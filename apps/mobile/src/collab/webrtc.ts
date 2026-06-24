import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';

import type { SocketClient } from '@/api';
import { env } from '@/config';

// In-document / in-channel voice ("huddles") over a WebRTC mesh.
//
// The realtime service only relays signaling (see gateways/webrtc.gateway.ts);
// audio flows peer-to-peer once connected, or via TURN when a direct path can't
// be punched through. ICE servers (STUN + credentialed TURN) come from the
// realtime /ice-servers endpoint so creds aren't baked into the bundle.
//
// Glare-free offer rule: the peer already in the room offers to each newcomer
// (on 'rtc:peer-joined'); the newcomer only answers. Exactly one offer per pair.

export type IceServersConfig = {
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
};

export type RemotePeer = { id: string; stream: MediaStream };

// Wire shapes for signaling — RN doesn't ship the DOM lib's RTC*Init types.
type SessionDescription = { type: string; sdp: string };
type IceCandidate = { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null };

const STUN_FALLBACK: IceServersConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// realtime HTTP shares the WS port; derive it from the ws(s):// URL.
function realtimeHttpBase(): string {
  return env.WS_URL.replace(/^ws/, 'http');
}

export async function getIceServers(): Promise<IceServersConfig> {
  try {
    const res = await fetch(`${realtimeHttpBase()}/ice-servers`);
    if (!res.ok) return STUN_FALLBACK;
    const data = (await res.json()) as IceServersConfig;
    return data.iceServers?.length ? data : STUN_FALLBACK;
  } catch {
    return STUN_FALLBACK;
  }
}

type PeersListener = (peers: RemotePeer[]) => void;

export class WebRTCRoom {
  private localStream: MediaStream | null = null;
  private iceConfig: IceServersConfig = STUN_FALLBACK;
  private readonly peers = new Map<string, RTCPeerConnection>();
  private readonly streams = new Map<string, MediaStream>();
  private readonly listeners = new Set<PeersListener>();
  private readonly cleanups: Array<() => void> = [];
  private muted = false;

  constructor(
    private readonly room: string,
    private readonly socket: SocketClient,
  ) {}

  onPeers(cb: PeersListener): () => void {
    this.listeners.add(cb);
    cb(this.snapshot());
    return () => this.listeners.delete(cb);
  }

  async join(): Promise<void> {
    this.iceConfig = await getIceServers();
    this.localStream = await mediaDevices.getUserMedia({ audio: true, video: false });

    this.cleanups.push(this.socket.on('rtc:peers', this.onPeersList));
    this.cleanups.push(this.socket.on('rtc:peer-joined', this.onPeerJoined));
    this.cleanups.push(this.socket.on('rtc:offer', this.onOffer));
    this.cleanups.push(this.socket.on('rtc:answer', this.onAnswer));
    this.cleanups.push(this.socket.on('rtc:ice', this.onIce));
    this.cleanups.push(this.socket.on('rtc:peer-left', this.onPeerLeft));

    this.socket.connect();
    this.socket.emit('rtc:join', { room: this.room });
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !this.muted;
    });
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  leave(): void {
    this.socket.emit('rtc:leave', { room: this.room });
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.length = 0;
    for (const pc of this.peers.values()) pc.close();
    this.peers.clear();
    this.streams.clear();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.listeners.clear();
  }

  // --- signaling handlers ---------------------------------------------------

  // We just joined: server hands us ICE config + the peers already present.
  // Those peers will offer to us, so here we only adopt the ICE config.
  private onPeersList = (payload: {
    room: string;
    iceServers?: IceServersConfig['iceServers'];
  }) => {
    if (payload.room !== this.room) return;
    if (payload.iceServers?.length) this.iceConfig = { iceServers: payload.iceServers };
  };

  // A newcomer joined while we were already here — we initiate the offer.
  private onPeerJoined = async (payload: { room: string; peerId: string }) => {
    if (payload.room !== this.room) return;
    const pc = this.createPeer(payload.peerId);
    const offer = await pc.createOffer({});
    await pc.setLocalDescription(offer);
    this.socket.emit('rtc:offer', { to: payload.peerId, sdp: offer });
  };

  private onOffer = async (payload: { from: string; sdp: SessionDescription }) => {
    const pc = this.createPeer(payload.from);
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.socket.emit('rtc:answer', { to: payload.from, sdp: answer });
  };

  private onAnswer = async (payload: { from: string; sdp: SessionDescription }) => {
    await this.peers
      .get(payload.from)
      ?.setRemoteDescription(new RTCSessionDescription(payload.sdp));
  };

  private onIce = async (payload: { from: string; candidate: IceCandidate }) => {
    if (!payload.candidate) return;
    await this.peers.get(payload.from)?.addIceCandidate(new RTCIceCandidate(payload.candidate));
  };

  private onPeerLeft = (payload: { room: string; peerId: string }) => {
    if (payload.room !== this.room) return;
    this.peers.get(payload.peerId)?.close();
    this.peers.delete(payload.peerId);
    this.streams.delete(payload.peerId);
    this.emit();
  };

  private createPeer(peerId: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: this.iceConfig.iceServers });
    this.localStream?.getTracks().forEach((track) => pc.addTrack(track, this.localStream!));

    // react-native-webrtc surfaces these as event-listener properties.
    (
      pc as unknown as { onicecandidate: (e: { candidate: RTCIceCandidate | null }) => void }
    ).onicecandidate = ({ candidate }) => {
      if (candidate) this.socket.emit('rtc:ice', { to: peerId, candidate });
    };
    (pc as unknown as { ontrack: (e: { streams: MediaStream[] }) => void }).ontrack = ({
      streams,
    }) => {
      if (streams[0]) {
        this.streams.set(peerId, streams[0]);
        this.emit();
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private snapshot(): RemotePeer[] {
    return [...this.streams.entries()].map(([id, stream]) => ({ id, stream }));
  }

  private emit() {
    const snap = this.snapshot();
    for (const cb of this.listeners) cb(snap);
  }
}

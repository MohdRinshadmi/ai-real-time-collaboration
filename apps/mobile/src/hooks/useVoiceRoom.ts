import {useCallback, useEffect, useRef, useState} from 'react';

import {getSocketClient} from '@/api';
import {WebRTCRoom, type RemotePeer} from '@/collab';

// Drives a WebRTC voice huddle for a given room (a document or channel id).
// Audio is peer-to-peer over a mesh; signaling rides the shared socket. Call
// join() to connect and request the mic, leave() to tear down.

export type VoiceRoom = {
  active: boolean;
  muted: boolean;
  peers: RemotePeer[];
  join: () => Promise<void>;
  leave: () => void;
  toggleMute: () => void;
};

export function useVoiceRoom(room: string): VoiceRoom {
  const socket = getSocketClient();
  const roomRef = useRef<WebRTCRoom | null>(null);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<RemotePeer[]>([]);

  const join = useCallback(async () => {
    if (roomRef.current) return;
    const rtc = new WebRTCRoom(room, socket);
    roomRef.current = rtc;
    try {
      const off = rtc.onPeers(setPeers);
      (rtc as WebRTCRoom & {_off?: () => void})._off = off;
      await rtc.join();
      setActive(true);
    } catch (err) {
      // join() can reject (mic denied, no audio device, signaling failure).
      // Tear the half-built room down and clear the ref so the user can retry
      // — otherwise the `if (roomRef.current) return` guard wedges us forever.
      rtc.leave();
      roomRef.current = null;
      setActive(false);
      setPeers([]);
      throw err;
    }
  }, [room, socket]);

  const leave = useCallback(() => {
    const rtc = roomRef.current as (WebRTCRoom & {_off?: () => void}) | null;
    rtc?._off?.();
    rtc?.leave();
    roomRef.current = null;
    setActive(false);
    setMuted(false);
    setPeers([]);
  }, []);

  const toggleMute = useCallback(() => {
    const next = roomRef.current?.toggleMute() ?? false;
    setMuted(next);
  }, []);

  // Always release the mic / sockets if the screen unmounts mid-call.
  useEffect(() => () => leave(), [leave]);

  return {active, muted, peers, join, leave, toggleMute};
}

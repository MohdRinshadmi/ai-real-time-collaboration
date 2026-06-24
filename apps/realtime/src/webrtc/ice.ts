// ICE server configuration for WebRTC.
//
// STUN lets peers discover their public-facing address for direct P2P.
// TURN relays media when a direct connection can't be established (symmetric
// NATs, restrictive corporate firewalls) — required for reliable connectivity,
// so we ship credentialed TURN from env alongside public STUN fallbacks.
//
// Credentials are short-lived in production (time-limited HMAC per the TURN
// REST spec); here we read static creds from env for simplicity.

export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export function buildIceServers(): IceServer[] {
  const servers: IceServer[] = [];

  const stunUrls = (process.env.STUN_URLS ?? 'stun:stun.l.google.com:19302')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  if (stunUrls.length) servers.push({ urls: stunUrls });

  if (process.env.TURN_URL) {
    servers.push({
      urls: process.env.TURN_URL.split(',').map((u) => u.trim()),
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }

  return servers;
}

// crypto.randomUUID() is not available in the Hermes runtime; this is enough
// for request correlation in logs.
export function requestId(): string {
  let hex = '';
  while (hex.length < 32) hex += Math.random().toString(16).slice(2);
  hex = hex.slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

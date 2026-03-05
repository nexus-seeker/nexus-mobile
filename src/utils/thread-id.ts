export function createNewThreadId(pubkey?: string) {
  const prefix = pubkey ? `thread:${pubkey}` : 'thread';
  const nonce = Math.random().toString(36).slice(2, 10);
  return `${prefix}:${Date.now().toString(36)}:${nonce}`;
}

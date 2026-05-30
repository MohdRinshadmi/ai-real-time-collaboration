import argon2 from 'argon2';

// argon2id parameters tuned for ~50ms on a modern x86 core.
// Tradeoff: higher params → safer against offline cracking but slower login UX.
const ARGON_OPTS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

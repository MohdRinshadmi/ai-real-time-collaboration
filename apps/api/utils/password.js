import argon2 from 'argon2';

// argon2id parameters tuned for ~50ms on a modern x86 core. Higher params are
// safer against offline cracking but slow down login UX.
const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain) {
  return argon2.hash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash, plain) {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

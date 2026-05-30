import * as Keychain from 'react-native-keychain';

// Tokens live in the OS keychain/keystore, not AsyncStorage.
// The web app keeps tokens in httpOnly cookies; on mobile we hold them
// ourselves and attach them as Authorization headers.

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const SERVICE = 'com.collab.mobile.auth';

// In-memory cache so the hot path (every API call) doesn't hit the keychain.
let cached: Tokens | null = null;

export async function saveTokens(tokens: Tokens): Promise<void> {
  cached = tokens;
  await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
  });
}

export async function loadTokens(): Promise<Tokens | null> {
  if (cached) return cached;
  const creds = await Keychain.getGenericPassword({service: SERVICE});
  if (!creds) return null;
  try {
    cached = JSON.parse(creds.password) as Tokens;
    return cached;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  cached = null;
  await Keychain.resetGenericPassword({service: SERVICE});
}

export function getCachedAccessToken(): string | null {
  return cached?.accessToken ?? null;
}

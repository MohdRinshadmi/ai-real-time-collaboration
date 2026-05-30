import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export type AccessTokenClaims = JWTPayload & {
  sub: string;          // user id
  email: string;
  workspaces: string[]; // workspace ids the user belongs to
};

export type TokenSigner = {
  sign(claims: Omit<AccessTokenClaims, 'iat' | 'exp' | 'iss' | 'aud'>): Promise<string>;
  verify(token: string): Promise<AccessTokenClaims>;
};

export function createTokenSigner(opts: {
  secret: string;
  issuer: string;
  audience: string;
  ttlSeconds: number;
}): TokenSigner {
  const key = new TextEncoder().encode(opts.secret);

  return {
    async sign(claims) {
      return new SignJWT(claims as JWTPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(opts.issuer)
        .setAudience(opts.audience)
        .setExpirationTime(`${opts.ttlSeconds}s`)
        .sign(key);
    },
    async verify(token) {
      const { payload } = await jwtVerify(token, key, {
        issuer: opts.issuer,
        audience: opts.audience,
      });
      return payload as AccessTokenClaims;
    },
  };
}

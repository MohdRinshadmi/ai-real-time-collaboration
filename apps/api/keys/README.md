# keys/

Key material that must **never** be committed:

- OAuth client secrets (when stored as files rather than env vars)
- JWT signing keys, if you migrate from the HS256 shared secret in `.env` to an
  RS256 keypair (`access-private.pem` / `access-public.pem`)
- TLS / mTLS certs for service-to-service calls

Everything in this folder is git-ignored except this README. In production, mount
these from a secrets manager (Vault, AWS Secrets Manager, k8s Secrets) rather than
baking them into the image.

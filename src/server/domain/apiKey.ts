import { createHash, randomBytes } from 'node:crypto';

export function generatePlainApiKey(): string {
  return `mithra_pk_${randomBytes(24).toString('hex')}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 20);
}

export function hashApiKey(apiKey: string, pepper: string): string {
  // API keys are generated from 192 bits of cryptographic randomness above,
  // not chosen by users. This is a keyed lookup fingerprint, not a password
  // verifier; a deliberately slow password KDF would only add server-side DoS
  // cost without improving resistance to brute force.
  return createHash('sha256').update(`${pepper}:${apiKey}`).digest('hex');
}

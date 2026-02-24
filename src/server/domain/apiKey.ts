import { createHash, randomBytes } from 'node:crypto';

export function generatePlainApiKey(): string {
  return `mithra_pk_${randomBytes(24).toString('hex')}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 20);
}

export function hashApiKey(apiKey: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${apiKey}`).digest('hex');
}

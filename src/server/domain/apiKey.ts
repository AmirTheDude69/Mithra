import { randomBytes, scrypt } from 'node:crypto';

export function generatePlainApiKey(): string {
  return `mithra_pk_${randomBytes(24).toString('hex')}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 20);
}

export async function hashApiKey(apiKey: string, pepper: string): Promise<string> {
  // A deterministic scrypt derivation preserves indexed lookups while making
  // an offline database/pepper compromise substantially more expensive.
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(apiKey, pepper, 32, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });

  return derivedKey.toString('hex');
}

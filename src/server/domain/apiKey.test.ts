import { describe, expect, it } from 'vitest';
import { generatePlainApiKey, getApiKeyPrefix, hashApiKey } from './apiKey';

describe('api key utilities', () => {
  it('generates expected prefix', () => {
    const key = generatePlainApiKey();
    expect(key.startsWith('mithra_pk_')).toBe(true);
    expect(getApiKeyPrefix(key).startsWith('mithra_pk_')).toBe(true);
  });

  it('hashes deterministically with pepper', () => {
    const key = 'mithra_pk_abc123';
    const pepper = 'pepper';
    expect(hashApiKey(key, pepper)).toBe(hashApiKey(key, pepper));
  });

  it('changes hash if pepper changes', () => {
    const key = 'mithra_pk_abc123';
    expect(hashApiKey(key, 'a')).not.toBe(hashApiKey(key, 'b'));
  });
});

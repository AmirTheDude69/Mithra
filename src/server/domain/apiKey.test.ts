import { describe, expect, it } from 'vitest';
import { generatePlainApiKey, getApiKeyPrefix, hashApiKey } from './apiKey.js';

describe('api key utilities', () => {
  it('generates expected prefix', () => {
    const key = generatePlainApiKey();
    expect(key.startsWith('mithra_pk_')).toBe(true);
    expect(getApiKeyPrefix(key).startsWith('mithra_pk_')).toBe(true);
  });

  it('hashes deterministically with pepper', () => {
    const key = 'mithra_pk_abc123';
    const pepper = 'pepper';
    expect(hashApiKey(key, pepper)).toBe(
      '17e0e8c778ee04aae9a6be61f18bf79dd759c092a971c312cff669f42c0b9bc6',
    );
  });

  it('changes hash if pepper changes', () => {
    const key = 'mithra_pk_abc123';
    expect(hashApiKey(key, 'a')).not.toBe(hashApiKey(key, 'b'));
  });
});

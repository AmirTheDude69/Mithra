import { describe, expect, it } from 'vitest';
import { generatePlainApiKey, getApiKeyPrefix, hashApiKey } from './apiKey.js';

describe('api key utilities', () => {
  it('generates expected prefix', () => {
    const key = generatePlainApiKey();
    expect(key.startsWith('mithra_pk_')).toBe(true);
    expect(getApiKeyPrefix(key).startsWith('mithra_pk_')).toBe(true);
  });

  it('hashes deterministically with pepper', async () => {
    const key = 'mithra_pk_abc123';
    const pepper = 'pepper';
    await expect(hashApiKey(key, pepper)).resolves.toBe(
      '61431395b6ed8da05d1deb865d8a77fa091f87e64618b5e9da709b23709d3064',
    );
  });

  it('changes hash if pepper changes', async () => {
    const key = 'mithra_pk_abc123';
    await expect(hashApiKey(key, 'a')).resolves.not.toBe(
      await hashApiKey(key, 'b'),
    );
  });
});

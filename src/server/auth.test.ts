import type { VercelRequest } from '@vercel/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyAuthToken: vi.fn(),
  findApiKey: vi.fn(),
  updateApiKey: vi.fn(),
}));

vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: class {
    verifyAuthToken = mocks.verifyAuthToken;
  },
}));

vi.mock('./db.js', () => ({
  prisma: {
    apiKey: {
      findFirst: mocks.findApiKey,
      update: mocks.updateApiKey,
    },
  },
}));

vi.mock('./env.js', () => ({
  serverEnv: {
    PRIVY_APP_ID: 'test-app',
    PRIVY_APP_SECRET: 'test-secret',
    PRIVY_VERIFICATION_KEY: undefined,
    API_KEY_PEPPER: 'test-pepper',
  },
}));

import {
  authenticatePrivyRequest,
  authenticateRequest,
} from './auth.js';

function request(headers: Record<string, string> = {}): VercelRequest {
  return { headers } as unknown as VercelRequest;
}

describe('request authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findApiKey.mockResolvedValue(null);
    mocks.verifyAuthToken.mockResolvedValue({ userId: 'did:privy:user' });
  });

  it('fails closed when the authorization header is absent', async () => {
    await expect(authenticatePrivyRequest(request())).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(mocks.verifyAuthToken).not.toHaveBeenCalled();
  });

  it('rejects malformed bearer headers before token verification', async () => {
    await expect(
      authenticatePrivyRequest(
        request({ authorization: 'Bearer token unexpected' }),
      ),
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.verifyAuthToken).not.toHaveBeenCalled();
  });

  it('always verifies a valid bearer token before accepting its identity', async () => {
    await expect(
      authenticatePrivyRequest(request({ authorization: 'Bearer signed-token' })),
    ).resolves.toEqual({
      mode: 'privy',
      privyDid: 'did:privy:user',
      accessToken: 'signed-token',
    });
    expect(mocks.verifyAuthToken).toHaveBeenCalledOnce();
    expect(mocks.verifyAuthToken).toHaveBeenCalledWith('signed-token', undefined);
  });

  it('accepts only a server-stored, non-revoked API-key record', async () => {
    mocks.findApiKey.mockResolvedValue({
      id: 'key-id',
      userId: 'user-id',
    });
    mocks.updateApiKey.mockResolvedValue({});

    await expect(
      authenticateRequest(request({ 'x-api-key': 'mithra_pk_candidate' })),
    ).resolves.toEqual({
      mode: 'api_key',
      userId: 'user-id',
      keyId: 'key-id',
    });
    expect(mocks.updateApiKey).toHaveBeenCalledWith({
      where: { id: 'key-id' },
      data: { lastUsedAt: expect.any(Date) },
    });
    expect(mocks.verifyAuthToken).not.toHaveBeenCalled();
  });
});

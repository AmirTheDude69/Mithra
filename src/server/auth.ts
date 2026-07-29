import type { VercelRequest } from '@vercel/node';
import { PrivyClient } from '@privy-io/server-auth';
import type { User as PrismaUser } from '@prisma/client';
import { prisma } from './db.js';
import { serverEnv } from './env.js';
import { HttpError, unauthorized } from './http/response.js';
import { hashApiKey } from './domain/apiKey.js';

const privy = new PrivyClient(serverEnv.PRIVY_APP_ID, serverEnv.PRIVY_APP_SECRET);

function getPrivyVerificationKeyOverride(): string | undefined {
  const key = serverEnv.PRIVY_VERIFICATION_KEY;
  if (!key) {
    return undefined;
  }

  // The SDK expects a PEM public key string for override. If env contains a JWKS URL,
  // let the SDK fetch the correct verification key from Privy using app credentials.
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return undefined;
  }

  return key;
}

export type RequestPrincipal =
  | {
      mode: 'privy';
      privyDid: string;
      accessToken: string;
    }
  | {
      mode: 'api_key';
      userId: string;
      keyId: string;
    };

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function requireBearerToken(authHeader: string | undefined): string {
  if (!authHeader) {
    unauthorized('Missing authentication');
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer' || !parts[1]) {
    unauthorized('Invalid authorization header');
  }

  const token = parts[1];
  if (token.length > 16_384) {
    unauthorized('Invalid auth token');
  }

  return token;
}

async function tryAuthenticateApiKey(req: VercelRequest): Promise<RequestPrincipal | null> {
  const apiKeyHeader = firstHeader(req.headers['x-api-key']);
  if (!apiKeyHeader) {
    return null;
  }

  const candidate = apiKeyHeader.trim();
  if (candidate.length === 0 || candidate.length > 512) {
    return null;
  }

  const hashed = hashApiKey(candidate, serverEnv.API_KEY_PEPPER);
  const key = await prisma.apiKey.findFirst({
    where: {
      keyHash: hashed,
      revokedAt: null,
    },
  });

  if (!key) {
    return null;
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    mode: 'api_key',
    userId: key.userId,
    keyId: key.id,
  };
}

export async function authenticatePrivyRequest(
  req: VercelRequest,
): Promise<Extract<RequestPrincipal, { mode: 'privy' }>> {
  const token = requireBearerToken(firstHeader(req.headers.authorization));

  try {
    const claims = await privy.verifyAuthToken(
      token,
      getPrivyVerificationKeyOverride(),
    );
    return {
      mode: 'privy',
      privyDid: claims.userId,
      accessToken: token,
    };
  } catch {
    unauthorized('Invalid auth token');
  }
}

export async function authenticateRequest(
  req: VercelRequest,
): Promise<RequestPrincipal> {
  const apiKeyPrincipal = await tryAuthenticateApiKey(req);
  if (apiKeyPrincipal) {
    return apiKeyPrincipal;
  }

  return authenticatePrivyRequest(req);
}

export async function tryAuthenticateRequest(
  req: VercelRequest,
): Promise<RequestPrincipal | null> {
  try {
    return await authenticateRequest(req);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 401) {
      return null;
    }
    throw error;
  }
}

export async function getLocalUserFromPrincipal(principal: RequestPrincipal): Promise<PrismaUser> {
  if (principal.mode === 'api_key') {
    const user = await prisma.user.findUnique({ where: { id: principal.userId } });
    if (!user) {
      unauthorized('API key user no longer exists');
    }
    return user;
  }

  const user = await prisma.user.findUnique({ where: { privyDid: principal.privyDid } });
  if (!user) {
    unauthorized('User not initialized. Authenticate via /api/auth/sync first.');
  }
  return user;
}

export async function getPrivyProfile(principal: RequestPrincipal) {
  if (principal.mode !== 'privy') {
    unauthorized('Privy authentication is required');
  }

  return privy.getUserById(principal.privyDid);
}

export function extractWalletAddresses(privyUser: { linkedAccounts?: Array<{ type?: string; address?: string }> }) {
  const fromLinkedAccounts = (privyUser.linkedAccounts ?? [])
    .filter((account) => account.type === 'wallet' && account.address)
    .map((account) => account.address!.toLowerCase());

  return [...new Set(fromLinkedAccounts)];
}

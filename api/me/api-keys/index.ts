import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../../src/server/auth.js';
import { prisma } from '../../../src/server/db.js';
import { serverEnv } from '../../../src/server/env.js';
import { generatePlainApiKey, getApiKeyPrefix, hashApiKey } from '../../../src/server/domain/apiKey.js';
import { parseBody } from '../../../src/server/http/body.js';
import { methodNotAllowed, ok, sendError } from '../../../src/server/http/response.js';

const createSchema = z.object({
  name: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    methodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: false, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);

    if (req.method === 'GET') {
      const keys = await prisma.apiKey.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      ok(res, {
        keys: keys.map((key) => ({
          id: key.id,
          name: key.name,
          prefix: key.keyPrefix,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString(),
          revokedAt: key.revokedAt?.toISOString(),
        })),
      });
      return;
    }

    const input = createSchema.parse(parseBody(req));
    const plaintext = generatePlainApiKey();
    const keyPrefix = getApiKeyPrefix(plaintext);

    const key = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: input.name?.trim() || null,
        keyPrefix,
        keyHash: hashApiKey(plaintext, serverEnv.API_KEY_PEPPER),
      },
    });

    ok(res, {
      key: {
        id: key.id,
        name: key.name,
        prefix: key.keyPrefix,
        createdAt: key.createdAt.toISOString(),
      },
      plaintext,
    });
  } catch (error) {
    sendError(res, error);
  }
}

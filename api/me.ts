import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../src/server/auth';
import { prisma } from '../src/server/db';
import { toUserSummary } from '../src/server/dto';
import { userTypeInputToEnum } from '../src/server/domain/mappers';
import { normalizeUsername } from '../src/server/domain/normalize';
import { parseBody } from '../src/server/http/body';
import {
  badRequest,
  conflict,
  methodNotAllowed,
  ok,
  sendError,
} from '../src/server/http/response';

const patchSchema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  type: z.enum(['human', 'ai_agent']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    methodNotAllowed(res, ['GET', 'PATCH']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: false, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);

    if (req.method === 'GET') {
      ok(res, { user: toUserSummary(user) });
      return;
    }

    const input = patchSchema.parse(parseBody(req));
    const username = input.username !== undefined ? normalizeUsername(input.username) : undefined;

    if (username !== undefined && username.length === 0) {
      badRequest('Username contains invalid characters');
    }

    if (username !== undefined) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          id: { not: user.id },
        },
        select: { id: true },
      });

      if (existing) {
        conflict('Username already taken');
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        bio: input.bio !== undefined ? input.bio.trim() : undefined,
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl.trim() : undefined,
        userType: input.type ? userTypeInputToEnum(input.type) : undefined,
      },
    });

    ok(res, { user: toUserSummary(updated) });
  } catch (error) {
    sendError(res, error);
  }
}

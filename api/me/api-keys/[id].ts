import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticatePrivyRequest, getLocalUserFromPrincipal } from '../../../src/server/auth.js';
import { prisma } from '../../../src/server/db.js';
import { methodNotAllowed, ok, sendError } from '../../../src/server/http/response.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    methodNotAllowed(res, ['DELETE']);
    return;
  }

  try {
    const principal = await authenticatePrivyRequest(req);
    const user = await getLocalUserFromPrincipal(principal);
    const id = String(req.query.id ?? '');

    await prisma.apiKey.updateMany({
      where: {
        id,
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    ok(res, { success: true });
  } catch (error) {
    sendError(res, error);
  }
}

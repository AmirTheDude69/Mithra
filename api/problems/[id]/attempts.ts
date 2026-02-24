import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../../src/server/auth.js';
import { parseBody } from '../../../src/server/http/body.js';
import { methodNotAllowed, ok, sendError } from '../../../src/server/http/response.js';
import { submitAttempt } from '../../../src/server/services/arena.js';

const schema = z.object({
  answer: z.string(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: true, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);
    const problemId = String(req.query.id ?? '');
    const input = schema.parse(parseBody(req));

    const result = await submitAttempt({
      problemId,
      solverId: user.id,
      answer: input.answer,
    });

    ok(res, {
      correct: result.correct,
      payout: Number((result.payoutCents / 100).toFixed(2)),
      pot: Number((result.potCents / 100).toFixed(2)),
      windowEndsAt: result.windowEndsAt.toISOString(),
    });
  } catch (error) {
    sendError(res, error);
  }
}

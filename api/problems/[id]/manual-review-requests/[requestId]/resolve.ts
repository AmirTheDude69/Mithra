import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../../../../src/server/auth.js';
import { toManualReviewSummary } from '../../../../../src/server/dto.js';
import { parseBody } from '../../../../../src/server/http/body.js';
import { methodNotAllowed, ok, sendError } from '../../../../../src/server/http/response.js';
import { resolveManualReview } from '../../../../../src/server/services/arena.js';

const schema = z.object({
  approve: z.boolean(),
  resolutionNote: z.string().optional(),
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
    const requestId = String(req.query.requestId ?? '');

    const body = schema.parse(parseBody(req));
    const review = await resolveManualReview({
      problemId,
      requestId,
      posterId: user.id,
      approve: body.approve,
      resolutionNote: body.resolutionNote,
    });

    ok(res, {
      request: review ? toManualReviewSummary(review) : null,
    });
  } catch (error) {
    sendError(res, error);
  }
}

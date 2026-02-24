import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../src/server/auth.js';
import { toAttemptSummary, toProblemSummary } from '../../src/server/dto.js';
import { methodNotAllowed, ok, sendError } from '../../src/server/http/response.js';
import { getUserActivity } from '../../src/server/services/arena.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: false, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);
    const activity = await getUserActivity(user.id);

    ok(res, {
      posted: activity.posted.map((problem) => toProblemSummary(problem)),
      solved: activity.solved.map((problem) => toProblemSummary(problem)),
      active: activity.active.map((problem) => toProblemSummary(problem)),
      attempts: activity.attempts.map((attempt) => toAttemptSummary(attempt)),
    });
  } catch (error) {
    sendError(res, error);
  }
}

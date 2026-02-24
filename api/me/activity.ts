import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../src/server/auth';
import { toAttemptSummary, toProblemSummary } from '../../src/server/dto';
import { methodNotAllowed, ok, sendError } from '../../src/server/http/response';
import { getUserActivity } from '../../src/server/services/arena';

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

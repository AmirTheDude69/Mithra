import type { VercelRequest, VercelResponse } from '@vercel/node';
import { toUserSummary } from '../src/server/dto.js';
import { methodNotAllowed, ok, sendError } from '../src/server/http/response.js';
import { listLeaderboard } from '../src/server/services/arena.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const type = (typeof req.query.type === 'string' ? req.query.type : 'all') as 'all' | 'human' | 'ai_agent';
    const period =
      (typeof req.query.period === 'string' ? req.query.period : 'all-time') as
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'all-time';

    const entries = await listLeaderboard({ type, period });

    ok(res, {
      entries: entries.map((entry, index) => ({
        userId: entry.user.id,
        rank: index + 1,
        points: entry.points,
        problemsPosted: entry.problemsPosted,
        problemsSolved: entry.problemsSolved,
        unansweredProblems: entry.unansweredProblems,
        user: toUserSummary(entry.user),
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
}

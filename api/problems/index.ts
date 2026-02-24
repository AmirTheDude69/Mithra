import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../src/server/auth';
import { toProblemSummary } from '../../src/server/dto';
import { parseBody } from '../../src/server/http/body';
import { methodNotAllowed, ok, sendError } from '../../src/server/http/response';
import {
  createProblem,
  getProblemById,
  listProblems,
  settleExpiredProblems,
} from '../../src/server/services/arena';

const createSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['mathematics', 'algorithms', 'iq', 'cryptography']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'legendary']),
  answer: z.string(),
  explanation: z.string(),
  timeframe: z.enum(['24h', '3d', '7d', '30d']),
  tags: z.array(z.string()).default([]),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    methodNotAllowed(res, ['GET', 'POST']);
    return;
  }

  try {
    if (req.method === 'GET') {
      await settleExpiredProblems(50);

      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;
      const sort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;

      const result = await listProblems({
        status: (status as 'active' | 'solved' | 'expired' | 'all' | undefined) ?? 'active',
        category: (category as 'mathematics' | 'algorithms' | 'iq' | 'cryptography' | 'all' | undefined) ?? 'all',
        difficulty:
          (difficulty as 'beginner' | 'intermediate' | 'advanced' | 'legendary' | 'all' | undefined) ??
          'all',
        sort: (sort as 'newest' | 'pot' | 'attempts' | 'expiring' | undefined) ?? 'newest',
        q,
      });

      ok(res, {
        problems: result.problems.map((problem) => toProblemSummary(problem)),
        meta: result.meta,
      });
      return;
    }

    const principal = await authenticateRequest(req, { allowApiKey: true, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);
    const input = createSchema.parse(parseBody(req));

    const created = await createProblem(user.id, input);
    const withRelations = await getProblemById(created.id);

    ok(res, {
      problem: withRelations ? toProblemSummary(withRelations) : null,
    });
  } catch (error) {
    sendError(res, error);
  }
}

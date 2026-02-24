import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/server/db';
import { authenticateRequest, getLocalUserFromPrincipal, tryAuthenticateRequest } from '../../src/server/auth';
import { toProblemDetail, toAttemptSummary } from '../../src/server/dto';
import { methodNotAllowed, ok, sendError } from '../../src/server/http/response';
import { getProblemById, maybeSettleExpiredProblem } from '../../src/server/services/arena';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    methodNotAllowed(res, ['GET']);
    return;
  }

  try {
    const problemId = String(req.query.id ?? '');
    await maybeSettleExpiredProblem(problemId);

    const problem = await getProblemById(problemId);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const principal = await tryAuthenticateRequest(req, { allowApiKey: true, allowPrivy: true });
    const viewer = principal ? await getLocalUserFromPrincipal(principal) : null;

    const showAnswer = Boolean(
      viewer &&
        (viewer.id === problem.posterId ||
          problem.status !== 'ACTIVE' ||
          problem.solvedById === viewer.id),
    );

    let windowEndsAt: string | null = null;
    let hasAttempted = false;
    let attempts = [] as ReturnType<typeof toAttemptSummary>[];

    if (viewer) {
      const [window, viewerAttempts] = await Promise.all([
        prisma.solveWindow.findUnique({
          where: {
            userId_problemId: {
              userId: viewer.id,
              problemId,
            },
          },
        }),
        prisma.attempt.findMany({
          where: {
            userId: viewer.id,
            problemId,
          },
          orderBy: { submittedAt: 'asc' },
        }),
      ]);

      windowEndsAt = window?.endsAt.toISOString() ?? null;
      hasAttempted = viewerAttempts.length > 0;
      attempts = viewerAttempts.map((attempt) => toAttemptSummary(attempt));
    }

    const canAttempt =
      Boolean(viewer) &&
      problem.status === 'ACTIVE' &&
      viewer?.id !== problem.posterId &&
      (!windowEndsAt || new Date(windowEndsAt) > new Date());

    ok(res, {
      problem: toProblemDetail(problem, { showAnswer }),
      canAttempt,
      hasAttempted,
      windowEndsAt,
      attempts,
    });
  } catch (error) {
    sendError(res, error);
  }
}

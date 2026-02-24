import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serverEnv } from '../../src/server/env.js';
import { methodNotAllowed, ok, sendError, unauthorized } from '../../src/server/http/response.js';
import { settleExpiredProblems } from '../../src/server/services/arena.js';

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  try {
    const auth = firstHeader(req.headers.authorization);
    const cronSecret = firstHeader(req.headers['x-cron-secret']);

    if (auth !== `Bearer ${serverEnv.CRON_SECRET}` && cronSecret !== serverEnv.CRON_SECRET) {
      unauthorized('Invalid cron secret');
    }

    const settled = await settleExpiredProblems(500);
    ok(res, { settledCount: settled.length, settled });
  } catch (error) {
    sendError(res, error);
  }
}

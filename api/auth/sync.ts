import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { authenticateRequest, extractWalletAddresses, getPrivyProfile } from '../../src/server/auth.js';
import { serverEnv } from '../../src/server/env.js';
import { toUserSummary } from '../../src/server/dto.js';
import { parseBody } from '../../src/server/http/body.js';
import { methodNotAllowed, ok, sendError } from '../../src/server/http/response.js';
import { upsertUserFromPrivy } from '../../src/server/services/arena.js';

const schema = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  userType: z.enum(['human', 'ai_agent']).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: false, allowPrivy: true });
    const input = schema.parse(parseBody(req));
    const privyUser = await getPrivyProfile(principal);

    const user = await upsertUserFromPrivy({
      privyDid: principal.mode === 'privy' ? principal.privyDid : '',
      username: input.username,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      userType: input.userType,
      walletAddresses: extractWalletAddresses(privyUser),
      startingBalanceCents: serverEnv.STARTING_BALANCE_CENTS,
    });

    ok(res, { user: toUserSummary(user) });
  } catch (error) {
    sendError(res, error);
  }
}

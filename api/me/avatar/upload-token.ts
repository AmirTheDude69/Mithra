import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { z } from 'zod';
import { authenticateRequest, getLocalUserFromPrincipal } from '../../../src/server/auth';
import { serverEnv } from '../../../src/server/env';
import { parseBody } from '../../../src/server/http/body';
import {
  badRequest,
  methodNotAllowed,
  ok,
  sendError,
} from '../../../src/server/http/response';

const schema = z.object({
  filename: z.string().min(1),
});

function sanitizeFilename(filename: string): string {
  const clean = filename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return clean.slice(0, 80);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    methodNotAllowed(res, ['POST']);
    return;
  }

  try {
    const principal = await authenticateRequest(req, { allowApiKey: false, allowPrivy: true });
    const user = await getLocalUserFromPrincipal(principal);

    if (!serverEnv.BLOB_READ_WRITE_TOKEN) {
      badRequest('BLOB_READ_WRITE_TOKEN is not configured');
    }

    const input = schema.parse(parseBody(req));
    const pathname = `avatars/${user.id}/${Date.now()}-${sanitizeFilename(input.filename)}`;

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: serverEnv.BLOB_READ_WRITE_TOKEN,
      pathname,
      allowedContentTypes: ['image/*'],
      maximumSizeInBytes: 5 * 1024 * 1024,
      validUntil: Date.now() + 5 * 60 * 1000,
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    ok(res, { pathname, clientToken });
  } catch (error) {
    sendError(res, error);
  }
}

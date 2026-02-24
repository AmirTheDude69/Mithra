import type { VercelRequest } from '@vercel/node';

export function parseBody<T>(req: VercelRequest): T {
  if (!req.body) {
    return {} as T;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }

  return req.body as T;
}

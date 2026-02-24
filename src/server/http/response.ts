import type { VercelResponse } from '@vercel/node';

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function badRequest(message: string): never {
  throw new HttpError(400, message);
}

export function unauthorized(message = 'Unauthorized'): never {
  throw new HttpError(401, message);
}

export function forbidden(message = 'Forbidden'): never {
  throw new HttpError(403, message);
}

export function notFound(message = 'Not found'): never {
  throw new HttpError(404, message);
}

export function conflict(message: string): never {
  throw new HttpError(409, message);
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: 'Method not allowed' });
}

export function sendError(res: VercelResponse, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({ error: message });
}

export function ok<T>(res: VercelResponse, data: T): void {
  res.status(200).json(data);
}

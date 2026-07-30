/**
 * The application only imports these Vercel definitions with `import type`.
 * Keeping the small runtime contract local avoids installing the full Vercel
 * build toolchain solely for request and response types.
 */
declare module '@vercel/node' {
  import type { IncomingMessage, ServerResponse } from 'node:http';

  export type VercelRequest = IncomingMessage & {
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
    body: any;
  };

  export type VercelResponse = ServerResponse & {
    send: (body: any) => VercelResponse;
    json: (body: any) => VercelResponse;
    status: (statusCode: number) => VercelResponse;
    redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
  };
}

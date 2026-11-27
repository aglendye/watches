// Bridges Node's IncomingMessage/ServerResponse (Vercel functions and the
// Vite dev server) to the framework-neutral photo handlers.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { PhotoRequest, PhotoResponse } from './photos.js';
import { MAX_UPLOAD_BYTES } from './photos.js';

export async function readBody(req: IncomingMessage, limit = MAX_UPLOAD_BYTES + 1): Promise<Uint8Array> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > limit) break; // the handler rejects it as too large
    chunks.push(c as Buffer);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export function toPhotoRequest(req: IncomingMessage, body?: Uint8Array): PhotoRequest {
  const url = new URL(req.url ?? '/', 'http://localhost');
  return { method: req.method ?? 'GET', headers: req.headers, query: url.searchParams, body };
}

export function send(res: ServerResponse, out: PhotoResponse) {
  for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
  res.statusCode = out.status;
  const b = out.body;
  if (b === null || b === undefined) return void res.end();
  if (b instanceof Uint8Array) return void res.end(Buffer.from(b));
  if (typeof (b as ReadableStream).getReader === 'function') {
    Readable.fromWeb(b as WebReadableStream).pipe(res);
    return;
  }
  res.end(JSON.stringify(b));
}

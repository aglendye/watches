// Photo upload and delivery, framework-neutral (used by api/photo.ts,
// api/photo-upload.ts, the Vite dev server and tests).
//
// Upload: POST /api/photo-upload?watchId=…&w=…&h=…  body = JPEG bytes
//   The app compresses on the phone first (long edge 1,600 px, JPEG 0.8), so
//   bodies are a few hundred KB, well under Vercel's 4.5 MB request limit.
// Serve:  GET /api/photo?id={image_id}
//   Signed-in users only. Photos never change (new photo = new id), so the
//   browser may keep them for a year; it's a private cache on the phone.
import { randomUUID } from 'node:crypto';
import { asOwner, asUser, q } from './db.js';
import { ApiError, badRequest, fromDbError, notFound, notSignedIn, tooMany } from './errors.js';
import { COOKIE } from './rpc.js';
import { sha256 } from './security.js';
import { storage } from './storage.js';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PhotoRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  query: URLSearchParams;
  body?: Uint8Array;
}

export interface PhotoResponse {
  status: number;
  headers: Record<string, string>;
  /** JSON-able value, a byte array, a stream, or nothing. */
  body: unknown;
}

function header(req: PhotoRequest, name: string): string {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

function tokenHash(req: PhotoRequest): string | null {
  for (const part of header(req, 'cookie').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE && rest.length) return sha256(decodeURIComponent(rest.join('=')));
  }
  return null;
}

function json(status: number, body: unknown): PhotoResponse {
  return { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body };
}

function fail(err: unknown): PhotoResponse {
  const e = fromDbError(err);
  return json(e.status, { error: { code: e.code, message: e.message } });
}

function isJpeg(b: Uint8Array) {
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
}

function dimension(v: string | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10000 ? n : null;
}

export async function handleUpload(req: PhotoRequest): Promise<PhotoResponse> {
  try {
    if (req.method !== 'POST' || header(req, 'x-requested-with') !== 'watch-app') {
      throw new ApiError(400, 'bad_request', 'Bad request.');
    }
    const th = tokenHash(req);
    if (!th) throw notSignedIn();
    const watchId = req.query.get('watchId') ?? '';
    if (!UUID.test(watchId)) throw badRequest('watchId is not valid.');
    if (!/^image\/jpeg\b/i.test(header(req, 'content-type'))) throw badRequest('Photos must be JPEG images.');
    const body = req.body ?? new Uint8Array();
    if (body.length === 0) throw badRequest('The photo is empty.');
    if (body.length > MAX_UPLOAD_BYTES) throw new ApiError(413, 'too_large', 'That photo is too big (4 MB at most).');
    if (!isJpeg(body)) throw badRequest('Photos must be JPEG images.');

    // Signed in, and the watch exists?
    const [[me], watch] = await asUser(th, q('select auth.uid() as id'), q('select id from public.watches where id = $1', watchId));
    if (!watch[0]) throw notFound('This watch doesn’t exist (it may have been deleted).');

    // Protect the free Blob quota from runaway uploads.
    const [[rl]] = await asOwner(q(`select auth.hit_rate_limit($1, 30, '1 hour'::interval) as over`, `upload:${me.id}`));
    if (rl.over) throw tooMany();

    const id = randomUUID();
    const path = `watch-images/${watchId}/${id}.jpg`;
    await storage().put(path, body, 'image/jpeg');
    try {
      await asUser(
        th,
        q(
          `insert into public.watch_images (id, watch_id, storage_path, width, height)
           values ($1, $2, $3, $4, $5)`,
          id,
          watchId,
          path,
          dimension(req.query.get('w')),
          dimension(req.query.get('h')),
        ),
      );
    } catch (err) {
      await storage().del([path]).catch(() => {});
      throw err;
    }
    return json(200, { data: { id, url: `/api/photo?id=${id}` } });
  } catch (err) {
    return fail(err);
  }
}

export async function handlePhoto(req: PhotoRequest): Promise<PhotoResponse> {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new ApiError(405, 'bad_request', 'Bad request.');
    const th = tokenHash(req);
    if (!th) throw notSignedIn();
    const id = req.query.get('id') ?? '';
    if (!UUID.test(id)) throw notFound();
    const [rows] = await asUser(th, q('select storage_path from public.watch_images where id = $1', id));
    if (!rows[0]) throw notFound();
    const file = await storage().get(rows[0].storage_path as string, header(req, 'if-none-match') || undefined);
    if (!file) throw notFound();
    const headers = {
      ETag: file.etag,
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    };
    if (file.status === 304) return { status: 304, headers, body: null };
    return {
      status: 200,
      headers: { ...headers, 'Content-Type': file.contentType },
      body: req.method === 'HEAD' ? null : file.body,
    };
  } catch (err) {
    return fail(err);
  }
}

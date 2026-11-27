// Vercel function: POST /api/photo-upload?watchId=… with a JPEG body
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBody, send, toPhotoRequest } from '../server/node-adapter.js';
import { handleUpload } from '../server/photos.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const body = req.method === 'POST' ? await readBody(req) : undefined;
  send(res, await handleUpload(toPhotoRequest(req, body)));
}

// Vercel function: GET /api/photo?id=… (signed-in users only)
import type { IncomingMessage, ServerResponse } from 'node:http';
import { send, toPhotoRequest } from '../server/node-adapter.js';
import { handlePhoto } from '../server/photos.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  send(res, await handlePhoto(toPhotoRequest(req)));
}

// Vercel serverless function: POST /api/rpc
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRpc } from '../server/rpc.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const out = await handleRpc({
    method: req.method ?? 'GET',
    headers: req.headers,
    body: req.body,
    ip: req.socket?.remoteAddress ?? '',
  });
  for (const [k, value] of Object.entries(out.headers)) res.setHeader(k, value);
  res.status(out.status).send(JSON.stringify(out.body));
}

// Framework-neutral request handler for POST /api/rpc.
// Used by the Vercel function (api/rpc.ts), the Vite dev server, and tests.
import { publicActions, userActions, type Ctx } from './actions.js';
import { ApiError, fromDbError, notSignedIn } from './errors.js';
import { sha256 } from './security.js';

export const COOKIE = 'wr_session';
const MAX_AGE = 400 * 24 * 3600; // the longest browsers allow; renewed on every app start

export interface RpcRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  ip: string;
}

export interface RpcResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: unknown;
}

function header(req: RpcRequest, name: string): string {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] ?? '' : v ?? '';
}

function readCookie(req: RpcRequest, name: string): string | null {
  for (const part of header(req, 'cookie').split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function handleRpc(req: RpcRequest): Promise<RpcResponse> {
  const headers: Record<string, string | string[]> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  const isLocalHttp = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(header(req, 'host')) &&
    header(req, 'x-forwarded-proto') !== 'https';
  const cookieAttrs = `Path=/; HttpOnly; SameSite=Lax${isLocalHttp ? '' : '; Secure'}`;

  try {
    // CSRF protection: only same-origin fetches from the app send this header.
    if (req.method !== 'POST' || header(req, 'x-requested-with') !== 'watch-app') {
      throw new ApiError(400, 'bad_request', 'Bad request.');
    }
    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body ?? {}) as {
      action?: unknown;
      params?: unknown;
    };
    const action = typeof body.action === 'string' ? body.action : '';
    const params =
      body.params && typeof body.params === 'object' ? (body.params as Record<string, unknown>) : {};

    const token = readCookie(req, COOKIE);
    const ctx: Ctx = {
      tokenHash: token ? sha256(token) : null,
      ip: header(req, 'x-forwarded-for').split(',')[0].trim() || req.ip || 'unknown',
      userAgent: header(req, 'user-agent'),
      startSession(raw) {
        headers['Set-Cookie'] = `${COOKIE}=${encodeURIComponent(raw)}; Max-Age=${MAX_AGE}; ${cookieAttrs}`;
      },
      clearSession() {
        headers['Set-Cookie'] = `${COOKIE}=; Max-Age=0; ${cookieAttrs}`;
      },
    };

    const fn = publicActions[action] ?? userActions[action];
    if (!fn) throw new ApiError(400, 'bad_request', `Unknown action: ${action}`);
    if (!publicActions[action] && !ctx.tokenHash) throw notSignedIn();

    const data = await fn(params, ctx);

    // Keep the session cookie fresh so the app never times out.
    if (action === 'auth.session' && token && !headers['Set-Cookie']) ctx.startSession(token);

    return { status: 200, headers, body: { data } };
  } catch (err) {
    const e = err instanceof SyntaxError ? new ApiError(400, 'bad_request', 'Bad request.') : fromDbError(err);
    if (e.code === 'not_signed_in') headers['Set-Cookie'] = `${COOKIE}=; Max-Age=0; ${cookieAttrs}`;
    return { status: e.status, headers, body: { error: { code: e.code, message: e.message } } };
  }
}

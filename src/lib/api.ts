// The only way the app talks to the server: POST /api/rpc { action, params }.

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const NETWORK_MESSAGE = 'Can’t reach the server. Check your connection.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

let onSignedOut: (() => void) | null = null;
/** The auth provider registers this so a server "not signed in" signs the app out. */
export function setSignedOutHandler(fn: (() => void) | null) {
  onSignedOut = fn;
}

export async function call<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/rpc', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'watch-app' },
      body: JSON.stringify({ action, params }),
    });
  } catch {
    throw new ApiError('network', 0, NETWORK_MESSAGE);
  }
  let body: { data?: T; error?: { code: string; message: string } };
  try {
    body = await res.json();
  } catch {
    throw new ApiError('server_error', res.status, res.status >= 500 ? GENERIC_MESSAGE : NETWORK_MESSAGE);
  }
  if (body.error) {
    if (body.error.code === 'not_signed_in') onSignedOut?.();
    throw new ApiError(body.error.code, res.status, body.error.message || GENERIC_MESSAGE);
  }
  return body.data as T;
}

/** A user-facing message for any error thrown while loading or saving. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return NETWORK_MESSAGE;
  return GENERIC_MESSAGE;
}

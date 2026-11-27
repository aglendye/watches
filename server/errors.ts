export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message: string) => new ApiError(400, 'bad_request', message);
export const forbidden = (message = 'You don’t have permission to do that.') =>
  new ApiError(403, 'forbidden', message);
export const notFound = (message = 'Not found.') => new ApiError(404, 'not_found', message);
export const notSignedIn = () => new ApiError(401, 'not_signed_in', 'Please sign in.');
export const tooMany = () =>
  new ApiError(429, 'rate_limited', 'Too many attempts. Wait a few minutes and try again.');

/** Turns a Postgres error (pg or Neon driver) into an ApiError with a user-facing message. */
export function fromDbError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const e = err as { code?: string; message?: string };
  switch (e?.code) {
    case '28000':
      return notSignedIn();
    case '23505':
      return new ApiError(409, 'conflict', 'That already exists.');
    case '42501':
      return forbidden();
    case 'P0001': // raised by our triggers and functions; shown as written
      return new ApiError(400, 'rule', e.message ?? 'Not allowed.');
    case '23514':
    case '22001':
    case '22003':
      return badRequest('Some values are out of range.');
    case '22P02':
    case '22007':
    case '22008':
      return badRequest('Some values are not valid.');
    case '23503':
      return badRequest('That item no longer exists.');
  }
  console.error(err);
  return new ApiError(500, 'server_error', 'Something went wrong. Please try again.');
}

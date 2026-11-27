// Database access. Every request runs as one short transaction.
//
// - asOwner(queries): runs as the connecting owner role. Used only for the
//   auth tables (sign up, sign in, sessions).
// - asUser(tokenHash, queries): starts the transaction with
//   auth.begin_session(token) and `set local role authenticated`, so the
//   queries run under row-level security as the signed-in user.
//
// In production this uses Neon's HTTP driver (one round trip per request).
// Locally and in tests (any non-Neon DATABASE_URL) it uses `pg` over TCP.
import { neon } from '@neondatabase/serverless';
import pg from 'pg';

export type Query = { text: string; values?: unknown[] };
export type Row = Record<string, unknown>;

export function q(text: string, ...values: unknown[]): Query {
  return { text, values };
}

type Runner = (queries: Query[]) => Promise<Row[][]>;

let runner: Runner | null = null;
let pool: pg.Pool | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

function makeRunner(): Runner {
  const url = databaseUrl();
  // DB_DRIVER=pg or DB_DRIVER=neon overrides the automatic choice.
  const useNeonHttp = process.env.DB_DRIVER
    ? process.env.DB_DRIVER === 'neon'
    : /\.neon\.(tech|com|build)\b/.test(url);
  if (useNeonHttp) {
    const sql = neon(url);
    return async (queries) => {
      const results = await sql.transaction(queries.map((x) => sql.query(x.text, x.values ?? [])));
      return results as Row[][];
    };
  }
  pool = new pg.Pool({ connectionString: url, max: 5 });
  // An idle connection dropping (server restart, network) must not crash the process.
  pool.on('error', (err) => console.error('Idle database connection error:', err.message));
  return async (queries) => {
    const client = await pool!.connect();
    try {
      await client.query('begin');
      const out: Row[][] = [];
      for (const x of queries) out.push((await client.query(x.text, x.values ?? [])).rows);
      await client.query('commit');
      return out;
    } catch (err) {
      await client.query('rollback').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  };
}

function run(queries: Query[]): Promise<Row[][]> {
  runner ??= makeRunner();
  return runner(queries);
}

export function asOwner(...queries: Query[]): Promise<Row[][]> {
  return run(queries);
}

export async function asUser(tokenHash: string, ...queries: Query[]): Promise<Row[][]> {
  const results = await run([
    q('select auth.begin_session($1) as uid', tokenHash),
    q('set local role authenticated'),
    ...queries,
  ]);
  return results.slice(2);
}

/** For tests: close the local pool. */
export async function closeDb(): Promise<void> {
  if (pool) await pool.end();
  pool = null;
  runner = null;
}

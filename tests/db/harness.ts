// Test harness: a fresh database per run, migrated with the real migrations,
// and API clients that keep their own session cookie.
import pg from 'pg';
import { migrate } from '../../scripts/migrate.mjs';
import { handleRpc } from '../../server/rpc';
import { sha256 } from '../../server/security';

const ADMIN_URL = process.env.TEST_PG_ADMIN ?? 'postgres://postgres@localhost:5432/postgres';
const OWNER = process.env.TEST_PG_OWNER ?? 'neondb_owner';
const OWNER_PW = process.env.TEST_PG_OWNER_PW ?? 'pw';
const DB = 'watch_test';

export const TEST_URL = `postgres://${OWNER}:${OWNER_PW}@localhost:5432/${DB}`;

export async function freshDatabase() {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`drop database if exists ${DB} with (force)`);
  await admin.query(`create database ${DB} owner ${OWNER}`);
  await admin.end();
  await migrate(TEST_URL, { log: () => {} });
  process.env.DATABASE_URL = TEST_URL;
  process.env.DB_DRIVER = 'pg';
}

export class Client {
  token: string | null = null;
  constructor(public ip = '10.0.0.1') {}

  async raw(action: string, params: Record<string, unknown> = {}) {
    const res = await handleRpc({
      method: 'POST',
      headers: {
        host: 'localhost:5173',
        'x-requested-with': 'watch-app',
        'content-type': 'application/json',
        cookie: this.token ? `wr_session=${encodeURIComponent(this.token)}` : undefined,
      },
      body: { action, params },
      ip: this.ip,
    });
    const set = res.headers['Set-Cookie'];
    if (typeof set === 'string') {
      const m = /^wr_session=([^;]*)/.exec(set);
      this.token = m && m[1] ? decodeURIComponent(m[1]) : null;
    }
    return res as { status: number; body: { data?: any; error?: { code: string; message: string } } };
  }

  /** Calls an action and returns data, throwing on error. */
  async call<T = any>(action: string, params: Record<string, unknown> = {}): Promise<T> {
    const res = await this.raw(action, params);
    if (res.body.error) {
      const e = new Error(res.body.error.message) as Error & { code: string; status: number };
      e.code = res.body.error.code;
      e.status = res.status;
      throw e;
    }
    return res.body.data as T;
  }

  get tokenHash() {
    return this.token ? sha256(this.token) : '';
  }
}

export async function signUp(email: string, name: string, ip?: string) {
  const c = new Client(ip);
  await c.call('auth.signUp', { email, password: 'password123', displayName: name });
  return c;
}

/** Runs raw SQL as the given user (row-level security applies) inside a rolled-back transaction. */
export async function sqlAs(client: Client | 'anon', sql: string, values: unknown[] = []) {
  const c = new pg.Client({ connectionString: TEST_URL });
  await c.connect();
  try {
    await c.query('begin');
    if (client === 'anon') {
      await c.query('set local role anon');
    } else {
      await c.query('select auth.begin_session($1)', [client.tokenHash]);
      await c.query('set local role authenticated');
    }
    return (await c.query(sql, values)).rows;
  } finally {
    await c.query('rollback').catch(() => {});
    await c.end();
  }
}

export async function sqlOwner(sql: string, values: unknown[] = []) {
  const c = new pg.Client({ connectionString: TEST_URL });
  await c.connect();
  try {
    return (await c.query(sql, values)).rows;
  } finally {
    await c.end();
  }
}

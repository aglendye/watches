// Applies db/migrations/*.sql in order, once each.
// Usage: DATABASE_URL=postgres://... npm run db:migrate
// Uses the plain `pg` driver over TCP, which works with Neon's connection string.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'db', 'migrations');

export async function migrate(connectionString, { log = console.log } = {}) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query('create schema if not exists ops');
    await client.query(`create table if not exists ops.schema_migrations (
      name text primary key, applied_at timestamptz not null default now())`);
    const done = new Set(
      (await client.query('select name from ops.schema_migrations')).rows.map((r) => r.name),
    );
    const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(path.join(dir, file), 'utf8');
      log(`Applying ${file} ...`);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into ops.schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw new Error(`${file} failed: ${err.message}`, { cause: err });
      }
    }
    log('Migrations up to date.');
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Set DATABASE_URL first (see README).');
    process.exit(1);
  }
  migrate(url).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

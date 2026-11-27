// Loads db/seed/seed.csv through add_watch(), as the given (existing) account.
// Usage: DATABASE_URL=... SEED_EMAIL=you@example.com npm run db:seed
// Safe to run again: existing watches are found, not duplicated.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const file = process.argv[2] ?? path.join(here, '..', 'db', 'seed', 'seed.csv');

function parseCsv(text) {
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    // Simple CSV: commas separate fields; wrap a field in "double quotes" if it contains a comma.
    const fields = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"' && quoted) {
        cur += '"';
        i++;
      } else if (c === '"') quoted = !quoted;
      else if (c === ',' && !quoted) {
        fields.push(cur);
        cur = '';
      } else cur += c;
    }
    fields.push(cur);
    rows.push(fields.map((f) => f.trim()));
  }
  const [header, ...data] = rows;
  if (header?.join(',').toLowerCase() !== 'brand,model,reference') {
    throw new Error('The first non-comment line must be: brand,model,reference');
  }
  return data.map(([brand, model, reference]) => ({ brand, model, reference: reference || null }));
}

const url = process.env.DATABASE_URL;
const email = process.env.SEED_EMAIL;
if (!url || !email) {
  console.error('Set DATABASE_URL and SEED_EMAIL (an account that already exists in the app).');
  process.exit(1);
}

const rows = parseCsv(await readFile(file, 'utf8'));
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const user = await client.query('select id from auth.users where lower(email) = lower($1)', [email]);
  if (!user.rows[0]) throw new Error(`No account for ${email}. Create it in the app first.`);
  await client.query('begin');
  await client.query("select set_config('app.user_id', $1, true)", [user.rows[0].id]);
  await client.query('set local role authenticated');
  let n = 0;
  for (const r of rows) {
    if (!r.brand || !r.model) {
      console.warn('Skipping row without brand and model:', r);
      continue;
    }
    await client.query('select public.add_watch($1, $2, $3)', [r.brand, r.model, r.reference]);
    n++;
  }
  await client.query('commit');
  console.log(`Loaded ${n} watches (existing ones were left as they are).`);
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

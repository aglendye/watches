// Loads a catalog CSV into the database, credited to a "Seed catalog" account
// that cannot sign in. Safe to re-run: brands, models and watches that already
// exist are left exactly as they are; only missing ones are added.
//
// Usage:
//   DATABASE_URL=... npm run db:seed                 # loads db/seed/catalog.csv
//   DATABASE_URL=... npm run db:seed -- my-list.csv  # any CSV with the same header
//   npm run db:seed -- --print-sql [file]            # print the SQL instead (JSON array per chunk)
//
// CSV header: brand,model,reference,nickname,case_size_mm,movement_type,case_material,
//             dial_color,water_resistance_m,year_introduced,caliber,bezel,bracelet,production_end
// Only brand and model are required. Lines starting with # are ignored.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_EMAIL = 'seed@catalog.invalid';
const EXTRA_KEYS = ['nickname', 'caliber', 'bezel', 'bracelet', 'production_end'];

export function parseCsv(text) {
  const records = [];
  let row = [], cur = '', quoted = false;
  const lines = text.split(/\r?\n/).filter((l) => !l.trimStart().startsWith('#'));
  const src = lines.join('\n') + '\n';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); if (row.some((v) => v.trim() !== '')) records.push(row); row = []; cur = ''; }
    else cur += c;
  }
  const [header, ...data] = records;
  const cols = header.map((h) => h.trim().toLowerCase());
  if (cols[0] !== 'brand' || cols[1] !== 'model') throw new Error('The first line must start with: brand,model');
  return data.map((vals) => Object.fromEntries(cols.map((c, i) => [c, (vals[i] ?? '').trim()])));
}

const lit = (v) => (v === null || v === undefined || v === '' ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === '' || v === undefined || Number.isNaN(Number(v)) ? 'null' : String(Number(v)));

function valuesRow(r) {
  const extras = {};
  for (const k of EXTRA_KEYS) if (r[k]) extras[k] = k === 'production_end' ? Number(r[k]) : r[k];
  return `(${[lit(r.brand), lit(r.model), lit(r.reference), num(r.case_size_mm), lit(r.movement_type || ''),
    lit(r.case_material), lit(r.dial_color), num(r.water_resistance_m), num(r.year_introduced),
    `${lit(JSON.stringify(extras))}::jsonb`].join(',')})`;
}

/** SQL statements for one chunk of rows, to run in a single transaction as the database owner. */
export function chunkStatements(rows) {
  return [
    `create temp table seed_in (b text, m text, r text, cs numeric, mv text, cm text, dc text, wr int, yi int, ex jsonb) on commit drop`,
    `insert into seed_in values ${rows.map(valuesRow).join(',\n')}`,
    `insert into auth.users (email, password_hash, raw_user_meta_data)
       values ('${SEED_EMAIL}', 'disabled', '{"display_name":"Seed catalog"}')
       on conflict ((lower(email))) do nothing`,
    `insert into public.brands (name, created_by)
       select distinct on (lower(btrim(b))) btrim(b), (select id from auth.users where email = '${SEED_EMAIL}')
       from seed_in where btrim(coalesce(b, '')) <> ''
       on conflict ((lower(name))) do nothing`,
    `insert into public.models (brand_id, name, created_by)
       select distinct on (br.id, lower(btrim(s.m))) br.id, btrim(s.m), (select id from auth.users where email = '${SEED_EMAIL}')
       from seed_in s join public.brands br on lower(br.name) = lower(btrim(s.b))
       where btrim(coalesce(s.m, '')) <> ''
       on conflict (brand_id, (lower(name))) do nothing`,
    `insert into public.watches (model_id, reference, case_size_mm, movement_type, case_material, dial_color,
                                 water_resistance_m, year_introduced, extras, created_by)
       select distinct on (mo.id, lower(btrim(s.r))) mo.id, nullif(btrim(s.r), ''), s.cs, nullif(s.mv, ''), s.cm, s.dc, s.wr, s.yi,
              coalesce(s.ex, '{}'::jsonb), (select id from auth.users where email = '${SEED_EMAIL}')
       from seed_in s
       join public.brands br on lower(br.name) = lower(btrim(s.b))
       join public.models mo on mo.brand_id = br.id and lower(mo.name) = lower(btrim(s.m))
       on conflict on constraint watches_model_reference_key do nothing`,
    `select (select count(*) from public.brands)::int as brands, (select count(*) from public.models)::int as models,
            (select count(*) from public.watches)::int as watches`,
  ];
}

export function chunks(rows, size = 200) {
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const printSql = args.includes('--print-sql');
  const file = args.find((a) => !a.startsWith('--')) ?? path.join(here, '..', 'db', 'seed', 'catalog.csv');
  const rows = parseCsv(await readFile(file, 'utf8')).filter((r) => r.brand && r.model);

  if (printSql) {
    console.log(JSON.stringify(chunks(rows).map(chunkStatements)));
    return;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Set DATABASE_URL first (see README).');
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    let last;
    for (const part of chunks(rows)) {
      await client.query('begin');
      for (const sql of chunkStatements(part)) last = await client.query(sql);
      await client.query('commit');
    }
    console.log(`Processed ${rows.length} rows. Totals now:`, last.rows[0]);
  } catch (err) {
    await client.query('rollback').catch(() => {});
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

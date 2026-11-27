// Loads a catalog CSV into the database, credited to a "Seed catalog" account
// that cannot sign in. Watches already in the catalog are never added again or
// changed: matching ignores case, spaces and punctuation (see stageStatements).
// Every new watch gets its drawn picture automatically; the drawing is built in
// the app from brand, model, reference, case material, dial colour and extras.
//
// Usage:
//   DATABASE_URL=... npm run db:seed                 # loads db/seed/catalog.csv
//   DATABASE_URL=... npm run db:seed -- my-list.csv  # any CSV with the same header
//   DATABASE_URL=... npm run db:seed -- --check new.csv  # dry run: list what's new, change nothing
//   npm run db:seed -- --print-sql [file]            # print the SQL instead (JSON array per chunk)
//
// CSV header: brand,model,reference,nickname,case_size_mm,movement_type,case_material,
//             dial_color,water_resistance_m,year_introduced,caliber,bezel,bracelet,production_end,aka,note
// Only brand and model are required. nickname is ONE short name ("Batman"): other
// names go in aka ("Batgirl"), descriptions in note. Bad nicknames block a load. Lines starting with # are ignored.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SEED_EMAIL = 'seed@catalog.invalid';
const EXTRA_KEYS = ['nickname', 'aka', 'note', 'caliber', 'bezel', 'bracelet', 'production_end'];

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

function valuesRow(r, i = 0) {
  const extras = {};
  for (const k of EXTRA_KEYS) if (r[k]) extras[k] = k === 'production_end' ? Number(r[k]) : r[k];
  return `(${[String(i), lit(r.brand), lit(r.model), lit(r.reference), num(r.case_size_mm), lit(r.movement_type || ''),
    lit(r.case_material), lit(r.dial_color), num(r.water_resistance_m), num(r.year_introduced),
    `${lit(JSON.stringify(extras))}::jsonb`].join(',')})`;
}

// Names and references are compared ignoring case, spaces and punctuation, so
// "GMT Master II" matches "GMT-Master II" and "126710-BLRO" matches "126710BLRO".
const norm = (x) => `regexp_replace(lower(coalesce(${x}, '')), '[^a-z0-9]', '', 'g')`;
const SEED_USER = `(select id from auth.users where email = '${SEED_EMAIL}')`;

/**
 * Loads one chunk into a temp table and removes every row that is already in
 * the catalog. What is left in seed_in afterwards is only new watches:
 *  - a row with a reference is dropped if that brand already has a watch with the
 *    same reference (under any model name);
 *  - a row without a reference is dropped if that brand already has the model;
 *  - repeats inside the file itself are dropped (first one wins).
 */
export function stageStatements(rows) {
  return [
    `create temp table seed_in (n int, b text, m text, r text, cs numeric, mv text, cm text, dc text, wr int, yi int, ex jsonb) on commit drop`,
    `insert into seed_in values ${rows.map((r, i) => valuesRow(r, i)).join(',\n')}`,
    `delete from seed_in s using seed_in t
       where t.n < s.n and ${norm('t.b')} = ${norm('s.b')}
         and ((${norm('s.r')} <> '' and ${norm('t.r')} = ${norm('s.r')})
           or (${norm('s.r')} = '' and ${norm('t.r')} = '' and ${norm('t.m')} = ${norm('s.m')}))`,
    `delete from seed_in s where ${norm('s.r')} <> '' and exists (
       select 1 from public.watches w join public.models mo on mo.id = w.model_id join public.brands br on br.id = mo.brand_id
       where ${norm('br.name')} = ${norm('s.b')} and ${norm('w.reference')} = ${norm('s.r')})`,
    `delete from seed_in s where ${norm('s.r')} = '' and exists (
       select 1 from public.models mo join public.brands br on br.id = mo.brand_id
       where ${norm('br.name')} = ${norm('s.b')} and ${norm('mo.name')} = ${norm('s.m')})`,
  ];
}

/** Adds what is left in seed_in, reusing existing brands and models whose names match. */
export function writeStatements() {
  const brandOf = (b) => `(select id from public.brands br where ${norm('br.name')} = ${norm(b)} order by created_at limit 1)`;
  return [
    `insert into auth.users (email, password_hash, raw_user_meta_data)
       values ('${SEED_EMAIL}', 'disabled', '{"display_name":"Seed catalog"}')
       on conflict ((lower(email))) do nothing`,
    // The seed account isn't a person: its watches stay out of the feed (migration 007).
    `update public.profiles set is_system = true where id = ${SEED_USER} and not is_system`,
    `insert into public.brands (name, created_by)
       select distinct on (${norm('b')}) btrim(b), ${SEED_USER} from seed_in s
       where ${norm('b')} <> '' and ${brandOf('s.b')} is null
       order by ${norm('b')}, n
       on conflict ((lower(name))) do nothing`,
    `insert into public.models (brand_id, name, created_by)
       select distinct on (bid, ${norm('m')}) bid, btrim(m), ${SEED_USER}
       from (select s.*, ${brandOf('s.b')} as bid from seed_in s) s
       where ${norm('m')} <> '' and not exists (
         select 1 from public.models mo where mo.brand_id = s.bid and ${norm('mo.name')} = ${norm('s.m')})
       order by bid, ${norm('m')}, n
       on conflict (brand_id, (lower(name))) do nothing`,
    `insert into public.watches (model_id, reference, case_size_mm, movement_type, case_material, dial_color,
                                 water_resistance_m, year_introduced, extras, created_by)
       select mid, nullif(btrim(r), ''), cs, nullif(mv, ''), cm, dc, wr, yi, coalesce(ex, '{}'::jsonb), ${SEED_USER}
       from (select s.*, (select mo.id from public.models mo where mo.brand_id = ${brandOf('s.b')}
                           and ${norm('mo.name')} = ${norm('s.m')} order by mo.created_at limit 1) as mid
             from seed_in s) s
       where mid is not null
       on conflict on constraint watches_model_reference_key do nothing`,
  ];
}

/** SQL statements for one chunk of rows, to run in a single transaction as the database owner. */
export function chunkStatements(rows) {
  return [
    ...stageStatements(rows),
    ...writeStatements(),
    `select (select count(*) from public.brands)::int as brands, (select count(*) from public.models)::int as models,
            (select count(*) from public.watches)::int as watches, (select count(*) from seed_in)::int as added_this_chunk`,
  ];
}

/** Fields the drawn picture uses; rows missing them still load but get a plainer drawing. */
export function drawingGaps(r) {
  const gaps = [];
  if (!r.case_material) gaps.push('case_material');
  if (!r.dial_color && !/panda|dial\)/i.test(r.nickname ?? '')) gaps.push('dial_color');
  return gaps;
}

/**
 * Nicknames are one short name ("Batman"), shown in orange on the watch and in
 * the feed. Other names go in `aka` (searchable), descriptions in `note`.
 * Returns why a row's nickname breaks that rule, or null.
 */
export function nicknameProblem(r) {
  const n = (r.nickname ?? '').trim();
  if (!n) return null;
  if (/[;/()[\]]/.test(n)) return 'one name only: put other names in aka, details in note';
  if (n.length > 24) return 'longer than 24 characters';
  return null;
}

function reportNicknames(rows) {
  const bad = rows.map((r) => [r, nicknameProblem(r)]).filter(([, p]) => p);
  for (const [r, p] of bad) console.error(`  ! ${r.brand} ${r.model} ${r.reference}: nickname "${r.nickname}" (${p})`);
  return bad.length;
}

export function chunks(rows, size = 200) {
  const out = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const printSql = args.includes('--print-sql');
  const check = args.includes('--check');
  const file = args.find((a) => !a.startsWith('--')) ?? path.join(here, '..', 'db', 'seed', 'catalog.csv');
  const rows = parseCsv(await readFile(file, 'utf8')).filter((r) => r.brand && r.model);

  // Bad nicknames stop a load (and are listed by --check) so they never reach the app.
  if (!check && reportNicknames(rows)) {
    console.error('Fix the nicknames above, then run again. Nothing was loaded.');
    process.exit(1);
  }

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
    if (check) {
      // Dry run: stage, remove what's already in the catalog, report, roll back.
      const fresh = [];
      for (const part of chunks(rows)) {
        await client.query('begin');
        for (const sql of stageStatements(part)) await client.query(sql);
        const { rows: left } = await client.query('select n from seed_in order by n');
        await client.query('rollback');
        for (const { n } of left) fresh.push(part[n]);
      }
      console.log(`${rows.length} rows: ${fresh.length} new, ${rows.length - fresh.length} already in the catalog (or repeated in the file).`);
      const badNicks = reportNicknames(fresh);
      if (badNicks) console.log(`${badNicks} nickname(s) to fix before loading (listed above).`);
      for (const r of fresh) {
        const gaps = drawingGaps(r);
        console.log(`  + ${r.brand} ${r.model} ${r.reference}${gaps.length ? `   (drawing would lack: ${gaps.join(', ')})` : ''}`);
      }
      return;
    }
    let last, added = 0;
    for (const part of chunks(rows)) {
      await client.query('begin');
      for (const sql of chunkStatements(part)) last = await client.query(sql);
      added += last.rows[0].added_this_chunk;
      await client.query('commit');
    }
    console.log(`Processed ${rows.length} rows; ${added} new, ${rows.length - added} already in the catalog. Totals now:`, last.rows[0]);
  } catch (err) {
    await client.query('rollback').catch(() => {});
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

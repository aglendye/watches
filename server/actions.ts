// Every API action. The app calls POST /api/rpc with { action, params }.
// Actions in `publicActions` work signed out; everything else needs a session
// and runs under row-level security as that user (see db.ts).
import { asOwner, asUser, q, type Query, type Row } from './db.js';
import { ApiError, badRequest, forbidden, notFound, notSignedIn, tooMany } from './errors.js';
import {
  DUMMY_HASH,
  hashPassword,
  newSessionToken,
  sha256,
  verifyPassword,
} from './security.js';
import * as v from './validate.js';

export interface Ctx {
  tokenHash: string | null;
  ip: string;
  userAgent: string;
  /** Sets the session cookie to this raw token. */
  startSession(token: string): void;
  clearSession(): void;
}

type Params = Record<string, unknown>;
type Action = (p: Params, ctx: Ctx) => Promise<unknown>;

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------
async function limit(key: string, max: number, window: string) {
  const [[row]] = await asOwner(q('select auth.hit_rate_limit($1, $2, $3::interval) as over', key, max, window));
  if (row.over) throw tooMany();
}

function user(ctx: Ctx, ...queries: Query[]): Promise<Row[][]> {
  if (!ctx.tokenHash) throw notSignedIn();
  return asUser(ctx.tokenHash, ...queries);
}

async function createSession(ctx: Ctx, userId: string) {
  const token = newSessionToken();
  await asOwner(
    q(
      'insert into auth.sessions (token_hash, user_id, user_agent) values ($1, $2, $3)',
      sha256(token),
      userId,
      ctx.userAgent.slice(0, 300),
    ),
  );
  ctx.startSession(token);
}

const ME_SQL = `select p.id, p.display_name as "displayName", p.is_admin as "isAdmin",
  (select u.email from auth.users u where u.id = p.id) as email
  from auth.sessions s join public.profiles p on p.id = s.user_id
  where s.token_hash = $1`;

const CATALOG_COLS = `c.watch_id, c.brand_id, c.brand_name, c.model_id, c.model_name, c.reference,
  c.case_size_mm::float8 as case_size_mm, c.movement_type, c.case_material, c.dial_color,
  c.water_resistance_m, c.year_introduced, c.extras, c.created_by, c.created_at,
  c.avg_score::float8 as avg_score, c.rating_count`;

/** Brand, model and the fields the drawing needs, for a watch aliased w joined to m and b. */
const WATCH_ART_COLS = `b.name as brand_name, m.name as model_name, w.reference,
  w.case_material, w.dial_color, w.extras`;
const WATCH_JOINS = `join public.models m on m.id = w.model_id
  join public.brands b on b.id = m.brand_id`;

const OWNERSHIP_COLS = `o.id, o.user_id, o.watch_id, o.acquired_on::text as acquired_on,
  o.sold_on::text as sold_on, o.notes, o.created_at`;

function ownershipInput(p: Params) {
  const acquired = v.optPastDate(p, 'acquiredOn', 'acquired date');
  const sold = v.optPastDate(p, 'soldOn', 'sold date');
  if (acquired && sold && sold < acquired) throw badRequest('The sold date can’t be before the acquired date.');
  return [acquired, sold, v.optStr(p, 'notes', 1000)] as const;
}

const RATING_COLS = `r.id, r.user_id, r.watch_id, r.score, r.review_text, r.rated_on::text as rated_on, r.created_at`;

// ---------------------------------------------------------------------
// auth (public)
// ---------------------------------------------------------------------
export const publicActions: Record<string, Action> = {
  async 'auth.session'(_p, ctx) {
    if (!ctx.tokenHash) return { user: null };
    const [rows] = await asOwner(q(ME_SQL, ctx.tokenHash));
    if (!rows[0]) {
      ctx.clearSession();
      return { user: null };
    }
    return { user: rows[0] };
  },

  async 'auth.signUp'(p, ctx) {
    const email = v.email(p);
    const password = v.password(p);
    const displayName = v.str(p, 'displayName', { min: 1, max: 40 });
    await limit(`signup:${ctx.ip}`, 10, '1 hour');
    const hash = await hashPassword(password);
    let id: string;
    try {
      const [[row]] = await asOwner(
        q(
          `insert into auth.users (email, password_hash, raw_user_meta_data)
           values ($1, $2, jsonb_build_object('display_name', $3::text)) returning id`,
          email,
          hash,
          displayName,
        ),
      );
      id = row.id as string;
    } catch (err) {
      if ((err as { code?: string }).code === '23505') {
        throw new ApiError(409, 'conflict', 'An account with that email already exists. Try signing in.');
      }
      throw err;
    }
    await createSession(ctx, id);
    return { ok: true };
  },

  async 'auth.signIn'(p, ctx) {
    const email = v.email(p);
    const password = typeof p.password === 'string' ? p.password : '';
    await limit(`signin-ip:${ctx.ip}`, 30, '15 minutes');
    await limit(`signin:${email.toLowerCase()}`, 10, '15 minutes');
    const [[row]] = await asOwner(
      q('select id, password_hash from auth.users where lower(email) = lower($1)', email),
    );
    const ok = await verifyPassword(password, (row?.password_hash as string) ?? DUMMY_HASH);
    if (!row || !ok) throw new ApiError(400, 'bad_login', 'Email or password is incorrect.');
    await createSession(ctx, row.id as string);
    return { ok: true };
  },

  async 'auth.signOut'(_p, ctx) {
    if (ctx.tokenHash) await asOwner(q('delete from auth.sessions where token_hash = $1', ctx.tokenHash));
    ctx.clearSession();
    return { ok: true };
  },
};

// ---------------------------------------------------------------------
// signed-in actions
// ---------------------------------------------------------------------
export const userActions: Record<string, Action> = {
  async 'profile.update'(p, ctx) {
    const name = v.str(p, 'displayName', { min: 1, max: 40 });
    const [rows] = await user(
      ctx,
      q('update public.profiles set display_name = $1 where id = auth.uid() returning id', name),
    );
    if (!rows[0]) throw forbidden();
    return { ok: true };
  },

  async 'watches.search'(p, ctx) {
    const query = typeof p.q === 'string' ? p.q.slice(0, 100) : '';
    const max = v.optNum(p, 'maxResults', { integer: true }) ?? 20;
    if (query.trim() === '') return [];
    const [rows] = await user(
      ctx,
      q(
        `select s.watch_id, s.brand_name, s.model_name, s.watch_reference, s.match_score,
                w.extras ->> 'nickname' as nickname, w.case_material, w.dial_color, w.extras,
                st.avg_score::float8 as avg_score, coalesce(st.rating_count, 0) as rating_count
           from public.search_watches($1, $2) s
           join public.watches w on w.id = s.watch_id
           left join public.watch_stats st on st.watch_id = s.watch_id
          order by s.match_score desc, s.brand_name, s.model_name`,
        query,
        max,
      ),
    );
    return rows;
  },

  async 'watches.add'(p, ctx) {
    const brand = v.str(p, 'brand', { max: 80 });
    const model = v.str(p, 'model', { max: 120 });
    const reference = v.optStr(p, 'reference', 60);
    const nickname = v.optStr(p, 'nickname', 80);
    const [[row]] = await user(
      ctx,
      q('select public.add_watch($1, $2, $3, $4::text) as id', brand, model, reference, nickname),
    );
    return { id: row.id };
  },

  async 'watches.lookup'(p, ctx) {
    const brand = typeof p.brand === 'string' ? p.brand : '';
    const model = typeof p.model === 'string' ? p.model : '';
    if (!brand.trim() || !model.trim()) return { id: null };
    const reference = v.optStr(p, 'reference', 60);
    const [rows] = await user(
      ctx,
      q(
        `select w.id from public.watches w
           join public.models m on m.id = w.model_id
           join public.brands b on b.id = m.brand_id
          where lower(b.name) = lower(btrim($1)) and lower(m.name) = lower(btrim($2))
            and w.reference_key is not distinct from lower($3::text)`,
        brand,
        model,
        reference,
      ),
    );
    return { id: rows[0]?.id ?? null };
  },

  async 'brands.suggest'(p, ctx) {
    const prefix = typeof p.prefix === 'string' ? p.prefix.trim().slice(0, 80) : '';
    if (!prefix) return [];
    const [rows] = await user(
      ctx,
      q(
        `select name from public.brands where lower(name) like lower($1) escape '\\'
          order by lower(name) limit 8`,
        v.likePrefix(prefix),
      ),
    );
    return rows.map((r) => r.name);
  },

  async 'models.suggest'(p, ctx) {
    const brand = typeof p.brand === 'string' ? p.brand.trim() : '';
    const prefix = typeof p.prefix === 'string' ? p.prefix.trim().slice(0, 120) : '';
    if (!brand) return [];
    const [rows] = await user(
      ctx,
      q(
        `select m.name from public.models m join public.brands b on b.id = m.brand_id
          where lower(b.name) = lower($1) and lower(m.name) like lower($2) escape '\\'
          order by lower(m.name) limit 8`,
        brand,
        v.likePrefix(prefix),
      ),
    );
    return rows.map((r) => r.name);
  },

  async 'watches.get'(p, ctx) {
    const id = v.uuid(p, 'id');
    const [rows] = await user(
      ctx,
      q(
        `select ${CATALOG_COLS},
                cp.display_name as created_by_name,
                up.display_name as updated_by_name,
                w.updated_at,
                (c.created_by = auth.uid() or public.is_admin()) as can_edit_identity,
                (public.is_admin() or (c.created_by = auth.uid()
                   and not public.watch_used_by_others(c.watch_id))) as can_delete
           from public.watch_catalog c
           join public.watches w on w.id = c.watch_id
           join public.profiles cp on cp.id = c.created_by
           left join public.profiles up on up.id = w.updated_by
          where c.watch_id = $1`,
        id,
      ),
    );
    if (!rows[0]) throw notFound('This watch doesn’t exist (it may have been deleted).');
    return rows[0];
  },

  async 'watches.update'(p, ctx) {
    const id = v.uuid(p, 'id');
    const movement = v.optStr(p, 'movement_type', 20);
    if (movement && !['automatic', 'manual', 'quartz', 'other'].includes(movement)) {
      throw badRequest('Choose a movement type from the list.');
    }
    const specs = [
      v.optNum(p, 'case_size_mm'),
      movement,
      v.optStr(p, 'case_material', 80),
      v.optStr(p, 'dial_color', 80),
      v.optNum(p, 'water_resistance_m', { integer: true }),
      v.optNum(p, 'year_introduced', { integer: true }),
    ];
    const queries: Query[] = [];
    let identitySql = '';
    if (p.brand !== undefined || p.model !== undefined || p.reference !== undefined) {
      const brand = v.str(p, 'brand', { min: 1, max: 80 });
      const model = v.str(p, 'model', { min: 1, max: 120 });
      const reference = v.optStr(p, 'reference', 60);
      // Find or create the brand and model first (same as add_watch). If the
      // update is then refused, the whole transaction rolls back.
      queries.push(
        q('insert into public.brands (name) values ($1) on conflict (lower(name)) do nothing', brand),
        q(
          `insert into public.models (brand_id, name)
           select id, $2 from public.brands where lower(name) = lower($1)
           on conflict (brand_id, lower(name)) do nothing`,
          brand,
          model,
        ),
      );
      specs.push(brand, model, reference);
      identitySql = `,
        model_id = (select m.id from public.models m join public.brands b on b.id = m.brand_id
                     where lower(b.name) = lower($8) and lower(m.name) = lower($9)),
        reference = $10`;
    }
    const values: unknown[] = [...specs.slice(0, 6), id, ...specs.slice(6)];
    let nicknameSql = '';
    if (p.nickname !== undefined) {
      // Blank removes the nickname; anyone can edit it, like the other specs.
      values.push(v.optStr(p, 'nickname', 80));
      const n = `$${values.length}::text`;
      nicknameSql = `,
        extras = case when ${n} is null then extras - 'nickname'
                      else jsonb_set(extras, '{nickname}', to_jsonb(${n})) end`;
    }
    queries.push(
      q(
        `update public.watches set
           case_size_mm = $1, movement_type = $2, case_material = $3, dial_color = $4,
           water_resistance_m = $5, year_introduced = $6${identitySql}${nicknameSql}
         where id = $7 returning id`,
        ...values,
      ),
    );
    const results = await user(ctx, ...queries);
    if (!results[results.length - 1][0]) throw notFound();
    return { ok: true };
  },

  async 'watches.delete'(p, ctx) {
    const id = v.uuid(p, 'id');
    const [rows] = await user(ctx, q('delete from public.watches where id = $1 returning id', id));
    if (!rows[0]) throw forbidden('Only the person who added this watch (or an admin) can delete it.');
    return { ok: true };
  },

  async 'ratings.forWatch'(p, ctx) {
    const watchId = v.uuid(p, 'watchId');
    const [rows] = await user(
      ctx,
      q(
        `select ${RATING_COLS}, p.display_name,
                (select count(*) from public.ratings x
                  where x.user_id = r.user_id and x.watch_id = r.watch_id)::int as entry_count
           from public.current_ratings r
           join public.profiles p on p.id = r.user_id
          where r.watch_id = $1
          order by (r.user_id = auth.uid()) desc, r.rated_on desc, r.created_at desc`,
        watchId,
      ),
    );
    return rows;
  },

  async 'ratings.personEntries'(p, ctx) {
    const watchId = v.uuid(p, 'watchId');
    const userId = v.uuid(p, 'userId');
    const [rows] = await user(
      ctx,
      q(
        `select ${RATING_COLS} from public.ratings r
          where r.watch_id = $1 and r.user_id = $2
          order by r.rated_on desc, r.created_at desc`,
        watchId,
        userId,
      ),
    );
    return rows;
  },

  async 'ratings.create'(p, ctx) {
    const watchId = v.uuid(p, 'watchId');
    const [[row]] = await user(
      ctx,
      q(
        `insert into public.ratings (watch_id, score, review_text, rated_on)
         values ($1, $2, $3, $4) returning id`,
        watchId,
        v.score(p),
        v.optStr(p, 'reviewText', 5000),
        v.date(p, 'ratedOn'),
      ),
    );
    return { id: row.id };
  },

  async 'ratings.update'(p, ctx) {
    const [rows] = await user(
      ctx,
      q(
        `update public.ratings set score = $2, review_text = $3, rated_on = $4
          where id = $1 returning id`,
        v.uuid(p, 'id'),
        v.score(p),
        v.optStr(p, 'reviewText', 5000),
        v.date(p, 'ratedOn'),
      ),
    );
    if (!rows[0]) throw forbidden('You can only edit your own entries.');
    return { ok: true };
  },

  async 'ratings.delete'(p, ctx) {
    const [rows] = await user(ctx, q('delete from public.ratings where id = $1 returning id', v.uuid(p, 'id')));
    if (!rows[0]) throw forbidden('You can only delete your own entries.');
    return { ok: true };
  },

  async 'diary.list'(p, ctx) {
    const page = Math.max(0, v.optNum(p, 'page', { integer: true }) ?? 0);
    const [rows] = await user(
      ctx,
      q(
        `select ${RATING_COLS}, b.name as brand_name, m.name as model_name, w.reference,
                w.case_material, w.dial_color, w.extras
           from public.ratings r
           join public.watches w on w.id = r.watch_id
           join public.models m on m.id = w.model_id
           join public.brands b on b.id = m.brand_id
          where r.user_id = auth.uid()
          order by r.rated_on desc, r.created_at desc
          limit 51 offset $1`,
        page * 50,
      ),
    );
    return { items: rows.slice(0, 50), hasMore: rows.length > 50 };
  },

  async 'home.feed'(_p, ctx) {
    const [rows] = await user(
      ctx,
      q(
        `select * from (
           (select 'rating' as kind, r.id, r.created_at, r.user_id, p.display_name, r.watch_id,
                   b.name as brand_name, m.name as model_name, w.reference,
                   w.case_material, w.dial_color, w.extras,
                   r.score, left(r.review_text, 141) as snippet
              from public.ratings r
              join public.profiles p on p.id = r.user_id
              join public.watches w on w.id = r.watch_id
              join public.models m on m.id = w.model_id
              join public.brands b on b.id = m.brand_id
             order by r.created_at desc limit 30)
           union all
           (select 'watch', w.id, w.created_at, w.created_by, p.display_name, w.id,
                   b.name, m.name, w.reference, w.case_material, w.dial_color, w.extras,
                   null::smallint, null::text
              from public.watches w
              join public.profiles p on p.id = w.created_by
              join public.models m on m.id = w.model_id
              join public.brands b on b.id = m.brand_id
             order by w.created_at desc limit 30)
         ) f
         order by created_at desc
         limit 30`,
      ),
    );
    return rows;
  },

  async 'home.recent'(_p, ctx) {
    const [rows] = await user(
      ctx,
      q(`select ${CATALOG_COLS} from public.watch_catalog c order by c.created_at desc limit 12`),
    );
    return rows;
  },

  // -------------------------------------------------------------------
  // ownership (M7). Not shown in the activity feed (PRD 5.11).
  // -------------------------------------------------------------------
  async 'ownerships.forWatch'(p, ctx) {
    const watchId = v.uuid(p, 'watchId');
    const [rows] = await user(
      ctx,
      q(
        `select ${OWNERSHIP_COLS}, pr.display_name
           from public.ownerships o
           join public.profiles pr on pr.id = o.user_id
          where o.watch_id = $1
          order by (o.sold_on is null) desc, (o.user_id = auth.uid()) desc,
                   pr.display_name, o.created_at`,
        watchId,
      ),
    );
    return rows;
  },

  async 'ownerships.mine'(_p, ctx) {
    const [rows] = await user(
      ctx,
      q(
        `select ${OWNERSHIP_COLS}, ${WATCH_ART_COLS}
           from public.ownerships o
           join public.watches w on w.id = o.watch_id
           ${WATCH_JOINS}
          where o.user_id = auth.uid()
          order by o.acquired_on desc nulls last, o.created_at desc`,
      ),
    );
    return rows;
  },

  async 'ownerships.create'(p, ctx) {
    const watchId = v.uuid(p, 'watchId');
    const [acquired, sold, notes] = ownershipInput(p);
    const [[row]] = await user(
      ctx,
      q(
        `insert into public.ownerships (watch_id, acquired_on, sold_on, notes)
         values ($1, $2, $3, $4) returning id`,
        watchId,
        acquired,
        sold,
        notes,
      ),
    );
    return { id: row.id };
  },

  async 'ownerships.update'(p, ctx) {
    const id = v.uuid(p, 'id');
    const [acquired, sold, notes] = ownershipInput(p);
    const [rows] = await user(
      ctx,
      q(
        `update public.ownerships set acquired_on = $2, sold_on = $3, notes = $4
          where id = $1 returning id`,
        id,
        acquired,
        sold,
        notes,
      ),
    );
    if (!rows[0]) throw forbidden('You can only edit your own collection.');
    return { ok: true };
  },

  async 'ownerships.delete'(p, ctx) {
    const [rows] = await user(ctx, q('delete from public.ownerships where id = $1 returning id', v.uuid(p, 'id')));
    if (!rows[0]) throw forbidden('You can only remove watches from your own collection.');
    return { ok: true };
  },
};

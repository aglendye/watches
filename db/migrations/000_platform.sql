-- =====================================================================
-- 000_platform.sql
-- Replaces the pieces Supabase used to provide, so that 001_core.sql
-- (the original schema.sql) runs unchanged on a plain Neon Postgres:
--   * roles `authenticated` and `anon`
--   * schema `extensions` (pg_trgm lives there)
--   * schema `auth` with users, sessions, password-reset codes and rate limits
--   * auth.uid(): the signed-in user's id for the current transaction
--   * default privileges that mirror Supabase's (001 then tightens them)
--
-- How requests run: the API connects as the database owner, then for every
-- signed-in request it opens a transaction, calls auth.begin_session(token),
-- and runs `set local role authenticated`. From that point row-level
-- security applies exactly as it did on Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Roles (no login; the API switches into `authenticated` per transaction)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  -- The connecting owner must be allowed to SET ROLE into authenticated.
  execute format('grant authenticated to %I', current_user);
end
$$;

-- ---------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------
create schema if not exists extensions;
create schema if not exists auth;

grant usage on schema public     to authenticated;
grant usage on schema extensions to authenticated;
grant usage on schema auth       to authenticated;   -- for auth.uid() only; no table grants

-- ---------------------------------------------------------------------
-- Default privileges (mirror Supabase): new tables/views/functions in
-- public are usable by authenticated. Functions are not executable by
-- PUBLIC by default.
-- ---------------------------------------------------------------------
alter default privileges revoke execute on functions from public;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;

-- ---------------------------------------------------------------------
-- auth tables (never granted to authenticated)
-- ---------------------------------------------------------------------
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null check (char_length(email) between 3 and 254),
  password_hash      text not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists users_email_key on auth.users (lower(email));

create table if not exists auth.sessions (
  token_hash  text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  user_agent  text
);
create index if not exists sessions_user_idx on auth.sessions (user_id);

create table if not exists auth.reset_codes (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists auth.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);

revoke all on all tables in schema auth from authenticated, anon, public;

-- ---------------------------------------------------------------------
-- auth.uid(): the user id set by begin_session for this transaction.
-- ---------------------------------------------------------------------
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;
grant execute on function auth.uid() to authenticated;

-- ---------------------------------------------------------------------
-- auth.begin_session(token_hash): looks up the session, stores the user id
-- for this transaction, and raises 28000 if the session does not exist.
-- Called by the API as the owner, before `set local role authenticated`.
-- ---------------------------------------------------------------------
create or replace function auth.begin_session(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  update auth.sessions
     set last_seen = now()
   where token_hash = p_token_hash
  returning user_id into v_user;

  if v_user is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  perform set_config('app.user_id', v_user::text, true);
  return v_user;
end;
$$;
revoke execute on function auth.begin_session(text) from public, authenticated, anon;

-- ---------------------------------------------------------------------
-- auth.hit_rate_limit(key, max, window): records one hit and returns true
-- when the key has exceeded `max` hits in the current window.
-- ---------------------------------------------------------------------
create or replace function auth.hit_rate_limit(p_key text, p_max integer, p_window interval)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into auth.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - p_window then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - p_window then now() else r.window_start end
  returning hits into v_hits;
  return v_hits > p_max;
end;
$$;
revoke execute on function auth.hit_rate_limit(text, integer, interval) from public, authenticated, anon;

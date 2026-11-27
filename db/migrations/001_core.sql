-- =====================================================================
-- 001_core.sql: watch rating app v1 schema (the original schema.sql)
-- Runs after 000_platform.sql, which supplies the auth schema, roles and
-- auth.uid() that Supabase used to provide. Apply with: npm run db:migrate
-- Scope: profiles, brands, models, watches, ratings, plus search and helpers.
-- Ownerships, lists, photos and links come in a later migration.
--
-- After you create your own account in the app, make yourself admin:
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where lower(email) = lower('you@example.com'));
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'collector'
    ), 40)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- Brands and models (shared catalog)
-- ---------------------------------------------------------------------
create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (btrim(name) <> ''),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create unique index brands_name_key on public.brands (lower(name));

create table public.models (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references public.brands (id) on delete restrict,
  name       text not null check (btrim(name) <> ''),
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create unique index models_brand_name_key on public.models (brand_id, lower(name));

-- ---------------------------------------------------------------------
-- Watches (reference-level records; reference is optional)
-- One row per (model, reference). NULLS NOT DISTINCT means each model gets
-- at most one "no reference" placeholder row.
-- ---------------------------------------------------------------------
create table public.watches (
  id                 uuid primary key default gen_random_uuid(),
  model_id           uuid not null references public.models (id) on delete restrict,
  reference          text check (reference is null or btrim(reference) <> ''),
  reference_key      text generated always as (lower(btrim(reference))) stored,

  case_size_mm       numeric(4,1) check (case_size_mm is null or case_size_mm between 10 and 80),
  movement_type      text check (movement_type is null
                                 or movement_type in ('automatic', 'manual', 'quartz', 'other')),
  case_material      text,
  dial_color         text,
  water_resistance_m integer check (water_resistance_m is null or water_resistance_m >= 0),
  year_introduced    integer check (year_introduced is null or year_introduced between 1800 and 2100),
  extras             jsonb not null default '{}'::jsonb,

  created_by         uuid not null default auth.uid() references public.profiles (id),
  created_at         timestamptz not null default now(),
  updated_by         uuid references public.profiles (id),
  updated_at         timestamptz,

  constraint watches_model_reference_key unique nulls not distinct (model_id, reference_key)
);
create index watches_model_idx on public.watches (model_id);

-- Identity fields (model, reference) can only be changed by the creator or an
-- admin. Specs and extras can be edited by any signed-in user. A watch can
-- only be deleted while nobody else has rated it (admins and the SQL editor
-- are exempt).
create or replace function public.watches_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if auth.uid() is not null
       and (new.model_id is distinct from old.model_id
            or new.reference is distinct from old.reference)
       and not (old.created_by = auth.uid() or public.is_admin()) then
      raise exception 'Only the creator or an admin can change a watch''s brand, model, or reference';
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := auth.uid();
    new.updated_at := now();
    return new;
  elsif tg_op = 'DELETE' then
    if auth.uid() is not null
       and not public.is_admin()
       and exists (select 1 from public.ratings r
                   where r.watch_id = old.id and r.user_id <> auth.uid()) then
      raise exception 'This watch has ratings from other people and cannot be deleted';
    end if;
    return old;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------
-- Ratings: an append-only diary. The same user can rate a watch many times.
-- ---------------------------------------------------------------------
create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  watch_id    uuid not null references public.watches (id) on delete cascade,
  score       smallint not null check (score between 1 and 10),
  review_text text check (review_text is null or char_length(review_text) <= 5000),
  rated_on    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index ratings_watch_idx on public.ratings (watch_id);
create index ratings_user_idx  on public.ratings (user_id, rated_on desc);

create trigger watches_guard_update
  before update on public.watches
  for each row execute function public.watches_guard();

create trigger watches_guard_delete
  before delete on public.watches
  for each row execute function public.watches_guard();

-- ---------------------------------------------------------------------
-- Views (security_invoker so row-level security still applies)
-- ---------------------------------------------------------------------
-- Each person's most recent entry per watch. Averages use this so that
-- re-rating doesn't count a person more than once.
create view public.current_ratings with (security_invoker = true) as
select distinct on (user_id, watch_id)
       id, user_id, watch_id, score, review_text, rated_on, created_at
from public.ratings
order by user_id, watch_id, rated_on desc, created_at desc;

create view public.watch_stats with (security_invoker = true) as
select watch_id,
       round(avg(score)::numeric, 1) as avg_score,
       count(*)::integer             as rating_count
from public.current_ratings
group by watch_id;

-- Convenience view for browsing the catalog.
create view public.watch_catalog with (security_invoker = true) as
select w.id            as watch_id,
       b.id            as brand_id,
       b.name          as brand_name,
       m.id            as model_id,
       m.name          as model_name,
       w.reference,
       w.case_size_mm,
       w.movement_type,
       w.case_material,
       w.dial_color,
       w.water_resistance_m,
       w.year_introduced,
       w.extras,
       w.created_by,
       w.created_at,
       s.avg_score,
       coalesce(s.rating_count, 0) as rating_count
from public.watches w
join public.models m on m.id = w.model_id
join public.brands b on b.id = m.brand_id
left join public.watch_stats s on s.watch_id = w.id;

-- ---------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------
-- Typo-tolerant search across brand + model + reference.
create or replace function public.search_watches(q text, max_results integer default 20)
returns table (
  watch_id        uuid,
  brand_name      text,
  model_name      text,
  watch_reference text,
  match_score     real
)
language sql
stable
set search_path = public, extensions
as $$
  with c as (
    select w.id as wid, b.name as bname, m.name as mname, w.reference as wref,
           (b.name || ' ' || m.name || ' ' || coalesce(w.reference, '')) as haystack
    from public.watches w
    join public.models m on m.id = w.model_id
    join public.brands b on b.id = m.brand_id
  )
  select wid, bname, mname, wref,
         greatest(
           word_similarity(btrim(q), haystack),
           case when haystack ilike '%' || btrim(q) || '%' then 1.0::real else 0::real end
         ) as match_score
  from c
  where btrim(q) <> ''
    and (word_similarity(btrim(q), haystack) >= 0.3
         or haystack ilike '%' || btrim(q) || '%')
  order by match_score desc, bname, mname
  limit least(greatest(max_results, 1), 50);
$$;

-- Finds or creates brand -> model -> watch in one call and returns the watch id.
-- Safe to call when the record already exists (returns the existing id).
create or replace function public.add_watch(
  p_brand     text,
  p_model     text,
  p_reference text default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_brand    text := nullif(btrim(p_brand), '');
  v_model    text := nullif(btrim(p_model), '');
  v_ref      text := nullif(btrim(p_reference), '');
  v_brand_id uuid;
  v_model_id uuid;
  v_watch_id uuid;
begin
  if v_brand is null or v_model is null then
    raise exception 'Brand and model are required';
  end if;

  insert into brands (name) values (v_brand)
  on conflict (lower(name)) do nothing;
  select id into v_brand_id from brands where lower(name) = lower(v_brand);

  insert into models (brand_id, name) values (v_brand_id, v_model)
  on conflict (brand_id, lower(name)) do nothing;
  select id into v_model_id from models
  where brand_id = v_brand_id and lower(name) = lower(v_model);

  insert into watches (model_id, reference) values (v_model_id, v_ref)
  on conflict on constraint watches_model_reference_key do nothing;
  select id into v_watch_id from watches
  where model_id = v_model_id and reference_key is not distinct from lower(v_ref);

  return v_watch_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Row-level security: everything is readable by signed-in users only.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.brands   enable row level security;
alter table public.models   enable row level security;
alter table public.watches  enable row level security;
alter table public.ratings  enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- brands
create policy brands_select on public.brands
  for select to authenticated using (true);
create policy brands_insert on public.brands
  for insert to authenticated with check (created_by = auth.uid());
create policy brands_update on public.brands
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy brands_delete on public.brands
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- models
create policy models_select on public.models
  for select to authenticated using (true);
create policy models_insert on public.models
  for insert to authenticated with check (created_by = auth.uid());
create policy models_update on public.models
  for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy models_delete on public.models
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- watches (the trigger above guards identity fields and deletes)
create policy watches_select on public.watches
  for select to authenticated using (true);
create policy watches_insert on public.watches
  for insert to authenticated with check (created_by = auth.uid());
create policy watches_update on public.watches
  for update to authenticated using (true) with check (true);
create policy watches_delete on public.watches
  for delete to authenticated using (created_by = auth.uid() or public.is_admin());

-- ratings: everyone reads, people only write their own
create policy ratings_select on public.ratings
  for select to authenticated using (true);
create policy ratings_insert on public.ratings
  for insert to authenticated with check (user_id = auth.uid());
create policy ratings_update on public.ratings
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ratings_delete on public.ratings
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- Grants: signed-in users only; nothing for anonymous visitors.
-- Users can change only their display name on their own profile.
-- ---------------------------------------------------------------------
revoke all on public.profiles, public.brands, public.models,
              public.watches, public.ratings from anon;
revoke all on public.current_ratings, public.watch_stats, public.watch_catalog from anon;

revoke insert, update, delete on public.profiles from authenticated;
grant  update (display_name) on public.profiles to authenticated;

grant execute on function public.search_watches(text, integer) to authenticated;
grant execute on function public.add_watch(text, text, text)   to authenticated;
revoke execute on function public.search_watches(text, integer) from anon;
revoke execute on function public.add_watch(text, text, text)   from anon;

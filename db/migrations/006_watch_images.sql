-- =====================================================================
-- 006_watch_images.sql (Phase 2, M9)
-- Photos of watches. The files live in a private Vercel Blob store at
-- storage_path (watch-images/{watch_id}/{image_id}.jpg); only this row is in
-- the database. The app serves a photo at /api/photo?id={image_id} after
-- checking the session, so photos are visible to signed-in users only.
--
-- The primary photo of a watch is its oldest; deleting it promotes the next
-- oldest automatically (it's just the new oldest). Anyone signed in can add
-- photos; the uploader or an admin can delete them.
-- The delete guard now also covers other people's photos.
-- =====================================================================

create table public.watch_images (
  id           uuid primary key default gen_random_uuid(),
  watch_id     uuid not null references public.watches (id) on delete cascade,
  uploaded_by  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^watch-images/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),
  width        integer check (width is null or width between 1 and 10000),
  height       integer check (height is null or height between 1 and 10000),
  created_at   timestamptz not null default now()
);
create index watch_images_watch_idx on public.watch_images (watch_id, created_at, id);

alter table public.watch_images enable row level security;

create policy watch_images_select on public.watch_images
  for select to authenticated using (true);
create policy watch_images_insert on public.watch_images
  for insert to authenticated with check (uploaded_by = auth.uid());
create policy watch_images_delete on public.watch_images
  for delete to authenticated using (uploaded_by = auth.uid() or public.is_admin());

-- Photos are never edited, only added and deleted.
revoke all on public.watch_images from anon;
revoke update on public.watch_images from authenticated;
grant select, insert, delete on public.watch_images to authenticated;

-- The URL the app uses for a watch's primary photo, or null.
create or replace function public.primary_image_url(p_watch uuid)
returns text
language sql
stable
set search_path = public
as $$
  select '/api/photo?id=' || i.id
    from public.watch_images i
   where i.watch_id = p_watch
   order by i.created_at, i.id
   limit 1;
$$;
revoke execute on function public.primary_image_url(uuid) from public, anon;
grant execute on function public.primary_image_url(uuid) to authenticated;

-- watch_catalog gains primary_image_url (appended, so existing columns keep
-- their positions).
create or replace view public.watch_catalog with (security_invoker = true) as
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
       coalesce(s.rating_count, 0) as rating_count,
       public.primary_image_url(w.id) as primary_image_url
from public.watches w
join public.models m on m.id = w.model_id
join public.brands b on b.id = m.brand_id
left join public.watch_stats s on s.watch_id = w.id;

-- ---------------------------------------------------------------------
-- Delete guard: also in use when someone else has added a photo.
-- ---------------------------------------------------------------------
create or replace function public.watch_used_by_others(p_watch uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (select 1 from public.ratings r
                  where r.watch_id = p_watch and r.user_id <> auth.uid())
      or exists (select 1 from public.ownerships o
                  where o.watch_id = p_watch and o.user_id <> auth.uid())
      or exists (select 1 from public.list_items i
                   join public.lists l on l.id = i.list_id
                  where i.watch_id = p_watch and l.user_id <> auth.uid())
      or exists (select 1 from public.watch_images p
                  where p.watch_id = p_watch and p.uploaded_by <> auth.uid());
$$;

-- =====================================================================
-- 004_ownerships.sql (Phase 2, M7)
-- "I own this": one row per physical watch a person owns or has owned.
-- Owning two of the same watch is two rows. No sold date = owned now.
-- Everyone signed in can see ownerships; people only write their own.
--
-- Also adds public.watch_used_by_others(watch_id), the single place that
-- decides whether a non-admin may delete a watch they created. The delete
-- guard trigger and the API's can_delete flag both call it; later
-- migrations (lists, photos) redefine it to cover their tables.
-- =====================================================================

create table public.ownerships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  watch_id    uuid not null references public.watches (id) on delete cascade,
  acquired_on date,
  sold_on     date,
  notes       text check (notes is null or char_length(notes) <= 1000),
  created_at  timestamptz not null default now(),
  constraint ownerships_sold_after_acquired
    check (sold_on is null or acquired_on is null or sold_on >= acquired_on)
);
create index ownerships_user_idx  on public.ownerships (user_id);
create index ownerships_watch_idx on public.ownerships (watch_id);

alter table public.ownerships enable row level security;

create policy ownerships_select on public.ownerships
  for select to authenticated using (true);
create policy ownerships_insert on public.ownerships
  for insert to authenticated with check (user_id = auth.uid());
create policy ownerships_update on public.ownerships
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ownerships_delete on public.ownerships
  for delete to authenticated using (user_id = auth.uid());

revoke all on public.ownerships from anon;
grant select, insert, update, delete on public.ownerships to authenticated;

-- ---------------------------------------------------------------------
-- Delete guard: a watch is "in use by others" when someone other than the
-- current user has rated it or owns (or owned) it. Deleting it would wipe
-- their records through the cascades.
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
                  where o.watch_id = p_watch and o.user_id <> auth.uid());
$$;
revoke execute on function public.watch_used_by_others(uuid) from public, anon;
grant execute on function public.watch_used_by_others(uuid) to authenticated;

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
       and public.watch_used_by_others(old.id) then
      raise exception 'Other people have rated, owned, listed or photographed this watch, so it can''t be deleted';
    end if;
    return old;
  end if;
  return null;
end;
$$;

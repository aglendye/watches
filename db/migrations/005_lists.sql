-- =====================================================================
-- 005_lists.sql (Phase 2, M8)
-- Named, unordered lists of watches ("Grails", "Dad's wishlist"). A watch
-- appears once per list, with an optional note. Everyone signed in can see
-- every list; only the list's owner changes it or its items.
-- The delete guard now also covers other people's lists.
-- =====================================================================

create table public.lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lists_user_idx on public.lists (user_id);
create index lists_created_idx on public.lists (created_at desc);

create table public.list_items (
  list_id  uuid not null references public.lists (id) on delete cascade,
  watch_id uuid not null references public.watches (id) on delete cascade,
  note     text check (note is null or char_length(note) <= 280),
  added_at timestamptz not null default now(),
  primary key (list_id, watch_id)
);
create index list_items_watch_idx on public.list_items (watch_id);

-- The owner and created time never change; updated_at is stamped.
create or replace function public.lists_touch()
returns trigger
language plpgsql
as $$
begin
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger lists_touch before update on public.lists
  for each row execute function public.lists_touch();

-- Is the current user the owner of this list? (security definer so the
-- list_items policies don't depend on the lists policies.)
create or replace function public.owns_list(p_list uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.lists l where l.id = p_list and l.user_id = auth.uid());
$$;
revoke execute on function public.owns_list(uuid) from public, anon;
grant execute on function public.owns_list(uuid) to authenticated;

alter table public.lists      enable row level security;
alter table public.list_items enable row level security;

create policy lists_select on public.lists
  for select to authenticated using (true);
create policy lists_insert on public.lists
  for insert to authenticated with check (user_id = auth.uid());
create policy lists_update on public.lists
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy lists_delete on public.lists
  for delete to authenticated using (user_id = auth.uid());

create policy list_items_select on public.list_items
  for select to authenticated using (true);
create policy list_items_insert on public.list_items
  for insert to authenticated with check (public.owns_list(list_id));
create policy list_items_update on public.list_items
  for update to authenticated using (public.owns_list(list_id)) with check (public.owns_list(list_id));
create policy list_items_delete on public.list_items
  for delete to authenticated using (public.owns_list(list_id));

revoke all on public.lists, public.list_items from anon;
grant select, insert, update, delete on public.lists, public.list_items to authenticated;

-- ---------------------------------------------------------------------
-- Delete guard: also in use when it's on someone else's list.
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
                  where i.watch_id = p_watch and l.user_id <> auth.uid());
$$;

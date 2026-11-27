-- =====================================================================
-- 003_add_watch_nickname.sql
-- add_watch(brand, model, reference, nickname): same as the 3-argument
-- version, but a newly created watch also gets extras.nickname. If the watch
-- already exists it is returned unchanged (its nickname is edited on the
-- watch's Edit details screen instead).
-- =====================================================================
create or replace function public.add_watch(
  p_brand     text,
  p_model     text,
  p_reference text,
  p_nickname  text
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_brand    text := nullif(btrim(p_brand), '');
  v_model    text := nullif(btrim(p_model), '');
  v_ref      text := nullif(btrim(p_reference), '');
  v_nick     text := nullif(btrim(p_nickname), '');
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

  insert into watches (model_id, reference, extras)
  values (v_model_id, v_ref,
          case when v_nick is null then '{}'::jsonb else jsonb_build_object('nickname', left(v_nick, 80)) end)
  on conflict on constraint watches_model_reference_key do nothing;
  select id into v_watch_id from watches
  where model_id = v_model_id and reference_key is not distinct from lower(v_ref);

  return v_watch_id;
end;
$$;

grant execute on function public.add_watch(text, text, text, text) to authenticated;
revoke execute on function public.add_watch(text, text, text, text) from anon;

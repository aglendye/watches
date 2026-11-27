-- =====================================================================
-- 002_nickname_search.sql
-- Search also matches a watch's nickname (extras ->> 'nickname'), so
-- "rolex batman" finds the GMT-Master II 116710BLNR. Same signature,
-- ranking and limits as 001; only the searched text changes.
-- =====================================================================
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
           (b.name || ' ' || m.name || ' ' || coalesce(w.reference, '') || ' ' ||
            coalesce(w.extras ->> 'nickname', '')) as haystack
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

grant execute on function public.search_watches(text, integer) to authenticated;
revoke execute on function public.search_watches(text, integer) from anon;

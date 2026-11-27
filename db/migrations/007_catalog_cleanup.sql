-- =====================================================================
-- 007_catalog_cleanup.sql
-- 1. profiles.is_system marks accounts that aren't people (the "Seed
--    catalog" account). Watches they add stay out of the activity feed and
--    "Recently added", including future seeding batches.
-- 2. One nickname per watch. Other names a watch goes by move to
--    extras.aka ("Bumblebee"), and descriptions to extras.note or
--    dial_color. Search also matches extras.aka.
-- =====================================================================

alter table public.profiles add column if not exists is_system boolean not null default false;
-- Users can still only change their display name (001 grants update on that column only).

update public.profiles set is_system = true
 where id in (select id from auth.users where lower(email) = 'seed@catalog.invalid');

-- ---------------------------------------------------------------------
-- Search: brand + model + reference + nickname + other names.
-- ---------------------------------------------------------------------
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
            coalesce(w.extras ->> 'nickname', '') || ' ' || coalesce(w.extras ->> 'aka', '')) as haystack
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

-- ---------------------------------------------------------------------
-- Nickname cleanup (seed data). The update trigger is paused so these rows
-- don't show as "edited by someone" on the watch page. Matched by brand + reference; a row is only
-- changed while its nickname is still the original seeded text, so any edit
-- a person already made is kept. null nickname = it wasn't really one.
-- ---------------------------------------------------------------------
alter table public.watches disable trigger watches_guard_update;

with fix (brand, ref, old_nick, nick, aka, note, dial) as (values
  ('Audemars Piguet', '15710ST.OO.A002CA.01', 'Offshore Diver (previous)', 'Offshore Diver', null, 'Previous generation', null),
  ('Omega', '210.90.42.20.01.001', 'No Time To Die (James Bond)', 'No Time To Die', 'James Bond', null, null),
  ('Omega', '2254.50.00', 'Seamaster Professional 300M', null, 'Seamaster Professional', null, null),
  ('Omega', '2531.80.00', 'James Bond (GoldenEye era)', 'James Bond', null, 'GoldenEye era', null),
  ('Omega', '145.022', 'Moonwatch (861)', 'Moonwatch', null, 'Calibre 861 era', null),
  ('Omega', '310.32.42.50.02.001', 'Silver Snoopy Award 50th Anniversary', 'Silver Snoopy', null, '50th anniversary of the Silver Snoopy Award', null),
  ('Patek Philippe', '5270G-019', 'Perpetual Calendar Chronograph', null, null, 'Perpetual calendar chronograph', null),
  ('Patek Philippe', '3700/1A', 'Jumbo (original)', 'Jumbo', null, 'The original Nautilus', null),
  ('Patek Philippe', '5711/1A-014', 'Olive green (final run)', 'Olive', null, 'Final production run', null),
  ('Rolex', '116500LN', 'Panda (white dial)', 'Panda', null, null, 'white'),
  ('Rolex', '116508', 'John Mayer (green dial)', 'John Mayer', null, null, 'green'),
  ('Rolex', '126500LN', 'Panda (white dial)', 'Panda', null, null, 'white'),
  ('Rolex', '6239', 'Paul Newman (exotic dial)', 'Paul Newman', null, 'Exotic dial', null),
  ('Rolex', '126334', 'Wimbledon (slate dial, green Roman numerals)', 'Wimbledon', null, 'Green Roman numerals', 'slate'),
  ('Rolex', '136660-0003', 'D-Blue; James Cameron', 'D-Blue', 'James Cameron', null, null),
  ('Rolex', '1655', 'Freccione; Steve McQueen', 'Freccione', 'Steve McQueen', null, null),
  ('Rolex', '16550', 'Cream dial (some)', null, null, 'Some have cream dials', null),
  ('Rolex', '16570', 'Polar (white dial)', 'Polar', null, null, 'white'),
  ('Rolex', '216570', 'Polar (white dial)', 'Polar', null, null, 'white'),
  ('Rolex', '226570', 'Polar (white dial)', 'Polar', null, null, 'white'),
  ('Rolex', '16753', 'Root Beer; Clint Eastwood', 'Root Beer', 'Clint Eastwood', null, null),
  ('Rolex', '116719BLRO', 'Pepsi (white gold)', 'Pepsi', null, 'White gold', null),
  ('Rolex', '126710BLNR', 'Batgirl (Jubilee); Batman (Oyster)', 'Batgirl', 'Batman', 'Batgirl on the Jubilee bracelet, Batman on the Oyster', null),
  ('Rolex', '126713GRNR', 'Zombie; Bumblebee', 'Zombie', 'Bumblebee', null, null),
  ('Rolex', '126718GRNR', 'Guinness; Zombie', 'Guinness', 'Zombie', null, null),
  ('Rolex', '126719BLRO', 'Pepsi (white gold)', 'Pepsi', null, 'White gold', null),
  ('Rolex', '126720VTNR', 'Sprite; Destro', 'Sprite', 'Destro', null, null),
  ('Rolex', '126729VTNR', 'Green Ceramic; Sprite (white gold)', 'Sprite', 'Green Ceramic', 'White gold', null),
  ('Rolex', '16710', 'Pepsi / Coke (by bezel)', 'Pepsi', 'Coke', 'Pepsi or Coke, depending on the bezel', null),
  ('Rolex', '16713', 'Root Beer; Tiger Eye', 'Root Beer', 'Tiger Eye', null, null),
  ('Rolex', '16760', 'Fat Lady; Sophia Loren', 'Fat Lady', 'Sophia Loren', null, null),
  ('Rolex', '134303', '100 Years (Oyster centenary)', '100 Years', null, 'Oyster centenary', null),
  ('Rolex', '1665', 'Double Red; Great White', 'Double Red', 'Great White', null, null),
  ('Rolex', '6538', 'Big Crown; James Bond', 'Big Crown', 'James Bond', null, null),
  ('Rolex', '126610LV', 'Starbucks; Cermit', 'Starbucks', 'Cermit', null, null),
  ('Rolex', '1680', 'Red Sub (early red-text dials)', 'Red Sub', null, 'Early red-text dials', null),
  ('Tudor', 'M79220R', 'Original Black Bay (ETA)', null, null, 'Original Black Bay (ETA movement)', null),
  ('Tudor', 'M25610TNL-0001', 'LHD (left-hand drive)', 'LHD', 'Left-hand drive', null, null)
)
update public.watches w
   set extras = jsonb_strip_nulls(
         (w.extras - 'nickname')
         || jsonb_build_object('nickname', f.nick,
                               'aka', coalesce(w.extras ->> 'aka', f.aka),
                               'note', coalesce(w.extras ->> 'note', f.note))),
       dial_color = coalesce(w.dial_color, f.dial)
  from fix f, public.models m, public.brands b
 where m.id = w.model_id and b.id = m.brand_id
   and lower(b.name) = lower(f.brand)
   and w.reference_key = lower(f.ref)
   and w.extras ->> 'nickname' = f.old_nick;

alter table public.watches enable trigger watches_guard_update;

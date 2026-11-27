-- =====================================================================
-- 008_nickname_backfill.sql
-- Second nickname pass over the seeded catalog (data only).
--  * Variant names that had been stored as nicknames ("Pasha Seatimer",
--    "Black Bay 41", "Offshore Diver") move to extras.aka, where search
--    still finds them; descriptions ("Diamonds", "Burgundy bezel") move to
--    extras.note or dial_color. They no longer appear in orange as if they
--    were nicknames ("Seed catalog added the Diamonds").
--  * Confident new names: 126619LB "Cookie Monster" (also Smurf), 6542 also
--    "Pussy Galore", 16520 "Zenith", every Rolex Day-Date also "President".
-- Rows are only changed while their nickname is still the seeded text, so
-- edits people made are kept. The edit-stamp trigger is paused so these
-- don't show as "edited by someone".
-- Same table: db/seed/research/nickname_fixes.py (FIXES_2).
-- =====================================================================

alter table public.watches disable trigger watches_guard_update;

with fix (brand, ref, old_nick, nick, aka, note, dial) as (values
  ('Rolex', '116300', 'Datejust II', null, 'Datejust II', null, null),
  ('Rolex', '116334', 'Datejust II', null, 'Datejust II', null, null),
  ('Rolex', '228235JG', 'Jubilee Gold', null, null, null, null),
  ('Rolex', '126067', 'Deepsea Challenge', null, 'Deepsea Challenge', null, null),
  ('Rolex', '224270', 'Explorer 40', null, 'Explorer 40', null, null),
  ('Rolex', '127234', 'Land-Dweller 36', null, null, null, null),
  ('Rolex', '127235', 'Land-Dweller 36', null, null, null, null),
  ('Rolex', '127286TBR', 'Land-Dweller 40', null, null, null, null),
  ('Rolex', '127334', 'Land-Dweller 40', null, null, null, null),
  ('Rolex', '127335', 'Land-Dweller 40', null, null, null, null),
  ('Rolex', '116400GV', 'Green crystal', null, 'GV', 'Green-tinted crystal', null),
  ('Rolex', '16520', 'Zenith Daytona', 'Zenith', null, null, null),
  ('Rolex', '126618LB', 'Cookie Monster', null, null, null, null),
  ('Rolex', '126619LB', 'Smurf', 'Cookie Monster', 'Smurf', null, null),
  ('Rolex', '6542', 'Bakelite', 'Bakelite', 'Pussy Galore', null, null),
  ('Omega', '145.022', 'Moonwatch', null, null, 'Calibre 861 era', null),
  ('Omega', '311.30.42.30.01.006', 'Sapphire sandwich', 'Sapphire Sandwich', null, null, null),
  ('Omega', '311.92.44.51.01.007', 'Original Dark Side', null, null, 'The original Dark Side of the Moon', null),
  ('Audemars Piguet', '15210BC.OO.A002KB.01', 'Selfwinding', null, 'Selfwinding', null, null),
  ('Audemars Piguet', '26393BC.OO.A321CR.01', 'Chronograph', null, 'Chronograph', null, null),
  ('Audemars Piguet', '5402ST', 'A-series original', null, null, 'Original A-series', null),
  ('Audemars Piguet', '15710ST.OO.A002CA.01', 'Offshore Diver', null, 'Offshore Diver', 'Previous generation', null),
  ('Audemars Piguet', '15720ST.OO.A002CA.01', 'Offshore Diver', null, 'Offshore Diver', null, null),
  ('Audemars Piguet', '26405CE', 'Offshore Chronograph 44', null, 'Offshore Chronograph 44', null, null),
  ('Audemars Piguet', '26470ST', 'Offshore Chronograph 42', null, 'Offshore Chronograph 42', null, null),
  ('Audemars Piguet', '26480TI.OO.A027CA.01', 'Offshore Chronograph 43', null, 'Offshore Chronograph 43', null, null),
  ('Audemars Piguet', '67650ST', 'Royal Oak 33 Quartz', null, 'Royal Oak 33 Quartz', null, null),
  ('Audemars Piguet', '77350CE', 'Royal Oak 34 Ceramic', null, 'Royal Oak 34 Ceramic', null, null),
  ('Audemars Piguet', '26585CE', 'Openworked black ceramic', null, null, 'Openworked, black ceramic', null),
  ('Cartier', 'WB520002', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WB520004', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WJBA0017', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WJPN0016', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WJPN0017', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WSPN0015', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WSPN0016', 'Diamonds', null, null, 'Diamond-set', null),
  ('Cartier', 'WGBA0017', 'Bangle', null, null, 'Bangle bracelet', null),
  ('Cartier', 'WGBA0020', 'Bangle', null, null, 'Bangle bracelet', null),
  ('Cartier', 'WE9009Z3', 'Diamond bezel', null, null, 'Diamond bezel', null),
  ('Cartier', 'WE902073', 'Diamond bezel', null, null, 'Diamond bezel', null),
  ('Cartier', 'W25028B6', 'Classic Panthère', null, 'Classic Panthère', null, null),
  ('Cartier', 'W25029B6', 'Classic Panthère', null, 'Classic Panthère', null, null),
  ('Cartier', 'W25054P5', 'Classic Panthère', null, 'Classic Panthère', null, null),
  ('Cartier', 'W3019351', 'Pasha Chronograph', null, 'Pasha Chronograph', null, null),
  ('Cartier', 'W31074M7', 'Pasha Seatimer', null, 'Pasha Seatimer', null, null),
  ('Cartier', 'W31077U2', 'Pasha Seatimer', null, 'Pasha Seatimer', null, null),
  ('Cartier', 'W31085M7', 'Pasha C', null, 'Pasha C', null, null),
  ('Cartier', 'WSPA0013', 'Chronograph', null, 'Chronograph', null, null),
  ('Cartier', 'W20056D6', 'Santos 100 XL', null, 'Santos 100 XL', null, null),
  ('Cartier', 'WSTA0059', 'SolarBeat', null, 'SolarBeat', null, null),
  ('Cartier', 'W5200028', 'Tank Solo XL', null, 'Tank Solo XL', null, null),
  ('Patek Philippe', '5164A-001', 'Travel Time', null, 'Travel Time', null, null),
  ('Patek Philippe', '5168G-010', 'Jumbo khaki green', 'Jumbo', null, null, 'khaki green'),
  ('Patek Philippe', '5968A-001', 'Chronograph', null, 'Chronograph', null, null),
  ('Patek Philippe', '5524G-001', 'Pilot Travel Time', null, 'Pilot Travel Time', null, null),
  ('Patek Philippe', '6119G-001', 'Clous de Paris', null, null, 'Clous de Paris bezel', null),
  ('Patek Philippe', '5172G-001', 'Chronograph', null, 'Chronograph', null, null),
  ('Patek Philippe', '5205G-013', 'Annual Calendar', null, 'Annual Calendar', null, null),
  ('Patek Philippe', '5212A-001', 'Weekly Calendar', null, 'Weekly Calendar', null, null),
  ('Patek Philippe', '5230G-001', 'World Time', null, 'World Time', null, null),
  ('Patek Philippe', '5320G-001', 'Perpetual Calendar', null, 'Perpetual Calendar', null, null),
  ('Patek Philippe', '5712/1A-001', 'Moonphase power reserve', null, null, 'Moon phase and power reserve', null),
  ('Patek Philippe', '5726/1A-014', 'Annual calendar', null, 'Annual Calendar', null, null),
  ('Patek Philippe', '5980/1A-001', 'Chronograph', null, 'Chronograph', null, null),
  ('Patek Philippe', '5990/1A-001', 'Travel Time Chronograph', null, 'Travel Time Chronograph', null, null),
  ('Tudor', 'M7941A1A0RU-0001', 'Burgundy', null, null, 'Burgundy bezel', null),
  ('Tudor', 'M7941A1A0RU-0002', 'Burgundy', null, null, 'Burgundy bezel', null),
  ('Tudor', 'M7941A1A0RU-0003', 'Burgundy', null, null, 'Burgundy bezel', null),
  ('Tudor', 'M79230R-0012', 'Burgundy', null, null, 'Burgundy bezel', null),
  ('Tudor', 'M79500-0001', 'Black Bay 36', null, 'Black Bay 36', null, null),
  ('Tudor', 'M79660-0001', 'Black Bay 39', null, 'Black Bay 39', null, null),
  ('Tudor', 'M79680-0001', 'Black Bay 41', null, 'Black Bay 41', null, null),
  ('Tudor', 'M79010SG-0001', 'BB58 925', null, 'BB58 925', null, null),
  ('Tudor', 'M79012M-0001', 'BB58 Bronze', null, 'BB58 Bronze', null, null),
  ('Tudor', 'M79018V-0001', 'BB58 18K', null, 'BB58 18K', null, null),
  ('Tudor', 'M79030B-0001', 'Navy Blue', null, null, null, 'navy blue'),
  ('Tudor', 'M79363N-0001', 'S&G', null, null, 'Steel and gold', null),
  ('Tudor', 'M25407N-0001', 'Pelagos 39', null, 'Pelagos 39', null, null),
  ('Tudor', 'M2543C1A7NU-0001', 'Pelagos Ultra', null, 'Pelagos Ultra', null, null),
  ('Tudor', 'M25707B/23-0001', 'Marine Nationale', null, 'Marine Nationale', null, null),
  ('Tudor', 'M25717N-0001', 'Black', null, null, null, 'black'),
  ('Tudor', 'M25807KN-0001', 'FXD Chrono', null, 'FXD Chrono', null, null),
  ('Tudor', '7928', 'Square crown guards', null, null, 'Square crown guards', null),
  ('Breitling', 'A32398A11L1A1', 'Giannis Antetokounmpo', null, 'Giannis Antetokounmpo', null, null)
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

-- Every Day-Date is a "President" (named for its bracelet).
update public.watches w
   set extras = w.extras || '{"aka": "President"}'::jsonb
  from public.models m, public.brands b
 where m.id = w.model_id and b.id = m.brand_id
   and b.name = 'Rolex' and m.name like 'Day-Date%'
   and not (w.extras ? 'aka');

alter table public.watches enable trigger watches_guard_update;

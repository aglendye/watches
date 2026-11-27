"""Rolex batch, Nov 27 2026: one row per reference (not per dial version).

Sources: rolex.com "all models" pages for every current family (sizes, metals),
collector reference tables (Bob's Watches, Luxury Bazaar, Fratello, Watch Guys,
Revolution, Bucherer, Sotheby's) for discontinued references, years and calibres.
Specs that weren't confirmed are left blank. Nicknames only where two sources
agree; other names in `aka`, descriptions in `note`.

Run: python3 rolex_2026_11.py  ->  db/seed/batches/2026-11-rolex.csv
"""
import csv, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import FIELDS, nickname_problem

# Rolex's last digit of the numeric reference gives the metal.
METAL = {'0': 'Oystersteel', '1': 'Everose Rolesor (steel & Everose gold)', '2': 'Rolesium (steel & platinum)',
         '3': 'Yellow Rolesor (steel & yellow gold)', '4': 'White Rolesor (steel & white gold)',
         '5': '18k Everose gold', '6': '950 platinum', '8': '18k yellow gold', '9': '18k white gold'}

def metal(ref):
    digits = re.match(r'\d+', ref).group(0)
    return METAL.get(digits[-1], '')

ROWS = []

def add(model, ref, size='', mat=None, dial='', wr='', year='', end='', cal='', bezel='', bracelet='',
        nick='', aka='', note='', movement='automatic'):
    if mat is None:
        mat = metal(ref)
    if re.search(r'(RBR|TBR|RBOW|SABR)$', ref) and 'diamond' not in note.lower() and 'sapphire' not in note.lower():
        note = (note + '; ' if note else '') + 'Gem-set'
    ROWS.append(dict(brand='Rolex', model=model, reference=ref, nickname=nick, case_size_mm=size,
                     movement_type=movement, case_material=mat, dial_color=dial, water_resistance_m=wr,
                     year_introduced=year, caliber=cal, bezel=bezel, bracelet=bracelet, production_end=end,
                     aka=aka, note=note))

STEEL = 'Stainless steel'
DIVE_ALU = 'Rotatable, black'
DIVE_CER = 'Unidirectional, black Cerachrom'

# --- Submariner (no date) -------------------------------------------------
add('Submariner', '6204', 37.5, STEEL, 'black', 100, 1953, 1954, 'A260', DIVE_ALU, note='Small crown; first Submariner')
add('Submariner', '6200', 37.5, STEEL, 'black', 200, 1954, 1956, 'A296', DIVE_ALU, nick='King Sub', aka='Big Crown', note='8 mm crown')
add('Submariner', '6205', 37.5, STEEL, 'black', 100, 1954, 1955, 'A260', DIVE_ALU)
add('Submariner', '6536', 37.5, STEEL, 'black', 100, 1955, 1958, '1030', DIVE_ALU)
add('Submariner', '6536/1', 37.5, STEEL, 'black', 100, 1955, 1959, '1030', DIVE_ALU, note='Chronometer version of the 6536')
add('Submariner', '5508', 37.5, STEEL, 'black', 100, 1958, 1962, '1530', DIVE_ALU)
add('Submariner', '5510', 37.5, STEEL, 'black', 200, 1958, 1959, '1530', DIVE_ALU, note='8 mm crown')
add('Submariner', '5517', 40, STEEL, 'black', 200, '', '', '', 'Fully graduated 60-minute, black', note='Military issue; fixed strap bars', nick='MilSub')
add('Submariner', '5514', 40, STEEL, 'black', 200, 1971, '', '', DIVE_ALU, aka='COMEX', note='Made for COMEX divers; helium escape valve')

# --- Submariner Date ------------------------------------------------------
add('Submariner Date', '1680/8', 40, '18k yellow gold', '', 200, 1969, 1979, '', 'Rotatable, gold')
add('Submariner Date', '16808', 40, None, '', 300, 1979, 1988, '3035', 'Unidirectional, aluminium')
add('Submariner Date', '16803', 40, None, '', 300, 1984, 1988, '3035', 'Unidirectional, aluminium')
add('Submariner Date', '168000', 40, 'Oystersteel', 'black', 300, 1987, 1988, '3035', 'Unidirectional, black aluminium', note='First 904L steel Submariner; transitional')
add('Submariner Date', '16618', 40, None, '', 300, 1988, 2008, '3135', 'Unidirectional, aluminium')
add('Submariner Date', '16619', 40, None, '', 300, '', '', '3135', 'Unidirectional, blue aluminium')
add('Submariner Date', '116618LN', 40, None, 'black', 300, 2008, 2020, '3135', DIVE_CER)
add('Submariner Date', '116659SABR', 40, None, 'black', 300, 2018, 2020, '3135', 'Sapphire-set', note='Sapphire-set bezel')

# --- Sea-Dweller / Deepsea --------------------------------------------------
add('Sea-Dweller', '16660', 40, STEEL, 'black', 1220, 1978, 1989, '3035', 'Unidirectional, black aluminium', nick='Triple Six')
add('Deepsea', '136668LB', 44, None, 'blue', 3900, 2024, '', '3235', 'Unidirectional, blue Cerachrom')

# --- GMT-Master / GMT-Master II ----------------------------------------------
add('GMT-Master', '6542/8', 38, '18k yellow gold', '', 50, 1955, 1959, '', 'Bidirectional 24h')
add('GMT-Master', '1675/3', 40, 'Yellow Rolesor (steel & yellow gold)', '', 50, '', '', '1575', 'Bidirectional 24h, aluminium')
add('GMT-Master', '1675/8', 40, '18k yellow gold', '', 50, '', '', '1575', 'Bidirectional 24h, aluminium')
add('GMT-Master', '16758', 40, None, '', 100, 1981, 1988, '3075', 'Bidirectional 24h, aluminium')
add('GMT-Master II', '16718', 40, None, '', 100, 1989, '', '3185', 'Bidirectional 24h, aluminium')

# --- Cosmograph Daytona ------------------------------------------------------
add('Cosmograph Daytona', '6240', 37, STEEL, '', 50, 1965, 1969, 'Valjoux 722', 'Black acrylic tachymeter', movement='manual', note='First screw-down pushers')
add('Cosmograph Daytona', '6241', 37, STEEL, '', 50, 1965, 1969, 'Valjoux 722', 'Black acrylic tachymeter', movement='manual', note='Also made in gold')
add('Cosmograph Daytona', '6262', 37, STEEL, '', 50, 1970, 1971, 'Valjoux 727', 'Steel tachymeter', movement='manual')
add('Cosmograph Daytona', '6264', 37, STEEL, '', 50, 1970, 1972, 'Valjoux 727', 'Black acrylic tachymeter', movement='manual')
add('Cosmograph Daytona', '16523', 40, None, '', 100, 1988, 2000, '4030', 'Yellow gold tachymeter', aka='Zenith')
add('Cosmograph Daytona', '16528', 40, None, '', 100, 1988, 2000, '4030', 'Yellow gold tachymeter', aka='Zenith')
add('Cosmograph Daytona', '16518', 40, None, '', 100, 1988, 2000, '4030', 'Yellow gold tachymeter', aka='Zenith', note='Leather strap')
add('Cosmograph Daytona', '16519', 40, None, '', 100, 1988, 2000, '4030', 'White gold tachymeter', aka='Zenith', note='Leather strap')
add('Cosmograph Daytona', '116595RBOW', 40, None, '', 100, 2018, '', '4130', 'Rainbow sapphire-set', nick='Rainbow', note='Rainbow sapphire-set bezel')
add('Cosmograph Daytona', '116598RBOW', 40, None, '', 100, 2012, '', '4130', 'Rainbow sapphire-set', nick='Rainbow', note='Rainbow sapphire-set bezel')
add('Cosmograph Daytona', '116599RBOW', 40, None, '', 100, 2012, '', '4130', 'Rainbow sapphire-set', nick='Rainbow', note='Rainbow sapphire-set bezel')
add('Cosmograph Daytona', '126529LN', 40, None, 'black', 100, 2023, '', '4132', 'Black Cerachrom tachymeter', nick='Le Mans', note='Le Mans 24 Hours centenary; 100 on the bezel')
for ref, mat in [('126589RBR', None), ('126579RBR', None), ('126539TBR', None), ('126538TBR', None),
                 ('126598TBR', None), ('126595TBR', None), ('126535TBR', None)]:
    add('Cosmograph Daytona', ref, 40, mat, '', 100, '', '', '4131', 'Gem-set')

# --- Datejust 36 / 41 / 31, Lady-Datejust -------------------------------------
add('Datejust 36', '1603', 36, STEEL, '', 100, '', '', '', 'Engine-turned')
add('Datejust 36', '16030', 36, STEEL, '', 100, 1977, 1988, '3035', '')
add('Datejust 36', '16013', 36, None, '', 100, 1977, 1988, '3035', 'Fluted, yellow gold')
add('Datejust 36', '16200', 36, None, '', 100, 1988, 2005, '3135', 'Smooth')
add('Datejust 36', '16220', 36, None, '', 100, '', '', '3135', 'Engine-turned')
add('Datejust 36', '116201', 36, None, '', 100, '', '', '3135', 'Smooth, Everose gold')
add('Datejust 36', '116231', 36, None, '', 100, '', '', '3135', 'Fluted, Everose gold')
add('Datejust 36', '126201', 36, None, '', 100, '', '', '3235', 'Smooth, Everose gold')
add('Datejust 36', '126203', 36, None, '', 100, '', '', '3235', 'Smooth, yellow gold')
add('Datejust 36', '126284RBR', 36, None, '', 100, '', '', '3235', 'Diamond-set', note='Diamond-set bezel')
add('Datejust 41', '116333', 41, None, '', 100, '', '', '3136', 'Fluted, yellow gold', aka='Datejust II')
for ref in ['278241', '278243', '278278']:
    add('Datejust 31', ref, 31, None, '', 100, '', '', '2236', '')
for ref in ['278285RBR', '278288RBR', '278341RBR', '278343RBR', '278344RBR', '278383RBR', '278384RBR']:
    add('Datejust 31', ref, 31, None, '', 100, '', '', '2236', 'Diamond-set', note='Diamond-set bezel')
add('Datejust 31', '178240', 31, None, '', 100, '', '', '2235', 'Smooth')
add('Datejust 31', '178274', 31, None, '', 100, '', '', '2235', 'Fluted, white gold')
for ref in ['279161', '279163', '279171', '279175', '279178']:
    add('Lady-Datejust', ref, 28, None, '', 100, '', '', '2236', '')
for ref in ['279135RBR', '279138RBR', '279139RBR', '279381RBR', '279383RBR', '279384RBR', '279458RBR']:
    add('Lady-Datejust', ref, 28, None, '', 100, '', '', '2236', 'Diamond-set', note='Diamond-set bezel')
add('Lady-Datejust', '179173', 26, None, '', 100, '', '', '', 'Fluted, yellow gold')
add('Lady-Datejust', '179174', 26, None, '', 100, '', '', '', 'Fluted, white gold')
add('Lady-Datejust', '69173', 26, None, '', 100, '', '', '', 'Fluted, yellow gold')

# --- Day-Date (all "President") ----------------------------------------------
P = dict(aka='President', bracelet='President')
for ref in ['18039', '18206', '18239']:
    add('Day-Date 36', ref, 36, None, '', 100, '', '', '', '', **P)
for ref, bez in [('118205', 'Smooth'), ('118206', 'Smooth'), ('118208', 'Smooth'), ('118235', 'Fluted'), ('118239', 'Fluted')]:
    add('Day-Date 36', ref, 36, None, '', 100, '', '', '3155', bez, **P)
add('Day-Date 36', '118348', 36, None, '', 100, '', '', '3155', 'Diamond-set', note='Diamond-set bezel', **P)
add('Day-Date 36', '128236', 36, None, 'ice blue', 100, '', '', '3255', '', **P)
for ref in ['128345RBR', '128348RBR', '128349RBR', '128395TBR', '128396TBR', '128398TBR', '128399TBR']:
    add('Day-Date 36', ref, 36, None, '', 100, '', '', '3255', 'Gem-set', **P)
add('Day-Date 40', '228236', 40, None, 'ice blue', 100, '', '', '3255', '', **P)
for ref in ['228345RBR', '228348RBR', '228349RBR', '228396TBR', '228398TBR']:
    add('Day-Date 40', ref, 40, None, '', 100, '', '', '3255', 'Gem-set', **P)
for ref in ['218206', '218235', '218239']:
    add('Day-Date II', ref, 41, None, '', 100, 2008, 2015, '3156', '', **P)

# --- Explorer, Milgauss, Air-King ----------------------------------------------
add('Explorer', '6350', 36, STEEL, 'black', '', 1953, '', '', 'Smooth')
add('Explorer', '6610', 36, STEEL, 'black', '', '', '', '1030', 'Smooth')
add('Milgauss', '6541', 38, STEEL, '', '', 1956, '', '', 'Rotating, black', note='Lightning-bolt seconds hand')
add('Air-King', '14000M', 34, None, '', 100, 1999, 2007, '3130', 'Smooth')
add('Air-King', '14010', 34, None, '', 100, '', '', '', 'Engine-turned')
add('Air-King', '114210', 34, None, '', 100, '', '', '3130', 'Engine-turned')
add('Air-King', '114234', 34, None, '', 100, '', '', '3130', 'Fluted, white gold')

# --- Yacht-Master / II, Sky-Dweller -----------------------------------------------
YM = 'Bidirectional, raised numerals'
add('Yacht-Master', '16628', 40, None, '', 100, 1992, 1999, '3135', YM, note='First Yacht-Master')
add('Yacht-Master', '16623', 40, None, '', 100, '', '', '3135', YM)
add('Yacht-Master', '168622', 35, None, '', 100, '', '', '2235', 'Bidirectional, platinum')
add('Yacht-Master', '169622', 29, None, '', 100, '', '', '2135', 'Bidirectional, platinum')
add('Yacht-Master', '116621', 40, None, '', 100, 2016, '', '3135', 'Bidirectional, Everose gold')
add('Yacht-Master', '126621', 40, None, '', 100, '', '', '3235', 'Bidirectional, Everose gold')
add('Yacht-Master', '268621', 37, None, '', 100, '', '', '2236', 'Bidirectional, Everose gold')
add('Yacht-Master', '268655', 37, None, '', 100, '', '', '2236', 'Bidirectional, black Cerachrom', bracelet='Oysterflex')
add('Yacht-Master II', '116689', 44, None, 'white', 100, 2007, '', '4161', 'Ring Command, platinum')
add('Sky-Dweller', '336235', 42, None, '', 100, '', '', '9002', 'Fluted Ring Command', bracelet='Oysterflex')
add('Sky-Dweller', '336238', 42, None, '', 100, '', '', '9002', 'Fluted Ring Command', bracelet='Oysterflex')
for ref in ['326135', '326138', '326139']:
    add('Sky-Dweller', ref, 42, None, '', 100, 2012, '', '9001', 'Fluted Ring Command', bracelet='Leather strap')

# --- Oyster Perpetual -------------------------------------------------------------
add('Oyster Perpetual 26', '176200', 26, None, '', 100, '', '', '2231', 'Smooth')
add('Oyster Perpetual 28', '276205', 28, None, '', 100, '', '', '2232', 'Smooth')
add('Oyster Perpetual 28', '276245RBR', 28, None, '', 100, '', '', '2232', 'Diamond-set', note='Diamond-set bezel')
add('Oyster Perpetual 28', '276248RBR', 28, None, '', 100, '', '', '2232', 'Diamond-set', note='Diamond-set bezel')
add('Oyster Perpetual 31', '177200', 31, None, '', 100, '', '', '2231', 'Smooth')
add('Oyster Perpetual 31', '277203', 31, None, 'slate', 100, '', '', '2232', 'Domed')
add('Oyster Perpetual 34', '1002', 34, STEEL, '', 100, '', '', '1570', 'Engine-turned')
add('Oyster Perpetual 34', '124208', 34, None, '', 100, '', '', '3230', 'Domed')
add('Oyster Perpetual 34', '124245RBR', 34, None, '', 100, '', '', '3230', 'Diamond-set', note='Diamond-set bezel')
add('Oyster Perpetual 34', '124248RBR', 34, None, '', 100, '', '', '3230', 'Diamond-set', note='Diamond-set bezel')
add('Oyster Perpetual 36', '126003', 36, None, 'slate', 100, '', '', '3230', 'Domed')
add('Oyster Perpetual 41', '134300', 41, None, '', 100, '', '', '3230', 'Domed')

# --- Cellini, Turn-O-Graph, Oysterquartz, Land-Dweller ------------------------------------
add('Cellini Date', '50515', 39, None, '', 50, 2014, 2022, '3165', 'Domed and fluted', bracelet='Alligator leather')
add('Cellini Date', '50519', 39, None, '', 50, 2014, 2022, '3165', 'Domed and fluted', bracelet='Alligator leather')
add('Cellini Dual Time', '50525', 39, None, '', 50, 2014, 2022, '3180', 'Domed and fluted', bracelet='Alligator leather')
add('Cellini Dual Time', '50529', 39, None, '', 50, 2014, 2022, '3180', 'Domed and fluted', bracelet='Alligator leather')
add('Turn-O-Graph', '6202', 36, STEEL, '', '', 1953, 1954, '', 'Rotating, graduated', note='The original Turn-O-Graph')
add('Turn-O-Graph', '1625', 36, STEEL, '', '', 1959, 1977, '', 'Rotating, graduated', nick='Thunderbird')
add('Turn-O-Graph', '116261', 36, None, '', 100, '', '', '3135', 'Rotating, Everose gold')
add('Turn-O-Graph', '116263', 36, None, '', 100, '', '', '3135', 'Rotating, yellow gold')
add('Oysterquartz', '17000', 36, STEEL, '', '', 1977, 2001, '5035', 'Smooth', movement='quartz', aka='Oysterquartz Datejust')
add('Oysterquartz', '17013', 36, None, '', '', '', '', '5035', 'Fluted, yellow gold', movement='quartz', aka='Oysterquartz Datejust')
add('Oysterquartz', '17014', 36, None, '', '', '', '', '5035', 'Fluted, white gold', movement='quartz', aka='Oysterquartz Datejust')
add('Oysterquartz', '19018', 36, None, '', '', 1977, 2001, '5055', 'Fluted', movement='quartz', aka='Oysterquartz Day-Date')
add('Oysterquartz', '19019', 36, None, '', '', '', '', '5055', 'Fluted', movement='quartz', aka='Oysterquartz Day-Date')
for ref, size, dial in [('127236', 36, 'ice blue'), ('127285TBR', 36, 'white'), ('127336', 40, 'ice blue'),
                        ('127385TBR', 40, 'white'), ('127386TBR', 40, 'ice blue')]:
    add('Land-Dweller', ref, size, None, dial, 100, 2025, '', '7135', 'Gem-set' if 'TBR' in ref else 'Fluted',
        note='Honeycomb dial')

# --- checks and write -------------------------------------------------------------------
errs = []
seen = set()
for r in ROWS:
    p = nickname_problem(r['nickname'])
    if p: errs.append(f"{r['reference']}: {p}")
    if r['reference'] in seen: errs.append(f"duplicate {r['reference']}")
    seen.add(r['reference'])
    if not r['case_material']: errs.append(f"no metal for {r['reference']}")
if errs:
    print('\n'.join(errs)); sys.exit(1)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'batches', '2026-11-rolex.csv')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader()
    for r in ROWS: w.writerow({k: r.get(k, '') for k in FIELDS})
print('rows', len(ROWS), '->', os.path.relpath(out))

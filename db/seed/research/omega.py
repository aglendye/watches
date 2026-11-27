from common import fam
B = 'Omega'
A, M = 'automatic', 'manual'
DIAL = {'01': 'black', '02': 'silver', '03': 'blue', '04': 'white', '06': 'grey', '10': 'green', '11': 'brown'}

def dot(r):
    r = r.replace('.', '')
    return f'{r[0:3]}.{r[3:5]}.{r[5:7]}.{r[7:9]}.{r[9:11]}.{r[11:14]}'

def strap(r):
    c = dot(r).split('.')[1][1]
    return {'0': 'Bracelet', '2': 'Rubber strap', '3': 'Leather strap'}.get(c, '')

def rows(model, refs, **defaults):
    items = []
    for r, mat in refs:
        d = dot(r)
        ov = dict(case_material=mat, bracelet=strap(r), dial_color=DIAL.get(d.split('.')[4], ''))
        items.append((d, ov))
    fam(B, model, defaults, items)

# --- Speedmaster Moonwatch Professional (omegawatches.com catalog), cal 3861 manual
S, MS, SG, CG = 'Stainless steel', '18k Moonshine gold', '18k Sedna gold', '18k Canopus gold'
rows('Speedmaster Moonwatch Professional', [
    ('310.30.42.50.01.001', S), ('310.30.42.50.01.002', S), ('310.32.42.50.01.001', S), ('310.32.42.50.01.002', S),
    ('310.30.42.50.04.001', S), ('310.32.42.50.04.001', S), ('310.32.42.50.04.002', S), ('310.30.42.50.01.004', S),
    ('310.20.42.50.02.001', 'Steel & Moonshine gold'), ('310.23.42.50.02.001', 'Steel & Moonshine gold'),
    ('310.20.42.50.99.001', 'Steel & Sedna gold'), ('310.23.42.50.99.001', 'Steel & Sedna gold'),
    ('310.60.42.50.01.001', SG), ('310.63.42.50.01.001', SG), ('310.55.42.50.13.001', SG),
    ('310.60.42.50.01.002', MS), ('310.60.42.50.10.002', MS), ('310.60.42.50.10.001', MS), ('310.63.42.50.10.001', MS),
    ('310.60.42.50.99.002', MS), ('310.62.42.50.99.001', MS),
    ('310.60.42.50.02.001', CG), ('310.63.42.50.02.001', CG), ('310.55.42.50.02.001', CG),
], case_size_mm=42, movement_type=M, caliber='3861', water_resistance_m=50, bezel='Tachymeter')
# Fix known years
from common import ROWS
for r in ROWS:
    if r['brand'] == B and r['reference'] in ('310.30.42.50.01.001', '310.30.42.50.01.002', '310.32.42.50.01.001', '310.32.42.50.01.002'):
        r['year_introduced'] = 2021
    if r['brand'] == B and r['reference'] in ('310.30.42.50.04.001', '310.32.42.50.04.001', '310.32.42.50.04.002'):
        r['year_introduced'] = 2024

# Speedmaster classics (well-documented references)
fam(B, 'Speedmaster Moonwatch Professional', dict(case_size_mm=42, movement_type=M, water_resistance_m=50, case_material=S, dial_color='black', bezel='Tachymeter'), [
    ('311.30.42.30.01.005', dict(year_introduced=2014, production_end=2021, caliber='1861', bracelet='Bracelet')),
    ('311.30.42.30.01.006', dict(nickname='Sapphire sandwich', year_introduced=2014, production_end=2021, caliber='1861', bracelet='Bracelet')),
    ('3570.50.00', dict(year_introduced=1996, production_end=2014, caliber='1861', bracelet='Bracelet')),
    ('145.022', dict(nickname='Moonwatch (861)', year_introduced=1968, production_end=1988, caliber='861')),
    ('105.012', dict(nickname='Pre-Moon', year_introduced=1964, production_end=1968, caliber='321', case_size_mm=40)),
    ('310.32.42.50.02.001', dict(nickname='Silver Snoopy Award 50th Anniversary', year_introduced=2020, caliber='3861', dial_color='silver', bracelet='Nylon strap')),
])
rows('Speedmaster First OMEGA in Space', [('310.30.40.50.06.001', S), ('310.32.40.50.06.001', S), ('310.32.40.50.06.002', S)],
     case_size_mm=39.7, movement_type=M, caliber='3861', water_resistance_m=50)
rows("Speedmaster '57", [('332.10.41.51.01.001', S), ('332.12.41.51.01.001', S), ('332.10.41.51.03.001', S), ('332.12.41.51.03.001', S),
                         ('332.10.41.51.11.001', S), ('332.12.41.51.11.001', S), ('332.10.41.51.10.001', S), ('332.12.41.51.10.001', S)],
     case_size_mm=40.5, movement_type=M, caliber='9906', water_resistance_m=50, year_introduced=2022)
rows('Speedmaster Calibre 321', [('311.30.40.30.01.001', S), ('311.50.39.30.01.001', CG), ('311.93.42.30.99.001', '950 platinum'), ('311.90.42.30.99.002', '950 platinum')],
     movement_type=M, caliber='321')
for r in ROWS:
    if r['brand'] == B and r['model'] == 'Speedmaster Calibre 321':
        r['case_size_mm'] = {'311.30.40.30.01.001': 39.7, '311.50.39.30.01.001': 38.6}.get(r['reference'], 42)
        if r['reference'] == '311.30.40.30.01.001': r['year_introduced'] = 2019
rows('Speedmaster Dark Side of the Moon', [('310.92.44.51.01.004', 'Black ceramic'), ('310.92.44.51.01.002', 'Black ceramic'), ('310.92.44.51.01.005', 'Black ceramic'),
                                         ('310.92.44.51.01.003', 'Black ceramic'), ('310.92.44.51.01.001', 'Black ceramic')],
     case_size_mm=44.25, movement_type=A, water_resistance_m=50)
rows('Speedmaster Grey Side of the Moon', [('310.92.44.50.06.002', 'Grey ceramic'), ('310.92.44.50.06.001', 'Grey ceramic')], case_size_mm=44.25, water_resistance_m=50)
rows('Speedmaster Apollo 8', [('310.92.44.50.01.001', 'Black ceramic')], case_size_mm=44.25, movement_type=M, water_resistance_m=50)
fam(B, 'Speedmaster Dark Side of the Moon', dict(case_size_mm=44.25, movement_type=A, caliber='9300', case_material='Black ceramic', dial_color='black', water_resistance_m=50), [
    ('311.92.44.51.01.007', dict(year_introduced=2013, nickname='Original Dark Side'))])
rows('Speedmaster Anniversary Series', [('310.32.42.50.02.001', S)], case_size_mm=42, movement_type=M, caliber='3861', water_resistance_m=50)
from common import ROWS as _R
# de-duplicate (Snoopy appears in Anniversary Series listing too); keep first occurrence
seen = set(); keep = []
for r in _R:
    k = (r['brand'], r['reference'])
    if r['brand'] == B and k in seen: continue
    seen.add(k); keep.append(r)
_R[:] = keep

# --- Seamaster
fam(B, 'Seamaster Diver 300M', dict(case_size_mm=42, movement_type=A, caliber='8800', water_resistance_m=300, case_material=S, bezel='Unidirectional, ceramic', bracelet='Bracelet', year_introduced=2018), [
    ('210.30.42.20.01.001', dict(dial_color='black')), ('210.30.42.20.03.001', dict(dial_color='blue')),
    ('210.30.42.20.04.001', dict(dial_color='white')), ('210.30.42.20.06.001', dict(dial_color='grey')),
    ('210.90.42.20.01.001', dict(nickname='No Time To Die (James Bond)', case_material='Grade 2 titanium', year_introduced=2020, bezel='Unidirectional, aluminium', bracelet='Titanium mesh bracelet')),
])
fam(B, 'Seamaster Diver 300M', dict(movement_type=A, water_resistance_m=300, case_material=S, bracelet='Bracelet'), [
    ('212.30.41.20.01.003', dict(case_size_mm=41.5, caliber='2500', year_introduced=2012, production_end=2018, dial_color='black')),
    ('2531.80.00', dict(nickname='James Bond (GoldenEye era)', case_size_mm=41, caliber='1120', year_introduced=1993, production_end=2007, dial_color='blue')),
    ('2254.50.00', dict(nickname='Seamaster Professional 300M', case_size_mm=41, caliber='1120', year_introduced=1993, production_end=2006, dial_color='blue')),
])
rows('Seamaster Aqua Terra 150M', [
    ('220.10.41.21.01.002', S), ('220.12.41.21.02.002', S), ('220.10.41.20.05.005', S), ('220.13.41.21.10.001', S), ('220.10.41.21.10.002', S),
    ('220.32.41.21.03.001', S), ('220.10.41.21.03.006', S), ('220.12.41.21.03.007', S), ('220.13.41.21.03.003', S), ('220.10.41.21.03.007', S),
    ('220.12.41.21.03.009', S), ('220.12.41.21.03.008', S), ('220.10.41.21.03.005', S), ('220.12.41.21.01.001', S), ('220.10.41.21.01.003', S),
    ('220.22.41.21.06.001', 'Steel & Sedna gold'), ('220.52.41.21.03.001', SG), ('220.22.41.21.02.001', 'Steel & Sedna gold'),
    ('220.23.41.21.02.001', 'Steel & Sedna gold'), ('220.20.41.21.02.001', 'Steel & Sedna gold'), ('220.20.41.21.01.001', 'Steel & Moonshine gold'),
    ('220.52.41.21.10.001', MS), ('220.50.41.21.10.001', MS), ('220.50.41.21.02.004', MS),
], case_size_mm=41, movement_type=A, water_resistance_m=150)
rows('Seamaster Planet Ocean 600M', [
    ('217.30.42.21.01.001', S), ('217.32.42.21.01.001', S), ('217.30.42.21.01.002', S), ('217.32.42.21.01.002', S),
    ('217.30.42.21.01.003', S), ('217.32.42.21.01.003', S), ('217.32.42.21.01.004', S),
], case_size_mm=42, movement_type=A, water_resistance_m=600)
fam(B, 'Seamaster Planet Ocean 600M', dict(movement_type=A, water_resistance_m=600, case_material=S, bracelet='Bracelet'), [
    ('215.30.44.21.01.001', dict(case_size_mm=43.5, caliber='8900', year_introduced=2016, dial_color='black')),
    ('215.30.44.21.03.001', dict(case_size_mm=43.5, caliber='8900', year_introduced=2016, dial_color='blue')),
    ('232.30.42.21.01.001', dict(case_size_mm=42, caliber='8500', year_introduced=2011, production_end=2016, dial_color='black')),
])
rows('Seamaster Planet Ocean 6000M Ultra Deep', [
    ('215.92.46.22.01.006', 'Black ceramic'), ('215.92.46.22.01.007', 'Black ceramic'), ('215.30.46.21.03.002', 'O-MEGASTEEL'),
    ('215.30.46.21.03.001', 'O-MEGASTEEL'), ('215.32.46.21.03.001', 'O-MEGASTEEL'), ('215.92.46.21.01.001', 'Titanium'),
    ('215.30.46.21.06.001', 'O-MEGASTEEL'), ('215.32.46.21.06.001', 'O-MEGASTEEL'), ('215.30.46.21.04.001', 'O-MEGASTEEL'), ('215.32.46.21.04.001', 'O-MEGASTEEL'),
], case_size_mm=45.5, movement_type=A, water_resistance_m=6000)
rows('Seamaster 300', [('234.30.41.21.03.002', S), ('234.30.41.21.03.001', S), ('234.30.41.21.01.001', S), ('234.92.41.21.10.001', 'Bronze gold'),
                       ('234.63.41.21.99.002', '18k yellow gold'), ('234.63.41.21.99.001', '18k yellow gold'), ('234.93.41.21.99.002', '950 platinum'), ('234.93.41.21.99.001', '950 platinum')],
     case_size_mm=41, movement_type=A, caliber='8912', water_resistance_m=300, year_introduced=2021)
rows('Seamaster Railmaster', [('235.10.38.20.06.001', S), ('235.12.38.20.06.001', S), ('235.10.38.20.13.001', S), ('235.12.38.20.13.001', S)],
     case_size_mm=38, movement_type=A, water_resistance_m=150)
rows('Seamaster Ploprof 1200M', [('227.32.55.21.03.001', 'O-MEGASTEEL')], movement_type=A, water_resistance_m=1200)
rows('Seamaster Olympic Official Timekeeper', [('522.53.40.20.04.002', CG), ('522.53.40.20.04.003', SG)], case_size_mm=39.5)
# --- Constellation
rows('Constellation Observatory', [('140.13.39.21.02.001', 'O-MEGASTEEL'), ('140.13.39.21.03.001', 'O-MEGASTEEL'), ('140.13.39.21.10.001', 'O-MEGASTEEL'),
                                   ('140.13.39.21.01.001', 'O-MEGASTEEL'), ('140.50.39.21.99.001', MS), ('140.53.39.21.99.001', MS), ('140.53.39.21.99.002', SG),
                                   ('140.53.39.21.99.004', CG), ('140.93.39.21.99.001', 'Platinum-gold')], case_size_mm=39.4, movement_type=A)
rows('Constellation', [('131.30.41.21.04.001', S), ('131.33.41.21.04.001', S), ('131.30.41.21.99.001', S), ('131.12.41.21.06.001', S),
                       ('131.33.41.21.06.001', S), ('131.30.41.21.99.003', S), ('131.33.41.21.03.001', S), ('131.30.41.21.99.002', S),
                       ('131.30.41.21.01.001', S), ('131.33.41.21.01.001', S), ('131.23.41.21.06.001', 'Steel & Sedna gold'),
                       ('131.23.41.21.03.001', 'Steel & Sedna gold'), ('131.23.41.21.11.001', 'Steel & Sedna gold'),
                       ('131.23.41.21.06.002', 'Steel & yellow gold'), ('131.23.41.21.10.001', 'Steel & yellow gold')],
     case_size_mm=41, movement_type=A, caliber='8900', water_resistance_m=50)

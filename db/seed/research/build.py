import csv, os, sys
from common import ROWS, FIELDS
import rolex, omega, tudor, breitling, others  # noqa: registers rows
# Original starter list (brand, model, reference) — keep any not already present
seen_models = {(r['brand'].lower(), r['model'].lower()) for r in ROWS}
seen_refs = {(r['brand'].lower(), r['reference'].lower()) for r in ROWS if r['reference']}
legacy = ''  # the original 35-watch starter list has already been merged in
for line in legacy.splitlines():
    line = line.strip()
    if not line or line.startswith('#') or line.lower().startswith('brand,'): continue
    b, m, ref = (line.split(',') + [''])[:3]
    if ref: continue  # every referenced starter row is covered by the researched catalog
    if not ref and any(bb == b.lower() and mm.startswith(m.lower()) for bb, mm in seen_models): continue
    row = {k: '' for k in FIELDS}; row.update(brand=b, model=m, reference=ref); ROWS.append(row)
    seen_models.add((b.lower(), m.lower()))
# One nickname per watch (see nickname_fixes.py)
from nickname_fixes import FIXES, FIXES_2
from common import nickname_problem
fix_by = {(b.lower(), ref.lower()): (n, a, note, d) for b, ref, n, a, note, d in FIXES}
fix_by.update({(b.lower(), ref.lower()): (n, a, note, d) for b, ref, _old, n, a, note, d in FIXES_2})
for r in ROWS:
    f = fix_by.get((r['brand'].lower(), r['reference'].lower()))
    if f:
        n, a, note, d = f
        r['nickname'] = n or ''
        r['aka'] = a or r.get('aka', '')
        r['note'] = note or r.get('note', '')
        if d and not r['dial_color']: r['dial_color'] = d
for r in ROWS:  # every Day-Date is a "President"
    if r['brand'] == 'Rolex' and r['model'].startswith('Day-Date') and not r.get('aka'):
        r['aka'] = 'President'
# Validate
errs = []; keys = set()
for r in ROWS:
    k = (r['brand'].lower(), r['model'].lower(), r['reference'].strip().lower())
    if k in keys: errs.append(f'duplicate {k}')
    keys.add(k)
    if r['case_size_mm'] != '' and not (10 <= float(r['case_size_mm']) <= 80): errs.append(f'size {k}')
    if r['year_introduced'] != '' and not (1800 <= int(r['year_introduced']) <= 2100): errs.append(f'year {k}')
    if r['water_resistance_m'] != '' and int(r['water_resistance_m']) < 0: errs.append(f'wr {k}')
    if r['movement_type'] not in ('', 'automatic', 'manual', 'quartz', 'other'): errs.append(f'movement {k}')
    if ',' in r['reference']: errs.append(f'comma in ref {k}')
    if nickname_problem(r['nickname']): errs.append(f'nickname {k}: {r["nickname"]!r} ({nickname_problem(r["nickname"])})')
# same brand+reference under two models?
from collections import Counter
c = Counter((r['brand'], r['reference']) for r in ROWS if r['reference'])
errs += [f'ref under 2 models {k}' for k, n in c.items() if n > 1]
if errs:
    print('\n'.join(errs)); sys.exit(1)
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'catalog.csv'), 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=FIELDS); w.writeheader()
    for r in ROWS: w.writerow(r)
print('rows', len(ROWS))
print(Counter(r['brand'] for r in ROWS).most_common())
spec = sum(1 for r in ROWS if r['case_size_mm'] != '')
print('with case size', spec, '| with year', sum(1 for r in ROWS if r['year_introduced'] != ''), '| with reference', sum(1 for r in ROWS if r['reference']))

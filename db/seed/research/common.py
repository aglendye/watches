# Shared helpers for building the seed catalog.
# Row fields: brand, model, reference, nickname, case_size_mm, movement_type, case_material,
# dial_color, water_resistance_m, year_introduced, caliber, bezel, bracelet, production_end, aka, note
# nickname: ONE short name (no ';', '/' or brackets). Other names -> aka; descriptions -> note.
FIELDS = ['brand','model','reference','nickname','case_size_mm','movement_type','case_material',
          'dial_color','water_resistance_m','year_introduced','caliber','bezel','bracelet','production_end',
          'aka','note']

import re as _re
def nickname_problem(nick):
    """Why a nickname isn't a single short name, or None. Mirrors scripts/seed.mjs."""
    if not nick: return None
    if _re.search(r'[;/()\[\]]', nick): return 'one name only: put other names in aka, details in note'
    if len(nick) > 24: return 'longer than 24 characters'
    return None
ROWS = []
def fam(brand, model, defaults, items):
    """items: list of tuples (reference, overrides-dict) or (reference,) ."""
    for it in items:
        ref = it[0]; ov = it[1] if len(it) > 1 else {}
        row = {k: '' for k in FIELDS}
        row.update(brand=brand, model=model, reference=ref)
        row.update(defaults); row.update(ov)
        ROWS.append(row)

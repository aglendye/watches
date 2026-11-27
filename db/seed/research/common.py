# Shared helpers for building the seed catalog.
# Row fields: brand, model, reference, nickname, case_size_mm, movement_type, case_material,
# dial_color, water_resistance_m, year_introduced, caliber, bezel, bracelet, production_end
FIELDS = ['brand','model','reference','nickname','case_size_mm','movement_type','case_material',
          'dial_color','water_resistance_m','year_introduced','caliber','bezel','bracelet','production_end']
ROWS = []
def fam(brand, model, defaults, items):
    """items: list of tuples (reference, overrides-dict) or (reference,) ."""
    for it in items:
        ref = it[0]; ov = it[1] if len(it) > 1 else {}
        row = {k: '' for k in FIELDS}
        row.update(brand=brand, model=model, reference=ref)
        row.update(defaults); row.update(ov)
        ROWS.append(row)

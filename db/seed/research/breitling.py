from common import fam
B = 'Breitling'
A = 'automatic'
MAT = {'A': 'Stainless steel', 'R': '18k red gold', 'E': 'Titanium', 'U': 'Steel & 18k red gold'}
DIAL = {'B': 'black', 'C': 'blue', 'A': 'silver', 'L': 'green'}
import re

def rows(model, refs, **defaults):
    items = []
    for r in refs:
        ov = {}
        if r[0] in MAT:
            ov['case_material'] = MAT[r[0]]
        # dial letter is the 3rd-from-last character in Breitling's 13-char refs (e.g. AB0138211 B 1 P1)
        if len(r) == 13 and r[-4] in DIAL:
            ov['dial_color'] = DIAL[r[-4]]
        items.append((r, ov))
    fam(B, model, defaults, items)

NAV = dict(movement_type=A, water_resistance_m=30, bezel='Bidirectional slide rule')
rows('Navitimer B01 Chronograph 41', ['AB0139A71G1P1', 'AB0139211G1P1', 'AB0139211B1P1'], case_size_mm=41, caliber='B01', year_introduced=2022, **NAV)
rows('Navitimer B01 Chronograph 43', ['AB0138241C1P1', 'AB0138211B1P1', 'AB0138241G1P1', 'AB0138241L1P1'], case_size_mm=43, caliber='B01', year_introduced=2022, **NAV)
rows('Navitimer B01 Chronograph 43 Aston Martin F1', ['EB01381A1B1X1'], case_size_mm=43, caliber='B01', **NAV)
rows('Navitimer B01 Chronograph 46', ['AB0137211C1P1', 'AB0137241L1P1', 'AB0137211B1P1', 'RB0137241G1R1'], case_size_mm=46, caliber='B01', year_introduced=2022, **NAV)
rows('Navitimer B09 Chronograph 41', ['AB0950211B1X1', 'AB0950211C1X1'], case_size_mm=41, caliber='B09', movement_type='manual', water_resistance_m=30)
rows('Navitimer B02 Chronograph 41 Cosmonaute', ['AB0230211B1A1'], case_size_mm=41, caliber='B02', movement_type='manual', water_resistance_m=30)
rows('Navitimer Automatic GMT 41', ['A32310211G1P1', 'A32310171C1P1', 'A32310251B1P1'], case_size_mm=41, **NAV)
rows('Navitimer Automatic 41', ['A17329371L1P1'], case_size_mm=41, **NAV)
rows('Navitimer B19 Chronograph 43 Perpetual Calendar', ['PB1920251C1P1'], case_size_mm=43, caliber='B19', **NAV)

CH = dict(movement_type=A, water_resistance_m=200, bezel='Unidirectional, rider tabs', bracelet='Rouleaux bracelet')
rows('Chronomat B01 42', ['AB0158101A1S1', 'PB0158101C1S1', 'UB0158101B1U1', 'AB0158101C1S1', 'AB0158101L1S1'], case_size_mm=42, caliber='B01', year_introduced=2020, **CH)
rows('Chronomat B01 42 Triumph', ['TB0134101M1X1'], case_size_mm=42, caliber='B01', **CH)
rows('Chronomat B31 Automatic 40', ['AB3114101C1A1', 'AB3114101A1A1', 'AB3114101L1A1', 'PB3114101C1S1'], case_size_mm=40, caliber='B31', **CH)
rows('Chronomat Automatic 36', ['A10320101C1A1', 'A10320101A1A1'], case_size_mm=36, **CH)
rows('Chronomat Automatic GMT 40', ['A32398A11L1A1'], case_size_mm=40, nickname='Giannis Antetokounmpo', **CH)
rows('Super Chronomat B01 44', ['UB0136251L1U1', 'EB0136251M1E1', 'AB0136251B2S1', 'RB0136E31Q1S1', 'AB0136251B1S1', 'AB0136161C1S1'], case_size_mm=44, caliber='B01', **CH)
rows('Super Chronomat Automatic 38', ['A17356531C1S1'], case_size_mm=38, **CH)

SO = dict(movement_type=A, water_resistance_m=300, bezel='Unidirectional, ceramic', year_introduced=2022)
rows('Superocean Automatic 36', ['A17377211A1S1', 'A17377211O1S1', 'A17377211C1S1'], case_size_mm=36, **SO)
rows('Superocean Automatic 42', ['A17375211B1S1', 'A17375E71C1S1', 'U17375211B1S1', 'N17375201L1S1', 'R17375211B1S1', 'A173751C1B1A1', 'A17375211B2S4', 'A17375E71G1S1'], case_size_mm=42, **SO)
rows('Superocean Automatic 44', ['A17376211L2S2', 'N17376201Q1S1', 'A17376211C1S1', 'A17376211B1S1', 'A17376A31L1S1'], case_size_mm=44, **SO)
rows('Superocean Automatic 46', ['A17378E71C1S1', 'A17378211B1S1'], case_size_mm=46, **SO)
rows('Superocean Automatic 46 Super Diver', ['E10379351B1E1', 'E10379D31L1E1'], case_size_mm=46, movement_type=A, water_resistance_m=1000)

SOH = dict(movement_type=A, water_resistance_m=200, bezel='Unidirectional, ceramic')
rows('Superocean Heritage B01 Chronograph 42', ['UB0156241L1S1', 'UB0156161C1A1', 'UB0156H11B1S1', 'AB0156161C1S1', 'AB0156361L1S1'], case_size_mm=42, caliber='B01', **SOH)
rows('Superocean Heritage B31 Automatic 40', ['AB3110241B1S1', 'AB3110361L1S1'], case_size_mm=40, caliber='B31', **SOH)
rows('Superocean Heritage B31 Automatic 42', ['AB3111161C1S1', 'UB3111241B1S1', 'AB3111241B1S1', 'AB3111361L1S1', 'UB3111161C1A1'], case_size_mm=42, caliber='B31', **SOH)
rows('Superocean Heritage B31 Automatic 44', ['UB3112241B1S1', 'UB3112161C1S1', 'AB3112241B1S1', 'AB3112361L1S1', 'AB3112241L1S1'], case_size_mm=44, caliber='B31', **SOH)
rows('Superocean Heritage Automatic 36', ['D10390A71A1S1', 'A10390161C1S1', 'A10390361L1S1'], case_size_mm=36, **SOH)

AV = dict(movement_type=A, water_resistance_m=300, bezel='Unidirectional', year_introduced=2023)
rows('Avenger Automatic 42', ['A17328101B1X1', 'A17328101C1X1', 'A17328101L1X1', 'A173281B1C1X1'], case_size_mm=42, **AV)
rows('Avenger Automatic 42 Night Mission', ['S17328101B1X1'], case_size_mm=42, **AV)
rows('Avenger Automatic GMT 44', ['A32320101C1A1', 'A32320101B1X1'], case_size_mm=44, **AV)
rows('Avenger Automatic GMT 44 Night Mission', ['S32320101B1X1'], case_size_mm=44, **AV)
rows('Avenger B01 Chronograph 42', ['SB01462A1L1X1'], case_size_mm=42, caliber='B01', **AV)
rows('Avenger B01 Chronograph 42 Night Mission', ['SB0146101B1X1', 'SB0146101L1X1', 'SB01464A1C1X1'], case_size_mm=42, caliber='B01', **AV)
rows('Avenger B01 Chronograph 44 Night Mission', ['SB0147101B1X1', 'SB01474A1C1X1', 'SB0147101I1X1', 'SB01473A1B1X1', 'SB01472A1B1X1'], case_size_mm=44, caliber='B01', **AV)
rows('Super Avenger B01 Chronograph 46', ['EB0148101B1E1', 'EB0148101C1E1'], case_size_mm=46, caliber='B01', **AV)
rows('Super Avenger B01 Chronograph 46 Night Mission', ['SB0148101B1X1'], case_size_mm=46, caliber='B01', **AV)

TT = dict(movement_type=A, water_resistance_m=100)
rows('Top Time B31', ['AB3113281A1X1', 'AB3113A71C2X1', 'AB3113A71L1X1'], caliber='B31', **TT)
rows('Top Time B01', ['AB01771A1B1X1', 'AB01765A1B1X1', 'AB01764A1C1X1', 'AB01771A1L1X1', 'AB01767A1C1X1', 'AB01768A1A1A1', 'RB01761A1Q1X1', 'AB01762C1I1X1'], caliber='B01', case_size_mm=41, **TT)
rows('Top Time B01 Tribute to Aston Martin DB5', ['AB0178121G1X1', 'PB0178121B1X1', 'RB0178131B1X1'], caliber='B01', case_size_mm=41, **TT)
rows('Top Time B21 Classic Cars', ['SB21251A1C1X1', 'NB21251A1L1X1', 'SB21252A1Q1X1'], caliber='B21', **TT)

PR = dict(movement_type=A, water_resistance_m=100)
rows('Premier B01 Chronograph 42', ['AB0145211G1P2', 'AB0145221B1P2', 'AB0145331K1P2', 'AB0145171C1P2', 'AB0145371L1P2', 'RB0145371G1R1'], case_size_mm=42, caliber='B01', **PR)
rows('Premier B09 Chronograph 40', ['AB0930D31L1P1', 'AB0930371G1P1', 'AB0930F51H1P1', 'RB0930371G1P1'], case_size_mm=40, caliber='B09', movement_type='manual', water_resistance_m=100)
rows('Premier B25 Datora 42', ['AB2510201K1P1', 'RB2510371G1P1'], case_size_mm=42, caliber='B25', **PR)
rows('Premier B15 Duograph 42', ['AB1510171C1P1', 'RB1510251B1P1'], case_size_mm=42, caliber='B15', **PR)
rows('Premier B21 Chronograph Tourbillon 42', ['RB2120211G1P1', 'RB21204A1C1P1'], case_size_mm=42, caliber='B21', **PR)
rows('Premier Automatic 36', ['A10310121Q1P1', 'A10310671M1P1', 'A10310671L1P1'], case_size_mm=36, **PR)

AVI = dict(movement_type=A, water_resistance_m=100)
rows('Super AVI B04 Chronograph GMT 46', ['RB04451A1B1X1', 'YB04451A1B1X1', 'AB04452A1L1X1', 'AB04453A1B1X1', 'AB04451A1C1X1', 'SB04452A1C1X1', 'SB04451A1B1X1'], case_size_mm=46, caliber='B04', **AVI)
rows('Classic AVI Chronograph 42', ['R233801A1B1R1', 'Y233801A1B1X1', 'A233803A1B1X1', 'A233802A1L1X1', 'A233801A1C1X1', 'R233802A1L1R1'], case_size_mm=42, **AVI)
rows('AVI Ref. 765 Re-Edition', ['AB09451A1B1X1', 'AB0920131B1X1', 'LB0920131C1X1'], case_size_mm=41, caliber='B09', movement_type='manual')
# Classic, well-known older Breitling references
fam(B, 'Navitimer 01', dict(movement_type=A, caliber='B01', water_resistance_m=30), [
    ('AB012012/BB01', dict(case_size_mm=43, production_end=2020, case_material='Stainless steel', dial_color='black')),
])
fam(B, 'Navitimer 806 1959 Re-Edition', dict(movement_type='manual', water_resistance_m=30, case_size_mm=41), [('AB0910371B1X1', dict(year_introduced=2019))])

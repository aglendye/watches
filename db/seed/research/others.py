from common import fam
A, M, Q = 'automatic', 'manual', 'quartz'

# ---------------- Audemars Piguet (base references; dial suffix varies)
B = 'Audemars Piguet'
RO = dict(movement_type=A, water_resistance_m=50, bracelet='Integrated bracelet', bezel='Octagonal')
fam(B, 'Royal Oak Selfwinding', RO, [
    ('15510ST', dict(case_size_mm=41, caliber='4302', year_introduced=2022, case_material='Stainless steel')),
    ('15500ST', dict(case_size_mm=41, caliber='4302', year_introduced=2019, production_end=2022, case_material='Stainless steel')),
    ('15500ST.OO.1220ST.01', dict(case_size_mm=41, caliber='4302', year_introduced=2019, production_end=2022, case_material='Stainless steel', dial_color='blue')),
    ('15500ST.OO.1220ST.03', dict(case_size_mm=41, caliber='4302', year_introduced=2019, production_end=2022, case_material='Stainless steel', dial_color='black')),
    ('15400ST', dict(case_size_mm=41, caliber='3120', year_introduced=2012, production_end=2019, case_material='Stainless steel')),
    ('15300ST', dict(case_size_mm=39, caliber='3120', year_introduced=2005, production_end=2012, case_material='Stainless steel')),
    ('14790ST', dict(case_size_mm=36, caliber='2225', year_introduced=1992, production_end=2005, case_material='Stainless steel')),
    ('15450ST', dict(case_size_mm=37, caliber='3120', year_introduced=2012, production_end=2022, case_material='Stainless steel')),
    ('15550ST', dict(case_size_mm=37, caliber='5900', year_introduced=2023, case_material='Stainless steel')),
    ('15500OR', dict(case_size_mm=41, caliber='4302', year_introduced=2019, case_material='18k pink gold')),
    ('77350CE', dict(nickname='Royal Oak 34 Ceramic', case_size_mm=34, caliber='5800', case_material='Black ceramic')),
    ('67650ST', dict(nickname='Royal Oak 33 Quartz', case_size_mm=33, movement_type=Q, caliber='2713', year_introduced=2016, case_material='Stainless steel')),
])
fam(B, 'Royal Oak "Jumbo" Extra-Thin', RO, [
    ('16202ST', dict(case_size_mm=39, caliber='7121', year_introduced=2022, case_material='Stainless steel', dial_color='blue')),
    ('15202ST', dict(case_size_mm=39, caliber='2121', year_introduced=2000, production_end=2022, case_material='Stainless steel', dial_color='blue')),
    ('15202ST.OO.1240ST.01', dict(case_size_mm=39, caliber='2121', year_introduced=2000, production_end=2022, case_material='Stainless steel', dial_color='blue')),
    ('16202BA', dict(case_size_mm=39, caliber='7121', year_introduced=2022, case_material='18k yellow gold')),
    ('5402ST', dict(nickname='A-series original', case_size_mm=39, caliber='2121', year_introduced=1972, production_end=1979, case_material='Stainless steel', dial_color='blue')),
])
fam(B, 'Royal Oak Chronograph', RO, [
    ('26240ST', dict(case_size_mm=41, caliber='4401', year_introduced=2021, case_material='Stainless steel')),
    ('26240ST.OO.1320ST.02', dict(case_size_mm=41, caliber='4401', year_introduced=2021, case_material='Stainless steel', dial_color='grey')),
    ('26331ST', dict(case_size_mm=41, caliber='2385', year_introduced=2017, production_end=2021, case_material='Stainless steel')),
    ('26320ST', dict(case_size_mm=41, caliber='2385', year_introduced=2008, production_end=2017, case_material='Stainless steel')),
])
fam(B, 'Royal Oak Perpetual Calendar', RO, [
    ('26574ST', dict(case_size_mm=41, caliber='5134', year_introduced=2015, case_material='Stainless steel')),
    ('26585CE', dict(nickname='Openworked black ceramic', case_size_mm=41, case_material='Black ceramic')),
])
fam(B, 'Royal Oak Offshore', dict(movement_type=A, water_resistance_m=100), [
    ('26470ST', dict(nickname='Offshore Chronograph 42', case_size_mm=42, caliber='3126/3840', year_introduced=2014, case_material='Stainless steel')),
    ('26480TI.OO.A027CA.01', dict(nickname='Offshore Chronograph 43', case_size_mm=43, case_material='Titanium', dial_color='black')),
    ('26405CE', dict(nickname='Offshore Chronograph 44', case_size_mm=44, case_material='Black ceramic')),
    ('15720ST.OO.A002CA.01', dict(nickname='Offshore Diver', case_size_mm=42, caliber='4308', year_introduced=2021, water_resistance_m=300, case_material='Stainless steel', dial_color='blue')),
    ('15710ST.OO.A002CA.01', dict(nickname='Offshore Diver (previous)', case_size_mm=42, caliber='3120', year_introduced=2010, production_end=2021, water_resistance_m=300, case_material='Stainless steel', dial_color='blue')),
])
fam(B, 'CODE 11.59', dict(movement_type=A, water_resistance_m=30, year_introduced=2019, case_size_mm=41), [
    ('15210BC.OO.A002KB.01', dict(nickname='Selfwinding', caliber='4302', case_material='18k white gold', dial_color='blue')),
    ('26393BC.OO.A321CR.01', dict(nickname='Chronograph', caliber='4401', case_material='18k white gold', dial_color='grey')),
])

# ---------------- Cartier (references from jeweller guide; sizes left in model names only where stated)
B = 'Cartier'
SS, TT, YG, RG, WG = 'Stainless steel', 'Steel & yellow gold', '18k yellow gold', '18k rose gold', '18k white gold'
fam(B, 'Santos de Cartier', dict(movement_type=A, water_resistance_m=100, bracelet='QuickSwitch bracelet', year_introduced=2018), [
    ('WSSA0018', dict(case_material=SS)), ('WSSA0013', dict(case_material=SS)), ('WSSA0029', dict(case_material=SS)),
    ('W2SA0016', dict(case_material=TT)), ('W2SA0009', dict(case_material=TT)), ('WSSA0062', dict(case_material=SS, dial_color='green')),
    ('WGSA0028', dict(case_material=YG)), ('WGSA0018', dict(case_material=YG)),
])
fam(B, 'Santos-Dumont', dict(), [('WSSA0030', dict(case_material=SS)), ('WSSA0022', dict(case_material=SS)), ('W2SA0011', dict(case_material=TT))])
fam(B, 'Santos Galbée', dict(), [('W20060D6', dict(case_material=SS)), ('W20011C4', dict(case_material=TT))])
fam(B, 'Santos 100', dict(movement_type=A), [('W20056D6', dict(nickname='Santos 100 XL')), ('WSSA0009', dict(case_material=SS))])
fam(B, 'Tank Must', dict(movement_type=Q, water_resistance_m=30), [
    ('WSTA0041', dict(case_material=SS)), ('WSTA0055', dict(case_material=SS)), ('WSTA0072', dict(dial_color='black')),
    ('WSTA0060', dict(dial_color='green')), ('WSTA0061', dict(dial_color='blue')), ('W2TA0003', dict(case_material=TT)),
    ('WSTA0135', dict(case_material=SS, dial_color='white', bracelet='Leather strap')), ('WSTA0136', dict(case_material=SS, dial_color='white', bracelet='Leather strap')),
    ('WSTA0059', dict(nickname='SolarBeat', case_material=SS)),
])
fam(B, 'Tank Louis Cartier', dict(movement_type=M, water_resistance_m=30, bracelet='Alligator strap'), [
    ('WGTA0011', dict(case_material=YG)), ('WGTA0010', dict(case_material=YG)), ('WGTA0021', dict(case_material=RG)),
])
fam(B, 'Tank Française', dict(), [('W51008Q3', dict(case_material=SS)), ('W51002Q3', dict(case_material=SS)), ('W51011Q3', dict(case_material=TT)), ('WSTA0065', dict(case_material=SS))])
fam(B, 'Tank Américaine', dict(), [('W2609156', dict(case_material=SS)), ('WSTA0017', dict(case_material=SS)), ('WSTA0016', dict(case_material=SS))])
fam(B, 'Tank Solo', dict(movement_type=A), [('W5200014',), ('W5200028', dict(nickname='Tank Solo XL'))])
fam(B, 'Tank Anglaise', dict(), [('W5310006',)])
fam(B, 'Panthère de Cartier', dict(movement_type=Q), [
    ('WSPN0006', dict(case_material=SS)), ('WSPN0007', dict(case_material=SS)), ('WSPN0016', dict(nickname='Diamonds')), ('WSPN0015', dict(nickname='Diamonds')),
    ('W2PN0006', dict(case_material=TT)), ('W2PN0007', dict(case_material=TT)), ('WGPN0008', dict(case_material=YG)), ('WGPN0009', dict(case_material=YG)),
    ('WJPN0016', dict(case_material=YG, nickname='Diamonds')), ('WJPN0017', dict(case_material=YG, nickname='Diamonds')),
    ('W25054P5', dict(case_material=TT, nickname='Classic Panthère')), ('W25029B6', dict(case_material=SS, nickname='Classic Panthère')), ('W25028B6', dict(case_material=SS, nickname='Classic Panthère')),
])
fam(B, 'Ballon Bleu de Cartier', dict(water_resistance_m=30), [
    ('W69010Z4', dict(case_size_mm=28, case_material=SS, movement_type=Q)), ('WSBB0067', dict(case_size_mm=33, case_material=SS)),
    ('WSBB0044', dict(case_size_mm=33, case_material=SS)), ('W69012Z4', dict(case_size_mm=36, case_material=SS)),
    ('WSBB0048', dict(case_size_mm=40, case_material=SS, movement_type=A)), ('W69016Z4', dict(case_size_mm=42, case_material=SS, movement_type=A)),
    ('W2BB0032', dict(case_size_mm=33, case_material=TT)), ('W2BB0033', dict(case_size_mm=36, case_material=TT)),
    ('WE902073', dict(case_size_mm=33, nickname='Diamond bezel')), ('WE9009Z3', dict(case_size_mm=36, nickname='Diamond bezel')),
    ('WGBB0009', dict(case_size_mm=36, case_material=YG)), ('WGBB0049', dict(case_size_mm=33, case_material=YG)),
])
fam(B, 'Pasha de Cartier', dict(movement_type=A, water_resistance_m=100), [
    ('WSPA0012', dict(case_size_mm=41, case_material=SS, year_introduced=2020)), ('WSPA0009', dict(case_size_mm=35, case_material=SS, year_introduced=2020)),
    ('WSPA0013', dict(case_size_mm=41, nickname='Chronograph')), ('W31074M7', dict(nickname='Pasha Seatimer')), ('W31077U2', dict(nickname='Pasha Seatimer')),
    ('W31040H3', dict(case_size_mm=38)), ('W31030H3', dict(case_size_mm=35)), ('W31085M7', dict(nickname='Pasha C')), ('W3019351', dict(nickname='Pasha Chronograph')),
])
fam(B, 'Baignoire', dict(), [
    ('WGBA0007', dict(case_material=YG)), ('WGBA0017', dict(case_material=YG, nickname='Bangle')), ('WGBA0020', dict(case_material=RG, nickname='Bangle')),
    ('WJBA0017', dict(case_material=YG, nickname='Diamonds')), ('WB520002', dict(case_material=WG, nickname='Diamonds')),
    ('WB520004', dict(case_material=RG, nickname='Diamonds')), ('W8000007',),
])

# ---------------- Patek Philippe (well-documented model references)
B = 'Patek Philippe'
fam(B, 'Nautilus', dict(movement_type=A, water_resistance_m=120, bracelet='Integrated bracelet'), [
    ('5711/1A-010', dict(case_size_mm=40, caliber='26-330 S C / 324 S C', year_introduced=2006, production_end=2021, case_material='Stainless steel', dial_color='blue')),
    ('5711/1A-014', dict(nickname='Olive green (final run)', case_size_mm=40, caliber='26-330 S C', year_introduced=2021, production_end=2021, case_material='Stainless steel', dial_color='olive green')),
    ('5811/1G-001', dict(case_size_mm=41, caliber='26-330 S C', year_introduced=2022, case_material='18k white gold', dial_color='blue')),
    ('5712/1A-001', dict(nickname='Moonphase power reserve', case_size_mm=40, caliber='240 PS IRM C LU', year_introduced=2006, case_material='Stainless steel', dial_color='blue', water_resistance_m=60)),
    ('5726/1A-014', dict(nickname='Annual calendar', case_size_mm=40.5, caliber='26-330 S QA LU 24H', case_material='Stainless steel', water_resistance_m=120)),
    ('5980/1A-001', dict(nickname='Chronograph', case_size_mm=40.5, caliber='CH 28-520 C', year_introduced=2006, production_end=2021, case_material='Stainless steel', dial_color='blue')),
    ('5990/1A-001', dict(nickname='Travel Time Chronograph', case_size_mm=40.5, caliber='CH 28-520 C FUS', year_introduced=2014, case_material='Stainless steel', dial_color='black')),
    ('3700/1A', dict(nickname='Jumbo (original)', case_size_mm=42, caliber='28-255 C', year_introduced=1976, production_end=1990, case_material='Stainless steel', dial_color='blue')),
])
fam(B, 'Aquanaut', dict(movement_type=A, water_resistance_m=120, bracelet='Tropical composite strap'), [
    ('5167A-001', dict(case_size_mm=40, caliber='26-330 S C', year_introduced=2007, case_material='Stainless steel', dial_color='black')),
    ('5168G-010', dict(nickname='Jumbo khaki green', case_size_mm=42.2, caliber='26-330 S C', case_material='18k white gold', dial_color='khaki green')),
    ('5164A-001', dict(nickname='Travel Time', case_size_mm=40.8, caliber='26-330 S C FUS', year_introduced=2011, case_material='Stainless steel', dial_color='black')),
    ('5968A-001', dict(nickname='Chronograph', case_size_mm=42.2, caliber='CH 28-520 C', year_introduced=2018, case_material='Stainless steel', dial_color='black')),
])
fam(B, 'Calatrava', dict(water_resistance_m=30, bracelet='Alligator strap'), [
    ('5196J-001', dict(case_size_mm=37, movement_type=M, caliber='215 PS', year_introduced=2004, case_material='18k yellow gold')),
    ('5227G-010', dict(case_size_mm=39, movement_type=A, caliber='324 S C', year_introduced=2013, case_material='18k white gold')),
    ('6119G-001', dict(nickname='Clous de Paris', case_size_mm=39, movement_type=M, caliber='30-255 PS', year_introduced=2021, case_material='18k white gold')),
    ('5226G-001', dict(case_size_mm=40, movement_type=A, caliber='26-330 S C', year_introduced=2022, case_material='18k white gold')),
    ('5524G-001', dict(nickname='Pilot Travel Time', case_size_mm=42, movement_type=A, caliber='324 S C FUS', year_introduced=2015, case_material='18k white gold', water_resistance_m=30)),
])
fam(B, 'Complications', dict(movement_type=A, water_resistance_m=30, bracelet='Alligator strap'), [
    ('5205G-013', dict(nickname='Annual Calendar', case_size_mm=40, caliber='324 S QA LU 24H', case_material='18k white gold')),
    ('5230G-001', dict(nickname='World Time', case_size_mm=38.5, caliber='240 HU', year_introduced=2016, case_material='18k white gold')),
    ('5212A-001', dict(nickname='Weekly Calendar', case_size_mm=40, caliber='26-330 S C J SE', year_introduced=2019, case_material='Stainless steel')),
    ('5172G-001', dict(nickname='Chronograph', case_size_mm=41, movement_type=M, caliber='CH 29-535 PS', year_introduced=2019, case_material='18k white gold')),
])
fam(B, 'Grand Complications', dict(water_resistance_m=30, bracelet='Alligator strap'), [
    ('5320G-001', dict(nickname='Perpetual Calendar', case_size_mm=40, movement_type=A, caliber='324 S Q', year_introduced=2017, case_material='18k white gold')),
    ('5270G-019', dict(nickname='Perpetual Calendar Chronograph', case_size_mm=41, movement_type=M, caliber='CH 29-535 PS Q', case_material='18k white gold')),
])

# ---------------- Other well-known watches (brand + model only; reference left blank)
others = [
    ('IWC', ['Portugieser Chronograph', 'Portugieser Automatic 42', 'Pilot\'s Watch Mark XX', 'Big Pilot\'s Watch 43', 'Pilot\'s Watch Chronograph 41', 'Ingenieur Automatic 40', 'Aquatimer Automatic', 'Portofino Automatic']),
    ('TAG Heuer', ['Carrera Chronograph', 'Carrera Glassbox', 'Monaco', 'Aquaracer Professional 300', 'Autavia', 'Formula 1']),
    ('Panerai', ['Luminor Marina', 'Luminor Due', 'Radiomir', 'Submersible', 'Luminor GMT']),
    ('Jaeger-LeCoultre', ['Reverso Tribute', 'Master Ultra Thin', 'Polaris', 'Master Control']),
    ('Grand Seiko', ['Snowflake', 'White Birch', 'Spring Drive GMT', 'Heritage 62GS', 'Evolution 9 Hi-Beat']),
    ('Seiko', ['SKX007', 'Prospex Alpinist', 'Prospex Turtle', 'Presage Cocktail Time', '5 Sports', 'Prospex Marinemaster']),
    ('Zenith', ['Chronomaster Sport', 'Chronomaster Original', 'Defy Skyline', 'Pilot Big Date']),
    ('Vacheron Constantin', ['Overseas', 'Patrimony', 'Traditionnelle', 'Fiftysix']),
    ('A. Lange & Söhne', ['Lange 1', 'Saxonia', 'Datograph', 'Odysseus', '1815']),
    ('Breguet', ['Classique', 'Type XX', 'Marine', 'Tradition']),
    ('Blancpain', ['Fifty Fathoms', 'Fifty Fathoms Bathyscaphe', 'Villeret']),
    ('Hublot', ['Big Bang', 'Classic Fusion', 'Spirit of Big Bang']),
    ('Richard Mille', ['RM 011', 'RM 035', 'RM 67-01']),
    ('Longines', ['Spirit', 'HydroConquest', 'Legend Diver', 'Master Collection']),
    ('Hamilton', ['Khaki Field Mechanical', 'Khaki Field Automatic', 'Jazzmaster', 'Ventura', 'Khaki Navy Scuba']),
    ('Tissot', ['PRX Powermatic 80', 'Seastar 1000', 'Gentleman']),
    ('Oris', ['Aquis Date', 'Divers Sixty-Five', 'Big Crown Pointer Date']),
    ('Nomos', ['Tangente', 'Club', 'Orion']),
    ('Sinn', ['556', '104', 'U1']),
    ('Casio', ['F-91W', 'G-Shock DW-5600', 'G-Shock GA-2100 "CasiOak"', 'G-Shock GMW-B5000']),
    ('Timex', ['Marlin', 'Q Timex', 'Weekender']),
    ('Bulova', ['Lunar Pilot', 'Precisionist']),
    ('Citizen', ['Promaster Diver', 'Tsuyosa']),
    ('Orient', ['Bambino', 'Kamasu']),
    ('Glashütte Original', ['Senator', 'SeaQ']),
    ('Chopard', ['Alpine Eagle', 'L.U.C', 'Happy Sport']),
    ('Bell & Ross', ['BR 03', 'BR 05']),
]
for brand, models in others:
    for m in models:
        fam(brand, m, dict(), [('',)])

# Grand Seiko Snowflake with its best-known reference
fam('Grand Seiko', 'Snowflake', dict(movement_type='other', caliber='9R65 (Spring Drive)', case_size_mm=41, case_material='High-intensity titanium', dial_color='white (snowflake texture)', water_resistance_m=100), [('SBGA211',)])

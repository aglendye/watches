from common import fam
B = 'Tudor'
A, S = 'automatic', 'Stainless steel'

fam(B, 'Black Bay', dict(movement_type=A, case_size_mm=41, caliber='MT5602-U', water_resistance_m=200, case_material=S, bezel='Unidirectional, aluminium', year_introduced=2023), [
    ('M7941A1A0NU-0001', dict(dial_color='black', bracelet='Bracelet')),
    ('M7941A1A0NU-0002', dict(dial_color='black', bracelet='Rubber strap')),
    ('M7941A1A0NU-0003', dict(dial_color='black', bracelet='Bracelet')),
    ('M7941A1A0RU-0001', dict(nickname='Burgundy', dial_color='black', bracelet='Bracelet')),
    ('M7941A1A0RU-0002', dict(nickname='Burgundy', dial_color='black', bracelet='Rubber strap')),
    ('M7941A1A0RU-0003', dict(nickname='Burgundy', dial_color='black', bracelet='Bracelet')),
])
fam(B, 'Black Bay Ceramic', dict(movement_type=A, case_size_mm=41, water_resistance_m=200, case_material='Black ceramic', dial_color='black'), [
    ('M79210CNU-0001', dict(caliber='MT5602-1U', year_introduced=2021, bracelet='Leather and rubber strap')),
    ('M7941A1ACNU-0001', dict(bracelet='Ceramic bracelet')),
])
fam(B, 'Black Bay Heritage', dict(movement_type=A, case_size_mm=41, water_resistance_m=200, case_material=S), [
    ('M79230R-0012', dict(nickname='Burgundy', caliber='MT5602', year_introduced=2016, production_end=2023, dial_color='black', bezel='Burgundy aluminium')),
    ('M79230N-0009', dict(caliber='MT5602', year_introduced=2016, production_end=2023, dial_color='black', bezel='Black aluminium')),
    ('M79230B-0008', dict(caliber='MT5602', year_introduced=2016, production_end=2023, dial_color='black', bezel='Blue aluminium')),
    ('M79220R', dict(nickname='Original Black Bay (ETA)', caliber='ETA 2824 based', year_introduced=2012, production_end=2016, dial_color='black', bezel='Burgundy aluminium')),
])
fam(B, 'Black Bay 58', dict(movement_type=A, case_size_mm=39, caliber='MT5402', water_resistance_m=200), [
    ('M79030N-0001', dict(case_material=S, dial_color='black', year_introduced=2018, bezel='Black aluminium', bracelet='Bracelet')),
    ('M79030B-0001', dict(nickname='Navy Blue', case_material=S, dial_color='blue', year_introduced=2020, bezel='Blue aluminium', bracelet='Bracelet')),
    ('M79010SG-0001', dict(nickname='BB58 925', case_material='925 silver', dial_color='taupe', year_introduced=2021, bracelet='Fabric strap')),
    ('M79018V-0001', dict(nickname='BB58 18K', case_material='18k yellow gold', dial_color='green', year_introduced=2021, bracelet='Fabric strap')),
    ('M79012M-0001', dict(nickname='BB58 Bronze', case_material='Bronze', dial_color='brown', year_introduced=2021, bracelet='Bronze bracelet')),
])
fam(B, 'Black Bay 58 GMT', dict(movement_type=A, case_size_mm=39, caliber='MT5450-U', water_resistance_m=200, case_material=S, year_introduced=2024), [
    ('M7939G1A0NRU-0001', dict(nickname='Coke', dial_color='black', bezel='Bidirectional 24h, red/black aluminium', bracelet='Bracelet')),
])
fam(B, 'Black Bay 54', dict(movement_type=A, case_size_mm=37, caliber='MT5400', water_resistance_m=200, case_material=S, year_introduced=2023), [
    ('M79000N-0001', dict(dial_color='black', bracelet='Bracelet')),
])
fam(B, 'Black Bay GMT', dict(movement_type=A, case_size_mm=41, caliber='MT5652', water_resistance_m=200, bezel='Bidirectional 24h, blue/red aluminium'), [
    ('M79830RB-0001', dict(nickname='Pepsi', case_material=S, dial_color='black', year_introduced=2018, bracelet='Bracelet')),
])
fam(B, 'Black Bay Pro', dict(movement_type=A, case_size_mm=39, caliber='MT5652', water_resistance_m=200, case_material=S, year_introduced=2022, bezel='Fixed 24h steel'), [
    ('M79470-0001', dict(dial_color='black', bracelet='Bracelet')),
])
fam(B, 'Black Bay Chrono', dict(movement_type=A, case_size_mm=41, caliber='MT5813', water_resistance_m=200, bezel='Fixed tachymeter'), [
    ('M79360N-0001', dict(case_material=S, dial_color='black', year_introduced=2017)),
    ('M79360N-0002', dict(nickname='Panda', case_material=S, dial_color='white', year_introduced=2021)),
    ('M79363N-0001', dict(nickname='S&G', case_material='Steel & yellow gold', dial_color='black', year_introduced=2019)),
])
fam(B, 'Black Bay Bronze', dict(movement_type=A, case_size_mm=43, caliber='MT5601', water_resistance_m=200, case_material='Bronze', year_introduced=2016), [
    ('M79250BM-0001', dict(dial_color='brown')),
])
fam(B, 'Black Bay 36 / 39 / 41', dict(movement_type=A, water_resistance_m=150, case_material=S, bezel='Smooth'), [
    ('M79500-0001', dict(nickname='Black Bay 36', case_size_mm=36, year_introduced=2016, caliber='ETA 2824 based')),
    ('M79660-0001', dict(nickname='Black Bay 39', case_size_mm=39, year_introduced=2022, caliber='MT5602')),
    ('M79680-0001', dict(nickname='Black Bay 41', case_size_mm=41, year_introduced=2022, caliber='MT5602')),
])
fam(B, 'Pelagos', dict(movement_type=A, water_resistance_m=500, case_material='Titanium', bracelet='Titanium bracelet'), [
    ('M25600TN-0001', dict(case_size_mm=42, caliber='MT5612', year_introduced=2015, dial_color='black', bezel='Unidirectional, black ceramic')),
    ('M25600TB-0001', dict(case_size_mm=42, caliber='MT5612', year_introduced=2015, dial_color='blue', bezel='Unidirectional, blue ceramic')),
    ('M25610TNL-0001', dict(nickname='LHD (left-hand drive)', case_size_mm=42, caliber='MT5612-LHD', year_introduced=2016, dial_color='black')),
    ('M25407N-0001', dict(nickname='Pelagos 39', case_size_mm=39, caliber='MT5400', water_resistance_m=200, year_introduced=2022, dial_color='black')),
    ('M2543C1A7NU-0001', dict(nickname='Pelagos Ultra')),
])
fam(B, 'Pelagos FXD', dict(movement_type=A, case_size_mm=42, water_resistance_m=200, case_material='Titanium'), [
    ('M25707B/23-0001', dict(nickname='Marine Nationale', caliber='MT5602', year_introduced=2021, dial_color='blue')),
    ('M25717N-0001', dict(nickname='Black', caliber='MT5602', year_introduced=2022, dial_color='black')),
    ('M25807KN-0001', dict(nickname='FXD Chrono', case_material='Carbon composite', caliber='MT5813', dial_color='black')),
])
fam(B, 'Ranger', dict(movement_type=A, case_size_mm=39, caliber='MT5402', water_resistance_m=100, case_material=S, dial_color='black', year_introduced=2022), [('M79950-0001',)])
fam(B, 'North Flag', dict(movement_type=A, case_size_mm=40, caliber='MT5621', water_resistance_m=100, case_material=S, dial_color='black', year_introduced=2015), [('M91210N-0001',)])
fam(B, 'Royal', dict(movement_type=A, water_resistance_m=100, case_material=S, year_introduced=2020), [
    ('M28600-0001', dict(case_size_mm=41)), ('M28500-0001', dict(case_size_mm=38)), ('M28400-0001', dict(case_size_mm=34)),
])
fam(B, 'Heritage Chrono', dict(movement_type=A, case_size_mm=42, water_resistance_m=150, case_material=S), [('M70330N-0001', dict(year_introduced=2010))])
fam(B, '1926', dict(movement_type=A, water_resistance_m=100, case_material=S, year_introduced=2018), [
    ('M91650-0001', dict(case_size_mm=41)), ('M91550-0001', dict(case_size_mm=39)), ('M91450-0001', dict(case_size_mm=36)),
])
fam(B, 'Submariner (Tudor)', dict(movement_type=A, water_resistance_m=200, case_material=S), [
    ('7928', dict(nickname='Square crown guards', case_size_mm=39, year_introduced=1959, production_end=1969)),
    ('7016', dict(nickname='Snowflake', case_size_mm=40, year_introduced=1969, production_end=1977)),
    ('94110', dict(case_size_mm=40, year_introduced=1977, production_end=1990)),
])

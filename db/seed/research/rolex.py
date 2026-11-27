from common import fam
B = 'Rolex'
S, YR, WR, ER = 'Oystersteel', 'Yellow Rolesor (steel & yellow gold)', 'White Rolesor (steel & white gold)', 'Everose Rolesor (steel & Everose gold)'
YG, WG, EG, PT, RS, TI = '18k yellow gold', '18k white gold', '18k Everose gold', '950 platinum', 'Rolesium (steel & platinum)', 'RLX titanium'
A = 'automatic'

# --- Submariner (no date)
fam(B, 'Submariner', dict(movement_type=A, water_resistance_m=300, bezel='Unidirectional rotatable, black Cerachrom', bracelet='Oyster', case_material=S, dial_color='black'), [
    ('124060', dict(case_size_mm=41, year_introduced=2020, caliber='3230')),
    ('114060', dict(case_size_mm=40, year_introduced=2012, caliber='3130', production_end=2020)),
    ('14060M', dict(case_size_mm=40, year_introduced=1999, caliber='3130', production_end=2012, bezel='Unidirectional rotatable, black aluminium')),
    ('14060', dict(case_size_mm=40, year_introduced=1990, caliber='3000', production_end=1999, bezel='Unidirectional rotatable, black aluminium')),
    ('5513', dict(case_size_mm=40, year_introduced=1962, caliber='1520/1530', production_end=1989, water_resistance_m=200, bezel='Rotatable, black aluminium')),
    ('5512', dict(case_size_mm=40, year_introduced=1959, caliber='1560/1570', production_end=1978, water_resistance_m=200, bezel='Rotatable, black aluminium')),
    ('6538', dict(nickname='Big Crown; James Bond', case_size_mm=38, year_introduced=1955, production_end=1959, water_resistance_m=200, bezel='Rotatable, black')),
])
# --- Submariner Date
SD = dict(movement_type=A, water_resistance_m=300, bracelet='Oyster')
fam(B, 'Submariner Date', SD, [
    ('126610LN', dict(case_size_mm=41, year_introduced=2020, caliber='3235', case_material=S, dial_color='black', bezel='Unidirectional, black Cerachrom')),
    ('126610LV', dict(nickname='Starbucks; Cermit', case_size_mm=41, year_introduced=2020, caliber='3235', case_material=S, dial_color='black', bezel='Unidirectional, green Cerachrom')),
    ('126613LB', dict(nickname='Bluesy', case_size_mm=41, year_introduced=2020, caliber='3235', case_material=YR, dial_color='blue', bezel='Unidirectional, blue Cerachrom')),
    ('126613LN', dict(case_size_mm=41, year_introduced=2020, caliber='3235', case_material=YR, dial_color='black', bezel='Unidirectional, black Cerachrom')),
    ('126618LB', dict(nickname='Cookie Monster', case_size_mm=41, year_introduced=2020, caliber='3235', case_material=YG, dial_color='blue', bezel='Unidirectional, blue Cerachrom', production_end=2026)),
    ('126618LN', dict(case_size_mm=41, year_introduced=2020, caliber='3235', case_material=YG, dial_color='black', bezel='Unidirectional, black Cerachrom')),
    ('126619LB', dict(nickname='Smurf', case_size_mm=41, year_introduced=2020, caliber='3235', case_material=WG, dial_color='black', bezel='Unidirectional, blue Cerachrom')),
    ('116610LN', dict(case_size_mm=40, year_introduced=2010, production_end=2020, caliber='3135', case_material=S, dial_color='black', bezel='Unidirectional, black Cerachrom')),
    ('116610LV', dict(nickname='Hulk', case_size_mm=40, year_introduced=2010, production_end=2020, caliber='3135', case_material=S, dial_color='green', bezel='Unidirectional, green Cerachrom')),
    ('116613LB', dict(nickname='Bluesy', case_size_mm=40, year_introduced=2009, production_end=2020, caliber='3135', case_material=YR, dial_color='blue', bezel='Unidirectional, blue Cerachrom')),
    ('116613LN', dict(case_size_mm=40, year_introduced=2009, production_end=2020, caliber='3135', case_material=YR, dial_color='black', bezel='Unidirectional, black Cerachrom')),
    ('116618LB', dict(case_size_mm=40, year_introduced=2008, production_end=2020, caliber='3135', case_material=YG, dial_color='blue', bezel='Unidirectional, blue Cerachrom')),
    ('116619LB', dict(nickname='Smurf', case_size_mm=40, year_introduced=2008, production_end=2020, caliber='3135', case_material=WG, dial_color='blue', bezel='Unidirectional, blue Cerachrom')),
    ('16610', dict(case_size_mm=40, year_introduced=1988, production_end=2010, caliber='3135', case_material=S, dial_color='black', bezel='Unidirectional, black aluminium')),
    ('16610LV', dict(nickname='Kermit', case_size_mm=40, year_introduced=2003, production_end=2010, caliber='3135', case_material=S, dial_color='black', bezel='Unidirectional, green aluminium')),
    ('16613', dict(case_size_mm=40, year_introduced=1988, production_end=2009, caliber='3135', case_material=YR, bezel='Unidirectional, aluminium')),
    ('16800', dict(case_size_mm=40, year_introduced=1979, production_end=1988, caliber='3035', case_material=S, dial_color='black', bezel='Unidirectional, black aluminium')),
    ('1680', dict(nickname='Red Sub (early red-text dials)', case_size_mm=40, year_introduced=1969, production_end=1979, caliber='1575', case_material=S, dial_color='black', water_resistance_m=200, bezel='Bidirectional, black aluminium')),
])
# --- Sea-Dweller / Deepsea
fam(B, 'Sea-Dweller', dict(movement_type=A, bracelet='Oyster', bezel='Unidirectional, black Cerachrom', dial_color='black'), [
    ('126600', dict(case_size_mm=43, year_introduced=2017, caliber='3235', case_material=S, water_resistance_m=1220)),
    ('126603', dict(case_size_mm=43, year_introduced=2019, caliber='3235', case_material=YR, water_resistance_m=1220)),
    ('116600', dict(nickname='SD4K', case_size_mm=40, year_introduced=2014, production_end=2017, caliber='3135', case_material=S, water_resistance_m=1220)),
    ('16600', dict(case_size_mm=40, year_introduced=1988, production_end=2008, caliber='3135', case_material=S, water_resistance_m=1220, bezel='Unidirectional, black aluminium')),
    ('1665', dict(nickname='Double Red; Great White', case_size_mm=40, year_introduced=1967, production_end=1983, caliber='1570', case_material=S, water_resistance_m=610, bezel='Unidirectional, black aluminium')),
])
fam(B, 'Deepsea', dict(movement_type=A, bracelet='Oyster', bezel='Unidirectional, black Cerachrom', case_material=S, water_resistance_m=3900), [
    ('136660', dict(case_size_mm=44, year_introduced=2022, caliber='3235', dial_color='black')),
    ('136660-0003', dict(nickname='D-Blue; James Cameron', case_size_mm=44, year_introduced=2022, caliber='3235', dial_color='D-blue gradient')),
    ('126660', dict(case_size_mm=44, year_introduced=2018, production_end=2022, caliber='3235', dial_color='black')),
    ('116660', dict(case_size_mm=44, year_introduced=2008, production_end=2018, caliber='3135', dial_color='black')),
    ('126067', dict(nickname='Deepsea Challenge', case_size_mm=50, year_introduced=2022, caliber='3230', case_material=TI, water_resistance_m=11000, dial_color='black')),
])
# --- GMT-Master II
G = dict(movement_type=A, water_resistance_m=100, dial_color='black')
fam(B, 'GMT-Master II', G, [
    ('126710BLRO', dict(nickname='Pepsi', case_size_mm=40, year_introduced=2018, production_end=2026, caliber='3285', case_material=S, bezel='Bidirectional 24h, blue/red Cerachrom', bracelet='Jubilee or Oyster')),
    ('126710BLNR', dict(nickname='Batgirl (Jubilee); Batman (Oyster)', case_size_mm=40, year_introduced=2019, caliber='3285', case_material=S, bezel='Bidirectional 24h, blue/black Cerachrom', bracelet='Jubilee or Oyster')),
    ('126710GRNR', dict(nickname='Bruce Wayne', case_size_mm=40, year_introduced=2024, caliber='3285', case_material=S, bezel='Bidirectional 24h, grey/black Cerachrom', bracelet='Jubilee or Oyster')),
    ('126711CHNR', dict(nickname='Root Beer', case_size_mm=40, year_introduced=2018, caliber='3285', case_material=ER, bezel='Bidirectional 24h, brown/black Cerachrom', bracelet='Oyster')),
    ('126713GRNR', dict(nickname='Zombie; Bumblebee', case_size_mm=40, year_introduced=2023, caliber='3285', case_material=YR, bezel='Bidirectional 24h, grey/black Cerachrom', bracelet='Jubilee')),
    ('126715CHNR', dict(nickname='Root Beer', case_size_mm=40, year_introduced=2018, caliber='3285', case_material=EG, bezel='Bidirectional 24h, brown/black Cerachrom', bracelet='Oyster')),
    ('126718GRNR', dict(nickname='Guinness; Zombie', case_size_mm=40, year_introduced=2023, caliber='3285', case_material=YG, bezel='Bidirectional 24h, grey/black Cerachrom', bracelet='Jubilee')),
    ('126719BLRO', dict(nickname='Pepsi (white gold)', case_size_mm=40, year_introduced=2018, caliber='3285', case_material=WG, bezel='Bidirectional 24h, blue/red Cerachrom', bracelet='Oyster or Jubilee')),
    ('126720VTNR', dict(nickname='Sprite; Destro', case_size_mm=40, year_introduced=2022, caliber='3285', case_material=S, bezel='Bidirectional 24h, green/black Cerachrom', bracelet='Oyster or Jubilee')),
    ('126729VTNR', dict(nickname='Green Ceramic; Sprite (white gold)', case_size_mm=40, year_introduced=2025, caliber='3285', case_material=WG, dial_color='green ceramic', bezel='Bidirectional 24h, green/black Cerachrom', bracelet='Oyster')),
    ('116710LN', dict(case_size_mm=40, year_introduced=2007, production_end=2019, caliber='3186', case_material=S, bezel='Bidirectional 24h, black Cerachrom', bracelet='Oyster')),
    ('116710BLNR', dict(nickname='Batman', case_size_mm=40, year_introduced=2013, production_end=2019, caliber='3186', case_material=S, bezel='Bidirectional 24h, blue/black Cerachrom', bracelet='Oyster')),
    ('116713LN', dict(case_size_mm=40, year_introduced=2005, production_end=2018, caliber='3186', case_material=YR, bezel='Bidirectional 24h, black Cerachrom', bracelet='Oyster')),
    ('116718LN', dict(case_size_mm=40, year_introduced=2005, production_end=2018, caliber='3186', case_material=YG, dial_color='green or black', bezel='Bidirectional 24h, black Cerachrom', bracelet='Oyster')),
    ('116719BLRO', dict(nickname='Pepsi (white gold)', case_size_mm=40, year_introduced=2014, production_end=2018, caliber='3186', case_material=WG, bezel='Bidirectional 24h, blue/red Cerachrom', bracelet='Oyster')),
    ('16710', dict(nickname='Pepsi / Coke (by bezel)', case_size_mm=40, year_introduced=1989, production_end=2007, caliber='3185/3186', case_material=S, bezel='Bidirectional 24h, aluminium (Pepsi, Coke or black)', bracelet='Oyster or Jubilee')),
    ('16713', dict(nickname='Root Beer; Tiger Eye', case_size_mm=40, year_introduced=1989, production_end=2007, caliber='3185', case_material=YR, bracelet='Jubilee or Oyster')),
    ('16760', dict(nickname='Fat Lady; Sophia Loren', case_size_mm=40, year_introduced=1983, production_end=1988, caliber='3085', case_material=S, bezel='Bidirectional 24h, red/black aluminium')),
])
fam(B, 'GMT-Master', dict(movement_type=A, water_resistance_m=100, case_size_mm=40, case_material=S, dial_color='black'), [
    ('16700', dict(case_size_mm=40, year_introduced=1988, production_end=1999, caliber='3175', bezel='Bidirectional 24h, aluminium')),
    ('16750', dict(year_introduced=1980, production_end=1988, caliber='3075', bezel='Bidirectional 24h, aluminium')),
    ('16753', dict(nickname='Root Beer; Clint Eastwood', year_introduced=1980, production_end=1988, caliber='3075', case_material=YR)),
    ('1675', dict(nickname='Pepsi', year_introduced=1959, production_end=1980, caliber='1565/1575', water_resistance_m=50, bezel='Bidirectional 24h, aluminium')),
    ('6542', dict(nickname='Bakelite', case_size_mm=38, year_introduced=1954, production_end=1959, caliber='1036/1065', water_resistance_m=50, bezel='Bidirectional 24h, Bakelite')),
])
# --- Cosmograph Daytona
D = dict(movement_type=A, water_resistance_m=100, case_size_mm=40)
fam(B, 'Cosmograph Daytona', D, [
    ('126500LN', dict(nickname='Panda (white dial)', year_introduced=2023, caliber='4131', case_material=S, bezel='Black Cerachrom tachymeter', bracelet='Oyster')),
    ('126502', dict(year_introduced=2026, caliber='4131', case_material=RS, dial_color='white enamel', bezel='Anthracite Cerachrom tachymeter', bracelet='Oyster')),
    ('126503', dict(year_introduced=2023, caliber='4131', case_material=YR, bezel='Yellow gold tachymeter', bracelet='Oyster')),
    ('126505', dict(year_introduced=2023, caliber='4131', case_material=EG, bezel='Everose gold tachymeter', bracelet='Oyster')),
    ('126506', dict(year_introduced=2023, caliber='4131', case_material=PT, dial_color='ice blue', bezel='Chestnut-brown Cerachrom tachymeter', bracelet='Oyster')),
    ('126508', dict(year_introduced=2023, caliber='4131', case_material=YG, bezel='Yellow gold tachymeter', bracelet='Oyster')),
    ('126509', dict(year_introduced=2023, caliber='4131', case_material=WG, bezel='White gold tachymeter', bracelet='Oyster')),
    ('126515LN', dict(year_introduced=2023, caliber='4131', case_material=EG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('126518LN', dict(year_introduced=2023, caliber='4131', case_material=YG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('126519LN', dict(year_introduced=2023, caliber='4131', case_material=WG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('116500LN', dict(nickname='Panda (white dial)', year_introduced=2016, production_end=2023, caliber='4130', case_material=S, bezel='Black Cerachrom tachymeter', bracelet='Oyster')),
    ('116520', dict(year_introduced=2000, production_end=2016, caliber='4130', case_material=S, bezel='Steel tachymeter', bracelet='Oyster')),
    ('116523', dict(year_introduced=2000, production_end=2016, caliber='4130', case_material=YR, bezel='Yellow gold tachymeter', bracelet='Oyster')),
    ('116528', dict(year_introduced=2000, production_end=2016, caliber='4130', case_material=YG, bezel='Yellow gold tachymeter', bracelet='Oyster')),
    ('116505', dict(year_introduced=2008, production_end=2023, caliber='4130', case_material=EG, bezel='Everose gold tachymeter', bracelet='Oyster')),
    ('116506', dict(year_introduced=2013, production_end=2023, caliber='4130', case_material=PT, dial_color='ice blue', bezel='Chestnut-brown Cerachrom tachymeter', bracelet='Oyster')),
    ('116508', dict(nickname='John Mayer (green dial)', year_introduced=2016, production_end=2023, caliber='4130', case_material=YG, bezel='Yellow gold tachymeter', bracelet='Oyster')),
    ('116509', dict(year_introduced=2000, production_end=2023, caliber='4130', case_material=WG, bezel='White gold tachymeter', bracelet='Oyster')),
    ('116515LN', dict(year_introduced=2017, production_end=2023, caliber='4130', case_material=EG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('116518LN', dict(year_introduced=2017, production_end=2023, caliber='4130', case_material=YG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('116519LN', dict(year_introduced=2017, production_end=2023, caliber='4130', case_material=WG, bezel='Black Cerachrom tachymeter', bracelet='Oysterflex')),
    ('16520', dict(nickname='Zenith Daytona', year_introduced=1988, production_end=2000, caliber='4030 (Zenith El Primero base)', case_material=S, bezel='Steel tachymeter', bracelet='Oyster')),
    ('6263', dict(case_size_mm=37, year_introduced=1971, production_end=1987, movement_type='manual', caliber='727', case_material=S, water_resistance_m=50, bezel='Black acrylic tachymeter')),
    ('6265', dict(case_size_mm=37, year_introduced=1971, production_end=1987, movement_type='manual', caliber='727', case_material=S, water_resistance_m=50, bezel='Steel tachymeter')),
    ('6239', dict(nickname='Paul Newman (exotic dial)', case_size_mm=37, year_introduced=1963, production_end=1969, movement_type='manual', caliber='Valjoux 72', case_material=S, water_resistance_m=50, bezel='Steel tachymeter')),
])
# --- Explorer / Explorer II
fam(B, 'Explorer', dict(movement_type=A, water_resistance_m=100, case_material=S, dial_color='black', bracelet='Oyster', bezel='Smooth'), [
    ('124270', dict(case_size_mm=36, year_introduced=2021, caliber='3230')),
    ('224270', dict(nickname='Explorer 40', case_size_mm=40, year_introduced=2023, caliber='3230')),
    ('124273', dict(case_size_mm=36, year_introduced=2021, caliber='3230', case_material=YR)),
    ('214270', dict(case_size_mm=39, year_introduced=2010, production_end=2021, caliber='3132')),
    ('114270', dict(case_size_mm=36, year_introduced=2001, production_end=2010, caliber='3130')),
    ('14270', dict(case_size_mm=36, year_introduced=1989, production_end=2001, caliber='3000')),
    ('1016', dict(case_size_mm=36, year_introduced=1963, production_end=1989, caliber='1560/1570', water_resistance_m=100)),
])
fam(B, 'Explorer II', dict(movement_type=A, water_resistance_m=100, case_material=S, bracelet='Oyster', bezel='Fixed 24h'), [
    ('226570', dict(nickname='Polar (white dial)', case_size_mm=42, year_introduced=2021, caliber='3285')),
    ('216570', dict(nickname='Polar (white dial)', case_size_mm=42, year_introduced=2011, production_end=2021, caliber='3187')),
    ('16570', dict(nickname='Polar (white dial)', case_size_mm=40, year_introduced=1989, production_end=2011, caliber='3185/3187')),
    ('16550', dict(nickname='Cream dial (some)', case_size_mm=40, year_introduced=1985, production_end=1989, caliber='3085')),
    ('1655', dict(nickname='Freccione; Steve McQueen', case_size_mm=39, year_introduced=1971, production_end=1985, caliber='1575', dial_color='black')),
])
# --- Yacht-Master / Yacht-Master II
fam(B, 'Yacht-Master', dict(movement_type=A, water_resistance_m=100), [
    ('126622', dict(case_size_mm=40, year_introduced=2019, caliber='3235', case_material=RS, bezel='Bidirectional, platinum', bracelet='Oyster')),
    ('116622', dict(case_size_mm=40, year_introduced=2012, production_end=2019, caliber='3135', case_material=RS, bezel='Bidirectional, platinum', bracelet='Oyster')),
    ('16622', dict(case_size_mm=40, year_introduced=1999, production_end=2012, caliber='3135', case_material=RS, bezel='Bidirectional, platinum', bracelet='Oyster')),
    ('126655', dict(case_size_mm=40, year_introduced=2019, caliber='3235', case_material=EG, dial_color='black', bezel='Bidirectional, black Cerachrom', bracelet='Oysterflex')),
    ('116655', dict(case_size_mm=40, year_introduced=2015, production_end=2019, caliber='3135', case_material=EG, dial_color='black', bezel='Bidirectional, black Cerachrom', bracelet='Oysterflex')),
    ('268622', dict(case_size_mm=37, year_introduced=2019, caliber='2236', case_material=RS, bezel='Bidirectional, platinum', bracelet='Oyster')),
    ('226659', dict(case_size_mm=42, year_introduced=2019, caliber='3235', case_material=WG, dial_color='black', bezel='Bidirectional, black Cerachrom', bracelet='Oysterflex')),
    ('226627', dict(case_size_mm=42, year_introduced=2023, caliber='3235', case_material=TI, dial_color='black', bezel='Bidirectional, black Cerachrom', bracelet='Oyster')),
    ('226658', dict(case_size_mm=42, year_introduced=2023, caliber='3235', case_material=YG, dial_color='black', bezel='Bidirectional, black Cerachrom', bracelet='Oysterflex')),
])
fam(B, 'Yacht-Master II', dict(movement_type=A, water_resistance_m=100, dial_color='white', bracelet='Oyster'), [
    ('126680', dict(case_size_mm=44, year_introduced=2026, caliber='4162', case_material=S, bezel='Bidirectional, blue Cerachrom')),
    ('126688', dict(case_size_mm=44, year_introduced=2026, caliber='4162', case_material=YG, bezel='Bidirectional, blue Cerachrom')),
    ('116680', dict(case_size_mm=44, year_introduced=2013, production_end=2024, caliber='4161', case_material=S, bezel='Ring Command, blue Cerachrom')),
    ('116681', dict(case_size_mm=44, year_introduced=2011, production_end=2024, caliber='4161', case_material=ER, bezel='Ring Command, blue Cerachrom')),
    ('116688', dict(case_size_mm=44, year_introduced=2007, production_end=2024, caliber='4160', case_material=YG, bezel='Ring Command, blue Cerachrom')),
])
# --- Sky-Dweller
fam(B, 'Sky-Dweller', dict(movement_type=A, water_resistance_m=100, case_size_mm=42, bezel='Fluted Ring Command'), [
    ('336934', dict(year_introduced=2023, caliber='9002', case_material=WR, bracelet='Jubilee or Oyster')),
    ('336933', dict(year_introduced=2023, caliber='9002', case_material=YR, bracelet='Oyster or Jubilee')),
    ('336935', dict(year_introduced=2023, caliber='9002', case_material=EG, bracelet='Oysterflex or Oyster')),
    ('336938', dict(year_introduced=2023, caliber='9002', case_material=YG, bracelet='Oyster or Oysterflex')),
    ('336239', dict(year_introduced=2023, caliber='9002', case_material=WG, bracelet='Oysterflex')),
    ('326934', dict(year_introduced=2017, production_end=2023, caliber='9001', case_material=WR, bracelet='Oyster or Jubilee')),
    ('326933', dict(year_introduced=2017, production_end=2023, caliber='9001', case_material=YR, bracelet='Oyster')),
    ('326935', dict(year_introduced=2012, production_end=2023, caliber='9001', case_material=EG, bracelet='Oyster or leather')),
    ('326938', dict(year_introduced=2012, production_end=2023, caliber='9001', case_material=YG, bracelet='Oyster or leather')),
    ('326939', dict(year_introduced=2012, production_end=2023, caliber='9001', case_material=WG, bracelet='Oyster or leather')),
])
# --- Land-Dweller
fam(B, 'Land-Dweller', dict(movement_type=A, water_resistance_m=100, caliber='7135', year_introduced=2025, bracelet='Flat Jubilee', bezel='Fluted', dial_color='white honeycomb'), [
    ('127234', dict(nickname='Land-Dweller 36', case_size_mm=36, case_material=WR)),
    ('127334', dict(nickname='Land-Dweller 40', case_size_mm=40, case_material=WR)),
    ('127235', dict(nickname='Land-Dweller 36', case_size_mm=36, case_material=EG)),
    ('127335', dict(nickname='Land-Dweller 40', case_size_mm=40, case_material=EG)),
    ('127286TBR', dict(nickname='Land-Dweller 40', case_size_mm=40, case_material=PT, dial_color='ice blue, diamond-set', bezel='Diamond-set')),
])
# --- Day-Date
DD = dict(movement_type=A, water_resistance_m=100, bracelet='President', bezel='Fluted')
fam(B, 'Day-Date 40', DD, [
    ('228238', dict(case_size_mm=40, year_introduced=2015, caliber='3255', case_material=YG)),
    ('228239', dict(case_size_mm=40, year_introduced=2015, caliber='3255', case_material=WG)),
    ('228235', dict(case_size_mm=40, year_introduced=2015, caliber='3255', case_material=EG)),
    ('228235JG', dict(nickname='Jubilee Gold', case_size_mm=40, year_introduced=2026, caliber='3255', case_material='18k Jubilee gold')),
    ('228206', dict(case_size_mm=40, year_introduced=2015, caliber='3255', case_material=PT, dial_color='ice blue', bezel='Smooth')),
])
fam(B, 'Day-Date 36', DD, [
    ('128238', dict(case_size_mm=36, year_introduced=2019, caliber='3255', case_material=YG)),
    ('128239', dict(case_size_mm=36, year_introduced=2019, caliber='3255', case_material=WG)),
    ('128235', dict(case_size_mm=36, year_introduced=2019, caliber='3255', case_material=EG)),
    ('118238', dict(case_size_mm=36, year_introduced=2000, production_end=2019, caliber='3155', case_material=YG)),
    ('18238', dict(case_size_mm=36, year_introduced=1988, production_end=2000, caliber='3155', case_material=YG)),
    ('18038', dict(case_size_mm=36, year_introduced=1977, production_end=1988, caliber='3055', case_material=YG)),
    ('1803', dict(case_size_mm=36, year_introduced=1959, production_end=1977, caliber='1555/1556', case_material=YG, water_resistance_m=50)),
])
fam(B, 'Day-Date II', DD, [('218238', dict(case_size_mm=41, year_introduced=2008, production_end=2015, caliber='3156', case_material=YG))])
# --- Datejust
DJ = dict(movement_type=A, water_resistance_m=100, bracelet='Jubilee or Oyster')
fam(B, 'Datejust 41', DJ, [
    ('126300', dict(case_size_mm=41, year_introduced=2017, caliber='3235', case_material=S, bezel='Smooth')),
    ('126334', dict(nickname='Wimbledon (slate dial, green Roman numerals)', case_size_mm=41, year_introduced=2017, caliber='3235', case_material=WR, bezel='Fluted, white gold')),
    ('126333', dict(case_size_mm=41, year_introduced=2017, caliber='3235', case_material=YR, bezel='Fluted, yellow gold')),
    ('126331', dict(case_size_mm=41, year_introduced=2017, caliber='3235', case_material=ER, bezel='Fluted, Everose gold')),
    ('126301', dict(case_size_mm=41, year_introduced=2017, caliber='3235', case_material=ER, bezel='Smooth, Everose gold')),
    ('126303', dict(case_size_mm=41, year_introduced=2017, caliber='3235', case_material=YR, bezel='Smooth, yellow gold')),
    ('116334', dict(nickname='Datejust II', case_size_mm=41, year_introduced=2009, production_end=2016, caliber='3136', case_material=WR, bezel='Fluted, white gold')),
    ('116300', dict(nickname='Datejust II', case_size_mm=41, year_introduced=2009, production_end=2016, caliber='3136', case_material=S, bezel='Smooth')),
])
fam(B, 'Datejust 36', DJ, [
    ('126200', dict(case_size_mm=36, year_introduced=2018, caliber='3235', case_material=S, bezel='Domed')),
    ('126234', dict(case_size_mm=36, year_introduced=2018, caliber='3235', case_material=WR, bezel='Fluted, white gold')),
    ('126233', dict(case_size_mm=36, year_introduced=2018, caliber='3235', case_material=YR, bezel='Fluted, yellow gold')),
    ('126231', dict(case_size_mm=36, year_introduced=2018, caliber='3235', case_material=ER, bezel='Fluted, Everose gold')),
    ('116234', dict(case_size_mm=36, year_introduced=2004, production_end=2018, caliber='3135', case_material=WR, bezel='Fluted, white gold')),
    ('116233', dict(case_size_mm=36, year_introduced=2004, production_end=2018, caliber='3135', case_material=YR, bezel='Fluted, yellow gold')),
    ('116200', dict(case_size_mm=36, year_introduced=2004, production_end=2018, caliber='3135', case_material=S, bezel='Smooth')),
    ('16234', dict(case_size_mm=36, year_introduced=1988, production_end=2004, caliber='3135', case_material=WR, bezel='Fluted, white gold')),
    ('16233', dict(case_size_mm=36, year_introduced=1988, production_end=2004, caliber='3135', case_material=YR, bezel='Fluted, yellow gold')),
    ('16014', dict(case_size_mm=36, year_introduced=1977, production_end=1988, caliber='3035', case_material=WR, bezel='Fluted, white gold')),
    ('1601', dict(case_size_mm=36, year_introduced=1959, production_end=1977, caliber='1560/1570', case_material=WR, bezel='Fluted, white gold', water_resistance_m=50)),
])
fam(B, 'Datejust 31', dict(movement_type=A, water_resistance_m=100, case_size_mm=31, caliber='2236', year_introduced=2018), [
    ('278240', dict(case_material=S, bezel='Domed')),
    ('278274', dict(case_material=WR, bezel='Fluted, white gold')),
    ('278273', dict(case_material=YR, bezel='Fluted, yellow gold')),
    ('278271', dict(case_material=ER, bezel='Fluted, Everose gold')),
])
fam(B, 'Lady-Datejust', dict(movement_type=A, water_resistance_m=100, case_size_mm=28, caliber='2236', year_introduced=2016), [
    ('279160', dict(case_material=S, bezel='Domed')),
    ('279174', dict(case_material=WR, bezel='Fluted, white gold')),
    ('279173', dict(case_material=YR, bezel='Fluted, yellow gold')),
])
# --- Oyster Perpetual
OP = dict(movement_type=A, water_resistance_m=100, bracelet='Oyster', bezel='Domed', case_material=S)
fam(B, 'Oyster Perpetual 41', OP, [
    ('124300', dict(case_size_mm=41, year_introduced=2020, caliber='3230')),
    ('134303', dict(nickname='100 Years (Oyster centenary)', case_size_mm=41, year_introduced=2026, caliber='3230', case_material=YR, dial_color='slate', bezel='Domed, yellow gold')),
])
fam(B, 'Oyster Perpetual 39', OP, [('114300', dict(case_size_mm=39, year_introduced=2015, production_end=2020, caliber='3132'))])
fam(B, 'Oyster Perpetual 36', OP, [
    ('126000', dict(case_size_mm=36, year_introduced=2020, caliber='3230')),
    ('116000', dict(case_size_mm=36, year_introduced=2007, production_end=2020, caliber='3130')),
])
fam(B, 'Oyster Perpetual 34', OP, [
    ('124200', dict(case_size_mm=34, year_introduced=2020, caliber='2232')),
    ('124205', dict(case_size_mm=34, year_introduced=2026, caliber='2232', case_material=EG, dial_color='blue stone lacquer')),
])
fam(B, 'Oyster Perpetual 31', OP, [('277200', dict(case_size_mm=31, year_introduced=2020, caliber='2232'))])
fam(B, 'Oyster Perpetual 28', OP, [
    ('276200', dict(case_size_mm=28, year_introduced=2020, caliber='2232')),
    ('276208', dict(case_size_mm=28, year_introduced=2026, caliber='2232', case_material=YG, dial_color='green stone lacquer')),
])
fam(B, 'Air-King', dict(movement_type=A, water_resistance_m=100, case_material=S, dial_color='black', bracelet='Oyster', bezel='Smooth'), [
    ('126900', dict(case_size_mm=40, year_introduced=2022, caliber='3230')),
    ('116900', dict(case_size_mm=40, year_introduced=2016, production_end=2022, caliber='3131')),
    ('114200', dict(case_size_mm=34, year_introduced=2007, production_end=2014, caliber='3130', dial_color='')),
    ('14000', dict(case_size_mm=34, year_introduced=1989, production_end=2001, caliber='3000', dial_color='')),
    ('5500', dict(case_size_mm=34, year_introduced=1957, production_end=1989, caliber='1520/1530', dial_color='', water_resistance_m=50)),
])
fam(B, 'Milgauss', dict(movement_type=A, water_resistance_m=100, case_size_mm=40, case_material=S, bracelet='Oyster', bezel='Smooth'), [
    ('116400GV', dict(nickname='Green crystal', year_introduced=2007, production_end=2023, caliber='3131')),
    ('116400', dict(year_introduced=2007, production_end=2014, caliber='3131')),
    ('1019', dict(case_size_mm=38, year_introduced=1960, production_end=1988, caliber='1580')),
])
fam(B, '1908', dict(movement_type=A, water_resistance_m=50, case_size_mm=39, caliber='7140', year_introduced=2023, bracelet='Alligator leather', bezel='Domed and fluted'), [
    ('52508', dict(case_material=YG)),
    ('52509', dict(case_material=WG)),
    ('52506', dict(case_material=PT, dial_color='ice blue', year_introduced=2024)),
])
fam(B, 'Cellini Moonphase', dict(movement_type=A, water_resistance_m=50, case_size_mm=39, case_material=EG), [('50535', dict(year_introduced=2017, production_end=2023, caliber='3195'))])
fam(B, 'Cellini Time', dict(movement_type=A, water_resistance_m=50, case_size_mm=39), [
    ('50505', dict(year_introduced=2014, production_end=2023, caliber='3132', case_material=EG)),
    ('50509', dict(year_introduced=2014, production_end=2023, caliber='3132', case_material=WG)),
])
fam(B, 'Turn-O-Graph', dict(movement_type=A, water_resistance_m=100, case_size_mm=36), [('116264', dict(nickname='Thunderbird', year_introduced=2004, production_end=2011, caliber='3135', case_material=WR, bezel='Rotating, white gold'))])

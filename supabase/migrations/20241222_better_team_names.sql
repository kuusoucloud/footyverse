-- Update team names to be more realistic English football team names (copyright safe)

-- Tier 1 teams (Premier League style)
UPDATE teams SET name = 'Metropolitan City' WHERE name = 'Skyline FC';
UPDATE teams SET name = 'Arsenal Borough' WHERE name = 'Arsenal United';
UPDATE teams SET name = 'Riverside United' WHERE name = 'Riverside FC';
UPDATE teams SET name = 'Chelsea Rovers' WHERE name = 'Blue Lions';
UPDATE teams SET name = 'Manchester Rovers' WHERE name = 'Red Devils FC';
UPDATE teams SET name = 'Newcastle Rovers' WHERE name = 'Magpies United';
UPDATE teams SET name = 'Tottenham Athletic' WHERE name = 'White Hart FC';
UPDATE teams SET name = 'Brighton Albion' WHERE name = 'Seagulls FC';
UPDATE teams SET name = 'Aston Park FC' WHERE name = 'Villa Park FC';
UPDATE teams SET name = 'West London United' WHERE name = 'Hammers United';
UPDATE teams SET name = 'Crystal Athletic' WHERE name = 'Eagles FC';
UPDATE teams SET name = 'Fulham Rovers' WHERE name = 'Cottage FC';
UPDATE teams SET name = 'Brentford City' WHERE name = 'Bees United';
UPDATE teams SET name = 'Wolverhampton FC' WHERE name = 'Wolves FC';
UPDATE teams SET name = 'Everton Athletic' WHERE name = 'Toffees United';
UPDATE teams SET name = 'Nottingham United' WHERE name = 'Forest FC';
UPDATE teams SET name = 'Bournemouth Town' WHERE name = 'Cherries FC';
UPDATE teams SET name = 'Sheffield Rovers' WHERE name = 'Blades United';
UPDATE teams SET name = 'Burnley Athletic' WHERE name = 'Clarets FC';
UPDATE teams SET name = 'Luton Borough' WHERE name = 'Hatters FC';

-- Tier 2 teams (Championship style)
UPDATE teams SET name = 'Leicester Rovers' WHERE name = 'Foxes FC';
UPDATE teams SET name = 'Leeds Athletic' WHERE name = 'United Leeds';
UPDATE teams SET name = 'Southampton FC' WHERE name = 'Saints FC';
UPDATE teams SET name = 'Ipswich United' WHERE name = 'Town FC';
UPDATE teams SET name = 'West Bromwich FC' WHERE name = 'Albion FC';
UPDATE teams SET name = 'Middlesbrough Town' WHERE name = 'Boro FC';
UPDATE teams SET name = 'Norwich Athletic' WHERE name = 'Canaries FC';
UPDATE teams SET name = 'Coventry United' WHERE name = 'Sky Blues';
UPDATE teams SET name = 'Hull Athletic' WHERE name = 'Tigers FC';
UPDATE teams SET name = 'Preston United' WHERE name = 'North End FC';
UPDATE teams SET name = 'Swansea Athletic' WHERE name = 'Swans FC';
UPDATE teams SET name = 'Cardiff United' WHERE name = 'Bluebirds FC';
UPDATE teams SET name = 'Millwall Athletic' WHERE name = 'Lions FC';
UPDATE teams SET name = 'Blackburn United' WHERE name = 'Rovers FC';
UPDATE teams SET name = 'Stoke Athletic' WHERE name = 'Potters FC';
UPDATE teams SET name = 'Sheffield Wednesday' WHERE name = 'Owls FC';
UPDATE teams SET name = 'Queens Park United' WHERE name = 'Rangers FC';
UPDATE teams SET name = 'Plymouth United' WHERE name = 'Pilgrims FC';
UPDATE teams SET name = 'Watford Athletic' WHERE name = 'Hornets FC';
UPDATE teams SET name = 'Rotherham FC' WHERE name = 'Millers FC';

-- Tier 3 teams (League One style)
UPDATE teams SET name = 'Birmingham Athletic' WHERE name = 'Blues FC';
UPDATE teams SET name = 'Wrexham United' WHERE name = 'Dragons FC';
UPDATE teams SET name = 'Bolton Athletic' WHERE name = 'Wanderers FC';
UPDATE teams SET name = 'Barnsley United' WHERE name = 'Reds FC';
UPDATE teams SET name = 'Stockport United' WHERE name = 'County FC';
UPDATE teams SET name = 'Wycombe Athletic' WHERE name = 'Chairboys FC';
UPDATE teams SET name = 'Lincoln United' WHERE name = 'Imps FC';
UPDATE teams SET name = 'Mansfield United' WHERE name = 'Stags FC';
UPDATE teams SET name = 'Exeter United' WHERE name = 'Grecians FC';
UPDATE teams SET name = 'Peterborough FC' WHERE name = 'Posh FC';
UPDATE teams SET name = 'Charlton United' WHERE name = 'Addicks FC';
UPDATE teams SET name = 'Reading Athletic' WHERE name = 'Royals FC';
UPDATE teams SET name = 'Stevenage United' WHERE name = 'Borough FC';
UPDATE teams SET name = 'Northampton FC' WHERE name = 'Cobblers FC';
UPDATE teams SET name = 'Leyton United' WHERE name = 'Orient FC';
UPDATE teams SET name = 'Crawley United' WHERE name = 'Red Devils';
UPDATE teams SET name = 'Bristol United' WHERE name = 'Pirates FC';
UPDATE teams SET name = 'Shrewsbury FC' WHERE name = 'Shrews FC';
UPDATE teams SET name = 'Cambridge FC' WHERE name = 'United FC';
UPDATE teams SET name = 'Burton United' WHERE name = 'Brewers FC';

-- Tier 4 teams (League Two style)
UPDATE teams SET name = 'Notts County FC' WHERE name = 'Magpies FC';
UPDATE teams SET name = 'Milton Keynes FC' WHERE name = 'Dons FC';
UPDATE teams SET name = 'Doncaster United' WHERE name = 'Rovers United';
UPDATE teams SET name = 'Crewe United' WHERE name = 'Alex FC';
UPDATE teams SET name = 'AFC Wimbledon FC' WHERE name = 'Wombles FC';
UPDATE teams SET name = 'Grimsby United' WHERE name = 'Mariners FC';
UPDATE teams SET name = 'Bradford Athletic' WHERE name = 'Bantams FC';
UPDATE teams SET name = 'Salford United' WHERE name = 'City FC';
UPDATE teams SET name = 'Tranmere United' WHERE name = 'Rovers City';
UPDATE teams SET name = 'Harrogate United' WHERE name = 'Town United';
UPDATE teams SET name = 'Colchester FC' WHERE name = 'United City';
UPDATE teams SET name = 'Swindon United' WHERE name = 'Robins FC';
UPDATE teams SET name = 'Walsall Athletic' WHERE name = 'Saddlers FC';
UPDATE teams SET name = 'Newport United' WHERE name = 'County United';
UPDATE teams SET name = 'Gillingham FC' WHERE name = 'Gills FC';
UPDATE teams SET name = 'Accrington FC' WHERE name = 'Stanley FC';
UPDATE teams SET name = 'Morecambe United' WHERE name = 'Shrimps FC';
UPDATE teams SET name = 'Barrow Athletic' WHERE name = 'Bluebirds United';
UPDATE teams SET name = 'Fleetwood United' WHERE name = 'Cod Army FC';
UPDATE teams SET name = 'Carlisle United' WHERE name = 'Cumbrians FC';

-- Tier 5 teams (National League style)
UPDATE teams SET name = 'Chesterfield FC' WHERE name = 'Spireites FC';
UPDATE teams SET name = 'York Athletic' WHERE name = 'Minstermen FC';
UPDATE teams SET name = 'Oldham United' WHERE name = 'Latics FC';
UPDATE teams SET name = 'Solihull United' WHERE name = 'Moors FC';
UPDATE teams SET name = 'Gateshead FC' WHERE name = 'Heed FC';
UPDATE teams SET name = 'Barnet Athletic' WHERE name = 'Bees FC';
UPDATE teams SET name = 'Altrincham FC' WHERE name = 'Robins United';
UPDATE teams SET name = 'Eastleigh United' WHERE name = 'Spitfires FC';
UPDATE teams SET name = 'Dagenham United' WHERE name = 'Daggers FC';
UPDATE teams SET name = 'Southend Athletic' WHERE name = 'Shrimpers FC';
UPDATE teams SET name = 'Woking Athletic' WHERE name = 'Cardinals FC';
UPDATE teams SET name = 'Halifax United' WHERE name = 'Shaymen FC';
UPDATE teams SET name = 'Dorking United' WHERE name = 'Wanderers United';
UPDATE teams SET name = 'Ebbsfleet FC' WHERE name = 'Fleet FC';
UPDATE teams SET name = 'Aldershot FC' WHERE name = 'Shots FC';
UPDATE teams SET name = 'Maidenhead FC' WHERE name = 'Magpies United';
UPDATE teams SET name = 'Wealdstone FC' WHERE name = 'Stones FC';
UPDATE teams SET name = 'Boreham United' WHERE name = 'Wood FC';
UPDATE teams SET name = 'Bromley Athletic' WHERE name = 'Ravens FC';
UPDATE teams SET name = 'Fylde United' WHERE name = 'Coasters FC';
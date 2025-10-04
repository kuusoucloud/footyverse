-- Update team names to completely fictional English-sounding towns and teams

-- Tier 1 teams (Premier League style)
UPDATE teams SET name = 'Thornfield City' WHERE name = 'Metropolitan City';
UPDATE teams SET name = 'Millbrook United' WHERE name = 'Arsenal Borough';
UPDATE teams SET name = 'Riverside Wanderers' WHERE name = 'Riverside United';
UPDATE teams SET name = 'Bluewater FC' WHERE name = 'Chelsea Rovers';
UPDATE teams SET name = 'Redbridge Athletic' WHERE name = 'Manchester Rovers';
UPDATE teams SET name = 'Blackmoor United' WHERE name = 'Newcastle Rovers';
UPDATE teams SET name = 'Whitehaven FC' WHERE name = 'Tottenham Athletic';
UPDATE teams SET name = 'Seaside Rovers' WHERE name = 'Brighton Albion';
UPDATE teams SET name = 'Oakwood Park FC' WHERE name = 'Aston Park FC';
UPDATE teams SET name = 'Ironbridge United' WHERE name = 'West London United';
UPDATE teams SET name = 'Crystaldale FC' WHERE name = 'Crystal Athletic';
UPDATE teams SET name = 'Riverside Town' WHERE name = 'Fulham Rovers';
UPDATE teams SET name = 'Honeywood City' WHERE name = 'Brentford City';
UPDATE teams SET name = 'Goldenvale FC' WHERE name = 'Wolverhampton FC';
UPDATE teams SET name = 'Bluehill Athletic' WHERE name = 'Everton Athletic';
UPDATE teams SET name = 'Greenwood United' WHERE name = 'Nottingham United';
UPDATE teams SET name = 'Cherryfield Town' WHERE name = 'Bournemouth Town';
UPDATE teams SET name = 'Steelport Rovers' WHERE name = 'Sheffield Rovers';
UPDATE teams SET name = 'Moorland Athletic' WHERE name = 'Burnley Athletic';
UPDATE teams SET name = 'Hatfield Borough' WHERE name = 'Luton Borough';

-- Tier 2 teams (Championship style)
UPDATE teams SET name = 'Foxborough Rovers' WHERE name = 'Leicester Rovers';
UPDATE teams SET name = 'Whitegate Athletic' WHERE name = 'Leeds Athletic';
UPDATE teams SET name = 'Southport FC' WHERE name = 'Southampton FC';
UPDATE teams SET name = 'Portfield United' WHERE name = 'Ipswich United';
UPDATE teams SET name = 'Westmoor FC' WHERE name = 'West Bromwich FC';
UPDATE teams SET name = 'Middleton Town' WHERE name = 'Middlesbrough Town';
UPDATE teams SET name = 'Goldfield Athletic' WHERE name = 'Norwich Athletic';
UPDATE teams SET name = 'Skybridge United' WHERE name = 'Coventry United';
UPDATE teams SET name = 'Tigertown Athletic' WHERE name = 'Hull Athletic';
UPDATE teams SET name = 'Northgate United' WHERE name = 'Preston United';
UPDATE teams SET name = 'Swanmere Athletic' WHERE name = 'Swansea Athletic';
UPDATE teams SET name = 'Bluewater United' WHERE name = 'Cardiff United';
UPDATE teams SET name = 'Millfield Athletic' WHERE name = 'Millwall Athletic';
UPDATE teams SET name = 'Blackwater United' WHERE name = 'Blackburn United';
UPDATE teams SET name = 'Clayfield Athletic' WHERE name = 'Stoke Athletic';
UPDATE teams SET name = 'Owlswood FC' WHERE name = 'Sheffield Wednesday';
UPDATE teams SET name = 'Royalpark United' WHERE name = 'Queens Park United';
UPDATE teams SET name = 'Pilgrimstown United' WHERE name = 'Plymouth United';
UPDATE teams SET name = 'Hornbeam Athletic' WHERE name = 'Watford Athletic';
UPDATE teams SET name = 'Milltown FC' WHERE name = 'Rotherham FC';

-- Tier 3 teams (League One style)
UPDATE teams SET name = 'Bluefield Athletic' WHERE name = 'Birmingham Athletic';
UPDATE teams SET name = 'Dragonmere United' WHERE name = 'Wrexham United';
UPDATE teams SET name = 'Boltwood Athletic' WHERE name = 'Bolton Athletic';
UPDATE teams SET name = 'Redfield United' WHERE name = 'Barnsley United';
UPDATE teams SET name = 'Stockbridge United' WHERE name = 'Stockport United';
UPDATE teams SET name = 'Wychwood Athletic' WHERE name = 'Wycombe Athletic';
UPDATE teams SET name = 'Lincolnshire United' WHERE name = 'Lincoln United';
UPDATE teams SET name = 'Stagmoor United' WHERE name = 'Mansfield United';
UPDATE teams SET name = 'Exmoor United' WHERE name = 'Exeter United';
UPDATE teams SET name = 'Peterfield FC' WHERE name = 'Peterborough FC';
UPDATE teams SET name = 'Charlwood United' WHERE name = 'Charlton United';
UPDATE teams SET name = 'Readingdale Athletic' WHERE name = 'Reading Athletic';
UPDATE teams SET name = 'Stevendale United' WHERE name = 'Stevenage United';
UPDATE teams SET name = 'Northfield FC' WHERE name = 'Northampton FC';
UPDATE teams SET name = 'Leytonstone United' WHERE name = 'Leyton United';
UPDATE teams SET name = 'Crawfield United' WHERE name = 'Crawley United';
UPDATE teams SET name = 'Bristolmere United' WHERE name = 'Bristol United';
UPDATE teams SET name = 'Shrewdale FC' WHERE name = 'Shrewsbury FC';
UPDATE teams SET name = 'Cambridgeshire FC' WHERE name = 'Cambridge FC';
UPDATE teams SET name = 'Burtonwood United' WHERE name = 'Burton United';

-- Tier 4 teams (League Two style)
UPDATE teams SET name = 'Nottshire County FC' WHERE name = 'Notts County FC';
UPDATE teams SET name = 'Miltondale FC' WHERE name = 'Milton Keynes FC';
UPDATE teams SET name = 'Doncasterfield United' WHERE name = 'Doncaster United';
UPDATE teams SET name = 'Crewmoor United' WHERE name = 'Crewe United';
UPDATE teams SET name = 'Wimbledale FC' WHERE name = 'AFC Wimbledon FC';
UPDATE teams SET name = 'Grimfield United' WHERE name = 'Grimsby United';
UPDATE teams SET name = 'Bradfield Athletic' WHERE name = 'Bradford Athletic';
UPDATE teams SET name = 'Saltonmere United' WHERE name = 'Salford United';
UPDATE teams SET name = 'Tranmere United' WHERE name = 'Tranmere United';
UPDATE teams SET name = 'Harrogate United' WHERE name = 'Harrogate United';
UPDATE teams SET name = 'Colchesterfield FC' WHERE name = 'Colchester FC';
UPDATE teams SET name = 'Swindonmere United' WHERE name = 'Swindon United';
UPDATE teams SET name = 'Walsingham Athletic' WHERE name = 'Walsall Athletic';
UPDATE teams SET name = 'Newportdale United' WHERE name = 'Newport United';
UPDATE teams SET name = 'Gillingham FC' WHERE name = 'Gillingham FC';
UPDATE teams SET name = 'Accringdale FC' WHERE name = 'Accrington FC';
UPDATE teams SET name = 'Morecambe United' WHERE name = 'Morecambe United';
UPDATE teams SET name = 'Barrowfield Athletic' WHERE name = 'Barrow Athletic';
UPDATE teams SET name = 'Fleetwood United' WHERE name = 'Fleetwood United';
UPDATE teams SET name = 'Carlisle United' WHERE name = 'Carlisle United';

-- Tier 5 teams (National League style)
UPDATE teams SET name = 'Chesterfield FC' WHERE name = 'Chesterfield FC';
UPDATE teams SET name = 'Yorkdale Athletic' WHERE name = 'York Athletic';
UPDATE teams SET name = 'Oldhamshire United' WHERE name = 'Oldham United';
UPDATE teams SET name = 'Solihullmere United' WHERE name = 'Solihull United';
UPDATE teams SET name = 'Gateshead FC' WHERE name = 'Gateshead FC';
UPDATE teams SET name = 'Barnetfield Athletic' WHERE name = 'Barnet Athletic';
UPDATE teams SET name = 'Altrincham FC' WHERE name = 'Altrincham FC';
UPDATE teams SET name = 'Eastleigh United' WHERE name = 'Eastleigh United';
UPDATE teams SET name = 'Dagenham United' WHERE name = 'Dagenham United';
UPDATE teams SET name = 'Southendmere Athletic' WHERE name = 'Southend Athletic';
UPDATE teams SET name = 'Wokingdale Athletic' WHERE name = 'Woking Athletic';
UPDATE teams SET name = 'Halifaxshire United' WHERE name = 'Halifax United';
UPDATE teams SET name = 'Dorkingmere United' WHERE name = 'Dorking United';
UPDATE teams SET name = 'Ebbsfleet FC' WHERE name = 'Ebbsfleet FC';
UPDATE teams SET name = 'Aldershotfield FC' WHERE name = 'Aldershot FC';
UPDATE teams SET name = 'Maidenhead FC' WHERE name = 'Maidenhead FC';
UPDATE teams SET name = 'Wealdstone FC' WHERE name = 'Wealdstone FC';
UPDATE teams SET name = 'Borehamwood United' WHERE name = 'Boreham United';
UPDATE teams SET name = 'Bromleydale Athletic' WHERE name = 'Bromley Athletic';
UPDATE teams SET name = 'Fyldemere United' WHERE name = 'Fylde United';
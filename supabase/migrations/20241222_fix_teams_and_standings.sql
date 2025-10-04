-- Simple fix for team names and ensure only 1 live match
-- Update all team names to be generic to avoid copyright issues

UPDATE teams SET name = 'Skyline FC' WHERE name = 'Manchester City';
UPDATE teams SET name = 'Arsenal United' WHERE name = 'Arsenal';
UPDATE teams SET name = 'Riverside FC' WHERE name = 'Liverpool';
UPDATE teams SET name = 'Blue Lions' WHERE name = 'Chelsea';
UPDATE teams SET name = 'Red Devils FC' WHERE name = 'Manchester United';
UPDATE teams SET name = 'Magpies United' WHERE name = 'Newcastle United';
UPDATE teams SET name = 'White Hart FC' WHERE name = 'Tottenham';
UPDATE teams SET name = 'Seagulls FC' WHERE name = 'Brighton';
UPDATE teams SET name = 'Villa Park FC' WHERE name = 'Aston Villa';
UPDATE teams SET name = 'Hammers United' WHERE name = 'West Ham';
UPDATE teams SET name = 'Eagles FC' WHERE name = 'Crystal Palace';
UPDATE teams SET name = 'Cottage FC' WHERE name = 'Fulham';
UPDATE teams SET name = 'Bees United' WHERE name = 'Brentford';
UPDATE teams SET name = 'Wolves FC' WHERE name = 'Wolves';
UPDATE teams SET name = 'Toffees United' WHERE name = 'Everton';
UPDATE teams SET name = 'Forest FC' WHERE name = 'Nottingham Forest';
UPDATE teams SET name = 'Cherries FC' WHERE name = 'Bournemouth';
UPDATE teams SET name = 'Blades United' WHERE name = 'Sheffield United';
UPDATE teams SET name = 'Clarets FC' WHERE name = 'Burnley';
UPDATE teams SET name = 'Hatters FC' WHERE name = 'Luton Town';

-- Tier 2 teams
UPDATE teams SET name = 'Foxes FC' WHERE name = 'Leicester City';
UPDATE teams SET name = 'United Leeds' WHERE name = 'Leeds United';
UPDATE teams SET name = 'Saints FC' WHERE name = 'Southampton';
UPDATE teams SET name = 'Town FC' WHERE name = 'Ipswich Town';
UPDATE teams SET name = 'Albion FC' WHERE name = 'West Bromwich';
UPDATE teams SET name = 'Boro FC' WHERE name = 'Middlesbrough';
UPDATE teams SET name = 'Canaries FC' WHERE name = 'Norwich City';
UPDATE teams SET name = 'Sky Blues' WHERE name = 'Coventry City';
UPDATE teams SET name = 'Tigers FC' WHERE name = 'Hull City';
UPDATE teams SET name = 'North End FC' WHERE name = 'Preston North End';
UPDATE teams SET name = 'Swans FC' WHERE name = 'Swansea City';
UPDATE teams SET name = 'Bluebirds FC' WHERE name = 'Cardiff City';
UPDATE teams SET name = 'Lions FC' WHERE name = 'Millwall';
UPDATE teams SET name = 'Rovers FC' WHERE name = 'Blackburn Rovers';
UPDATE teams SET name = 'Potters FC' WHERE name = 'Stoke City';
UPDATE teams SET name = 'Owls FC' WHERE name = 'Sheffield Wednesday';
UPDATE teams SET name = 'Rangers FC' WHERE name = 'Queens Park Rangers';
UPDATE teams SET name = 'Pilgrims FC' WHERE name = 'Plymouth Argyle';
UPDATE teams SET name = 'Hornets FC' WHERE name = 'Watford';
UPDATE teams SET name = 'Millers FC' WHERE name = 'Rotherham United';

-- Tier 3 teams
UPDATE teams SET name = 'Blues FC' WHERE name = 'Birmingham City';
UPDATE teams SET name = 'Dragons FC' WHERE name = 'Wrexham';
UPDATE teams SET name = 'Wanderers FC' WHERE name = 'Bolton Wanderers';
UPDATE teams SET name = 'Reds FC' WHERE name = 'Barnsley';
UPDATE teams SET name = 'County FC' WHERE name = 'Stockport County';
UPDATE teams SET name = 'Chairboys FC' WHERE name = 'Wycombe Wanderers';
UPDATE teams SET name = 'Imps FC' WHERE name = 'Lincoln City';
UPDATE teams SET name = 'Stags FC' WHERE name = 'Mansfield Town';
UPDATE teams SET name = 'Grecians FC' WHERE name = 'Exeter City';
UPDATE teams SET name = 'Posh FC' WHERE name = 'Peterborough United';
UPDATE teams SET name = 'Addicks FC' WHERE name = 'Charlton Athletic';
UPDATE teams SET name = 'Royals FC' WHERE name = 'Reading';
UPDATE teams SET name = 'Borough FC' WHERE name = 'Stevenage';
UPDATE teams SET name = 'Cobblers FC' WHERE name = 'Northampton Town';
UPDATE teams SET name = 'Orient FC' WHERE name = 'Leyton Orient';
UPDATE teams SET name = 'Red Devils' WHERE name = 'Crawley Town';
UPDATE teams SET name = 'Pirates FC' WHERE name = 'Bristol Rovers';
UPDATE teams SET name = 'Shrews FC' WHERE name = 'Shrewsbury Town';
UPDATE teams SET name = 'United FC' WHERE name = 'Cambridge United';
UPDATE teams SET name = 'Brewers FC' WHERE name = 'Burton Albion';

-- Tier 4 teams
UPDATE teams SET name = 'Magpies FC' WHERE name = 'Notts County';
UPDATE teams SET name = 'Dons FC' WHERE name = 'MK Dons';
UPDATE teams SET name = 'Rovers United' WHERE name = 'Doncaster Rovers';
UPDATE teams SET name = 'Alex FC' WHERE name = 'Crewe Alexandra';
UPDATE teams SET name = 'Wombles FC' WHERE name = 'AFC Wimbledon';
UPDATE teams SET name = 'Mariners FC' WHERE name = 'Grimsby Town';
UPDATE teams SET name = 'Bantams FC' WHERE name = 'Bradford City';
UPDATE teams SET name = 'City FC' WHERE name = 'Salford City';
UPDATE teams SET name = 'Rovers City' WHERE name = 'Tranmere Rovers';
UPDATE teams SET name = 'Town United' WHERE name = 'Harrogate Town';
UPDATE teams SET name = 'United City' WHERE name = 'Colchester United';
UPDATE teams SET name = 'Robins FC' WHERE name = 'Swindon Town';
UPDATE teams SET name = 'Saddlers FC' WHERE name = 'Walsall';
UPDATE teams SET name = 'County United' WHERE name = 'Newport County';
UPDATE teams SET name = 'Gills FC' WHERE name = 'Gillingham';
UPDATE teams SET name = 'Stanley FC' WHERE name = 'Accrington Stanley';
UPDATE teams SET name = 'Shrimps FC' WHERE name = 'Morecambe';
UPDATE teams SET name = 'Bluebirds United' WHERE name = 'Barrow';
UPDATE teams SET name = 'Cod Army FC' WHERE name = 'Fleetwood Town';
UPDATE teams SET name = 'Cumbrians FC' WHERE name = 'Carlisle United';

-- Tier 5 teams
UPDATE teams SET name = 'Spireites FC' WHERE name = 'Chesterfield';
UPDATE teams SET name = 'Minstermen FC' WHERE name = 'York City';
UPDATE teams SET name = 'Latics FC' WHERE name = 'Oldham Athletic';
UPDATE teams SET name = 'Moors FC' WHERE name = 'Solihull Moors';
UPDATE teams SET name = 'Heed FC' WHERE name = 'Gateshead';
UPDATE teams SET name = 'Bees FC' WHERE name = 'Barnet';
UPDATE teams SET name = 'Robins United' WHERE name = 'Altrincham';
UPDATE teams SET name = 'Spitfires FC' WHERE name = 'Eastleigh';
UPDATE teams SET name = 'Daggers FC' WHERE name = 'Dagenham & Redbridge';
UPDATE teams SET name = 'Shrimpers FC' WHERE name = 'Southend United';
UPDATE teams SET name = 'Cardinals FC' WHERE name = 'Woking';
UPDATE teams SET name = 'Shaymen FC' WHERE name = 'Halifax Town';
UPDATE teams SET name = 'Wanderers United' WHERE name = 'Dorking Wanderers';
UPDATE teams SET name = 'Fleet FC' WHERE name = 'Ebbsfleet United';
UPDATE teams SET name = 'Shots FC' WHERE name = 'Aldershot Town';
UPDATE teams SET name = 'Magpies United' WHERE name = 'Maidenhead United';
UPDATE teams SET name = 'Stones FC' WHERE name = 'Wealdstone';
UPDATE teams SET name = 'Wood FC' WHERE name = 'Boreham Wood';
UPDATE teams SET name = 'Ravens FC' WHERE name = 'Bromley';
UPDATE teams SET name = 'Coasters FC' WHERE name = 'Fylde';

-- Ensure only 1 live match at a time
UPDATE fixtures SET status = 'scheduled', scheduled_at = NOW() + INTERVAL '1 hour'
WHERE status = 'live' AND id NOT IN (
    SELECT id FROM fixtures WHERE status = 'live' LIMIT 1
);
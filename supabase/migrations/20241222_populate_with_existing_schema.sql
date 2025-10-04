-- Populate database with teams and players using existing schema
-- Clear existing data first
DELETE FROM elo_history;
DELETE FROM player_match_stats;
DELETE FROM events;
DELETE FROM matches;
DELETE FROM fixtures;
DELETE FROM team_standings;
DELETE FROM players;
DELETE FROM teams;

-- Insert teams for all 5 tiers
INSERT INTO teams (name, tier, elo, primary_color, secondary_color) VALUES
-- Tier 1 (Premier League equivalent) - 20 teams
('Manchester City', 1, 2100, '#6CABDD', '#FFFFFF'),
('Arsenal', 1, 2050, '#EF0107', '#FFFFFF'),
('Liverpool', 1, 2080, '#C8102E', '#FFFFFF'),
('Chelsea', 1, 2020, '#034694', '#FFFFFF'),
('Manchester United', 1, 1980, '#DA020E', '#FFFFFF'),
('Newcastle United', 1, 1950, '#241F20', '#FFFFFF'),
('Tottenham', 1, 1940, '#132257', '#FFFFFF'),
('Brighton', 1, 1900, '#0057B8', '#FFFFFF'),
('Aston Villa', 1, 1920, '#95BFE5', '#670E36'),
('West Ham', 1, 1880, '#7A263A', '#1BB1E7'),
('Crystal Palace', 1, 1850, '#1B458F', '#A7A5A6'),
('Fulham', 1, 1840, '#FFFFFF', '#000000'),
('Brentford', 1, 1830, '#E30613', '#FFFFFF'),
('Wolves', 1, 1820, '#FDB462', '#231F20'),
('Everton', 1, 1810, '#003399', '#FFFFFF'),
('Nottingham Forest', 1, 1800, '#DD0000', '#FFFFFF'),
('Bournemouth', 1, 1790, '#DA020E', '#000000'),
('Sheffield United', 1, 1780, '#EE2737', '#FFFFFF'),
('Burnley', 1, 1770, '#6C1D45', '#99D6EA'),
('Luton Town', 1, 1760, '#F78F1E', '#002D62'),

-- Tier 2 (Championship equivalent) - 20 teams
('Leicester City', 2, 1750, '#003090', '#FFFFFF'),
('Leeds United', 2, 1740, '#FFFFFF', '#1D428A'),
('Southampton', 2, 1730, '#D71920', '#FFFFFF'),
('Ipswich Town', 2, 1720, '#4C9AE5', '#FFFFFF'),
('West Bromwich', 2, 1710, '#122F67', '#FFFFFF'),
('Middlesbrough', 2, 1700, '#DC143C', '#FFFFFF'),
('Norwich City', 2, 1690, '#FFF200', '#00A650'),
('Coventry City', 2, 1680, '#7BA7D7', '#FFFFFF'),
('Hull City', 2, 1670, '#F5A12D', '#000000'),
('Preston North End', 2, 1660, '#FFFFFF', '#000080'),
('Swansea City', 2, 1650, '#FFFFFF', '#000000'),
('Cardiff City', 2, 1640, '#0070B5', '#ED1C24'),
('Millwall', 2, 1630, '#003F7F', '#FFFFFF'),
('Blackburn Rovers', 2, 1620, '#0066CC', '#FFFFFF'),
('Stoke City', 2, 1610, '#E03A3E', '#FFFFFF'),
('Sheffield Wednesday', 2, 1600, '#1760AB', '#FFFFFF'),
('Queens Park Rangers', 2, 1590, '#005CAB', '#FFFFFF'),
('Plymouth Argyle', 2, 1580, '#00843D', '#FFFFFF'),
('Watford', 2, 1570, '#FBEE23', '#ED2127'),
('Rotherham United', 2, 1560, '#C8102E', '#FFFFFF'),

-- Tier 3 (League One equivalent) - 20 teams
('Birmingham City', 3, 1550, '#0066CC', '#FFFFFF'),
('Wrexham', 3, 1540, '#CC0000', '#FFFFFF'),
('Bolton Wanderers', 3, 1530, '#FFFFFF', '#003366'),
('Barnsley', 3, 1520, '#DC143C', '#FFFFFF'),
('Stockport County', 3, 1510, '#0066CC', '#FFFFFF'),
('Wycombe Wanderers', 3, 1500, '#7BB3D9', '#003366'),
('Lincoln City', 3, 1490, '#DC143C', '#FFFFFF'),
('Mansfield Town', 3, 1480, '#F5A623', '#003366'),
('Exeter City', 3, 1470, '#DC143C', '#FFFFFF'),
('Peterborough United', 3, 1460, '#0066CC', '#FFFFFF'),
('Charlton Athletic', 3, 1450, '#DC143C', '#FFFFFF'),
('Reading', 3, 1440, '#0066CC', '#FFFFFF'),
('Stevenage', 3, 1430, '#DC143C', '#FFFFFF'),
('Northampton Town', 3, 1420, '#7A263A', '#FFFFFF'),
('Leyton Orient', 3, 1410, '#DC143C', '#FFFFFF'),
('Crawley Town', 3, 1400, '#DC143C', '#FFFFFF'),
('Bristol Rovers', 3, 1390, '#0066CC', '#FFFFFF'),
('Shrewsbury Town', 3, 1380, '#F5A623', '#003366'),
('Cambridge United', 3, 1370, '#F5A623', '#000000'),
('Burton Albion', 3, 1360, '#F5A623', '#000000'),

-- Tier 4 (League Two equivalent) - 20 teams
('Notts County', 4, 1350, '#000000', '#FFFFFF'),
('MK Dons', 4, 1340, '#FFFFFF', '#000000'),
('Doncaster Rovers', 4, 1330, '#DC143C', '#FFFFFF'),
('Crewe Alexandra', 4, 1320, '#DC143C', '#FFFFFF'),
('AFC Wimbledon', 4, 1310, '#0066CC', '#F5A623'),
('Grimsby Town', 4, 1300, '#000000', '#FFFFFF'),
('Bradford City', 4, 1290, '#7A263A', '#F5A623'),
('Salford City', 4, 1280, '#DC143C', '#FFFFFF'),
('Tranmere Rovers', 4, 1270, '#FFFFFF', '#0066CC'),
('Harrogate Town', 4, 1260, '#F5A623', '#000000'),
('Colchester United', 4, 1250, '#0066CC', '#FFFFFF'),
('Swindon Town', 4, 1240, '#DC143C', '#FFFFFF'),
('Walsall', 4, 1230, '#DC143C', '#000000'),
('Newport County', 4, 1220, '#F5A623', '#000000'),
('Gillingham', 4, 1210, '#0066CC', '#FFFFFF'),
('Accrington Stanley', 4, 1200, '#DC143C', '#FFFFFF'),
('Morecambe', 4, 1190, '#DC143C', '#FFFFFF'),
('Barrow', 4, 1180, '#0066CC', '#FFFFFF'),
('Fleetwood Town', 4, 1170, '#DC143C', '#FFFFFF'),
('Carlisle United', 4, 1160, '#0066CC', '#FFFFFF'),

-- Tier 5 (National League equivalent) - 20 teams
('Chesterfield', 5, 1150, '#0066CC', '#FFFFFF'),
('York City', 5, 1140, '#DC143C', '#FFFFFF'),
('Oldham Athletic', 5, 1130, '#0066CC', '#FFFFFF'),
('Solihull Moors', 5, 1120, '#F5A623', '#0066CC'),
('Gateshead', 5, 1110, '#FFFFFF', '#000000'),
('Barnet', 5, 1100, '#F5A623', '#000000'),
('Altrincham', 5, 1090, '#DC143C', '#FFFFFF'),
('Eastleigh', 5, 1080, '#0066CC', '#FFFFFF'),
('Dagenham & Redbridge', 5, 1070, '#DC143C', '#0066CC'),
('Southend United', 5, 1060, '#0066CC', '#FFFFFF'),
('Woking', 5, 1050, '#DC143C', '#FFFFFF'),
('Halifax Town', 5, 1040, '#0066CC', '#FFFFFF'),
('Dorking Wanderers', 5, 1030, '#FFFFFF', '#DC143C'),
('Ebbsfleet United', 5, 1020, '#DC143C', '#FFFFFF'),
('Aldershot Town', 5, 1010, '#DC143C', '#0066CC'),
('Maidenhead United', 5, 1000, '#000000', '#FFFFFF'),
('Wealdstone', 5, 990, '#DC143C', '#FFFFFF'),
('Boreham Wood', 5, 980, '#FFFFFF', '#000000'),
('Bromley', 5, 970, '#FFFFFF', '#000000'),
('Fylde', 5, 960, '#FFFFFF', '#DC143C');

-- Create players for each team (23 players per team)
DO $$
DECLARE
    team_record RECORD;
    i INTEGER;
    player_names TEXT[] := ARRAY[
        'James Smith', 'John Johnson', 'Robert Williams', 'Michael Brown', 'William Jones',
        'David Garcia', 'Richard Miller', 'Charles Davis', 'Joseph Rodriguez', 'Thomas Wilson',
        'Christopher Martinez', 'Daniel Anderson', 'Paul Taylor', 'Mark Thomas', 'Donald Jackson',
        'Kenneth White', 'Steven Harris', 'Edward Martin', 'Brian Thompson', 'Ronald Garcia',
        'Anthony Martinez', 'Kevin Robinson', 'Jason Clark', 'Matthew Rodriguez', 'Gary Lewis'
    ];
    positions TEXT[] := ARRAY['GK', 'GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW', 'FW', 'FW', 'FW', 'FW'];
BEGIN
    FOR team_record IN SELECT id, name, tier FROM teams LOOP
        -- Create 23 players per team
        FOR i IN 1..23 LOOP
            INSERT INTO players (
                team_id,
                name, 
                position, 
                age, 
                height_cm,
                weight_kg,
                base_elo,
                current_elo,
                attributes
            ) VALUES (
                team_record.id,
                team_record.name || ' ' || player_names[((i-1) % array_length(player_names, 1)) + 1] || ' ' || i,
                positions[i],
                18 + (random() * 17)::integer, -- Age between 18-35
                170 + (random() * 25)::integer, -- Height 170-195cm
                65 + (random() * 25)::integer,  -- Weight 65-90kg
                -- Base ELO based on tier
                CASE 
                    WHEN team_record.tier = 1 THEN 700 + (random() * 300)::integer
                    WHEN team_record.tier = 2 THEN 600 + (random() * 250)::integer
                    WHEN team_record.tier = 3 THEN 500 + (random() * 200)::integer
                    WHEN team_record.tier = 4 THEN 400 + (random() * 150)::integer
                    ELSE 300 + (random() * 100)::integer
                END,
                -- Current ELO (same as base for now)
                CASE 
                    WHEN team_record.tier = 1 THEN 700 + (random() * 300)::integer
                    WHEN team_record.tier = 2 THEN 600 + (random() * 250)::integer
                    WHEN team_record.tier = 3 THEN 500 + (random() * 200)::integer
                    WHEN team_record.tier = 4 THEN 400 + (random() * 150)::integer
                    ELSE 300 + (random() * 100)::integer
                END,
                -- Random attributes based on position and tier
                jsonb_build_object(
                    'pace', 40 + (random() * 40)::integer,
                    'accel', 40 + (random() * 40)::integer,
                    'stamina', 40 + (random() * 40)::integer,
                    'strength', 40 + (random() * 40)::integer,
                    'passing', 40 + (random() * 40)::integer,
                    'vision', 40 + (random() * 40)::integer,
                    'finishing', 40 + (random() * 40)::integer,
                    'heading', 40 + (random() * 40)::integer,
                    'marking', 40 + (random() * 40)::integer,
                    'tackling', 40 + (random() * 40)::integer,
                    'reflexes', CASE WHEN positions[i] = 'GK' THEN 60 + (random() * 30)::integer ELSE 30 + (random() * 20)::integer END,
                    'handling', CASE WHEN positions[i] = 'GK' THEN 60 + (random() * 30)::integer ELSE 30 + (random() * 20)::integer END,
                    'positioning', 40 + (random() * 40)::integer,
                    'composure', 40 + (random() * 40)::integer
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- Create team standings for current season
WITH current_season AS (
    SELECT id FROM seasons WHERE year = 2024 LIMIT 1
),
league_data AS (
    SELECT l.id as league_id, l.tier, s.id as season_id
    FROM leagues l
    JOIN current_season s ON l.season_id = s.id
)
INSERT INTO team_standings (season_id, league_id, team_id)
SELECT 
    ld.season_id,
    ld.league_id,
    t.id
FROM teams t
JOIN league_data ld ON t.tier = ld.tier;

-- Create some fixtures for immediate matches
WITH current_season AS (
    SELECT id FROM seasons WHERE year = 2024 LIMIT 1
),
tier1_league AS (
    SELECT l.id 
    FROM leagues l
    JOIN current_season s ON l.season_id = s.id
    WHERE l.tier = 1
    LIMIT 1
),
tier1_teams AS (
    SELECT id, name FROM teams WHERE tier = 1 ORDER BY random() LIMIT 10
)
INSERT INTO fixtures (
    season_id,
    league_id,
    round,
    home_team_id,
    away_team_id,
    scheduled_at,
    status
)
SELECT 
    (SELECT id FROM current_season),
    (SELECT id FROM tier1_league),
    1,
    t1.id,
    t2.id,
    NOW() + INTERVAL '5 minutes' * row_number() OVER (),
    'scheduled'
FROM tier1_teams t1
CROSS JOIN tier1_teams t2
WHERE t1.id != t2.id
LIMIT 20;

-- Create some live fixtures
UPDATE fixtures 
SET status = 'live', scheduled_at = NOW() - INTERVAL '30 minutes'
WHERE id IN (
    SELECT id FROM fixtures 
    ORDER BY scheduled_at 
    LIMIT 5
);
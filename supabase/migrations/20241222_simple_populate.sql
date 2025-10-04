-- Simple database population - just add teams and players to existing schema
-- Clear existing data first
DELETE FROM transfers;
DELETE FROM matches;
DELETE FROM players;
DELETE FROM teams;

-- Insert teams for all 5 tiers
INSERT INTO teams (name, tier, transfer_budget, wealth_category) VALUES
-- Tier 1 (Premier League equivalent) - 20 teams
('Manchester City', 1, 200000000, 'mega_rich'),
('Arsenal', 1, 150000000, 'mega_rich'),
('Liverpool', 1, 180000000, 'mega_rich'),
('Chelsea', 1, 170000000, 'mega_rich'),
('Manchester United', 1, 160000000, 'rich'),
('Newcastle United', 1, 140000000, 'rich'),
('Tottenham', 1, 130000000, 'rich'),
('Brighton', 1, 80000000, 'moderate'),
('Aston Villa', 1, 90000000, 'moderate'),
('West Ham', 1, 70000000, 'moderate'),
('Crystal Palace', 1, 50000000, 'limited'),
('Fulham', 1, 45000000, 'limited'),
('Brentford', 1, 40000000, 'limited'),
('Wolves', 1, 35000000, 'limited'),
('Everton', 1, 30000000, 'poor'),
('Nottingham Forest', 1, 25000000, 'poor'),
('Bournemouth', 1, 20000000, 'poor'),
('Sheffield United', 1, 15000000, 'very_poor'),
('Burnley', 1, 12000000, 'very_poor'),
('Luton Town', 1, 10000000, 'very_poor'),

-- Tier 2 (Championship equivalent) - 20 teams
('Leicester City', 2, 50000000, 'rich'),
('Leeds United', 2, 45000000, 'moderate'),
('Southampton', 2, 40000000, 'moderate'),
('Ipswich Town', 2, 35000000, 'moderate'),
('West Bromwich', 2, 30000000, 'limited'),
('Middlesbrough', 2, 25000000, 'limited'),
('Norwich City', 2, 22000000, 'limited'),
('Coventry City', 2, 20000000, 'limited'),
('Hull City', 2, 18000000, 'poor'),
('Preston North End', 2, 16000000, 'poor'),
('Swansea City', 2, 15000000, 'poor'),
('Cardiff City', 2, 14000000, 'poor'),
('Millwall', 2, 12000000, 'very_poor'),
('Blackburn Rovers', 2, 11000000, 'very_poor'),
('Stoke City', 2, 10000000, 'very_poor'),
('Sheffield Wednesday', 2, 9000000, 'very_poor'),
('Queens Park Rangers', 2, 8000000, 'very_poor'),
('Plymouth Argyle', 2, 7000000, 'very_poor'),
('Watford', 2, 6000000, 'very_poor'),
('Rotherham United', 2, 5000000, 'very_poor'),

-- Tier 3 (League One equivalent) - 20 teams
('Birmingham City', 3, 4000000, 'limited'),
('Wrexham', 3, 3500000, 'limited'),
('Bolton Wanderers', 3, 3000000, 'poor'),
('Barnsley', 3, 2800000, 'poor'),
('Stockport County', 3, 2500000, 'poor'),
('Wycombe Wanderers', 3, 2200000, 'poor'),
('Lincoln City', 3, 2000000, 'very_poor'),
('Mansfield Town', 3, 1800000, 'very_poor'),
('Exeter City', 3, 1600000, 'very_poor'),
('Peterborough United', 3, 1500000, 'very_poor'),
('Charlton Athletic', 3, 1400000, 'very_poor'),
('Reading', 3, 1300000, 'very_poor'),
('Stevenage', 3, 1200000, 'very_poor'),
('Northampton Town', 3, 1100000, 'very_poor'),
('Leyton Orient', 3, 1000000, 'very_poor'),
('Crawley Town', 3, 900000, 'very_poor'),
('Bristol Rovers', 3, 800000, 'very_poor'),
('Shrewsbury Town', 3, 700000, 'very_poor'),
('Cambridge United', 3, 600000, 'very_poor'),
('Burton Albion', 3, 500000, 'very_poor'),

-- Tier 4 (League Two equivalent) - 20 teams
('Notts County', 4, 400000, 'very_poor'),
('MK Dons', 4, 380000, 'very_poor'),
('Doncaster Rovers', 4, 360000, 'very_poor'),
('Crewe Alexandra', 4, 340000, 'very_poor'),
('AFC Wimbledon', 4, 320000, 'very_poor'),
('Grimsby Town', 4, 300000, 'very_poor'),
('Bradford City', 4, 280000, 'very_poor'),
('Salford City', 4, 260000, 'very_poor'),
('Tranmere Rovers', 4, 240000, 'very_poor'),
('Harrogate Town', 4, 220000, 'very_poor'),
('Colchester United', 4, 200000, 'very_poor'),
('Swindon Town', 4, 180000, 'very_poor'),
('Walsall', 4, 160000, 'very_poor'),
('Newport County', 4, 140000, 'very_poor'),
('Gillingham', 4, 120000, 'very_poor'),
('Accrington Stanley', 4, 100000, 'very_poor'),
('Morecambe', 4, 90000, 'very_poor'),
('Barrow', 4, 80000, 'very_poor'),
('Fleetwood Town', 4, 70000, 'very_poor'),
('Carlisle United', 4, 60000, 'very_poor'),

-- Tier 5 (National League equivalent) - 20 teams
('Chesterfield', 5, 50000, 'very_poor'),
('York City', 5, 45000, 'very_poor'),
('Oldham Athletic', 5, 40000, 'very_poor'),
('Solihull Moors', 5, 35000, 'very_poor'),
('Gateshead', 5, 30000, 'very_poor'),
('Barnet', 5, 28000, 'very_poor'),
('Altrincham', 5, 26000, 'very_poor'),
('Eastleigh', 5, 24000, 'very_poor'),
('Dagenham & Redbridge', 5, 22000, 'very_poor'),
('Southend United', 5, 20000, 'very_poor'),
('Woking', 5, 18000, 'very_poor'),
('Halifax Town', 5, 16000, 'very_poor'),
('Dorking Wanderers', 5, 14000, 'very_poor'),
('Ebbsfleet United', 5, 12000, 'very_poor'),
('Aldershot Town', 5, 10000, 'very_poor'),
('Maidenhead United', 5, 9000, 'very_poor'),
('Wealdstone', 5, 8000, 'very_poor'),
('Boreham Wood', 5, 7000, 'very_poor'),
('Bromley', 5, 6000, 'very_poor'),
('Fylde', 5, 5000, 'very_poor');

-- Create players for each team (simplified version)
DO $$
DECLARE
    team_record RECORD;
    i INTEGER;
BEGIN
    FOR team_record IN SELECT id, name, tier FROM teams LOOP
        -- Create 23 players per team
        FOR i IN 1..23 LOOP
            INSERT INTO players (
                name, 
                team_id, 
                position, 
                age, 
                overall_rating, 
                market_value, 
                wage, 
                contract_end,
                nationality
            ) VALUES (
                team_record.name || ' Player ' || i,
                team_record.id,
                CASE 
                    WHEN i <= 2 THEN 'GK'
                    WHEN i <= 8 THEN 'DEF'
                    WHEN i <= 14 THEN 'MID'
                    ELSE 'FWD'
                END,
                18 + (random() * 17)::integer,
                CASE 
                    WHEN team_record.tier = 1 THEN 70 + (random() * 25)::integer
                    WHEN team_record.tier = 2 THEN 60 + (random() * 25)::integer
                    WHEN team_record.tier = 3 THEN 50 + (random() * 25)::integer
                    WHEN team_record.tier = 4 THEN 40 + (random() * 25)::integer
                    ELSE 30 + (random() * 25)::integer
                END,
                CASE 
                    WHEN team_record.tier = 1 THEN 1000000 + (random() * 49000000)::integer
                    WHEN team_record.tier = 2 THEN 100000 + (random() * 4900000)::integer
                    WHEN team_record.tier = 3 THEN 10000 + (random() * 490000)::integer
                    WHEN team_record.tier = 4 THEN 1000 + (random() * 49000)::integer
                    ELSE 100 + (random() * 4900)::integer
                END,
                CASE 
                    WHEN team_record.tier = 1 THEN 10000 + (random() * 190000)::integer
                    WHEN team_record.tier = 2 THEN 5000 + (random() * 45000)::integer
                    WHEN team_record.tier = 3 THEN 1000 + (random() * 9000)::integer
                    WHEN team_record.tier = 4 THEN 500 + (random() * 2500)::integer
                    ELSE 200 + (random() * 800)::integer
                END,
                (CURRENT_DATE + INTERVAL '1 year' + (random() * INTERVAL '3 years'))::date,
                'England'
            );
        END LOOP;
    END LOOP;
END $$;

-- Create some live matches
INSERT INTO matches (
    home_team_id, 
    away_team_id, 
    home_team_name, 
    away_team_name, 
    home_score, 
    away_score, 
    status, 
    minute, 
    match_date, 
    tier
) 
SELECT 
    t1.id,
    t2.id,
    t1.name,
    t2.name,
    (random() * 3)::integer,
    (random() * 3)::integer,
    'live',
    (random() * 90)::integer,
    NOW(),
    1
FROM teams t1
CROSS JOIN teams t2 
WHERE t1.tier = 1 AND t2.tier = 1 AND t1.id < t2.id
LIMIT 8;

-- Create scheduled matches
INSERT INTO matches (
    home_team_id, 
    away_team_id, 
    home_team_name, 
    away_team_name, 
    status, 
    match_date, 
    tier
) 
SELECT 
    t1.id,
    t2.id,
    t1.name,
    t2.name,
    'scheduled',
    NOW() + INTERVAL '1 hour' * (row_number() OVER ()),
    1
FROM teams t1
CROSS JOIN teams t2 
WHERE t1.tier = 1 AND t2.tier = 1 AND t1.id != t2.id
LIMIT 30;

-- Open transfer window
UPDATE transfer_windows SET is_active = true WHERE window_type = 'summer';
INSERT INTO transfer_windows (window_type, is_active, start_date, end_date)
SELECT 'summer', true, NOW(), NOW() + INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM transfer_windows WHERE window_type = 'summer');
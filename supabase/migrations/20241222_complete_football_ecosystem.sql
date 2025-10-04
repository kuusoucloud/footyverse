-- Force complete football ecosystem setup immediately
-- This ensures teams, players, and matches are created right away

-- First, let's make sure we have the ecosystem
DO $$
DECLARE
    team_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO team_count FROM teams;
    
    IF team_count = 0 THEN
        -- Create teams immediately
        INSERT INTO teams (name, tier, elo_rating, transfer_budget, wealth_category) VALUES
        -- Tier 1 (Premier League equivalent)
        ('Manchester City', 1, 2100, 200000000, 'mega_rich'),
        ('Arsenal', 1, 2050, 150000000, 'mega_rich'),
        ('Liverpool', 1, 2080, 180000000, 'mega_rich'),
        ('Chelsea', 1, 2020, 170000000, 'mega_rich'),
        ('Manchester United', 1, 1980, 160000000, 'rich'),
        ('Newcastle United', 1, 1950, 140000000, 'rich'),
        ('Tottenham', 1, 1940, 130000000, 'rich'),
        ('Brighton', 1, 1900, 80000000, 'moderate'),
        ('Aston Villa', 1, 1920, 90000000, 'moderate'),
        ('West Ham', 1, 1880, 70000000, 'moderate'),
        ('Crystal Palace', 1, 1850, 50000000, 'limited'),
        ('Fulham', 1, 1840, 45000000, 'limited'),
        ('Brentford', 1, 1830, 40000000, 'limited'),
        ('Wolves', 1, 1820, 35000000, 'limited'),
        ('Everton', 1, 1810, 30000000, 'poor'),
        ('Nottingham Forest', 1, 1800, 25000000, 'poor'),
        ('Bournemouth', 1, 1790, 20000000, 'poor'),
        ('Sheffield United', 1, 1780, 15000000, 'very_poor'),
        ('Burnley', 1, 1770, 12000000, 'very_poor'),
        ('Luton Town', 1, 1760, 10000000, 'very_poor'),
        
        -- Tier 2 (Championship equivalent)
        ('Leicester City', 2, 1750, 50000000, 'rich'),
        ('Leeds United', 2, 1740, 45000000, 'moderate'),
        ('Southampton', 2, 1730, 40000000, 'moderate'),
        ('Ipswich Town', 2, 1720, 35000000, 'moderate'),
        ('West Bromwich', 2, 1710, 30000000, 'limited'),
        ('Middlesbrough', 2, 1700, 25000000, 'limited'),
        ('Norwich City', 2, 1690, 22000000, 'limited'),
        ('Coventry City', 2, 1680, 20000000, 'limited'),
        ('Hull City', 2, 1670, 18000000, 'poor'),
        ('Preston North End', 2, 1660, 16000000, 'poor'),
        ('Swansea City', 2, 1650, 15000000, 'poor'),
        ('Cardiff City', 2, 1640, 14000000, 'poor'),
        ('Millwall', 2, 1630, 12000000, 'very_poor'),
        ('Blackburn Rovers', 2, 1620, 11000000, 'very_poor'),
        ('Stoke City', 2, 1610, 10000000, 'very_poor'),
        ('Sheffield Wednesday', 2, 1600, 9000000, 'very_poor'),
        ('Queens Park Rangers', 2, 1590, 8000000, 'very_poor'),
        ('Plymouth Argyle', 2, 1580, 7000000, 'very_poor'),
        ('Watford', 2, 1570, 6000000, 'very_poor'),
        ('Rotherham United', 2, 1560, 5000000, 'very_poor'),
        
        -- Tier 3 (League One equivalent) - 20 teams
        ('Birmingham City', 3, 1550, 4000000, 'limited'),
        ('Wrexham', 3, 1540, 3500000, 'limited'),
        ('Bolton Wanderers', 3, 1530, 3000000, 'poor'),
        ('Barnsley', 3, 1520, 2800000, 'poor'),
        ('Stockport County', 3, 1510, 2500000, 'poor'),
        ('Wycombe Wanderers', 3, 1500, 2200000, 'poor'),
        ('Lincoln City', 3, 1490, 2000000, 'very_poor'),
        ('Mansfield Town', 3, 1480, 1800000, 'very_poor'),
        ('Exeter City', 3, 1470, 1600000, 'very_poor'),
        ('Peterborough United', 3, 1460, 1500000, 'very_poor'),
        ('Charlton Athletic', 3, 1450, 1400000, 'very_poor'),
        ('Reading', 3, 1440, 1300000, 'very_poor'),
        ('Stevenage', 3, 1430, 1200000, 'very_poor'),
        ('Northampton Town', 3, 1420, 1100000, 'very_poor'),
        ('Leyton Orient', 3, 1410, 1000000, 'very_poor'),
        ('Crawley Town', 3, 1400, 900000, 'very_poor'),
        ('Bristol Rovers', 3, 1390, 800000, 'very_poor'),
        ('Shrewsbury Town', 3, 1380, 700000, 'very_poor'),
        ('Cambridge United', 3, 1370, 600000, 'very_poor'),
        ('Burton Albion', 3, 1360, 500000, 'very_poor'),
        
        -- Tier 4 (League Two equivalent) - 20 teams
        ('Notts County', 4, 1350, 400000, 'very_poor'),
        ('MK Dons', 4, 1340, 380000, 'very_poor'),
        ('Doncaster Rovers', 4, 1330, 360000, 'very_poor'),
        ('Crewe Alexandra', 4, 1320, 340000, 'very_poor'),
        ('AFC Wimbledon', 4, 1310, 320000, 'very_poor'),
        ('Grimsby Town', 4, 1300, 300000, 'very_poor'),
        ('Bradford City', 4, 1290, 280000, 'very_poor'),
        ('Salford City', 4, 1280, 260000, 'very_poor'),
        ('Tranmere Rovers', 4, 1270, 240000, 'very_poor'),
        ('Harrogate Town', 4, 1260, 220000, 'very_poor'),
        ('Colchester United', 4, 1250, 200000, 'very_poor'),
        ('Swindon Town', 4, 1240, 180000, 'very_poor'),
        ('Walsall', 4, 1230, 160000, 'very_poor'),
        ('Newport County', 4, 1220, 140000, 'very_poor'),
        ('Gillingham', 4, 1210, 120000, 'very_poor'),
        ('Accrington Stanley', 4, 1200, 100000, 'very_poor'),
        ('Morecambe', 4, 1190, 90000, 'very_poor'),
        ('Barrow', 4, 1180, 80000, 'very_poor'),
        ('Fleetwood Town', 4, 1170, 70000, 'very_poor'),
        ('Carlisle United', 4, 1160, 60000, 'very_poor'),
        
        -- Tier 5 (National League equivalent) - 20 teams
        ('Chesterfield', 5, 1150, 50000, 'very_poor'),
        ('York City', 5, 1140, 45000, 'very_poor'),
        ('Oldham Athletic', 5, 1130, 40000, 'very_poor'),
        ('Solihull Moors', 5, 1120, 35000, 'very_poor'),
        ('Gateshead', 5, 1110, 30000, 'very_poor'),
        ('Barnet', 5, 1100, 28000, 'very_poor'),
        ('Altrincham', 5, 1090, 26000, 'very_poor'),
        ('Eastleigh', 5, 1080, 24000, 'very_poor'),
        ('Dagenham & Redbridge', 5, 1070, 22000, 'very_poor'),
        ('Southend United', 5, 1060, 20000, 'very_poor'),
        ('Woking', 5, 1050, 18000, 'very_poor'),
        ('Halifax Town', 5, 1040, 16000, 'very_poor'),
        ('Dorking Wanderers', 5, 1030, 14000, 'very_poor'),
        ('Ebbsfleet United', 5, 1020, 12000, 'very_poor'),
        ('Aldershot Town', 5, 1010, 10000, 'very_poor'),
        ('Maidenhead United', 5, 1000, 9000, 'very_poor'),
        ('Wealdstone', 5, 990, 8000, 'very_poor'),
        ('Boreham Wood', 5, 980, 7000, 'very_poor'),
        ('Bromley', 5, 970, 6000, 'very_poor'),
        ('Fylde', 5, 960, 5000, 'very_poor');
    END IF;
END $$;

-- Create some sample players for each team
DO $$
DECLARE
    team_record RECORD;
    player_count INTEGER := 0;
BEGIN
    -- Check if we have players
    SELECT COUNT(*) INTO player_count FROM players;
    
    IF player_count < 100 THEN
        -- Create players for each team
        FOR team_record IN SELECT id, name, tier FROM teams LOOP
            -- Create 23 players per team (realistic squad size)
            INSERT INTO players (name, position, age, overall_rating, market_value, team_id, wage, contract_end, nationality, injury_status, form_rating)
            SELECT 
                CASE 
                    WHEN i <= 2 THEN team_record.name || ' GK' || i
                    WHEN i <= 8 THEN team_record.name || ' DEF' || (i-2)
                    WHEN i <= 14 THEN team_record.name || ' MID' || (i-8)
                    ELSE team_record.name || ' FWD' || (i-14)
                END as name,
                CASE 
                    WHEN i <= 2 THEN 'GK'
                    WHEN i <= 8 THEN 'DEF'
                    WHEN i <= 14 THEN 'MID'
                    ELSE 'FWD'
                END as position,
                18 + (random() * 17)::integer as age,
                CASE 
                    WHEN team_record.tier = 1 THEN 70 + (random() * 25)::integer
                    WHEN team_record.tier = 2 THEN 60 + (random() * 25)::integer
                    WHEN team_record.tier = 3 THEN 50 + (random() * 25)::integer
                    WHEN team_record.tier = 4 THEN 40 + (random() * 25)::integer
                    ELSE 30 + (random() * 25)::integer
                END as overall_rating,
                CASE 
                    WHEN team_record.tier = 1 THEN 1000000 + (random() * 49000000)::integer
                    WHEN team_record.tier = 2 THEN 100000 + (random() * 4900000)::integer
                    WHEN team_record.tier = 3 THEN 10000 + (random() * 490000)::integer
                    WHEN team_record.tier = 4 THEN 1000 + (random() * 49000)::integer
                    ELSE 100 + (random() * 4900)::integer
                END as market_value,
                team_record.id as team_id,
                CASE 
                    WHEN team_record.tier = 1 THEN 10000 + (random() * 190000)::integer
                    WHEN team_record.tier = 2 THEN 5000 + (random() * 45000)::integer
                    WHEN team_record.tier = 3 THEN 1000 + (random() * 9000)::integer
                    WHEN team_record.tier = 4 THEN 500 + (random() * 2500)::integer
                    ELSE 200 + (random() * 800)::integer
                END as wage,
                (CURRENT_DATE + INTERVAL '1 year' + (random() * INTERVAL '3 years'))::date as contract_end,
                CASE (random() * 10)::integer
                    WHEN 0 THEN 'England'
                    WHEN 1 THEN 'Spain'
                    WHEN 2 THEN 'France'
                    WHEN 3 THEN 'Germany'
                    WHEN 4 THEN 'Italy'
                    WHEN 5 THEN 'Brazil'
                    WHEN 6 THEN 'Argentina'
                    WHEN 7 THEN 'Portugal'
                    WHEN 8 THEN 'Netherlands'
                    ELSE 'Belgium'
                END as nationality,
                CASE 
                    WHEN random() < 0.1 THEN 'injured'
                    ELSE 'fit'
                END as injury_status,
                5 + (random() * 5)::integer as form_rating
            FROM generate_series(1, 23) as i;
        END LOOP;
    END IF;
END $$;

-- Create some initial fixtures
DO $$
DECLARE
    fixture_count INTEGER := 0;
    team_ids INTEGER[];
    i INTEGER;
    j INTEGER;
    match_date TIMESTAMP;
BEGIN
    SELECT COUNT(*) INTO fixture_count FROM matches;
    
    IF fixture_count < 10 THEN
        -- Get team IDs for tier 1
        SELECT ARRAY(SELECT id FROM teams WHERE tier = 1 ORDER BY id LIMIT 10) INTO team_ids;
        
        -- Create some matches for immediate play
        FOR i IN 1..5 LOOP
            INSERT INTO matches (
                home_team_id, 
                away_team_id, 
                home_team_name, 
                away_team_name, 
                match_date, 
                status, 
                minute, 
                home_score, 
                away_score, 
                competition_type,
                tier
            ) VALUES (
                team_ids[i], 
                team_ids[i+5], 
                (SELECT name FROM teams WHERE id = team_ids[i]),
                (SELECT name FROM teams WHERE id = team_ids[i+5]),
                NOW() - INTERVAL '5 minutes',
                'live',
                (random() * 90)::integer,
                (random() * 3)::integer,
                (random() * 3)::integer,
                'league',
                1
            );
        END LOOP;
        
        -- Create some scheduled matches
        FOR i IN 1..10 LOOP
            INSERT INTO matches (
                home_team_id, 
                away_team_id, 
                home_team_name, 
                away_team_name, 
                match_date, 
                status, 
                minute, 
                home_score, 
                away_score, 
                competition_type,
                tier
            ) VALUES (
                team_ids[(i % 10) + 1], 
                team_ids[((i + 3) % 10) + 1], 
                (SELECT name FROM teams WHERE id = team_ids[(i % 10) + 1]),
                (SELECT name FROM teams WHERE id = team_ids[((i + 3) % 10) + 1]),
                NOW() + INTERVAL '1 hour' * i,
                'scheduled',
                0,
                0,
                0,
                'league',
                1
            );
        END LOOP;
    END IF;
END $$;

-- Open a transfer window
INSERT INTO transfer_windows (window_type, is_active, start_date, end_date)
VALUES ('summer', true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- Force orchestration to run immediately
UPDATE orchestration_status 
SET last_run = NOW() - INTERVAL '5 minutes',
    is_running = FALSE
WHERE id = 1;
-- Completely regenerate fixtures with proper team rotation
-- This will create a truly balanced schedule where no team plays consecutively

-- First, clear all existing fixtures
DELETE FROM fixtures WHERE status IN ('scheduled', 'live');

-- Create a function to generate properly rotated fixtures
CREATE OR REPLACE FUNCTION generate_balanced_fixtures()
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    round_num INTEGER;
    team_ids UUID[];
    team_count INTEGER;
    i INTEGER;
    j INTEGER;
    home_team UUID;
    away_team UUID;
    fixture_date TIMESTAMP;
    sequence_counter INTEGER := 1;
BEGIN
    RAISE NOTICE 'Generating balanced fixtures with proper team rotation...';
    
    -- Process each tier
    FOR tier_num IN 1..5 LOOP
        -- Get all teams in this tier
        SELECT array_agg(id ORDER BY name) INTO team_ids
        FROM teams 
        WHERE tier = tier_num;
        
        team_count := array_length(team_ids, 1);
        RAISE NOTICE 'Processing Tier % with % teams', tier_num, team_count;
        
        -- Generate round-robin fixtures for this tier
        FOR round_num IN 1..38 LOOP
            -- Calculate which teams play in this round using round-robin algorithm
            FOR i IN 1..team_count/2 LOOP
                -- Calculate home and away team indices for this round
                IF round_num <= team_count - 1 THEN
                    -- First half of season
                    IF i = 1 THEN
                        home_team := team_ids[1]; -- Team 1 always at position 1
                        away_team := team_ids[((team_count - round_num - 1) % (team_count - 1)) + 2];
                    ELSE
                        j := ((round_num + i - 2) % (team_count - 1)) + 2;
                        home_team := team_ids[j];
                        j := ((round_num - i) % (team_count - 1)) + 2;
                        away_team := team_ids[j];
                    END IF;
                ELSE
                    -- Second half of season (reverse fixtures)
                    IF i = 1 THEN
                        away_team := team_ids[1]; -- Team 1 always at position 1
                        home_team := team_ids[((team_count - (round_num - (team_count - 1)) - 1) % (team_count - 1)) + 2];
                    ELSE
                        j := (((round_num - (team_count - 1)) + i - 2) % (team_count - 1)) + 2;
                        away_team := team_ids[j];
                        j := (((round_num - (team_count - 1)) - i) % (team_count - 1)) + 2;
                        home_team := team_ids[j];
                    END IF;
                END IF;
                
                -- Calculate fixture date (spread over time)
                fixture_date := now() + (round_num * interval '1 week') + (i * interval '2 hours');
                
                -- Insert the fixture
                INSERT INTO fixtures (
                    id,
                    home_team_id,
                    away_team_id,
                    round,
                    scheduled_at,
                    status,
                    sequence_order
                ) VALUES (
                    gen_random_uuid(),
                    home_team,
                    away_team,
                    round_num,
                    fixture_date,
                    'scheduled',
                    NULL -- Will be set by sequencing function
                );
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Fixtures generated successfully';
END;
$$ LANGUAGE plpgsql;

-- Generate the fixtures
SELECT generate_balanced_fixtures();

-- Now apply proper cross-tier sequencing
CREATE OR REPLACE FUNCTION sequence_cross_tier_rotation()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    round_num INTEGER;
    tier_num INTEGER;
    fixture_id UUID;
    total_fixtures INTEGER;
    fixture_rec RECORD;
BEGIN
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing % fixtures with cross-tier rotation', total_fixtures;
    
    -- Sequence fixtures: Round 1 (T1,T2,T3,T4,T5), Round 2 (T1,T2,T3,T4,T5), etc.
    FOR round_num IN 1..38 LOOP
        FOR tier_num IN 1..5 LOOP
            -- Get one fixture from this tier and round
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_num
            AND f.round = round_num
            AND f.status = 'scheduled'
            AND f.sequence_order IS NULL
            ORDER BY f.scheduled_at
            LIMIT 1;
            
            -- Assign sequence if found
            IF fixture_id IS NOT NULL THEN
                UPDATE fixtures 
                SET sequence_order = sequence_num,
                    scheduled_at = now() + (sequence_num * interval '2 hours')
                WHERE id = fixture_id;
                
                sequence_num := sequence_num + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    RAISE NOTICE 'Cross-tier sequencing completed. Fixtures sequenced: %', sequence_num - 1;
    
    -- Show first 15 fixtures to verify
    FOR fixture_rec IN 
        SELECT 
            f.sequence_order,
            ht.tier,
            ht.name as home_team,
            at.name as away_team,
            f.round
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.sequence_order IS NOT NULL
        ORDER BY f.sequence_order
        LIMIT 15
    LOOP
        RAISE NOTICE 'Seq %, Tier %, Round %: % vs %', 
            fixture_rec.sequence_order, 
            fixture_rec.tier, 
            fixture_rec.round,
            fixture_rec.home_team, 
            fixture_rec.away_team;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply the cross-tier sequencing
SELECT sequence_cross_tier_rotation();
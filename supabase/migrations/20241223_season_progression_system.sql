-- Fix fixture sequencing to ensure proper team rotation within tiers
-- Each team should play once before any team plays again within their tier

-- Create improved function to sequence fixtures with proper team rotation
CREATE OR REPLACE FUNCTION sequence_new_fixtures()
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    round_num INTEGER;
    sequence_num INTEGER := 1;
    tier_order INTEGER[] := ARRAY[1, 2, 3, 4, 5];
    current_tier_index INTEGER := 1;
    max_rounds INTEGER;
    fixture_rec RECORD;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status = 'scheduled';
    
    -- Get maximum number of rounds across all tiers
    SELECT MAX(round) INTO max_rounds FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing fixtures across % rounds with proper team rotation', max_rounds;
    
    -- Process each round to ensure team rotation within tiers
    FOR round_num IN 1..max_rounds LOOP
        -- Reset tier index for each round
        current_tier_index := 1;
        
        -- For each tier in this round
        FOR tier_index IN 1..5 LOOP
            DECLARE
                current_tier INTEGER := tier_order[current_tier_index];
                fixture_id UUID;
            BEGIN
                -- Find next fixture for this tier and round that hasn't been sequenced
                -- and ensure we don't have the same team playing twice in a row
                SELECT f.id INTO fixture_id
                FROM fixtures f
                JOIN teams ht ON f.home_team_id = ht.id
                WHERE ht.tier = current_tier 
                AND f.status = 'scheduled' 
                AND f.sequence_order IS NULL
                AND f.round = round_num
                AND NOT EXISTS (
                    -- Check if this home team played in the last fixture of this tier
                    SELECT 1 FROM fixtures prev_f
                    JOIN teams prev_ht ON prev_f.home_team_id = prev_ht.id
                    WHERE prev_ht.tier = current_tier
                    AND prev_f.sequence_order = sequence_num - 5  -- 5 fixtures ago (one full tier cycle)
                    AND (prev_f.home_team_id = f.home_team_id OR prev_f.away_team_id = f.home_team_id)
                )
                AND NOT EXISTS (
                    -- Check if this away team played in the last fixture of this tier
                    SELECT 1 FROM fixtures prev_f
                    JOIN teams prev_ht ON prev_f.home_team_id = prev_ht.id
                    WHERE prev_ht.tier = current_tier
                    AND prev_f.sequence_order = sequence_num - 5  -- 5 fixtures ago (one full tier cycle)
                    AND (prev_f.home_team_id = f.away_team_id OR prev_f.away_team_id = f.away_team_id)
                )
                ORDER BY f.scheduled_at
                LIMIT 1;
                
                -- If no fixture found with team rotation constraint, just get any fixture for this tier/round
                IF fixture_id IS NULL THEN
                    SELECT f.id INTO fixture_id
                    FROM fixtures f
                    JOIN teams ht ON f.home_team_id = ht.id
                    WHERE ht.tier = current_tier 
                    AND f.status = 'scheduled' 
                    AND f.sequence_order IS NULL
                    AND f.round = round_num
                    ORDER BY f.scheduled_at
                    LIMIT 1;
                END IF;
                
                -- If we found a fixture, assign sequence number
                IF fixture_id IS NOT NULL THEN
                    UPDATE fixtures 
                    SET sequence_order = sequence_num 
                    WHERE id = fixture_id;
                    
                    sequence_num := sequence_num + 1;
                END IF;
                
                -- Move to next tier
                current_tier_index := current_tier_index + 1;
                IF current_tier_index > 5 THEN
                    current_tier_index := 1;
                END IF;
            END;
        END LOOP;
    END LOOP;
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    -- Update scheduled times to reflect proper sequence (2 hours apart)
    UPDATE fixtures 
    SET scheduled_at = now() + (sequence_order * interval '2 hours')
    WHERE sequence_order IS NOT NULL;
    
    RAISE NOTICE 'Fixtures sequenced with proper team rotation. First match set to live.';
    
    -- Show first 15 fixtures to verify rotation
    RAISE NOTICE 'First 15 fixtures in sequence:';
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

-- Apply the new sequencing to current fixtures
SELECT sequence_new_fixtures();
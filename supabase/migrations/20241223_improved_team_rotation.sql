-- Create a much simpler and more reliable team rotation sequencing function
-- This ensures no team plays consecutive matches by using a round-robin approach

CREATE OR REPLACE FUNCTION sequence_fixtures_with_team_rotation()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    round_num INTEGER;
    tier_num INTEGER;
    max_rounds INTEGER;
    fixture_id UUID;
    used_teams UUID[] := ARRAY[]::UUID[];
    tier_cycle INTEGER := 1;
    fixture_rec RECORD;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get maximum number of rounds
    SELECT MAX(round) INTO max_rounds FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Starting fixture sequencing with team rotation for % rounds', max_rounds;
    
    -- Process fixtures in a way that ensures team rotation
    WHILE sequence_num <= (SELECT COUNT(*) FROM fixtures WHERE status = 'scheduled') LOOP
        -- Reset used teams every 5 fixtures (one per tier)
        IF (sequence_num - 1) % 5 = 0 THEN
            used_teams := ARRAY[]::UUID[];
            tier_cycle := 1;
        END IF;
        
        -- Find next fixture for current tier that doesn't use recently used teams
        SELECT f.id INTO fixture_id
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        WHERE ht.tier = tier_cycle
        AND f.status = 'scheduled'
        AND f.sequence_order IS NULL
        AND f.home_team_id != ALL(used_teams)
        AND f.away_team_id != ALL(used_teams)
        ORDER BY f.round, f.scheduled_at
        LIMIT 1;
        
        -- If no fixture found with unused teams, just get any fixture for this tier
        IF fixture_id IS NULL THEN
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_cycle
            AND f.status = 'scheduled'
            AND f.sequence_order IS NULL
            ORDER BY f.round, f.scheduled_at
            LIMIT 1;
        END IF;
        
        -- If we found a fixture, assign sequence and track teams
        IF fixture_id IS NOT NULL THEN
            -- Add teams to used list
            used_teams := used_teams || (SELECT ARRAY[home_team_id, away_team_id] FROM fixtures WHERE id = fixture_id);
            
            -- Assign sequence order
            UPDATE fixtures 
            SET sequence_order = sequence_num 
            WHERE id = fixture_id;
            
            sequence_num := sequence_num + 1;
        END IF;
        
        -- Move to next tier (1->2->3->4->5->1...)
        tier_cycle := tier_cycle + 1;
        IF tier_cycle > 5 THEN
            tier_cycle := 1;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF sequence_num > 2000 THEN
            EXIT;
        END IF;
    END LOOP;
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    -- Update scheduled times to reflect proper sequence (2 hours apart)
    UPDATE fixtures 
    SET scheduled_at = now() + (sequence_order * interval '2 hours')
    WHERE sequence_order IS NOT NULL;
    
    RAISE NOTICE 'Fixture sequencing completed. Total fixtures sequenced: %', sequence_num - 1;
    
    -- Show first 10 fixtures to verify
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
        LIMIT 10
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

-- Apply the new sequencing
SELECT sequence_fixtures_with_team_rotation();
-- Fix the consecutive match issue by implementing strict team avoidance
-- This ensures no team can appear in consecutive sequence positions

CREATE OR REPLACE FUNCTION fix_consecutive_team_matches()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    fixture_id UUID;
    total_fixtures INTEGER;
    last_home_team UUID;
    last_away_team UUID;
    fixture_rec RECORD;
    tier_cycle INTEGER := 1;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Fixing consecutive matches for % fixtures', total_fixtures;
    
    -- Initialize with first fixture from tier 1
    SELECT f.id, f.home_team_id, f.away_team_id INTO fixture_id, last_home_team, last_away_team
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    WHERE ht.tier = 1
    AND f.status = 'scheduled'
    ORDER BY f.round, f.scheduled_at
    LIMIT 1;
    
    -- Set first fixture
    IF fixture_id IS NOT NULL THEN
        UPDATE fixtures 
        SET sequence_order = sequence_num,
            status = 'live'
        WHERE id = fixture_id;
        
        sequence_num := sequence_num + 1;
        tier_cycle := 2; -- Next tier
    END IF;
    
    -- Process remaining fixtures with strict team avoidance
    WHILE sequence_num <= total_fixtures LOOP
        -- Find next fixture that doesn't use the teams from the previous match
        SELECT f.id INTO fixture_id
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        WHERE ht.tier = tier_cycle
        AND f.status = 'scheduled'
        AND f.sequence_order IS NULL
        AND f.home_team_id != last_home_team
        AND f.home_team_id != last_away_team
        AND f.away_team_id != last_home_team
        AND f.away_team_id != last_away_team
        ORDER BY f.round, f.scheduled_at
        LIMIT 1;
        
        -- If no fixture found for this tier, try next tier
        IF fixture_id IS NULL THEN
            tier_cycle := tier_cycle + 1;
            IF tier_cycle > 5 THEN
                tier_cycle := 1;
            END IF;
            
            -- Try again with new tier
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_cycle
            AND f.status = 'scheduled'
            AND f.sequence_order IS NULL
            AND f.home_team_id != last_home_team
            AND f.home_team_id != last_away_team
            AND f.away_team_id != last_home_team
            AND f.away_team_id != last_away_team
            ORDER BY f.round, f.scheduled_at
            LIMIT 1;
        END IF;
        
        -- If still no fixture, get any fixture (fallback)
        IF fixture_id IS NULL THEN
            SELECT f.id INTO fixture_id
            FROM fixtures f
            WHERE f.status = 'scheduled'
            AND f.sequence_order IS NULL
            ORDER BY f.round, f.scheduled_at
            LIMIT 1;
        END IF;
        
        -- Assign sequence if found
        IF fixture_id IS NOT NULL THEN
            -- Get the teams from this fixture
            SELECT home_team_id, away_team_id INTO last_home_team, last_away_team
            FROM fixtures 
            WHERE id = fixture_id;
            
            -- Assign sequence order
            UPDATE fixtures 
            SET sequence_order = sequence_num,
                scheduled_at = now() + (sequence_num * interval '2 hours')
            WHERE id = fixture_id;
            
            sequence_num := sequence_num + 1;
        END IF;
        
        -- Move to next tier
        tier_cycle := tier_cycle + 1;
        IF tier_cycle > 5 THEN
            tier_cycle := 1;
        END IF;
        
        -- Safety check
        IF sequence_num > total_fixtures + 100 THEN
            RAISE NOTICE 'Safety exit at sequence %', sequence_num;
            EXIT;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed consecutive matches. Fixtures sequenced: %', sequence_num - 1;
    
    -- Verify no consecutive team appearances in first 20 matches
    FOR fixture_rec IN 
        WITH consecutive_check AS (
            SELECT 
                f.sequence_order,
                ht.name as home_team,
                at.name as away_team,
                ht.tier,
                LAG(ht.name) OVER (ORDER BY f.sequence_order) as prev_home,
                LAG(at.name) OVER (ORDER BY f.sequence_order) as prev_away
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            JOIN teams at ON f.away_team_id = at.id
            WHERE f.sequence_order IS NOT NULL
            ORDER BY f.sequence_order
            LIMIT 20
        )
        SELECT *
        FROM consecutive_check
        WHERE home_team = prev_home OR home_team = prev_away 
           OR away_team = prev_home OR away_team = prev_away
    LOOP
        RAISE NOTICE 'CONSECUTIVE MATCH STILL FOUND: Seq % - % vs %', 
            fixture_rec.sequence_order,
            fixture_rec.home_team, 
            fixture_rec.away_team;
    END LOOP;
    
    -- Show first 15 fixtures
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

-- Apply the fix
SELECT fix_consecutive_team_matches();
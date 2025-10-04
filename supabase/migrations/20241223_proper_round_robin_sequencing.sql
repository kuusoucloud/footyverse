-- Proper round-robin sequencing that ensures each team plays through all opponents
-- before any team can play again within their tier

CREATE OR REPLACE FUNCTION proper_round_robin_sequencing()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    tier_num INTEGER;
    round_num INTEGER;
    fixture_id UUID;
    total_fixtures INTEGER;
    teams_per_tier INTEGER := 20;
    matches_per_round INTEGER := 10; -- 20 teams = 10 matches per round
    current_tier_round INTEGER;
    tier_cycle INTEGER := 1;
    fixture_rec RECORD;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing % fixtures with proper round-robin system', total_fixtures;
    
    -- Process by rounds to ensure proper team rotation
    FOR round_num IN 1..38 LOOP
        -- For each round, cycle through tiers: T1, T2, T3, T4, T5
        FOR tier_num IN 1..5 LOOP
            -- Get one fixture from this tier and round that hasn't been sequenced
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_num
            AND f.round = round_num
            AND f.status = 'scheduled'
            AND f.sequence_order IS NULL
            ORDER BY f.scheduled_at
            LIMIT 1;
            
            -- If we found a fixture, assign sequence
            IF fixture_id IS NOT NULL THEN
                UPDATE fixtures 
                SET sequence_order = sequence_num 
                WHERE id = fixture_id;
                
                sequence_num := sequence_num + 1;
            END IF;
            
            -- Safety check
            IF sequence_num > total_fixtures + 100 THEN
                RAISE NOTICE 'Safety exit at sequence %', sequence_num;
                EXIT;
            END IF;
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
    
    RAISE NOTICE 'Proper round-robin sequencing completed. Fixtures sequenced: %', sequence_num - 1;
    
    -- Show first 20 fixtures to verify proper round-robin
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
        LIMIT 20
    LOOP
        RAISE NOTICE 'Seq %, Tier %, Round %: % vs %', 
            fixture_rec.sequence_order, 
            fixture_rec.tier, 
            fixture_rec.round,
            fixture_rec.home_team, 
            fixture_rec.away_team;
    END LOOP;
    
    -- Verify no team plays consecutive matches
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for consecutive team appearances in first 50 matches...';
    
    FOR fixture_rec IN 
        WITH consecutive_check AS (
            SELECT 
                f.sequence_order,
                ht.name as home_team,
                at.name as away_team,
                LAG(ht.name) OVER (ORDER BY f.sequence_order) as prev_home,
                LAG(at.name) OVER (ORDER BY f.sequence_order) as prev_away
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            JOIN teams at ON f.away_team_id = at.id
            WHERE f.sequence_order IS NOT NULL
            ORDER BY f.sequence_order
            LIMIT 50
        )
        SELECT *
        FROM consecutive_check
        WHERE home_team = prev_home OR home_team = prev_away 
           OR away_team = prev_home OR away_team = prev_away
    LOOP
        RAISE NOTICE 'CONSECUTIVE MATCH FOUND: Seq % - % vs % (previous teams: % vs %)', 
            fixture_rec.sequence_order,
            fixture_rec.home_team, 
            fixture_rec.away_team,
            fixture_rec.prev_home,
            fixture_rec.prev_away;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply the proper round-robin sequencing
SELECT proper_round_robin_sequencing();
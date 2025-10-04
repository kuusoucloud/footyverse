-- Advanced team rotation algorithm that ensures no team plays too frequently
-- This tracks which teams have played recently and avoids them

CREATE OR REPLACE FUNCTION advanced_team_rotation_sequencing()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    tier_cycle INTEGER := 1;
    fixture_id UUID;
    total_fixtures INTEGER;
    recent_teams UUID[] := ARRAY[]::UUID[];
    max_recent_teams INTEGER := 10; -- Track last 10 teams that played
    fixture_rec RECORD;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing % fixtures with advanced team rotation', total_fixtures;
    
    -- Advanced tier and team rotation
    WHILE sequence_num <= total_fixtures LOOP
        -- Find next fixture for current tier that avoids recently used teams
        SELECT f.id INTO fixture_id
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE ht.tier = tier_cycle
        AND f.status = 'scheduled'
        AND f.sequence_order IS NULL
        AND f.home_team_id != ALL(recent_teams)
        AND f.away_team_id != ALL(recent_teams)
        ORDER BY f.round, f.scheduled_at
        LIMIT 1;
        
        -- If no fixture found avoiding recent teams, just get any fixture for this tier
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
            -- Get the teams from this fixture
            SELECT home_team_id, away_team_id INTO fixture_rec
            FROM fixtures 
            WHERE id = fixture_id;
            
            -- Add teams to recent list
            recent_teams := recent_teams || ARRAY[fixture_rec.home_team_id, fixture_rec.away_team_id];
            
            -- Keep only the most recent teams (limit array size)
            IF array_length(recent_teams, 1) > max_recent_teams THEN
                recent_teams := recent_teams[array_length(recent_teams, 1) - max_recent_teams + 1:array_length(recent_teams, 1)];
            END IF;
            
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
        IF sequence_num > total_fixtures + 100 THEN
            RAISE NOTICE 'Safety exit at sequence %', sequence_num;
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
    
    RAISE NOTICE 'Advanced team rotation sequencing completed. Fixtures sequenced: %', sequence_num - 1;
    
    -- Show first 15 fixtures to verify no team repetition
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

-- Apply the advanced sequencing
SELECT advanced_team_rotation_sequencing();
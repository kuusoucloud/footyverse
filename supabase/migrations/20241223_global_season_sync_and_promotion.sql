-- Implement proper team spacing - no team plays for 9 matches after their last appearance
-- This ensures fair distribution across all teams in each tier

CREATE OR REPLACE FUNCTION proper_team_spacing_sequencing()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    fixture_id UUID;
    total_fixtures INTEGER;
    recent_teams UUID[] := ARRAY[]::UUID[];
    buffer_size INTEGER := 18; -- Track last 18 teams (9 matches = 18 teams)
    tier_cycle INTEGER := 1;
    fixture_rec RECORD;
    attempts INTEGER;
    max_attempts INTEGER := 50;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing % fixtures with proper team spacing (9 match buffer)', total_fixtures;
    
    -- Process fixtures with proper team spacing
    WHILE sequence_num <= total_fixtures LOOP
        attempts := 0;
        fixture_id := NULL;
        
        -- Try to find a fixture that doesn't use recently played teams
        WHILE fixture_id IS NULL AND attempts < max_attempts LOOP
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_cycle
            AND f.status = 'scheduled'
            AND f.sequence_order IS NULL
            AND (array_length(recent_teams, 1) IS NULL OR 
                 (f.home_team_id != ALL(recent_teams) AND f.away_team_id != ALL(recent_teams)))
            ORDER BY f.round, f.scheduled_at
            LIMIT 1;
            
            -- If no fixture found for this tier, try next tier
            IF fixture_id IS NULL THEN
                tier_cycle := tier_cycle + 1;
                IF tier_cycle > 5 THEN
                    tier_cycle := 1;
                END IF;
                attempts := attempts + 1;
            END IF;
        END LOOP;
        
        -- If still no fixture after trying all tiers, get any available fixture (emergency fallback)
        IF fixture_id IS NULL THEN
            SELECT f.id INTO fixture_id
            FROM fixtures f
            WHERE f.status = 'scheduled'
            AND f.sequence_order IS NULL
            ORDER BY f.round, f.scheduled_at
            LIMIT 1;
            
            RAISE NOTICE 'Emergency fallback used at sequence %', sequence_num;
        END IF;
        
        -- Assign sequence if found
        IF fixture_id IS NOT NULL THEN
            -- Get the teams from this fixture and add to recent list
            SELECT home_team_id, away_team_id INTO fixture_rec
            FROM fixtures 
            WHERE id = fixture_id;
            
            -- Add both teams to recent teams list
            recent_teams := recent_teams || ARRAY[fixture_rec.home_team_id, fixture_rec.away_team_id];
            
            -- Keep only the most recent teams (buffer_size limit)
            IF array_length(recent_teams, 1) > buffer_size THEN
                recent_teams := recent_teams[array_length(recent_teams, 1) - buffer_size + 1:array_length(recent_teams, 1)];
            END IF;
            
            -- Assign sequence order
            UPDATE fixtures 
            SET sequence_order = sequence_num,
                scheduled_at = now() + (sequence_num * interval '2 hours')
            WHERE id = fixture_id;
            
            sequence_num := sequence_num + 1;
        END IF;
        
        -- Move to next tier for variety
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
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    RAISE NOTICE 'Proper team spacing completed. Fixtures sequenced: %', sequence_num - 1;
    
    -- Show first 20 fixtures to verify spacing
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
    
    -- Check for any team appearing too frequently in first 30 matches
    RAISE NOTICE '';
    RAISE NOTICE 'Checking team frequency in first 30 matches...';
    
    FOR fixture_rec IN 
        WITH team_frequency AS (
            SELECT 
                t.name as team_name,
                COUNT(*) as appearances
            FROM fixtures f
            JOIN teams t ON (f.home_team_id = t.id OR f.away_team_id = t.id)
            WHERE f.sequence_order IS NOT NULL AND f.sequence_order <= 30
            GROUP BY t.id, t.name
            HAVING COUNT(*) > 3
            ORDER BY COUNT(*) DESC
        )
        SELECT * FROM team_frequency
    LOOP
        RAISE NOTICE 'Team % appears % times in first 30 matches (should be max 3)', 
            fixture_rec.team_name, fixture_rec.appearances;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply the proper team spacing
SELECT proper_team_spacing_sequencing();
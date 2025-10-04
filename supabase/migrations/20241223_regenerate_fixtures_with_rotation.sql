-- Regenerate all fixtures with proper team rotation sequencing
-- Clear existing fixtures and generate new ones with improved algorithm

-- Clear all existing fixtures
DELETE FROM fixtures WHERE status IN ('scheduled', 'live');

-- Generate new fixtures with proper team rotation
DO $$
DECLARE
    tier_num INTEGER;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    fixture_count INTEGER := 0;
    current_season INTEGER;
    status_rec RECORD;
BEGIN
    -- Get current season
    SELECT season_number INTO current_season
    FROM global_season_status 
    WHERE season_status = 'active'
    ORDER BY season_number DESC 
    LIMIT 1;
    
    IF current_season IS NULL THEN
        current_season := 1;
    END IF;
    
    RAISE NOTICE 'Regenerating fixtures for season % with proper team rotation', current_season;
    
    -- Loop through each tier
    FOR tier_num IN 1..5 LOOP
        round_num := 1;
        
        RAISE NOTICE 'Processing Tier %', tier_num;
        
        -- Generate round-robin fixtures for this tier
        FOR home_team IN 
            SELECT id, name FROM teams WHERE tier = tier_num ORDER BY name
        LOOP
            FOR away_team IN 
                SELECT id, name FROM teams WHERE tier = tier_num AND id != home_team.id ORDER BY name
            LOOP
                -- Skip if we already have this matchup (avoid duplicates)
                IF home_team.id < away_team.id THEN
                    -- First leg (home vs away)
                    match_date := now() + (round_num * interval '2 days') + (tier_num * interval '4 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round
                    ) VALUES (
                        home_team.id,
                        away_team.id,
                        match_date,
                        'scheduled',
                        round_num
                    );
                    
                    fixture_count := fixture_count + 1;
                    
                    -- Second leg (away vs home) - later in the season
                    match_date := now() + ((round_num + 19) * interval '2 days') + (tier_num * interval '4 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round
                    ) VALUES (
                        away_team.id,
                        home_team.id,
                        match_date,
                        'scheduled',
                        round_num + 19
                    );
                    
                    fixture_count := fixture_count + 1;
                    round_num := round_num + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generated % fixtures total', fixture_count;
    
    -- Apply proper sequencing with team rotation
    PERFORM sequence_new_fixtures();
    
    RAISE NOTICE 'All fixtures regenerated with proper team rotation sequencing';
    
    -- Show fixture counts by tier
    FOR tier_num IN 1..5 LOOP
        RAISE NOTICE 'Tier % fixtures: %', tier_num, (
            SELECT COUNT(*) 
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_num AND f.status IN ('scheduled', 'live')
        );
    END LOOP;
    
    -- Show total fixture counts by status
    RAISE NOTICE 'Fixture status summary:';
    FOR status_rec IN 
        SELECT status, COUNT(*) as count
        FROM fixtures 
        GROUP BY status
        ORDER BY status
    LOOP
        RAISE NOTICE 'Status %: % fixtures', status_rec.status, status_rec.count;
    END LOOP;

END $$;
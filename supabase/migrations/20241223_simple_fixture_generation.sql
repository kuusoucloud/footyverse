-- Simple fixture generation without foreign key dependencies
-- This creates fixtures with NULL season_id and league_id to avoid FK constraints

-- First, clear existing scheduled fixtures
DELETE FROM fixtures WHERE status = 'scheduled';

-- Generate fixtures for each tier
DO $$
DECLARE
    tier_num INTEGER;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    fixture_count INTEGER := 0;
    current_season INTEGER;
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
    
    RAISE NOTICE 'Generating fixtures for season %', current_season;
    
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
        
        RAISE NOTICE 'Generated fixtures for Tier %', tier_num;
    END LOOP;
    
    RAISE NOTICE 'Total fixtures generated: %', fixture_count;
    
    -- Show fixture counts by tier
    FOR tier_num IN 1..5 LOOP
        RAISE NOTICE 'Tier % fixtures: %', tier_num, (
            SELECT COUNT(*) 
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = tier_num AND f.status = 'scheduled'
        );
    END LOOP;
    
END $$;
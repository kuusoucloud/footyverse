-- Generate fixtures for the current season with proper UUID handling
-- This creates a complete round-robin schedule for all teams

-- First, clear existing scheduled fixtures (keep completed ones)
DELETE FROM fixtures WHERE status = 'scheduled';

-- Generate fixtures for each tier
DO $$
DECLARE
    tier_num INTEGER;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    season_uuid UUID;
    league_uuid UUID;
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
    
    -- Create season UUID
    season_uuid := gen_random_uuid();
    
    RAISE NOTICE 'Generating fixtures for season %', current_season;
    
    -- Loop through each tier
    FOR tier_num IN 1..5 LOOP
        league_uuid := gen_random_uuid();
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
                    match_date := now() + (round_num * interval '3 days') + (tier_num * interval '6 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round, 
                        league_id, 
                        season_id
                    ) VALUES (
                        home_team.id,
                        away_team.id,
                        match_date,
                        'scheduled',
                        round_num,
                        league_uuid,
                        season_uuid
                    );
                    
                    fixture_count := fixture_count + 1;
                    
                    -- Second leg (away vs home) - later in the season
                    match_date := now() + ((round_num + 19) * interval '3 days') + (tier_num * interval '6 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round, 
                        league_id, 
                        season_id
                    ) VALUES (
                        away_team.id,
                        home_team.id,
                        match_date,
                        'scheduled',
                        round_num + 19,
                        league_uuid,
                        season_uuid
                    );
                    
                    fixture_count := fixture_count + 1;
                    round_num := round_num + 1;
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Generated fixtures for Tier %: % fixtures', tier_num, (SELECT COUNT(*) FROM fixtures WHERE league_id = league_uuid);
    END LOOP;
    
    RAISE NOTICE 'Total fixtures generated: %', fixture_count;
    RAISE NOTICE 'Season UUID: %', season_uuid;
    
    -- Update fixture generation log
    INSERT INTO fixture_generation_log (
        season_number, 
        generation_type, 
        total_fixtures, 
        status, 
        completed_at
    ) VALUES (
        current_season,
        'manual',
        fixture_count,
        'completed',
        NOW()
    );
    
END $$;
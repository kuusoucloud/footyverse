-- Update the fixture generation function to use improved team rotation sequencing

CREATE OR REPLACE FUNCTION generate_new_season_fixtures(new_season INTEGER)
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    season_uuid UUID;
    league_uuid UUID;
    fixture_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Generating fixtures for season %', new_season;
    
    -- Create season UUID
    season_uuid := gen_random_uuid();
    
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
    
    -- Apply proper sequencing to new fixtures with team rotation
    PERFORM sequence_new_fixtures();
    
    RAISE NOTICE 'Generated % fixtures for season % with proper team rotation', fixture_count, new_season;
END;
$$ LANGUAGE plpgsql;
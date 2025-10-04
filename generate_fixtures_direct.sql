-- Generate fixtures directly in the database
-- This creates a complete round-robin schedule for all teams

-- First, clear existing fixtures
DELETE FROM fixtures WHERE id != '00000000-0000-0000-0000-000000000000';

-- Generate fixtures for each tier
DO $$
DECLARE
    tier_num INTEGER;
    team_record RECORD;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    season_id TEXT;
    league_id TEXT;
    fixture_count INTEGER := 0;
BEGIN
    -- Create a season ID
    season_id := 'season-' || extract(epoch from now())::text;
    
    -- Loop through each tier
    FOR tier_num IN 1..5 LOOP
        league_id := 'tier-' || tier_num || '-league';
        
        -- Generate round-robin fixtures for this tier
        round_num := 1;
        
        -- Get all teams in this tier
        FOR home_team IN 
            SELECT id, name FROM teams WHERE tier = tier_num ORDER BY name
        LOOP
            FOR away_team IN 
                SELECT id, name FROM teams WHERE tier = tier_num AND id > home_team.id ORDER BY name
            LOOP
                -- First leg (home vs away)
                match_date := now() + (round_num * interval '7 days') + (tier_num * interval '2 days');
                
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
                    league_id,
                    season_id
                );
                
                fixture_count := fixture_count + 1;
                
                -- Second leg (away vs home) - later in the season
                match_date := now() + ((round_num + 19) * interval '7 days') + (tier_num * interval '2 days');
                
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
                    league_id,
                    season_id
                );
                
                fixture_count := fixture_count + 1;
                round_num := round_num + 1;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Generated fixtures for Tier %: % fixtures', tier_num, (SELECT COUNT(*) FROM fixtures WHERE league_id = 'tier-' || tier_num || '-league');
    END LOOP;
    
    RAISE NOTICE 'Total fixtures generated: %', fixture_count;
    RAISE NOTICE 'Season ID: %', season_id;
END $$;
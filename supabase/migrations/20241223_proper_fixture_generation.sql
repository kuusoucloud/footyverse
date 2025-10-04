-- Proper fixture generation with strict rules
-- Clear all existing fixtures
DELETE FROM fixtures;

-- Create function to generate fixtures with proper team rotation
CREATE OR REPLACE FUNCTION generate_proper_fixtures()
RETURNS void AS $$
DECLARE
    tier_num INTEGER;
    team_ids UUID[];
    team_count INTEGER;
    match_counter INTEGER := 0;
    current_season_id UUID;
    tier_league_id UUID;
    home_idx INTEGER;
    away_idx INTEGER;
    round_num INTEGER;
    fixture_date TIMESTAMP := NOW();
    team_last_match INTEGER[] := '{}';
    team_home_count INTEGER[] := '{}';
    team_away_count INTEGER[] := '{}';
    valid_match BOOLEAN;
    attempts INTEGER;
BEGIN
    -- Get current season
    SELECT id INTO current_season_id FROM seasons WHERE year = 2024 LIMIT 1;
    
    -- Process each tier
    FOR tier_num IN 1..5 LOOP
        RAISE NOTICE 'Processing Tier %', tier_num;
        
        -- Get league for this tier
        SELECT id INTO tier_league_id 
        FROM leagues 
        WHERE tier = tier_num AND season_id = current_season_id 
        LIMIT 1;
        
        -- Get all teams in this tier
        SELECT ARRAY_AGG(id ORDER BY name) INTO team_ids
        FROM teams 
        WHERE tier = tier_num;
        
        team_count := array_length(team_ids, 1);
        
        -- Initialize tracking arrays for this tier
        team_last_match := array_fill(-10, ARRAY[team_count]);
        team_home_count := array_fill(0, ARRAY[team_count]);
        team_away_count := array_fill(0, ARRAY[team_count]);
        
        -- Generate 38 matches for this tier
        FOR match_num IN 1..38 LOOP
            attempts := 0;
            valid_match := FALSE;
            
            -- Try to find a valid match pairing
            WHILE NOT valid_match AND attempts < 1000 LOOP
                attempts := attempts + 1;
                
                -- Pick random home and away teams
                home_idx := 1 + (random() * (team_count - 1))::INTEGER;
                away_idx := 1 + (random() * (team_count - 1))::INTEGER;
                
                -- Check if this is a valid pairing
                IF home_idx != away_idx AND
                   -- Neither team played in last 9 matches
                   (match_counter - team_last_match[home_idx]) >= 9 AND
                   (match_counter - team_last_match[away_idx]) >= 9 AND
                   -- Balance home/away games (no more than 3 consecutive)
                   (team_home_count[home_idx] - team_away_count[home_idx]) < 3 AND
                   (team_away_count[away_idx] - team_home_count[away_idx]) < 3
                THEN
                    valid_match := TRUE;
                END IF;
            END LOOP;
            
            -- If we couldn't find a valid match, use fallback
            IF NOT valid_match THEN
                home_idx := ((match_num - 1) % team_count) + 1;
                away_idx := (match_num % team_count) + 1;
                IF away_idx = home_idx THEN
                    away_idx := (away_idx % team_count) + 1;
                END IF;
            END IF;
            
            -- Calculate when this match should be played in the global rotation
            -- Each tier gets its turn: T1,T2,T3,T4,T5,T1,T2...
            fixture_date := NOW() + INTERVAL '2 hours' * ((match_num - 1) * 5 + (tier_num - 1));
            
            -- Insert the fixture
            INSERT INTO fixtures (
                id,
                home_team_id,
                away_team_id,
                league_id,
                season_id,
                scheduled_at,
                status,
                round
            ) VALUES (
                gen_random_uuid(),
                team_ids[home_idx],
                team_ids[away_idx],
                tier_league_id,
                current_season_id,
                fixture_date,
                CASE WHEN match_counter = 0 THEN 'live' ELSE 'scheduled' END,
                CEIL(match_num / 10.0)
            );
            
            -- Update tracking
            team_last_match[home_idx] := match_counter;
            team_last_match[away_idx] := match_counter;
            team_home_count[home_idx] := team_home_count[home_idx] + 1;
            team_away_count[away_idx] := team_away_count[away_idx] + 1;
            
            match_counter := match_counter + 1;
            
            RAISE NOTICE 'Tier % Match %: Team % vs Team % at %', 
                tier_num, match_num, home_idx, away_idx, fixture_date;
        END LOOP;
        
        RAISE NOTICE 'Tier % completed with 38 matches', tier_num;
    END LOOP;
    
    RAISE NOTICE 'Total fixtures generated: %', match_counter;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT generate_proper_fixtures();

-- Drop the function
DROP FUNCTION generate_proper_fixtures();

-- Verify results
SELECT 
    l.tier,
    l.name as league_name,
    COUNT(*) as fixture_count,
    MIN(f.scheduled_at) as first_match,
    MAX(f.scheduled_at) as last_match,
    COUNT(CASE WHEN f.status = 'live' THEN 1 END) as live_matches
FROM fixtures f
JOIN leagues l ON f.league_id = l.id
GROUP BY l.tier, l.name
ORDER BY l.tier;
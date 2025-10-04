-- Generate fixtures with proper round-robin rotation
-- Each team waits 9 matches before playing again (for 20-team tier)

DO $$
DECLARE
  tier_num integer;
  team_count integer;
  teams_array uuid[];
  team_names_array text[];
  current_round integer := 1;
  match_date timestamp;
  current_season_id uuid;
  current_league_id uuid;
  total_fixtures integer := 0;
  first_fixture_id uuid;
  
  -- Round robin variables
  round_matches integer;
  home_idx integer;
  away_idx integer;
  week_num integer;
  matches_per_round integer;
BEGIN
  -- Get current season
  SELECT id INTO current_season_id FROM seasons WHERE year = 2024 LIMIT 1;
  
  -- Clear existing fixtures
  DELETE FROM fixtures;
  
  -- Initialize match date
  match_date := NOW() + interval '2 hours';
  
  -- Generate fixtures for each tier with proper rotation
  FOR tier_num IN 1..5 LOOP
    RAISE NOTICE 'Generating fixtures for Tier % with round-robin rotation', tier_num;
    
    -- Get league for this tier
    SELECT id INTO current_league_id FROM leagues WHERE tier = tier_num AND season_id = current_season_id LIMIT 1;
    
    -- Get teams for this tier
    SELECT array_agg(id ORDER BY name), array_agg(name ORDER BY name), COUNT(*) 
    INTO teams_array, team_names_array, team_count 
    FROM teams WHERE tier = tier_num;
    
    IF team_count >= 2 THEN
      -- Calculate matches per round (half the teams play simultaneously)
      matches_per_round := team_count / 2;
      
      -- Reset round counter for this tier
      current_round := (tier_num - 1) * 1000 + 1;
      
      -- Round-robin algorithm: each team plays every other team twice
      -- First leg: each team plays every other team once
      FOR week_num IN 1..(team_count - 1) LOOP
        round_matches := 0;
        
        -- Generate matches for this week/round
        FOR home_idx IN 1..matches_per_round LOOP
          -- Calculate opponent using round-robin formula
          IF home_idx = 1 THEN
            away_idx := team_count; -- First team always plays last team
          ELSE
            away_idx := ((week_num - home_idx + team_count - 2) % (team_count - 1)) + 1;
            IF away_idx >= home_idx THEN
              away_idx := away_idx + 1;
            END IF;
          END IF;
          
          -- Ensure valid indices
          IF home_idx <= team_count AND away_idx <= team_count AND home_idx != away_idx THEN
            -- Insert fixture
            INSERT INTO fixtures (
              season_id,
              league_id,
              round,
              home_team_id,
              away_team_id,
              scheduled_at,
              status
            ) VALUES (
              current_season_id,
              current_league_id,
              current_round,
              teams_array[home_idx],
              teams_array[away_idx],
              match_date,
              'scheduled'
            );
            
            total_fixtures := total_fixtures + 1;
            round_matches := round_matches + 1;
            
            RAISE NOTICE 'Tier % Round %: % vs % (Match % of round)', 
              tier_num, current_round, team_names_array[home_idx], team_names_array[away_idx], round_matches;
          END IF;
        END LOOP;
        
        -- Move to next round
        current_round := current_round + 1;
        match_date := match_date + interval '3 days'; -- 3 days between rounds
      END LOOP;
      
      -- Second leg: reverse home/away for complete season
      FOR week_num IN 1..(team_count - 1) LOOP
        round_matches := 0;
        
        -- Generate return matches for this week/round
        FOR away_idx IN 1..matches_per_round LOOP
          -- Calculate opponent using round-robin formula (reversed)
          IF away_idx = 1 THEN
            home_idx := team_count; -- Last team now plays first team at home
          ELSE
            home_idx := ((week_num - away_idx + team_count - 2) % (team_count - 1)) + 1;
            IF home_idx >= away_idx THEN
              home_idx := home_idx + 1;
            END IF;
          END IF;
          
          -- Ensure valid indices
          IF home_idx <= team_count AND away_idx <= team_count AND home_idx != away_idx THEN
            -- Insert return fixture (home/away swapped)
            INSERT INTO fixtures (
              season_id,
              league_id,
              round,
              home_team_id,
              away_team_id,
              scheduled_at,
              status
            ) VALUES (
              current_season_id,
              current_league_id,
              current_round,
              teams_array[home_idx],
              teams_array[away_idx],
              match_date,
              'scheduled'
            );
            
            total_fixtures := total_fixtures + 1;
            round_matches := round_matches + 1;
          END IF;
        END LOOP;
        
        -- Move to next round
        current_round := current_round + 1;
        match_date := match_date + interval '3 days';
      END LOOP;
      
      RAISE NOTICE 'Generated % fixtures for Tier % using round-robin rotation', 
        (team_count - 1) * 2 * matches_per_round, tier_num;
    END IF;
    
    -- Stagger start times for different tiers by 1 week
    match_date := match_date + interval '7 days';
  END LOOP;
  
  -- Set the first fixture to live
  SELECT id INTO first_fixture_id 
  FROM fixtures 
  WHERE round = (SELECT MIN(round) FROM fixtures)
  ORDER BY scheduled_at ASC
  LIMIT 1;
  
  IF first_fixture_id IS NOT NULL THEN
    UPDATE fixtures 
    SET status = 'live' 
    WHERE id = first_fixture_id;
  END IF;
  
  RAISE NOTICE 'Generated % total fixtures with proper round-robin rotation across all tiers', total_fixtures;
  
  -- Log fixture distribution by tier
  FOR tier_num IN 1..5 LOOP
    SELECT COUNT(*) INTO team_count 
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    WHERE ht.tier = tier_num;
    
    RAISE NOTICE 'Tier %: % fixtures', tier_num, team_count;
  END LOOP;
  
END;
$$;
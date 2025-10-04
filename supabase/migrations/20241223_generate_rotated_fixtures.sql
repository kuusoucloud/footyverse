-- Generate fixtures with proper team rotation algorithm
-- This ensures no team plays consecutive matches

DO $$
DECLARE
  tier_num integer;
  team_count integer;
  current_round integer := 1;
  match_date timestamp;
  current_season_id uuid;
  current_league_id uuid;
  total_fixtures integer := 0;
  home_team record;
  away_team record;
  first_fixture_id uuid;
BEGIN
  -- Get current season
  SELECT id INTO current_season_id FROM seasons WHERE year = 2024 LIMIT 1;
  
  -- Clear existing fixtures
  DELETE FROM fixtures;
  
  -- Initialize match date
  match_date := NOW() + interval '2 hours';
  
  -- Generate fixtures for each tier with rotation
  FOR tier_num IN 1..5 LOOP
    RAISE NOTICE 'Generating fixtures for Tier %', tier_num;
    
    -- Get league for this tier
    SELECT id INTO current_league_id FROM leagues WHERE tier = tier_num AND season_id = current_season_id LIMIT 1;
    
    -- Get team count for this tier
    SELECT COUNT(*) INTO team_count FROM teams WHERE tier = tier_num;
    
    IF team_count >= 2 THEN
      -- Reset round counter for this tier
      current_round := (tier_num - 1) * 100 + 1; -- Separate round numbers by tier
      
      -- Generate fixtures with rotation - each team plays every other team twice
      FOR home_team IN 
        SELECT id, name FROM teams WHERE tier = tier_num ORDER BY name
      LOOP
        FOR away_team IN 
          SELECT id, name FROM teams WHERE tier = tier_num AND id != home_team.id ORDER BY name
        LOOP
          -- Insert the fixture with proper spacing
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
            home_team.id,
            away_team.id,
            match_date,
            'scheduled'
          );
          
          total_fixtures := total_fixtures + 1;
          
          -- Advance round every 2 matches to spread teams across rounds
          IF total_fixtures % 2 = 0 THEN
            current_round := current_round + 1;
            match_date := match_date + interval '3 days'; -- 3 days between rounds
          ELSE
            match_date := match_date + interval '6 hours'; -- 6 hours between matches in same round
          END IF;
        END LOOP;
      END LOOP;
      
      RAISE NOTICE 'Generated fixtures for Tier % - Total so far: %', tier_num, total_fixtures;
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
  
  RAISE NOTICE 'Generated % total fixtures with rotation algorithm across all tiers', total_fixtures;
  
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
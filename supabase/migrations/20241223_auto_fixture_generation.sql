-- Generate initial fixtures for the season and set up automatic regeneration

-- Create a function to automatically check and generate fixtures when needed
CREATE OR REPLACE FUNCTION auto_check_fixtures()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  remaining_count integer;
BEGIN
  -- Count remaining scheduled fixtures
  SELECT COUNT(*) INTO remaining_count
  FROM fixtures
  WHERE status = 'scheduled';
  
  -- Log the check
  RAISE NOTICE 'Auto fixture check: % remaining fixtures', remaining_count;
  
  -- If less than 10 fixtures remain, we need new fixtures
  -- This will be handled by the edge function system
  IF remaining_count < 10 THEN
    RAISE NOTICE 'Low fixture count detected - system will regenerate';
  END IF;
END;
$$;

-- Create a trigger that runs after each match completion
CREATE OR REPLACE FUNCTION trigger_fixture_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger if a fixture was just completed
  IF OLD.status != 'finished' AND NEW.status = 'finished' THEN
    PERFORM auto_check_fixtures();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS fixture_completion_check ON fixtures;

-- Create trigger on fixtures table
CREATE TRIGGER fixture_completion_check
  AFTER UPDATE ON fixtures
  FOR EACH ROW
  EXECUTE FUNCTION trigger_fixture_check();

-- Generate initial fixtures
DO $$
DECLARE
  tier_num integer;
  team_record record;
  opponent_record record;
  match_date timestamp;
  round_num integer := 1;
  current_season_id uuid;
  current_league_id uuid;
  total_fixtures integer := 0;
BEGIN
  -- Get current season
  SELECT id INTO current_season_id FROM seasons WHERE year = 2024 LIMIT 1;
  
  -- Clear existing fixtures
  DELETE FROM fixtures WHERE status IN ('scheduled', 'live');
  
  -- Reset variables
  round_num := 1;
  match_date := NOW() + interval '1 hour';
  
  -- Generate fixtures for each tier
  FOR tier_num IN 1..5 LOOP
    -- Get league for this tier
    SELECT id INTO current_league_id FROM leagues WHERE tier = tier_num AND season_id = current_season_id LIMIT 1;
    
    -- Generate round-robin fixtures (each team plays every other team twice)
    FOR team_record IN 
      SELECT id, name FROM teams WHERE tier = tier_num ORDER BY name
    LOOP
      FOR opponent_record IN 
        SELECT id, name FROM teams WHERE tier = tier_num AND id != team_record.id ORDER BY name
      LOOP
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
          round_num,
          team_record.id,
          opponent_record.id,
          match_date,
          'scheduled'
        );
        
        total_fixtures := total_fixtures + 1;
        round_num := round_num + 1;
        match_date := match_date + interval '2 hours';
      END LOOP;
    END LOOP;
  END LOOP;
  
  -- Set the first fixture to live
  UPDATE fixtures 
  SET status = 'live' 
  WHERE round = 1;
  
  RAISE NOTICE 'Generated % fixtures across all tiers', total_fixtures;
END;
$$;
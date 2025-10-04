-- Fixture generation system for new seasons
-- This migration adds automatic fixture generation when seasons change

-- Function to automatically generate fixtures for new season
CREATE OR REPLACE FUNCTION generate_fixtures_for_new_season()
RETURNS VOID AS $$
DECLARE
  current_season INTEGER;
BEGIN
  -- Get current active season
  SELECT season_number INTO current_season
  FROM global_season_status 
  WHERE season_status = 'active'
  ORDER BY season_number DESC 
  LIMIT 1;
  
  IF current_season IS NULL THEN
    RAISE NOTICE 'No active season found, skipping fixture generation';
    RETURN;
  END IF;
  
  -- Call the edge function to generate fixtures
  PERFORM net.http_post(
    url := 'https://61a6679e-1b7a-4a09-82c9-a4f4b6c4294e.supabase.co/functions/v1/supabase-functions-generate-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
    ),
    body := jsonb_build_object(
      'action', 'regenerate_for_new_season'
    )
  );
  
  RAISE NOTICE 'Fixture generation triggered for season %', current_season;
END;
$$ LANGUAGE plpgsql;

-- Update the global season progression function to include fixture generation
CREATE OR REPLACE FUNCTION progress_global_season()
RETURNS VOID AS $$
DECLARE
  current_season INTEGER;
  new_season INTEGER;
  retirement_count INTEGER;
BEGIN
  -- Get current season
  SELECT season_number INTO current_season
  FROM global_season_status 
  WHERE season_status = 'active'
  ORDER BY season_number DESC 
  LIMIT 1;
  
  IF current_season IS NULL THEN
    RETURN;
  END IF;
  
  -- Mark current season as in promotion phase
  UPDATE global_season_status 
  SET season_status = 'promotion_phase',
      season_end_date = NOW()
  WHERE season_number = current_season;
  
  -- Mark all tier seasons as completed
  UPDATE season_progression 
  SET season_status = 'completed'
  WHERE season_number = current_season;
  
  -- Process promotion and relegation
  PERFORM process_promotion_relegation(current_season);
  
  -- Process player retirements and generate replacements
  retirement_count := process_player_retirements(current_season);
  
  -- Age all players by 1 year and reduce contract years
  UPDATE players 
  SET age = age + 1,
      contract_years_remaining = GREATEST(0, contract_years_remaining - 1),
      -- Increase retirement probability with age
      retirement_probability = CASE 
        WHEN age >= 35 THEN LEAST(0.8, retirement_probability + 0.1)
        WHEN age >= 32 THEN LEAST(0.6, retirement_probability + 0.05)
        ELSE retirement_probability
      END
  WHERE injury_status != 'retired';
  
  -- Handle contract renewals for expiring contracts
  UPDATE players 
  SET contract_years_remaining = FLOOR(RANDOM() * 4) + 2, -- 2-5 years
      weekly_wage = weekly_wage * (1 + (RANDOM() * 0.2 - 0.1)) -- ±10% wage change
  WHERE contract_years_remaining = 0
  AND injury_status != 'retired'
  AND RANDOM() < 0.8; -- 80% chance of renewal
  
  -- Release players who don't get renewed
  UPDATE players 
  SET injury_status = 'retired'
  WHERE contract_years_remaining = 0
  AND injury_status != 'retired';
  
  -- Create new global season
  new_season := current_season + 1;
  
  INSERT INTO global_season_status (season_number, total_tiers, tiers_completed)
  VALUES (new_season, 5, 0);
  
  -- Create new season progression for all tiers
  INSERT INTO season_progression (tier, season_number, total_matches_required)
  SELECT tier, new_season, COUNT(*) * 38 / 2  -- 38 matches per team in a season
  FROM teams 
  GROUP BY tier;
  
  -- Reset team match counters and update season
  UPDATE teams 
  SET matches_played_this_season = 0,
      current_season = new_season;
  
  -- Reset team standings for new season
  DELETE FROM team_standings;
  
  -- Initialize new standings
  INSERT INTO team_standings (team_id, played, won, drawn, lost, gf, ga, points)
  SELECT id, 0, 0, 0, 0, 0, 0, 0
  FROM teams;
  
  -- Generate fixtures for the new season
  PERFORM generate_fixtures_for_new_season();
  
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger fixture generation (for admin use)
CREATE OR REPLACE FUNCTION admin_generate_fixtures(force_regenerate BOOLEAN DEFAULT FALSE)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Call the edge function to generate fixtures
  SELECT content INTO result
  FROM net.http_post(
    url := 'https://61a6679e-1b7a-4a09-82c9-a4f4b6c4294e.supabase.co/functions/v1/supabase-functions-generate-fixtures',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_key', true)
    ),
    body := jsonb_build_object(
      'action', 'generate_all_fixtures',
      'force_regenerate', force_regenerate
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add fixture generation status tracking
CREATE TABLE IF NOT EXISTS fixture_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('initial', 'new_season', 'manual')),
  total_fixtures INTEGER DEFAULT 0,
  fixtures_by_tier JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable realtime for fixture generation log
ALTER PUBLICATION supabase_realtime ADD TABLE fixture_generation_log;
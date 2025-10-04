-- Season progression system based on matches played
-- 1 season = 35 matches per team in each tier
-- When all teams in a tier complete 35 matches, the season ends

-- Add season tracking columns
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS matches_played_this_season INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_season INTEGER DEFAULT 1;

-- Add season progression tracking table
CREATE TABLE IF NOT EXISTS season_progression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  matches_completed INTEGER DEFAULT 0,
  total_matches_required INTEGER DEFAULT 350, -- 10 teams * 35 matches = 350 total matches per tier
  season_status TEXT DEFAULT 'active' CHECK (season_status IN ('active', 'completed')),
  season_start_date TIMESTAMP DEFAULT NOW(),
  season_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tier, season_number)
);

-- Initialize season progression for all tiers
INSERT INTO season_progression (tier, season_number, total_matches_required)
SELECT tier, 1, COUNT(*) * 35 / 2 as total_matches -- Divide by 2 because each match involves 2 teams
FROM teams 
GROUP BY tier
ON CONFLICT (tier, season_number) DO NOTHING;

-- Function to check if a tier's season is complete
CREATE OR REPLACE FUNCTION check_season_completion(tier_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  matches_needed INTEGER;
  matches_played INTEGER;
BEGIN
  -- Get total matches needed for this tier (teams * 35 / 2)
  SELECT COUNT(*) * 35 / 2 INTO matches_needed
  FROM teams 
  WHERE tier = tier_num;
  
  -- Get matches played this season for this tier
  SELECT COUNT(*) INTO matches_played
  FROM matches m
  JOIN teams ht ON m.home_team_id = ht.id
  WHERE ht.tier = tier_num 
  AND m.status = 'completed'
  AND m.season = (SELECT MAX(season_number) FROM season_progression WHERE tier = tier_num);
  
  RETURN matches_played >= matches_needed;
END;
$$ LANGUAGE plpgsql;

-- Function to progress season for a tier
CREATE OR REPLACE FUNCTION progress_season(tier_num INTEGER)
RETURNS VOID AS $$
DECLARE
  current_season_num INTEGER;
  new_season_num INTEGER;
BEGIN
  -- Get current season number
  SELECT MAX(season_number) INTO current_season_num
  FROM season_progression 
  WHERE tier = tier_num;
  
  -- Mark current season as completed
  UPDATE season_progression 
  SET season_status = 'completed',
      season_end_date = NOW()
  WHERE tier = tier_num AND season_number = current_season_num;
  
  -- Create new season
  new_season_num := current_season_num + 1;
  
  INSERT INTO season_progression (tier, season_number, total_matches_required)
  SELECT tier_num, new_season_num, COUNT(*) * 35 / 2
  FROM teams 
  WHERE tier = tier_num;
  
  -- Reset team match counters
  UPDATE teams 
  SET matches_played_this_season = 0,
      current_season = new_season_num
  WHERE tier = tier_num;
  
  -- Age all players by 1 year and reduce contract years
  UPDATE players 
  SET age = age + 1,
      contract_years_remaining = GREATEST(0, contract_years_remaining - 1)
  WHERE team_id IN (SELECT id FROM teams WHERE tier = tier_num);
  
  -- Handle contract renewals for expiring contracts
  UPDATE players 
  SET contract_years_remaining = FLOOR(RANDOM() * 4) + 2, -- 2-5 years
      weekly_wage = weekly_wage * (1 + (RANDOM() * 0.2 - 0.1)) -- ±10% wage change
  WHERE team_id IN (SELECT id FROM teams WHERE tier = tier_num)
  AND contract_years_remaining = 0
  AND RANDOM() < 0.8; -- 80% chance of renewal
  
  -- Release players who don't get renewed (20% chance)
  DELETE FROM players 
  WHERE team_id IN (SELECT id FROM teams WHERE tier = tier_num)
  AND contract_years_remaining = 0;
  
END;
$$ LANGUAGE plpgsql;

-- Function to update match counter when a match completes
CREATE OR REPLACE FUNCTION update_season_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when match status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update team match counters
    UPDATE teams 
    SET matches_played_this_season = matches_played_this_season + 1
    WHERE id IN (NEW.home_team_id, NEW.away_team_id);
    
    -- Update season progression counter
    UPDATE season_progression 
    SET matches_completed = matches_completed + 1
    WHERE tier = (SELECT tier FROM teams WHERE id = NEW.home_team_id)
    AND season_status = 'active';
    
    -- Check if season is complete for this tier
    DECLARE
      tier_num INTEGER;
    BEGIN
      SELECT tier INTO tier_num FROM teams WHERE id = NEW.home_team_id;
      
      IF check_season_completion(tier_num) THEN
        PERFORM progress_season(tier_num);
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match completion
DROP TRIGGER IF EXISTS match_completion_trigger ON matches;
CREATE TRIGGER match_completion_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_season_progress();

-- Transfer window management based on season progression
CREATE TABLE IF NOT EXISTS transfer_window_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  window_type TEXT NOT NULL CHECK (window_type IN ('summer', 'winter')),
  matches_trigger INTEGER NOT NULL, -- Number of matches when window opens
  is_active BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to manage transfer windows based on season progress
CREATE OR REPLACE FUNCTION manage_transfer_windows()
RETURNS VOID AS $$
DECLARE
  tier_record RECORD;
  season_record RECORD;
BEGIN
  -- Check each tier's season progress
  FOR tier_record IN SELECT DISTINCT tier FROM teams LOOP
    -- Get current season info
    SELECT * INTO season_record
    FROM season_progression 
    WHERE tier = tier_record.tier 
    AND season_status = 'active'
    ORDER BY season_number DESC 
    LIMIT 1;
    
    IF season_record IS NOT NULL THEN
      -- Summer transfer window: Opens at start of season (0-5 matches)
      IF season_record.matches_completed >= 0 AND season_record.matches_completed <= 5 THEN
        -- Open summer window if not already open
        INSERT INTO transfer_window_schedule (tier, season_number, window_type, matches_trigger, is_active, opened_at)
        VALUES (tier_record.tier, season_record.season_number, 'summer', 0, TRUE, NOW())
        ON CONFLICT DO NOTHING;
        
        -- Close winter window if open
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'winter' 
        AND is_active = TRUE;
      END IF;
      
      -- Close summer window after 10 matches
      IF season_record.matches_completed > 10 THEN
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'summer' 
        AND is_active = TRUE;
      END IF;
      
      -- Winter transfer window: Opens mid-season (15-25 matches)
      IF season_record.matches_completed >= 15 AND season_record.matches_completed <= 25 THEN
        -- Open winter window if not already open
        INSERT INTO transfer_window_schedule (tier, season_number, window_type, matches_trigger, is_active, opened_at)
        VALUES (tier_record.tier, season_record.season_number, 'winter', 15, TRUE, NOW())
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Close winter window after 25 matches
      IF season_record.matches_completed > 25 THEN
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'winter' 
        AND is_active = TRUE;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get active transfer windows
CREATE OR REPLACE FUNCTION get_active_transfer_windows()
RETURNS TABLE (
  tier INTEGER,
  season_number INTEGER,
  window_type TEXT,
  matches_completed INTEGER,
  total_matches_required INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tws.tier,
    tws.season_number,
    tws.window_type,
    sp.matches_completed,
    sp.total_matches_required
  FROM transfer_window_schedule tws
  JOIN season_progression sp ON tws.tier = sp.tier AND tws.season_number = sp.season_number
  WHERE tws.is_active = TRUE
  AND sp.season_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Add season column to matches table if not exists
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS season INTEGER DEFAULT 1;

-- Update existing matches with season 1
UPDATE matches SET season = 1 WHERE season IS NULL;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE season_progression;
ALTER PUBLICATION supabase_realtime ADD TABLE transfer_window_schedule;
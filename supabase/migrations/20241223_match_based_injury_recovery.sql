-- Update injury system to use match-based recovery instead of time-based
-- 1 match played = 1 week of recovery time

-- Add match-based recovery columns to player_injuries
ALTER TABLE player_injuries 
ADD COLUMN IF NOT EXISTS recovery_weeks_needed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recovery_weeks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_at_injury INTEGER DEFAULT 0;

-- Update existing injuries to use match-based recovery
UPDATE player_injuries 
SET recovery_weeks_needed = CASE severity
  WHEN 'minor' THEN 1 + floor(random() * 2) -- 1-3 weeks
  WHEN 'moderate' THEN 3 + floor(random() * 3) -- 3-6 weeks  
  WHEN 'major' THEN 6 + floor(random() * 12) -- 6-18 weeks
  WHEN 'career_ending' THEN 52 -- 1 year (effectively retirement)
END,
recovery_weeks_completed = 0,
matches_at_injury = 0
WHERE recovery_weeks_needed IS NULL OR recovery_weeks_needed = 0;

-- Function to update injury recovery based on matches played
CREATE OR REPLACE FUNCTION update_injury_recovery_on_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when match status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update recovery progress for all active injuries
    -- Each completed match = 1 week of recovery
    UPDATE player_injuries 
    SET recovery_weeks_completed = recovery_weeks_completed + 1,
        recovery_progress = LEAST(100, ((recovery_weeks_completed + 1) * 100.0 / GREATEST(recovery_weeks_needed, 1)))
    WHERE is_active = TRUE;
    
    -- Mark injuries as recovered if they've reached their recovery time
    UPDATE player_injuries 
    SET is_active = FALSE,
        actual_return_date = NOW(),
        recovery_progress = 100
    WHERE is_active = TRUE 
    AND recovery_weeks_completed >= recovery_weeks_needed;
    
    -- Update player status for recovered players
    UPDATE players 
    SET injury_status = 'fit',
        injury_return_date = NULL
    WHERE id IN (
      SELECT player_id 
      FROM player_injuries 
      WHERE is_active = FALSE 
      AND actual_return_date >= NOW() - INTERVAL '1 minute'
      AND injury_status = 'injured'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for match-based injury recovery
DROP TRIGGER IF EXISTS injury_recovery_on_match_trigger ON matches;
CREATE TRIGGER injury_recovery_on_match_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_injury_recovery_on_match();

-- Updated function to apply match injury with match-based recovery
CREATE OR REPLACE FUNCTION apply_match_injury(player_id UUID, match_id UUID, injury_severity TEXT DEFAULT 'minor')
RETURNS UUID AS $$
DECLARE
  injury_id UUID;
  injury_types TEXT[] := ARRAY['muscle_strain', 'ligament_damage', 'bone_fracture', 'concussion', 'ankle_sprain', 'knee_injury', 'hamstring_pull', 'shoulder_dislocation'];
  recovery_weeks INTEGER;
  current_matches INTEGER;
BEGIN
  injury_id := gen_random_uuid();
  
  -- Determine recovery time in weeks (matches) based on severity
  recovery_weeks := CASE injury_severity
    WHEN 'minor' THEN 1 + floor(random() * 2) -- 1-3 weeks
    WHEN 'moderate' THEN 3 + floor(random() * 3) -- 3-6 weeks  
    WHEN 'major' THEN 6 + floor(random() * 12) -- 6-18 weeks
    WHEN 'career_ending' THEN 52 -- 1 year (effectively retirement)
  END;
  
  -- Get current total matches played (as a baseline)
  SELECT COUNT(*) INTO current_matches FROM matches WHERE status = 'completed';
  
  -- Create injury record
  INSERT INTO player_injuries (
    id, player_id, injury_type, severity, match_id,
    recovery_weeks_needed, recovery_weeks_completed, matches_at_injury,
    is_active, recovery_progress
  ) VALUES (
    injury_id,
    player_id,
    injury_types[1 + floor(random() * array_length(injury_types, 1))],
    injury_severity,
    match_id,
    recovery_weeks,
    0,
    current_matches,
    TRUE,
    0
  );
  
  -- Update player status
  UPDATE players 
  SET injury_status = CASE 
      WHEN injury_severity = 'career_ending' THEN 'retired'
      ELSE 'injured'
    END,
    injury_return_date = NOW() + INTERVAL '1 day' * (recovery_weeks * 7), -- Estimate for display
    career_injuries = career_injuries + 1,
    retirement_probability = CASE 
      WHEN injury_severity = 'career_ending' THEN 1.0
      WHEN injury_severity = 'major' THEN LEAST(0.9, retirement_probability + 0.15)
      WHEN injury_severity = 'moderate' THEN LEAST(0.8, retirement_probability + 0.05)
      ELSE retirement_probability + 0.01
    END
  WHERE id = player_id;
  
  -- Generate replacement if career-ending
  IF injury_severity = 'career_ending' THEN
    PERFORM generate_replacement_player(player_id, (SELECT team_id FROM players WHERE id = player_id));
  END IF;
  
  RETURN injury_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get injury recovery status based on matches
CREATE OR REPLACE FUNCTION get_injury_recovery_status()
RETURNS TABLE (
  injury_id UUID,
  player_name TEXT,
  team_name TEXT,
  injury_type TEXT,
  severity TEXT,
  weeks_needed INTEGER,
  weeks_completed INTEGER,
  matches_remaining INTEGER,
  recovery_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pi.id as injury_id,
    p.name as player_name,
    t.name as team_name,
    pi.injury_type,
    pi.severity,
    pi.recovery_weeks_needed as weeks_needed,
    pi.recovery_weeks_completed as weeks_completed,
    GREATEST(0, pi.recovery_weeks_needed - pi.recovery_weeks_completed) as matches_remaining,
    LEAST(100, ROUND((pi.recovery_weeks_completed * 100.0 / GREATEST(pi.recovery_weeks_needed, 1)))) as recovery_percentage
  FROM player_injuries pi
  JOIN players p ON pi.player_id = p.id
  JOIN teams t ON p.team_id = t.id
  WHERE pi.is_active = TRUE
  ORDER BY pi.severity DESC, pi.recovery_weeks_needed DESC;
END;
$$ LANGUAGE plpgsql;

-- Remove the old time-based recovery function since we're using match-based now
DROP FUNCTION IF EXISTS process_injury_recoveries();

-- Create new match-based recovery function
CREATE OR REPLACE FUNCTION process_match_based_injury_recoveries()
RETURNS INTEGER AS $$
DECLARE
  recovered_count INTEGER := 0;
BEGIN
  -- This function is now mostly handled by the trigger
  -- But we can use it to clean up any inconsistencies
  
  -- Mark injuries as recovered if they've reached their recovery time
  UPDATE player_injuries 
  SET is_active = FALSE,
      actual_return_date = NOW(),
      recovery_progress = 100
  WHERE is_active = TRUE 
  AND recovery_weeks_completed >= recovery_weeks_needed;
  
  -- Update player status for recovered players
  UPDATE players 
  SET injury_status = 'fit',
      injury_return_date = NULL
  WHERE injury_status = 'injured'
  AND id NOT IN (
    SELECT player_id 
    FROM player_injuries 
    WHERE is_active = TRUE
  );
  
  GET DIAGNOSTICS recovered_count = ROW_COUNT;
  
  RETURN recovered_count;
END;
$$ LANGUAGE plpgsql;
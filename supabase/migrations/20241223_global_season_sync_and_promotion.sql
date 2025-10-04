-- Global season synchronization and promotion/relegation system
-- All tiers must complete 35 matches before any season ends

-- Add global season tracking
CREATE TABLE IF NOT EXISTS global_season_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL UNIQUE,
  total_tiers INTEGER DEFAULT 5,
  tiers_completed INTEGER DEFAULT 0,
  season_status TEXT DEFAULT 'active' CHECK (season_status IN ('active', 'completed', 'promotion_phase')),
  season_start_date TIMESTAMP DEFAULT NOW(),
  season_end_date TIMESTAMP,
  promotion_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Initialize global season 1
INSERT INTO global_season_status (season_number, total_tiers, tiers_completed)
VALUES (1, 5, 0)
ON CONFLICT (season_number) DO NOTHING;

-- Add promotion/relegation tracking
CREATE TABLE IF NOT EXISTS promotion_relegation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id),
  old_tier INTEGER NOT NULL,
  new_tier INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('promoted', 'relegated', 'stayed')),
  final_position INTEGER,
  points INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add injury system tables
CREATE TABLE IF NOT EXISTS player_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'career_ending')),
  injury_date TIMESTAMP DEFAULT NOW(),
  expected_return_date TIMESTAMP,
  actual_return_date TIMESTAMP,
  match_id UUID REFERENCES matches(id),
  is_active BOOLEAN DEFAULT TRUE,
  recovery_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add injury status to players
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS injury_status TEXT DEFAULT 'fit' CHECK (injury_status IN ('fit', 'injured', 'recovering', 'retired')),
ADD COLUMN IF NOT EXISTS injury_return_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS career_injuries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS retirement_probability REAL DEFAULT 0.0;

-- Function to check if ALL tiers have completed their seasons
CREATE OR REPLACE FUNCTION check_global_season_completion()
RETURNS BOOLEAN AS $$
DECLARE
  current_season INTEGER;
  completed_tiers INTEGER;
  total_tiers INTEGER;
BEGIN
  -- Get current global season
  SELECT season_number, total_tiers INTO current_season, total_tiers
  FROM global_season_status 
  WHERE season_status = 'active'
  ORDER BY season_number DESC 
  LIMIT 1;
  
  IF current_season IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Count how many tiers have completed their required matches
  SELECT COUNT(*) INTO completed_tiers
  FROM (
    SELECT sp.tier
    FROM season_progression sp
    WHERE sp.season_number = current_season
    AND sp.season_status = 'active'
    AND sp.matches_completed >= sp.total_matches_required
  ) completed;
  
  -- Update global status
  UPDATE global_season_status 
  SET tiers_completed = completed_tiers
  WHERE season_number = current_season;
  
  -- Return true if all tiers are complete
  RETURN completed_tiers >= total_tiers;
END;
$$ LANGUAGE plpgsql;

-- Function to handle promotion and relegation
CREATE OR REPLACE FUNCTION process_promotion_relegation(season_num INTEGER)
RETURNS VOID AS $$
DECLARE
  tier_num INTEGER;
  team_record RECORD;
  promotion_count INTEGER := 3;
  relegation_count INTEGER := 3;
BEGIN
  -- Process each tier (1 to 5)
  FOR tier_num IN 1..5 LOOP
    -- Get final standings for this tier
    WITH final_standings AS (
      SELECT 
        ts.*,
        t.id as team_id,
        t.name as team_name,
        ROW_NUMBER() OVER (ORDER BY ts.points DESC, (ts.goals_for - ts.goals_against) DESC, ts.goals_for DESC) as final_position
      FROM team_standings ts
      JOIN teams t ON ts.team_id = t.id
      WHERE t.tier = tier_num
    )
    -- Process promotions (top 3 teams, except tier 1)
    INSERT INTO promotion_relegation_log (season_number, team_id, old_tier, new_tier, movement_type, final_position, points)
    SELECT 
      season_num,
      team_id,
      tier_num,
      CASE 
        WHEN tier_num > 1 AND final_position <= promotion_count THEN tier_num - 1
        WHEN tier_num < 5 AND final_position > (10 - relegation_count) THEN tier_num + 1
        ELSE tier_num
      END as new_tier,
      CASE 
        WHEN tier_num > 1 AND final_position <= promotion_count THEN 'promoted'
        WHEN tier_num < 5 AND final_position > (10 - relegation_count) THEN 'relegated'
        ELSE 'stayed'
      END as movement_type,
      final_position,
      points
    FROM final_standings;
    
    -- Update team tiers based on promotion/relegation
    UPDATE teams 
    SET tier = prl.new_tier
    FROM promotion_relegation_log prl
    WHERE teams.id = prl.team_id 
    AND prl.season_number = season_num
    AND teams.tier = tier_num;
  END LOOP;
  
  -- Mark promotion as completed
  UPDATE global_season_status 
  SET promotion_completed = TRUE,
      season_status = 'completed'
  WHERE season_number = season_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate replacement player when one retires
CREATE OR REPLACE FUNCTION generate_replacement_player(retired_player_id UUID, team_id UUID)
RETURNS UUID AS $$
DECLARE
  retired_player RECORD;
  team_info RECORD;
  new_player_id UUID;
  youth_names TEXT[] := ARRAY[
    'Alex Johnson', 'Jamie Smith', 'Taylor Brown', 'Jordan Davis', 'Casey Wilson',
    'Riley Martinez', 'Avery Garcia', 'Quinn Rodriguez', 'Sage Anderson', 'River Thompson',
    'Phoenix White', 'Skyler Harris', 'Rowan Clark', 'Sage Lewis', 'Dakota Walker',
    'Cameron Hall', 'Emery Allen', 'Finley Young', 'Hayden King', 'Indigo Wright',
    'Kai Lopez', 'Lane Hill', 'Morgan Scott', 'Nova Green', 'Ocean Adams'
  ];
BEGIN
  -- Get retired player info
  SELECT * INTO retired_player FROM players WHERE id = retired_player_id;
  
  -- Get team info
  SELECT * INTO team_info FROM teams WHERE id = team_id;
  
  IF retired_player IS NULL OR team_info IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate new youth player
  new_player_id := gen_random_uuid();
  
  INSERT INTO players (
    id,
    name,
    age,
    position,
    team_id,
    overall_rating,
    pace,
    shooting,
    passing,
    defending,
    dribbling,
    physical,
    form_rating,
    weekly_wage,
    contract_years_remaining,
    shirt_number,
    nationality,
    injury_status,
    career_injuries,
    retirement_probability
  ) VALUES (
    new_player_id,
    youth_names[1 + floor(random() * array_length(youth_names, 1))],
    16 + floor(random() * 3), -- 16-18 years old
    retired_player.position, -- Same position as retired player
    team_id,
    -- Youth players start with lower ratings but potential
    GREATEST(40, retired_player.overall_rating - 20 + floor(random() * 15)), -- Base rating
    40 + floor(random() * 30), -- Pace: 40-70
    30 + floor(random() * 25), -- Shooting: 30-55
    35 + floor(random() * 25), -- Passing: 35-60
    30 + floor(random() * 25), -- Defending: 30-55
    40 + floor(random() * 30), -- Dribbling: 40-70
    45 + floor(random() * 25), -- Physical: 45-70
    60 + floor(random() * 20), -- Form: 60-80 (young and eager)
    -- Wage based on team wealth but low for youth
    CASE team_info.wealth_category
      WHEN 'mega_rich' THEN 2000 + floor(random() * 1000)
      WHEN 'rich' THEN 1500 + floor(random() * 500)
      WHEN 'moderate' THEN 1000 + floor(random() * 500)
      WHEN 'limited' THEN 800 + floor(random() * 300)
      ELSE 500 + floor(random() * 300)
    END,
    4 + floor(random() * 2), -- 4-5 year contract
    retired_player.shirt_number, -- Take the retired player's number
    retired_player.nationality,
    'fit',
    0,
    0.0
  );
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process player retirements
CREATE OR REPLACE FUNCTION process_player_retirements(season_num INTEGER)
RETURNS INTEGER AS $$
DECLARE
  player_record RECORD;
  retirement_count INTEGER := 0;
  new_player_id UUID;
BEGIN
  -- Process retirements for players with high retirement probability
  FOR player_record IN 
    SELECT p.*, t.wealth_category
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.retirement_probability > 0.7 OR p.age >= 38
  LOOP
    -- Calculate final retirement probability
    DECLARE
      final_retirement_prob REAL := player_record.retirement_probability;
    BEGIN
      -- Age factor
      IF player_record.age >= 40 THEN final_retirement_prob := 0.95;
      ELSIF player_record.age >= 38 THEN final_retirement_prob := GREATEST(final_retirement_prob, 0.6);
      ELSIF player_record.age >= 35 THEN final_retirement_prob := GREATEST(final_retirement_prob, 0.3);
      END IF;
      
      -- Injury factor
      IF player_record.career_injuries >= 5 THEN final_retirement_prob := final_retirement_prob + 0.2;
      END IF;
      
      -- Rating factor (declining players more likely to retire)
      IF player_record.overall_rating < 50 AND player_record.age >= 32 THEN 
        final_retirement_prob := final_retirement_prob + 0.15;
      END IF;
      
      -- Check if player retires
      IF random() < final_retirement_prob THEN
        -- Generate replacement player
        new_player_id := generate_replacement_player(player_record.id, player_record.team_id);
        
        -- Mark player as retired
        UPDATE players 
        SET injury_status = 'retired'
        WHERE id = player_record.id;
        
        -- Log the retirement and replacement
        INSERT INTO promotion_relegation_log (season_number, team_id, old_tier, new_tier, movement_type, final_position, points)
        VALUES (season_num, player_record.team_id, 0, 0, 'player_retired', 0, 0);
        
        retirement_count := retirement_count + 1;
      END IF;
    END;
  END LOOP;
  
  RETURN retirement_count;
END;
$$ LANGUAGE plpgsql;

-- Updated global season progression function
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
  SELECT tier, new_season, COUNT(*) * 35 / 2
  FROM teams 
  GROUP BY tier;
  
  -- Reset team match counters and update season
  UPDATE teams 
  SET matches_played_this_season = 0,
      current_season = new_season;
  
  -- Reset team standings for new season
  DELETE FROM team_standings;
  
  -- Initialize new standings
  INSERT INTO team_standings (team_id, matches_played, wins, draws, losses, goals_for, goals_against, points)
  SELECT id, 0, 0, 0, 0, 0, 0, 0
  FROM teams;
  
END;
$$ LANGUAGE plpgsql;

-- Updated trigger function for match completion
CREATE OR REPLACE FUNCTION update_global_season_progress()
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
    
    -- Check if ALL tiers have completed their seasons
    IF check_global_season_completion() THEN
      PERFORM progress_global_season();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger
DROP TRIGGER IF EXISTS match_completion_trigger ON matches;
CREATE TRIGGER match_completion_trigger
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_global_season_progress();

-- Injury system functions
CREATE OR REPLACE FUNCTION apply_match_injury(player_id UUID, match_id UUID, injury_severity TEXT DEFAULT 'minor')
RETURNS UUID AS $$
DECLARE
  injury_id UUID;
  injury_types TEXT[] := ARRAY['muscle_strain', 'ligament_damage', 'bone_fracture', 'concussion', 'ankle_sprain', 'knee_injury', 'hamstring_pull', 'shoulder_dislocation'];
  recovery_days INTEGER;
BEGIN
  injury_id := gen_random_uuid();
  
  -- Determine recovery time based on severity
  recovery_days := CASE injury_severity
    WHEN 'minor' THEN 7 + floor(random() * 14) -- 1-3 weeks
    WHEN 'moderate' THEN 21 + floor(random() * 21) -- 3-6 weeks  
    WHEN 'major' THEN 42 + floor(random() * 84) -- 6-18 weeks
    WHEN 'career_ending' THEN 365 -- 1 year (effectively retirement)
  END;
  
  -- Create injury record
  INSERT INTO player_injuries (
    id, player_id, injury_type, severity, match_id,
    expected_return_date, is_active, recovery_progress
  ) VALUES (
    injury_id,
    player_id,
    injury_types[1 + floor(random() * array_length(injury_types, 1))],
    injury_severity,
    match_id,
    NOW() + INTERVAL '1 day' * recovery_days,
    TRUE,
    0
  );
  
  -- Update player status
  UPDATE players 
  SET injury_status = CASE 
      WHEN injury_severity = 'career_ending' THEN 'retired'
      ELSE 'injured'
    END,
    injury_return_date = NOW() + INTERVAL '1 day' * recovery_days,
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

-- Function to recover players from injuries
CREATE OR REPLACE FUNCTION process_injury_recoveries()
RETURNS INTEGER AS $$
DECLARE
  recovered_count INTEGER := 0;
  injury_record RECORD;
BEGIN
  -- Process active injuries
  FOR injury_record IN 
    SELECT pi.*, p.id as player_id
    FROM player_injuries pi
    JOIN players p ON pi.player_id = p.id
    WHERE pi.is_active = TRUE 
    AND pi.expected_return_date <= NOW()
    AND p.injury_status = 'injured'
  LOOP
    -- Mark injury as recovered
    UPDATE player_injuries 
    SET is_active = FALSE,
        actual_return_date = NOW(),
        recovery_progress = 100
    WHERE id = injury_record.id;
    
    -- Update player status
    UPDATE players 
    SET injury_status = 'fit',
        injury_return_date = NULL
    WHERE id = injury_record.player_id;
    
    recovered_count := recovered_count + 1;
  END LOOP;
  
  RETURN recovered_count;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE global_season_status;
ALTER PUBLICATION supabase_realtime ADD TABLE promotion_relegation_log;
-- Update season progression system from 35 to 38 matches per team
-- 20 teams * 38 matches each = 760 team-match instances
-- 760 ÷ 2 = 380 total matches per tier

-- Update existing season progression records
UPDATE season_progression 
SET total_matches_required = (
  SELECT COUNT(*) * 38 / 2 
  FROM teams 
  WHERE tier = season_progression.tier
)
WHERE season_status = 'active';

-- Update the check_season_completion function
CREATE OR REPLACE FUNCTION check_season_completion(tier_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  matches_needed INTEGER;
  matches_played INTEGER;
BEGIN
  -- Get total matches needed for this tier (teams * 38 / 2)
  SELECT COUNT(*) * 38 / 2 INTO matches_needed
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

-- Update the progress_season function
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
  SELECT tier_num, new_season_num, COUNT(*) * 38 / 2
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

-- Update the global season progression function
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
  
  -- Create new season progression for all tiers with 38 matches
  INSERT INTO season_progression (tier, season_number, total_matches_required)
  SELECT tier, new_season, COUNT(*) * 38 / 2
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
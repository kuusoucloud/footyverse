-- 3D Match Simulation Support Functions (Fixed for existing schema)
-- Create functions to support the 3D match simulation engine

-- First, let's add missing columns to existing tables if they don't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS form INTEGER DEFAULT 5 CHECK (form >= 1 AND form <= 10);
ALTER TABLE players ADD COLUMN IF NOT EXISTS overall_rating INTEGER DEFAULT 70 CHECK (overall_rating >= 1 AND overall_rating <= 99);
ALTER TABLE players ADD COLUMN IF NOT EXISTS market_value BIGINT DEFAULT 1000000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_match_rating DECIMAL DEFAULT 6.0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS injury_status TEXT DEFAULT 'fit' CHECK (injury_status IN ('fit', 'minor', 'moderate', 'major', 'career_ending'));

ALTER TABLE teams ADD COLUMN IF NOT EXISTS formations JSONB DEFAULT NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS season_number INTEGER DEFAULT 1;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS odds JSONB DEFAULT NULL;

-- Create standings table if it doesn't exist
CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL DEFAULT 1,
    tier INTEGER NOT NULL DEFAULT 1,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, season_number)
);

-- Create finished_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS finished_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID REFERENCES fixtures(id) ON DELETE CASCADE,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    season_number INTEGER NOT NULL DEFAULT 1,
    round INTEGER DEFAULT 1,
    tier INTEGER DEFAULT 1,
    match_events JSONB DEFAULT '[]',
    match_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_match_performance table if it doesn't exist
CREATE TABLE IF NOT EXISTS player_match_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_match_id UUID REFERENCES finished_matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    tackles INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    fouls_suffered INTEGER DEFAULT 0,
    match_rating DECIMAL DEFAULT 6.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create global_season_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS global_season_status (
    season_number INTEGER PRIMARY KEY,
    season_status TEXT NOT NULL DEFAULT 'active' CHECK (season_status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update team standings after a match
CREATE OR REPLACE FUNCTION update_team_standings(
  team_id UUID,
  goals_for INTEGER,
  goals_against INTEGER,
  points INTEGER,
  season_number INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO standings (team_id, season_number, tier, matches_played, wins, draws, losses, goals_for, goals_against, goal_difference, points)
  SELECT 
    update_team_standings.team_id,
    update_team_standings.season_number,
    t.tier,
    1,
    CASE WHEN update_team_standings.points = 3 THEN 1 ELSE 0 END,
    CASE WHEN update_team_standings.points = 1 THEN 1 ELSE 0 END,
    CASE WHEN update_team_standings.points = 0 THEN 1 ELSE 0 END,
    update_team_standings.goals_for,
    update_team_standings.goals_against,
    update_team_standings.goals_for - update_team_standings.goals_against,
    update_team_standings.points
  FROM teams t WHERE t.id = update_team_standings.team_id
  ON CONFLICT (team_id, season_number)
  DO UPDATE SET
    matches_played = standings.matches_played + 1,
    wins = standings.wins + CASE WHEN update_team_standings.points = 3 THEN 1 ELSE 0 END,
    draws = standings.draws + CASE WHEN update_team_standings.points = 1 THEN 1 ELSE 0 END,
    losses = standings.losses + CASE WHEN update_team_standings.points = 0 THEN 1 ELSE 0 END,
    goals_for = standings.goals_for + update_team_standings.goals_for,
    goals_against = standings.goals_against + update_team_standings.goals_against,
    goal_difference = standings.goal_difference + (update_team_standings.goals_for - update_team_standings.goals_against),
    points = standings.points + update_team_standings.points;
END;
$$ LANGUAGE plpgsql;

-- Function to progress season and handle promotion/relegation
CREATE OR REPLACE FUNCTION progress_season_and_generate_fixtures()
RETURNS JSON AS $$
DECLARE
  current_season INTEGER;
  promotion_teams UUID[];
  relegation_teams UUID[];
  result JSON;
BEGIN
  -- Get current season
  SELECT COALESCE(MAX(season_number), 0) + 1 INTO current_season FROM standings;
  
  -- Handle promotion and relegation for each tier
  FOR tier_level IN 1..5 LOOP
    -- Get top 3 teams for promotion (except tier 1)
    IF tier_level > 1 THEN
      SELECT ARRAY_AGG(team_id ORDER BY points DESC, goal_difference DESC) 
      INTO promotion_teams
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      WHERE t.tier = tier_level AND s.season_number = current_season - 1
      LIMIT 3;
      
      -- Promote teams
      UPDATE teams SET tier = tier_level - 1 
      WHERE id = ANY(promotion_teams);
    END IF;
    
    -- Get bottom 3 teams for relegation (except tier 5)
    IF tier_level < 5 THEN
      SELECT ARRAY_AGG(team_id ORDER BY points ASC, goal_difference ASC)
      INTO relegation_teams
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      WHERE t.tier = tier_level AND s.season_number = current_season - 1
      LIMIT 3;
      
      -- Relegate teams
      UPDATE teams SET tier = tier_level + 1 
      WHERE id = ANY(relegation_teams);
    END IF;
  END LOOP;
  
  -- Generate new fixtures for the new season
  PERFORM generate_season_fixtures(current_season);
  
  -- Update global season status
  INSERT INTO global_season_status (season_number, season_status, created_at)
  VALUES (current_season, 'active', NOW())
  ON CONFLICT (season_number) 
  DO UPDATE SET season_status = 'active', created_at = NOW();
  
  result := json_build_object(
    'success', true,
    'new_season', current_season,
    'promoted_teams', promotion_teams,
    'relegated_teams', relegation_teams
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate fixtures for a season
CREATE OR REPLACE FUNCTION generate_season_fixtures(season_num INTEGER)
RETURNS VOID AS $$
DECLARE
  tier_level INTEGER;
  team_ids UUID[];
  team_count INTEGER;
  round_num INTEGER;
  i INTEGER;
  j INTEGER;
  home_team UUID;
  away_team UUID;
  match_date TIMESTAMP;
  current_season_id UUID;
  current_league_id UUID;
BEGIN
  -- Get current season ID
  SELECT id INTO current_season_id FROM seasons ORDER BY year DESC LIMIT 1;
  
  -- Generate fixtures for each tier
  FOR tier_level IN 1..5 LOOP
    -- Get league ID for this tier
    SELECT id INTO current_league_id FROM leagues WHERE tier = tier_level LIMIT 1;
    
    -- Get teams in this tier
    SELECT ARRAY_AGG(id ORDER BY name) INTO team_ids
    FROM teams WHERE tier = tier_level;
    
    team_count := array_length(team_ids, 1);
    
    IF team_count IS NULL OR team_count < 2 THEN
      CONTINUE;
    END IF;
    
    -- Generate round-robin fixtures (each team plays each other twice)
    round_num := 1;
    
    -- First half of season
    FOR i IN 1..team_count LOOP
      FOR j IN 1..team_count LOOP
        IF i != j THEN
          home_team := team_ids[i];
          away_team := team_ids[j];
          
          -- Calculate match date (spread over 38 weeks)
          match_date := NOW() + INTERVAL '1 week' * round_num;
          
          INSERT INTO fixtures (
            season_id,
            league_id,
            home_team_id, 
            away_team_id, 
            scheduled_at, 
            status, 
            round, 
            season_number,
            tier
          ) VALUES (
            current_season_id,
            current_league_id,
            home_team, 
            away_team, 
            match_date, 
            'scheduled', 
            round_num,
            season_num,
            tier_level
          );
          
          round_num := round_num + 1;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get next scheduled match for simulation
CREATE OR REPLACE FUNCTION get_next_match_for_simulation()
RETURNS TABLE(
  fixture_id UUID,
  home_team_id UUID,
  away_team_id UUID,
  scheduled_at TIMESTAMP,
  tier INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.home_team_id,
    f.away_team_id,
    f.scheduled_at,
    COALESCE(f.tier, 1) as tier
  FROM fixtures f
  WHERE f.status = 'scheduled'
  ORDER BY f.scheduled_at ASC, COALESCE(f.tier, 1) ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate player form changes after match
CREATE OR REPLACE FUNCTION update_player_form_after_match(
  player_id UUID,
  match_rating DECIMAL,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  cards INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_form INTEGER;
  form_change DECIMAL;
  new_form INTEGER;
BEGIN
  -- Get current form
  SELECT COALESCE(form, 5) INTO current_form FROM players WHERE id = player_id;
  
  -- Calculate form change
  form_change := 0;
  
  -- Match rating impact
  IF match_rating >= 8 THEN form_change := form_change + 0.5;
  ELSIF match_rating >= 7 THEN form_change := form_change + 0.2;
  ELSIF match_rating < 5 THEN form_change := form_change - 0.3;
  ELSIF match_rating < 4 THEN form_change := form_change - 0.5;
  END IF;
  
  -- Goals and assists boost
  form_change := form_change + (goals * 0.3) + (assists * 0.2);
  
  -- Cards penalty
  form_change := form_change - (cards * 0.2);
  
  -- Calculate new form (1-10 scale)
  new_form := GREATEST(1, LEAST(10, current_form + form_change));
  
  -- Update player
  UPDATE players 
  SET form = new_form,
      last_match_rating = match_rating
  WHERE id = player_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixtures_status_scheduled ON fixtures(status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_fixtures_tier_scheduled ON fixtures(tier, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_standings_season_tier ON standings(season_number, tier);
CREATE INDEX IF NOT EXISTS idx_player_match_performance_match ON player_match_performance(finished_match_id);
CREATE INDEX IF NOT EXISTS idx_finished_matches_season ON finished_matches(season_number, tier);

-- Try to add tables to realtime publication (ignore if already exists)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE player_match_performance;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE standings;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
END $$;
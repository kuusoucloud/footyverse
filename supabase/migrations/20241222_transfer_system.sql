-- Enhanced transfer system with realistic mechanics

-- Add transfer-related columns to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS transfer_budget INTEGER DEFAULT 50000000;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS wage_budget INTEGER DEFAULT 2000000;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS current_wages INTEGER DEFAULT 0;

-- Add wage and transfer-related columns to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS weekly_wage INTEGER DEFAULT 10000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS transfer_listed BOOLEAN DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS contract_length INTEGER DEFAULT 3;
ALTER TABLE players ADD COLUMN IF NOT EXISTS loyalty INTEGER DEFAULT 50; -- 0-100 scale
ALTER TABLE players ADD COLUMN IF NOT EXISTS form_rating INTEGER DEFAULT 50; -- Recent performance
ALTER TABLE players ADD COLUMN IF NOT EXISTS international_caps INTEGER DEFAULT 0;

-- Create transfer windows table
CREATE TABLE IF NOT EXISTS transfer_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id),
  window_type TEXT NOT NULL, -- 'summer', 'winter'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transfers table with more details
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_type TEXT DEFAULT 'permanent'; -- 'permanent', 'loan'
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS weekly_wage INTEGER;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS agent_fee INTEGER DEFAULT 0;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS contract_length INTEGER DEFAULT 3;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_window_id UUID REFERENCES transfer_windows(id);

-- Create transfer bids table
CREATE TABLE IF NOT EXISTS transfer_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  bidding_team_id UUID REFERENCES teams(id),
  selling_team_id UUID REFERENCES teams(id),
  bid_amount INTEGER NOT NULL,
  weekly_wage_offer INTEGER NOT NULL,
  contract_length INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  bid_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player interests table (which teams are interested in which players)
CREATE TABLE IF NOT EXISTS player_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  interest_level INTEGER DEFAULT 50, -- 0-100 scale
  position_need TEXT, -- 'high', 'medium', 'low'
  max_bid_amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Create youth academy table for generating new players
CREATE TABLE IF NOT EXISTS youth_academy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT NOT NULL,
  age INTEGER DEFAULT 16,
  potential_rating INTEGER, -- How good they could become
  current_rating INTEGER, -- Current ability
  ready_for_first_team BOOLEAN DEFAULT false,
  graduation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert transfer windows for current season
INSERT INTO transfer_windows (season_id, window_type, start_date, end_date, is_active)
SELECT 
  s.id,
  'summer',
  DATE(s.started_at),
  DATE(s.started_at + INTERVAL '2 months'),
  true
FROM seasons s WHERE s.year = 2024
ON CONFLICT DO NOTHING;

INSERT INTO transfer_windows (season_id, window_type, start_date, end_date, is_active)
SELECT 
  s.id,
  'winter',
  DATE(s.started_at + INTERVAL '5 months'),
  DATE(s.started_at + INTERVAL '6 months'),
  false
FROM seasons s WHERE s.year = 2024
ON CONFLICT DO NOTHING;

-- Function to calculate player market value based on attributes
CREATE OR REPLACE FUNCTION calculate_market_value(player_attributes JSONB, player_age INTEGER, team_tier INTEGER)
RETURNS INTEGER AS $$
DECLARE
  base_value INTEGER;
  age_modifier DECIMAL;
  tier_modifier DECIMAL;
  attribute_avg DECIMAL;
BEGIN
  -- Calculate average of all attributes
  SELECT AVG(value::INTEGER) INTO attribute_avg
  FROM jsonb_each_text(player_attributes);
  
  -- Base value from attributes (higher attributes = higher value)
  base_value := (attribute_avg * 100000)::INTEGER;
  
  -- Age modifier (peak at 25-28)
  CASE 
    WHEN player_age <= 20 THEN age_modifier := 0.8;
    WHEN player_age <= 23 THEN age_modifier := 1.1;
    WHEN player_age <= 28 THEN age_modifier := 1.3;
    WHEN player_age <= 30 THEN age_modifier := 1.0;
    WHEN player_age <= 32 THEN age_modifier := 0.7;
    ELSE age_modifier := 0.4;
  END CASE;
  
  -- Tier modifier (higher tier teams have more valuable players)
  tier_modifier := (6 - team_tier) * 0.3 + 0.7;
  
  RETURN (base_value * age_modifier * tier_modifier)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE transfer_windows;
ALTER PUBLICATION supabase_realtime ADD TABLE transfer_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE player_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE youth_academy;
-- Complete football ecosystem with seasons, cups, injuries, and automation

-- Add missing columns to existing tables
ALTER TABLE players ADD COLUMN IF NOT EXISTS injury_status TEXT DEFAULT 'fit';
ALTER TABLE players ADD COLUMN IF NOT EXISTS injury_until DATE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS contract_expires DATE DEFAULT (CURRENT_DATE + INTERVAL '3 years');
ALTER TABLE players ADD COLUMN IF NOT EXISTS market_value INTEGER DEFAULT 1000000;

-- Add season status
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Create cups table for knockout competitions
CREATE TABLE IF NOT EXISTS cups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  season_id UUID REFERENCES seasons(id),
  current_round TEXT DEFAULT 'round_1',
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cup fixtures table
CREATE TABLE IF NOT EXISTS cup_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cup_id UUID REFERENCES cups(id),
  round TEXT NOT NULL,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  winner_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player injuries table
CREATE TABLE IF NOT EXISTS player_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  injury_type TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'minor', 'moderate', 'severe'
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_return DATE,
  actual_return DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  from_team_id UUID REFERENCES teams(id),
  to_team_id UUID REFERENCES teams(id),
  transfer_fee INTEGER,
  transfer_date DATE DEFAULT CURRENT_DATE,
  season_id UUID REFERENCES seasons(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retirement table
CREATE TABLE IF NOT EXISTS player_retirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  retirement_date DATE DEFAULT CURRENT_DATE,
  reason TEXT, -- 'age', 'injury', 'personal'
  final_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promotion/relegation history
CREATE TABLE IF NOT EXISTS promotion_relegation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  season_id UUID REFERENCES seasons(id),
  from_tier INTEGER,
  to_tier INTEGER,
  type TEXT, -- 'promotion', 'relegation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update current season to be active
UPDATE seasons SET is_active = true WHERE year = 2024;

-- Insert cup competition
INSERT INTO cups (name, season_id)
SELECT 'FA Cup', id FROM seasons WHERE year = 2024
ON CONFLICT DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE cups;
ALTER PUBLICATION supabase_realtime ADD TABLE cup_fixtures;
ALTER PUBLICATION supabase_realtime ADD TABLE player_injuries;
ALTER PUBLICATION supabase_realtime ADD TABLE transfers;
ALTER PUBLICATION supabase_realtime ADD TABLE player_retirements;
ALTER PUBLICATION supabase_realtime ADD TABLE promotion_relegation;
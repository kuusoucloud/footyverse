-- Fix database schema issues causing 400 errors

-- Add missing columns to player_injuries table
ALTER TABLE player_injuries ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to transfers table  
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS fee INTEGER DEFAULT 0;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- Update existing transfers to have proper fee values
UPDATE transfers SET fee = transfer_fee WHERE fee IS NULL AND transfer_fee IS NOT NULL;
UPDATE transfers SET date = transfer_date::date WHERE date IS NULL AND transfer_date IS NOT NULL;

-- Add missing overall_rating column to players if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS overall_rating INTEGER;

-- Update overall_rating based on current_elo for existing players
UPDATE players 
SET overall_rating = CASE 
    WHEN current_elo >= 2000 THEN 90 + (current_elo - 2000) / 50
    WHEN current_elo >= 1800 THEN 80 + (current_elo - 1800) / 20
    WHEN current_elo >= 1600 THEN 70 + (current_elo - 1600) / 20
    WHEN current_elo >= 1400 THEN 60 + (current_elo - 1400) / 20
    ELSE 50 + (current_elo - 1200) / 20
END
WHERE overall_rating IS NULL;

-- Ensure all players have team relationships
UPDATE players SET team_id = (
    SELECT id FROM teams WHERE tier = 1 LIMIT 1
) WHERE team_id IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_player_injuries_active ON player_injuries(is_active);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_team_standings_team_id ON team_standings(team_id);

-- Update any null team references in standings
DELETE FROM team_standings WHERE team_id IS NULL;

-- Ensure all teams have proper tier values
UPDATE teams SET tier = 1 WHERE tier IS NULL;

-- Add proper constraints
ALTER TABLE player_injuries ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE transfers ALTER COLUMN fee SET DEFAULT 0;
ALTER TABLE players ALTER COLUMN overall_rating SET DEFAULT 50;
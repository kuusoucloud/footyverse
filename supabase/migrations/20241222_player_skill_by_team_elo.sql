-- Update player skill ratings based on team ELO while maintaining team averages
-- This will distribute player skills around the team's ELO rating

-- First, let's add a skill_rating column if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS skill_rating INTEGER DEFAULT 50;

-- Update player skill ratings based on team ELO with realistic distribution
WITH team_elo_data AS (
  SELECT 
    id as team_id,
    elo,
    -- Convert ELO to a 0-99 scale (ELO typically ranges from ~800-2200)
    GREATEST(0, LEAST(99, ROUND((elo - 800) * 99.0 / 1400.0))) as base_skill
  FROM teams
),
player_skill_assignments AS (
  SELECT 
    p.id,
    p.team_id,
    ted.base_skill,
    -- Create variation around the team's base skill
    -- Top players get +15 to +25 above base
    -- Average players get -5 to +10 above base  
    -- Weaker players get -15 to +5 above base
    CASE 
      WHEN ROW_NUMBER() OVER (PARTITION BY p.team_id ORDER BY COALESCE(p.market_value, 0) + COALESCE(p.form_rating, 5) * 100000 DESC) <= 3 THEN
        -- Top 3 players: base_skill + 15 to 25
        GREATEST(1, LEAST(99, ted.base_skill + 15 + (RANDOM() * 10)::INTEGER))
      WHEN ROW_NUMBER() OVER (PARTITION BY p.team_id ORDER BY COALESCE(p.market_value, 0) + COALESCE(p.form_rating, 5) * 100000 DESC) <= 8 THEN
        -- Next 5 players: base_skill + 5 to 15
        GREATEST(1, LEAST(99, ted.base_skill + 5 + (RANDOM() * 10)::INTEGER))
      WHEN ROW_NUMBER() OVER (PARTITION BY p.team_id ORDER BY COALESCE(p.market_value, 0) + COALESCE(p.form_rating, 5) * 100000 DESC) <= 15 THEN
        -- Next 7 players: base_skill - 5 to +10
        GREATEST(1, LEAST(99, ted.base_skill - 5 + (RANDOM() * 15)::INTEGER))
      ELSE
        -- Remaining players: base_skill - 15 to +5
        GREATEST(1, LEAST(99, ted.base_skill - 15 + (RANDOM() * 20)::INTEGER))
    END as new_skill_rating
  FROM players p
  JOIN team_elo_data ted ON p.team_id = ted.team_id
)
UPDATE players 
SET skill_rating = psa.new_skill_rating
FROM player_skill_assignments psa
WHERE players.id = psa.id;

-- Update form_rating to match skill_rating for consistency (scaled to 1-10)
UPDATE players 
SET form_rating = GREATEST(1.0, LEAST(10.0, (skill_rating / 10.0) + (RANDOM() * 2 - 1)))
WHERE skill_rating IS NOT NULL;
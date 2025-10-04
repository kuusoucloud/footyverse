-- Update shirt numbers to give special numbers to high-skilled players
-- Reset all shirt numbers first
UPDATE players SET shirt_number = NULL;

-- Assign special numbers to top players by position and skill
WITH player_rankings AS (
  SELECT 
    id,
    team_id,
    position,
    name,
    (COALESCE(market_value, 0) + COALESCE(form_rating, 5) * 100000) as skill_score,
    ROW_NUMBER() OVER (PARTITION BY team_id, position ORDER BY (COALESCE(market_value, 0) + COALESCE(form_rating, 5) * 100000) DESC) as position_rank,
    ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY (COALESCE(market_value, 0) + COALESCE(form_rating, 5) * 100000) DESC) as team_rank
  FROM players
)
UPDATE players 
SET shirt_number = CASE 
  -- Goalkeepers get 1, 12, 22
  WHEN pr.position = 'GK' AND pr.position_rank = 1 THEN 1
  WHEN pr.position = 'GK' AND pr.position_rank = 2 THEN 12
  WHEN pr.position = 'GK' AND pr.position_rank >= 3 THEN 22
  
  -- Top defenders get 2-6
  WHEN pr.position = 'DF' AND pr.position_rank = 1 THEN 2
  WHEN pr.position = 'DF' AND pr.position_rank = 2 THEN 3
  WHEN pr.position = 'DF' AND pr.position_rank = 3 THEN 4
  WHEN pr.position = 'DF' AND pr.position_rank = 4 THEN 5
  WHEN pr.position = 'DF' AND pr.position_rank = 5 THEN 6
  WHEN pr.position = 'DF' AND pr.position_rank >= 6 THEN 13 + (pr.position_rank - 6)
  
  -- Special midfield numbers for top players
  WHEN pr.position = 'MF' AND pr.team_rank = 1 THEN 10  -- Best player gets 10
  WHEN pr.position = 'MF' AND pr.position_rank = 1 AND pr.team_rank != 1 THEN 8
  WHEN pr.position = 'MF' AND pr.position_rank = 2 THEN 6
  WHEN pr.position = 'MF' AND pr.position_rank = 3 THEN 14
  WHEN pr.position = 'MF' AND pr.position_rank = 4 THEN 16
  WHEN pr.position = 'MF' AND pr.position_rank >= 5 THEN 17 + (pr.position_rank - 5)
  
  -- Special forward numbers for top players
  WHEN pr.position = 'FW' AND pr.position_rank = 1 AND pr.team_rank <= 2 THEN 9  -- Top striker gets 9
  WHEN pr.position = 'FW' AND pr.position_rank = 1 AND pr.team_rank > 2 THEN 11
  WHEN pr.position = 'FW' AND pr.position_rank = 2 THEN 7   -- Second striker gets 7
  WHEN pr.position = 'FW' AND pr.position_rank = 3 THEN 11
  WHEN pr.position = 'FW' AND pr.position_rank = 4 THEN 21
  WHEN pr.position = 'FW' AND pr.position_rank >= 5 THEN 18 + (pr.position_rank - 5)
  
  ELSE 23  -- Fallback
END
FROM player_rankings pr
WHERE players.id = pr.id;
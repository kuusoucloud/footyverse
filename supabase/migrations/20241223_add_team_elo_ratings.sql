-- Add ELO rating column to teams table and populate with tier-based ratings

-- First, add the elo_rating column if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS elo_rating integer DEFAULT 1000;

-- Now populate ELO ratings for all teams based on their tier
DO $$
DECLARE
  team_record RECORD;
  base_elo integer;
  random_variation integer;
  final_elo integer;
BEGIN
  -- Update ELO ratings for all teams based on tier
  FOR team_record IN 
    SELECT id, name, tier FROM teams ORDER BY tier ASC, name ASC
  LOOP
    -- Set base ELO by tier
    CASE team_record.tier
      WHEN 1 THEN base_elo := 1600; -- Premier League equivalent
      WHEN 2 THEN base_elo := 1450; -- Championship equivalent  
      WHEN 3 THEN base_elo := 1300; -- League One equivalent
      WHEN 4 THEN base_elo := 1150; -- League Two equivalent
      WHEN 5 THEN base_elo := 1000; -- Non-league equivalent
      ELSE base_elo := 1000;
    END CASE;
    
    -- Add random variation within tier (±100 points)
    random_variation := (RANDOM() * 200 - 100)::integer;
    final_elo := base_elo + random_variation;
    
    -- Ensure minimum ELO of 800
    IF final_elo < 800 THEN
      final_elo := 800;
    END IF;
    
    -- Update team ELO rating
    UPDATE teams 
    SET elo_rating = final_elo
    WHERE id = team_record.id;
    
    RAISE NOTICE 'Set % (Tier %) ELO to %', team_record.name, team_record.tier, final_elo;
  END LOOP;
  
  RAISE NOTICE 'Updated ELO ratings for all teams based on tier structure';
  
END;
$$;
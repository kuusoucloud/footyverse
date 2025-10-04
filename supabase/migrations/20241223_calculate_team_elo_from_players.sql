-- Calculate team ELO ratings based on average player skill ratings
-- This makes team strength truly reflect the quality of their players

DO $$
DECLARE
  team_record RECORD;
  avg_skill_rating numeric;
  calculated_elo integer;
BEGIN
  -- Update ELO ratings for all teams based on their players' average skill rating
  FOR team_record IN 
    SELECT id, name, tier FROM teams ORDER BY tier ASC, name ASC
  LOOP
    -- Calculate average skill rating for this team's players
    SELECT AVG(skill_rating) INTO avg_skill_rating
    FROM players 
    WHERE team_id = team_record.id;
    
    -- If team has no players, use tier-based default
    IF avg_skill_rating IS NULL THEN
      CASE team_record.tier
        WHEN 1 THEN calculated_elo := 1600;
        WHEN 2 THEN calculated_elo := 1450;
        WHEN 3 THEN calculated_elo := 1300;
        WHEN 4 THEN calculated_elo := 1150;
        WHEN 5 THEN calculated_elo := 1000;
        ELSE calculated_elo := 1000;
      END CASE;
    ELSE
      -- Convert skill rating (0-100) to ELO rating (800-2000)
      -- Formula: ELO = 800 + (skill_rating * 12)
      -- This maps: 0 skill -> 800 ELO, 50 skill -> 1400 ELO, 100 skill -> 2000 ELO
      calculated_elo := 800 + (avg_skill_rating * 12)::integer;
      
      -- Ensure ELO stays within reasonable bounds
      IF calculated_elo < 800 THEN
        calculated_elo := 800;
      ELSIF calculated_elo > 2000 THEN
        calculated_elo := 2000;
      END IF;
    END IF;
    
    -- Update team ELO rating
    UPDATE teams 
    SET elo_rating = calculated_elo
    WHERE id = team_record.id;
    
    RAISE NOTICE 'Team % (Tier %): Avg Skill = %, ELO = %', 
      team_record.name, team_record.tier, 
      COALESCE(ROUND(avg_skill_rating, 1), 0), calculated_elo;
  END LOOP;
  
  RAISE NOTICE 'Updated all team ELO ratings based on player skill averages';
  
END;
$$;
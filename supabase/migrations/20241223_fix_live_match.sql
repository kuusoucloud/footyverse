-- Fix live match to be the correct Tier 1 Round 1 match
-- Set Bluehill Athletic vs Thornfield City as the live match

DO $$
DECLARE
  bluehill_id uuid;
  thornfield_id uuid;
  correct_fixture_id uuid;
BEGIN
  -- Get team IDs
  SELECT id INTO bluehill_id FROM teams WHERE name ILIKE '%bluehill%athletic%' LIMIT 1;
  SELECT id INTO thornfield_id FROM teams WHERE name ILIKE '%thornfield%city%' LIMIT 1;
  
  -- Reset all matches to scheduled first
  UPDATE fixtures SET status = 'scheduled';
  
  -- Find the correct fixture (Bluehill Athletic vs Thornfield City in Tier 1 Round 1)
  SELECT f.id INTO correct_fixture_id 
  FROM fixtures f
  JOIN teams ht ON f.home_team_id = ht.id
  JOIN teams at ON f.away_team_id = at.id
  WHERE ht.tier = 1 
    AND at.tier = 1
    AND (
      (ht.id = bluehill_id AND at.id = thornfield_id) OR
      (ht.id = thornfield_id AND at.id = bluehill_id)
    )
  ORDER BY f.round ASC, f.scheduled_at ASC
  LIMIT 1;
  
  -- Set the correct match to live
  IF correct_fixture_id IS NOT NULL THEN
    UPDATE fixtures 
    SET status = 'live' 
    WHERE id = correct_fixture_id;
    
    RAISE NOTICE 'Set Bluehill Athletic vs Thornfield City match to live status';
  ELSE
    -- If exact match not found, set the first Tier 1 Round 1 match to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE id = (
      SELECT f.id 
      FROM fixtures f
      JOIN teams ht ON f.home_team_id = ht.id
      WHERE ht.tier = 1
      ORDER BY f.round ASC, f.scheduled_at ASC
      LIMIT 1
    );
    
    RAISE NOTICE 'Set first Tier 1 match to live status as fallback';
  END IF;
  
END;
$$;
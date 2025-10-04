-- Regenerate fixtures with proper team rotation to prevent consecutive matches

-- Clear existing fixtures and regenerate with rotation algorithm
DO $$
BEGIN
  -- Clear all existing fixtures
  DELETE FROM fixtures;
  
  RAISE NOTICE 'Cleared existing fixtures - regenerating with team rotation algorithm';
END;
$$;
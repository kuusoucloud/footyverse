-- Clear fixtures and force regeneration with proper rotation algorithm

-- Clear all existing fixtures first
DELETE FROM fixtures;

-- Log that we cleared fixtures
DO $$
BEGIN
  RAISE NOTICE 'Cleared all fixtures - edge function will regenerate with rotation algorithm';
END;
$$;
-- Simple fixture sequence check to identify team rotation issues
-- This will help us see what's actually happening with the sequencing

-- First, let's see the current fixture sequence
SELECT 
    f.sequence_order,
    ht.tier,
    ht.name as home_team,
    at.name as away_team,
    f.round,
    f.status
FROM fixtures f
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE f.sequence_order IS NOT NULL
ORDER BY f.sequence_order
LIMIT 15;

-- Check if the sequencing function is working correctly
-- Let's re-run the sequencing to fix any issues
SELECT sequence_new_fixtures();
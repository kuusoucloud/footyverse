-- Check the first 15 fixtures to see if tier rotation is working
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
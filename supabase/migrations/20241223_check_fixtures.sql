-- Check fixture generation results
SELECT 
    'Total fixtures' as metric,
    COUNT(*) as count
FROM fixtures 
WHERE status = 'scheduled'

UNION ALL

SELECT 
    'Tier ' || ht.tier || ' fixtures' as metric,
    COUNT(*) as count
FROM fixtures f
JOIN teams ht ON f.home_team_id = ht.id
WHERE f.status = 'scheduled'
GROUP BY ht.tier
ORDER BY metric;
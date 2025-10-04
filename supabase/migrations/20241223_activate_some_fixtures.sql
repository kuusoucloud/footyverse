-- Set some fixtures to live status for immediate viewing
-- Update the earliest fixtures from each tier to be live

UPDATE fixtures 
SET status = 'live',
    home_score = FLOOR(RANDOM() * 3),
    away_score = FLOOR(RANDOM() * 3),
    minute = 45 + FLOOR(RANDOM() * 45)
WHERE id IN (
    SELECT DISTINCT ON (ht.tier) f.id
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    WHERE f.status = 'scheduled'
    ORDER BY ht.tier, f.scheduled_at
    LIMIT 10
);

-- Also set some recent fixtures to completed status
UPDATE fixtures 
SET status = 'completed',
    home_score = FLOOR(RANDOM() * 4),
    away_score = FLOOR(RANDOM() * 4),
    minute = 90
WHERE id IN (
    SELECT f.id
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    WHERE f.status = 'scheduled'
    AND f.scheduled_at < now()
    ORDER BY f.scheduled_at
    LIMIT 50
);

-- Show updated fixture counts
SELECT 
    status,
    COUNT(*) as count
FROM fixtures 
GROUP BY status
ORDER BY status;
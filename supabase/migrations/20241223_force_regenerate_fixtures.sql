-- Force regenerate all fixtures with tier rotation rules
-- Clear all existing fixtures
DELETE FROM fixtures;

-- Simple direct approach - generate fixtures with tier rotation
WITH 
-- Get current season and leagues
current_season AS (
    SELECT id as season_id FROM seasons WHERE year = 2024 LIMIT 1
),
tier_leagues AS (
    SELECT l.id as league_id, l.tier 
    FROM leagues l, current_season s 
    WHERE l.season_id = s.season_id
),
-- Generate all possible team pairings for each tier
team_pairings AS (
    SELECT 
        h.id as home_team_id,
        a.id as away_team_id,
        h.tier,
        tl.league_id,
        cs.season_id,
        ROW_NUMBER() OVER (PARTITION BY h.tier ORDER BY h.name, a.name) as pairing_num
    FROM teams h
    CROSS JOIN teams a
    JOIN tier_leagues tl ON h.tier = tl.tier
    CROSS JOIN current_season cs
    WHERE h.id != a.id 
    AND h.tier = a.tier
),
-- Limit to 38 matches per tier
limited_pairings AS (
    SELECT *
    FROM team_pairings
    WHERE pairing_num <= 38
),
-- Add tier rotation scheduling
scheduled_fixtures AS (
    SELECT 
        gen_random_uuid() as id,
        home_team_id,
        away_team_id,
        league_id,
        season_id,
        tier,
        pairing_num,
        -- Tier rotation: T1,T2,T3,T4,T5,T1,T2... 
        NOW() + INTERVAL '2 hours' * ((pairing_num - 1) * 5 + (tier - 1)) as scheduled_at,
        CASE WHEN ((pairing_num - 1) * 5 + (tier - 1)) = 0 THEN 'live' ELSE 'scheduled' END as status,
        CEIL(pairing_num / 10.0) as round
    FROM limited_pairings
)
-- Insert the fixtures
INSERT INTO fixtures (
    id, home_team_id, away_team_id, league_id, season_id, 
    scheduled_at, status, round
)
SELECT 
    id, home_team_id, away_team_id, league_id, season_id,
    scheduled_at, status, round
FROM scheduled_fixtures
ORDER BY scheduled_at;

-- Verify results
SELECT 
    l.tier,
    l.name as league_name,
    COUNT(*) as fixture_count,
    MIN(f.scheduled_at) as first_match,
    MAX(f.scheduled_at) as last_match,
    COUNT(CASE WHEN f.status = 'live' THEN 1 END) as live_matches
FROM fixtures f
JOIN leagues l ON f.league_id = l.id
GROUP BY l.tier, l.name
ORDER BY l.tier;
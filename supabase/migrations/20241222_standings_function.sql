-- Create standings function for league tables
CREATE OR REPLACE FUNCTION get_league_standings(league_tier INTEGER DEFAULT 1)
RETURNS TABLE (
    team_id INTEGER,
    team_name TEXT,
    matches_played INTEGER,
    wins INTEGER,
    draws INTEGER,
    losses INTEGER,
    goals_for INTEGER,
    goals_against INTEGER,
    goal_difference INTEGER,
    points INTEGER,
    transfer_budget BIGINT,
    wealth_category TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        COALESCE(stats.matches_played, 0) as matches_played,
        COALESCE(stats.wins, 0) as wins,
        COALESCE(stats.draws, 0) as draws,
        COALESCE(stats.losses, 0) as losses,
        COALESCE(stats.goals_for, 0) as goals_for,
        COALESCE(stats.goals_against, 0) as goals_against,
        COALESCE(stats.goals_for, 0) - COALESCE(stats.goals_against, 0) as goal_difference,
        COALESCE(stats.wins, 0) * 3 + COALESCE(stats.draws, 0) as points,
        t.transfer_budget,
        t.wealth_category
    FROM teams t
    LEFT JOIN (
        SELECT 
            team_id,
            COUNT(*) as matches_played,
            SUM(CASE WHEN result = 'W' THEN 1 ELSE 0 END) as wins,
            SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
            SUM(CASE WHEN result = 'L' THEN 1 ELSE 0 END) as losses,
            SUM(goals_for) as goals_for,
            SUM(goals_against) as goals_against
        FROM (
            -- Home matches
            SELECT 
                home_team_id as team_id,
                CASE 
                    WHEN home_score > away_score THEN 'W'
                    WHEN home_score = away_score THEN 'D'
                    ELSE 'L'
                END as result,
                home_score as goals_for,
                away_score as goals_against
            FROM matches 
            WHERE status = 'completed' AND tier = league_tier
            
            UNION ALL
            
            -- Away matches
            SELECT 
                away_team_id as team_id,
                CASE 
                    WHEN away_score > home_score THEN 'W'
                    WHEN away_score = home_score THEN 'D'
                    ELSE 'L'
                END as result,
                away_score as goals_for,
                home_score as goals_against
            FROM matches 
            WHERE status = 'completed' AND tier = league_tier
        ) match_results
        GROUP BY team_id
    ) stats ON t.id = stats.team_id
    WHERE t.tier = league_tier
    ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_name;
END;
$$;
-- Update promotion/relegation system to top 3 up, bottom 3 down
-- This replaces the previous 2 up/2 down system

CREATE OR REPLACE FUNCTION process_promotions_relegations(completed_season INTEGER)
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    promoted_teams UUID[];
    relegated_teams UUID[];
BEGIN
    RAISE NOTICE 'Processing promotions and relegations for season % (3 up, 3 down)', completed_season;
    
    -- Process each tier (except tier 1 for promotion and tier 5 for relegation)
    FOR tier_num IN 1..5 LOOP
        -- Get bottom 3 teams from current tier (except tier 5)
        IF tier_num < 5 THEN
            SELECT ARRAY_AGG(team_id) INTO relegated_teams
            FROM (
                SELECT 
                    t.id as team_id,
                    COUNT(CASE WHEN (fm.home_team_id = t.id AND fm.home_score > fm.away_score) 
                              OR (fm.away_team_id = t.id AND fm.away_score > fm.home_score) THEN 1 END) * 3 +
                    COUNT(CASE WHEN fm.home_score = fm.away_score THEN 1 END) as points
                FROM teams t
                LEFT JOIN finished_matches fm ON (fm.home_team_id = t.id OR fm.away_team_id = t.id)
                    AND fm.season_number = completed_season
                WHERE t.tier = tier_num
                GROUP BY t.id
                ORDER BY points ASC
                LIMIT 3
            ) bottom_teams;
            
            -- Relegate teams
            UPDATE teams 
            SET tier = tier + 1 
            WHERE id = ANY(relegated_teams) AND tier < 5;
            
            RAISE NOTICE 'Relegated % teams from Tier % to Tier %', array_length(relegated_teams, 1), tier_num, tier_num + 1;
        END IF;
        
        -- Get top 3 teams from tier below (except tier 1)
        IF tier_num > 1 THEN
            SELECT ARRAY_AGG(team_id) INTO promoted_teams
            FROM (
                SELECT 
                    t.id as team_id,
                    COUNT(CASE WHEN (fm.home_team_id = t.id AND fm.home_score > fm.away_score) 
                              OR (fm.away_team_id = t.id AND fm.away_score > fm.home_score) THEN 1 END) * 3 +
                    COUNT(CASE WHEN fm.home_score = fm.away_score THEN 1 END) as points
                FROM teams t
                LEFT JOIN finished_matches fm ON (fm.home_team_id = t.id OR fm.away_team_id = t.id)
                    AND fm.season_number = completed_season
                WHERE t.tier = tier_num
                GROUP BY t.id
                ORDER BY points DESC
                LIMIT 3
            ) top_teams;
            
            -- Promote teams
            UPDATE teams 
            SET tier = tier - 1 
            WHERE id = ANY(promoted_teams) AND tier > 1;
            
            RAISE NOTICE 'Promoted % teams from Tier % to Tier %', array_length(promoted_teams, 1), tier_num, tier_num - 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Promotions and relegations completed (3 up, 3 down system)';
END;
$$ LANGUAGE plpgsql;
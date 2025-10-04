-- Add odds column to fixtures table
ALTER TABLE fixtures ADD COLUMN IF NOT EXISTS odds jsonb DEFAULT '{}';

-- Create function to update team standings
CREATE OR REPLACE FUNCTION update_team_standings(
    p_team_id uuid,
    p_season_id uuid,
    p_league_id uuid,
    p_goals_for integer,
    p_goals_against integer,
    p_won integer,
    p_drawn integer,
    p_lost integer
) RETURNS void AS $$
BEGIN
    INSERT INTO team_standings (
        team_id, season_id, league_id, played, won, drawn, lost, gf, ga
    ) VALUES (
        p_team_id, p_season_id, p_league_id, 1, p_won, p_drawn, p_lost, p_goals_for, p_goals_against
    )
    ON CONFLICT (season_id, league_id, team_id) 
    DO UPDATE SET
        played = team_standings.played + 1,
        won = team_standings.won + p_won,
        drawn = team_standings.drawn + p_drawn,
        lost = team_standings.lost + p_lost,
        gf = team_standings.gf + p_goals_for,
        ga = team_standings.ga + p_goals_against;
END;
$$ LANGUAGE plpgsql;

-- Create automated fixture generation function
CREATE OR REPLACE FUNCTION generate_season_fixtures(p_season_id uuid) RETURNS integer AS $$
DECLARE
    league_record RECORD;
    team_record RECORD;
    teams_array uuid[];
    fixture_count integer := 0;
    round_num integer;
    match_date timestamp with time zone;
BEGIN
    FOR league_record IN 
        SELECT * FROM leagues WHERE season_id = p_season_id
    LOOP
        SELECT array_agg(id) INTO teams_array
        FROM teams 
        WHERE tier = league_record.tier;
        
        IF array_length(teams_array, 1) < 2 THEN
            CONTINUE;
        END IF;
        
        FOR round_num IN 1..10 LOOP
            match_date := now() + (round_num * interval '3 days') + (random() * interval '2 hours');
            
            FOR i IN 1..array_length(teams_array, 1) BY 2 LOOP
                IF i + 1 <= array_length(teams_array, 1) THEN
                    INSERT INTO fixtures (
                        season_id, league_id, round, 
                        home_team_id, away_team_id, 
                        scheduled_at, status
                    ) VALUES (
                        p_season_id, league_record.id, round_num,
                        teams_array[i], teams_array[i + 1],
                        match_date, 'scheduled'
                    );
                    fixture_count := fixture_count + 1;
                END IF;
            END LOOP;
            
            IF array_length(teams_array, 1) > 2 THEN
                teams_array := teams_array[1:1] || teams_array[3:] || teams_array[2:2];
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN fixture_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to start continuous matches
CREATE OR REPLACE FUNCTION start_continuous_matches() RETURNS void AS $$
DECLARE
    fixture_ids uuid[];
BEGIN
    PERFORM generate_season_fixtures((SELECT id FROM seasons WHERE year = 2024 LIMIT 1));
    
    SELECT array_agg(id) INTO fixture_ids
    FROM fixtures 
    WHERE status = 'scheduled' 
    AND scheduled_at > now() + interval '1 hour'
    ORDER BY scheduled_at
    LIMIT 5;
    
    UPDATE fixtures 
    SET scheduled_at = now() + (random() * interval '1 minute')
    WHERE id = ANY(fixture_ids);
END;
$$ LANGUAGE plpgsql;
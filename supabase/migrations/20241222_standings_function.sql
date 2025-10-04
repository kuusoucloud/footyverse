-- Create function to update team standings
CREATE OR REPLACE FUNCTION update_team_standings(
  p_team_id UUID,
  p_league_id UUID, 
  p_season_id UUID,
  p_result TEXT,
  p_goals_for INTEGER,
  p_goals_against INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO team_standings (
    season_id, league_id, team_id, played, won, drawn, lost, gf, ga
  )
  VALUES (
    p_season_id, p_league_id, p_team_id, 1,
    CASE WHEN p_result = 'W' THEN 1 ELSE 0 END,
    CASE WHEN p_result = 'D' THEN 1 ELSE 0 END,
    CASE WHEN p_result = 'L' THEN 1 ELSE 0 END,
    p_goals_for, p_goals_against
  )
  ON CONFLICT (season_id, league_id, team_id)
  DO UPDATE SET
    played = team_standings.played + 1,
    won = team_standings.won + CASE WHEN p_result = 'W' THEN 1 ELSE 0 END,
    drawn = team_standings.drawn + CASE WHEN p_result = 'D' THEN 1 ELSE 0 END,
    lost = team_standings.lost + CASE WHEN p_result = 'L' THEN 1 ELSE 0 END,
    gf = team_standings.gf + p_goals_for,
    ga = team_standings.ga + p_goals_against;
END;
$$ LANGUAGE plpgsql;
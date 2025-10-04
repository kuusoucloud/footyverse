-- Populate team standings for all tiers to ensure all teams appear in standings
-- This ensures every team has a standings entry

-- Insert team standings for all teams that don't have standings yet
INSERT INTO team_standings (season_id, league_id, team_id, played, won, drawn, lost, gf, ga)
SELECT 
    s.id as season_id,
    l.id as league_id,
    t.id as team_id,
    (random() * 10)::integer as played,
    (random() * 8)::integer as won,
    (random() * 3)::integer as drawn,
    (random() * 5)::integer as lost,
    (random() * 20)::integer as gf,
    (random() * 15)::integer as ga
FROM teams t
JOIN leagues l ON t.tier = l.tier
JOIN seasons s ON l.season_id = s.id
WHERE NOT EXISTS (
    SELECT 1 FROM team_standings ts 
    WHERE ts.team_id = t.id AND ts.league_id = l.id AND ts.season_id = s.id
);
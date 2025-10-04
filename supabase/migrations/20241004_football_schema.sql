-- Football 3D Viewer Database Schema

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    tier integer NOT NULL CHECK (tier >= 1 AND tier <= 5),
    crest_url text,
    primary_color text NOT NULL DEFAULT '#FF0000',
    secondary_color text NOT NULL DEFAULT '#FFFFFF',
    elo float NOT NULL DEFAULT 1000.0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    position text NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
    age integer NOT NULL CHECK (age >= 16 AND age <= 40),
    height_cm integer NOT NULL CHECK (height_cm >= 150 AND height_cm <= 220),
    weight_kg integer NOT NULL CHECK (weight_kg >= 50 AND weight_kg <= 120),
    foot text NOT NULL CHECK (foot IN ('L', 'R')) DEFAULT 'R',
    base_elo float NOT NULL DEFAULT 500.0,
    current_elo float NOT NULL DEFAULT 500.0,
    attributes jsonb NOT NULL DEFAULT '{
        "pace": 50, "accel": 50, "stamina": 50, "strength": 50,
        "passing": 50, "vision": 50, "finishing": 50, "heading": 50,
        "marking": 50, "tackling": 50, "reflexes": 50, "handling": 50,
        "positioning": 50, "composure": 50
    }',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year integer NOT NULL,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    tier integer NOT NULL CHECK (tier >= 1 AND tier <= 5),
    season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Fixtures table
CREATE TABLE IF NOT EXISTS fixtures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
    league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
    round integer NOT NULL,
    home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    scheduled_at timestamp with time zone NOT NULL,
    status text NOT NULL CHECK (status IN ('scheduled', 'live', 'finished')) DEFAULT 'scheduled',
    match_channel text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id uuid REFERENCES fixtures(id) ON DELETE CASCADE,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    home_goals integer DEFAULT 0,
    away_goals integer DEFAULT 0,
    state_blob jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
    minute integer NOT NULL,
    second integer NOT NULL DEFAULT 0,
    type text NOT NULL CHECK (type IN ('kickoff', 'shot', 'goal', 'card', 'substitution', 'foul', 'offside', 'save')),
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Player match stats table
CREATE TABLE IF NOT EXISTS player_match_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
    player_id uuid REFERENCES players(id) ON DELETE CASCADE,
    minutes integer NOT NULL DEFAULT 0,
    goals integer NOT NULL DEFAULT 0,
    assists integer NOT NULL DEFAULT 0,
    shots integer NOT NULL DEFAULT 0,
    xg float NOT NULL DEFAULT 0.0,
    key_passes integer NOT NULL DEFAULT 0,
    tackles integer NOT NULL DEFAULT 0,
    interceptions integer NOT NULL DEFAULT 0,
    saves integer NOT NULL DEFAULT 0,
    cs boolean NOT NULL DEFAULT false,
    rating float NOT NULL DEFAULT 6.0 CHECK (rating >= 1.0 AND rating <= 10.0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Team standings table
CREATE TABLE IF NOT EXISTS team_standings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id uuid REFERENCES seasons(id) ON DELETE CASCADE,
    league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    played integer NOT NULL DEFAULT 0,
    won integer NOT NULL DEFAULT 0,
    drawn integer NOT NULL DEFAULT 0,
    lost integer NOT NULL DEFAULT 0,
    gf integer NOT NULL DEFAULT 0,
    ga integer NOT NULL DEFAULT 0,
    gd integer GENERATED ALWAYS AS (gf - ga) STORED,
    points integer GENERATED ALWAYS AS (won * 3 + drawn) STORED,
    form_last5 text DEFAULT '',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(season_id, league_id, team_id)
);

-- ELO history table
CREATE TABLE IF NOT EXISTS elo_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL CHECK (entity_type IN ('team', 'player')),
    entity_id uuid NOT NULL,
    match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
    delta float NOT NULL,
    before_elo float NOT NULL,
    after_elo float NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_scheduled_at ON fixtures(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_matches_fixture_id ON matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_events_match_id ON events(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_match_id ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_player_id ON player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_team_standings_league_id ON team_standings(league_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_entity ON elo_history(entity_type, entity_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE team_standings;

-- Insert initial season
INSERT INTO seasons (year, started_at) 
VALUES (2024, timezone('utc'::text, now()))
ON CONFLICT DO NOTHING;

-- Insert leagues for the current season
WITH current_season AS (
    SELECT id FROM seasons WHERE year = 2024 LIMIT 1
)
INSERT INTO leagues (name, tier, season_id)
SELECT 
    CASE tier
        WHEN 1 THEN 'Premier Division'
        WHEN 2 THEN 'Championship'
        WHEN 3 THEN 'League One'
        WHEN 4 THEN 'League Two'
        WHEN 5 THEN 'National League'
    END,
    tier,
    (SELECT id FROM current_season)
FROM generate_series(1, 5) AS tier
ON CONFLICT DO NOTHING;
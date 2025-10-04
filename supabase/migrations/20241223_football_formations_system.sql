-- Football Formations System
-- Create formations table with popular tactical setups

CREATE TABLE IF NOT EXISTS formations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    formation_code text NOT NULL, -- e.g., "4-4-2", "3-5-2"
    positions jsonb NOT NULL, -- Array of position objects with x,y coordinates and role
    tactical_style text NOT NULL CHECK (tactical_style IN ('attacking', 'balanced', 'defensive', 'counter_attack', 'possession', 'high_press')),
    popularity_rating integer NOT NULL DEFAULT 50 CHECK (popularity_rating >= 1 AND popularity_rating <= 100),
    era text DEFAULT 'modern', -- classic, modern, contemporary
    strengths text[], -- Array of tactical strengths
    weaknesses text[], -- Array of tactical weaknesses
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Team formation preferences - which formations teams prefer and use
CREATE TABLE IF NOT EXISTS team_formations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
    preference_level text NOT NULL CHECK (preference_level IN ('primary', 'secondary', 'situational')) DEFAULT 'secondary',
    usage_frequency integer NOT NULL DEFAULT 20 CHECK (usage_frequency >= 0 AND usage_frequency <= 100), -- Percentage chance of using this formation
    vs_stronger_teams boolean DEFAULT false, -- Use against stronger opponents
    vs_weaker_teams boolean DEFAULT false, -- Use against weaker opponents
    home_preference boolean DEFAULT false, -- Prefer at home
    away_preference boolean DEFAULT false, -- Prefer away
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(team_id, formation_id)
);

-- Match formations - which formation each team used in a specific match
CREATE TABLE IF NOT EXISTS match_formations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
    fixture_id uuid REFERENCES fixtures(id) ON DELETE CASCADE,
    team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
    formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
    formation_change_minute integer DEFAULT 0, -- When formation was changed (0 = starting formation)
    reason text, -- Why formation was chosen/changed
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Insert popular football formations
INSERT INTO formations (name, display_name, description, formation_code, positions, tactical_style, popularity_rating, strengths, weaknesses) VALUES

-- 4-4-2 Classic
('442_classic', '4-4-2 Classic', 'Traditional English formation with two strikers and balanced midfield', '4-4-2', 
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "RM", "x": 45, "y": 85, "role": "winger"},
    {"position": "CM", "x": 45, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 35, "role": "central_midfielder"},
    {"position": "LM", "x": 45, "y": 15, "role": "winger"},
    {"position": "ST", "x": 70, "y": 65, "role": "striker"},
    {"position": "ST", "x": 70, "y": 35, "role": "striker"}
]'::jsonb, 
'balanced', 85, 
ARRAY['width', 'crossing', 'direct_play', 'aerial_threat'], 
ARRAY['midfield_overload', 'possession_weakness']),

-- 4-3-3 Modern
('433_modern', '4-3-3 Modern', 'Modern attacking formation with wingers and single striker', '4-3-3',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "CDM", "x": 40, "y": 50, "role": "defensive_midfielder"},
    {"position": "CM", "x": 50, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 50, "y": 35, "role": "central_midfielder"},
    {"position": "RW", "x": 70, "y": 80, "role": "winger"},
    {"position": "ST", "x": 70, "y": 50, "role": "striker"},
    {"position": "LW", "x": 70, "y": 20, "role": "winger"}
]'::jsonb,
'attacking', 90,
ARRAY['width', 'pace', 'pressing', 'possession'],
ARRAY['defensive_stability', 'aerial_weakness']),

-- 3-5-2 Tactical
('352_tactical', '3-5-2 Tactical', 'Three center-backs with wing-backs providing width', '3-5-2',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "CB", "x": 25, "y": 70, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 50, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 30, "role": "centre_back"},
    {"position": "RWB", "x": 45, "y": 85, "role": "wing_back"},
    {"position": "CM", "x": 45, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 50, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 35, "role": "central_midfielder"},
    {"position": "LWB", "x": 45, "y": 15, "role": "wing_back"},
    {"position": "ST", "x": 70, "y": 60, "role": "striker"},
    {"position": "ST", "x": 70, "y": 40, "role": "striker"}
]'::jsonb,
'balanced', 75,
ARRAY['midfield_control', 'flexibility', 'counter_attack'],
ARRAY['wide_vulnerability', 'wing_back_dependency']),

-- 4-2-3-1 Modern
('4231_modern', '4-2-3-1 Modern', 'Defensive stability with creative attacking midfield trio', '4-2-3-1',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "CDM", "x": 40, "y": 60, "role": "defensive_midfielder"},
    {"position": "CDM", "x": 40, "y": 40, "role": "defensive_midfielder"},
    {"position": "RAM", "x": 55, "y": 75, "role": "attacking_midfielder"},
    {"position": "CAM", "x": 55, "y": 50, "role": "attacking_midfielder"},
    {"position": "LAM", "x": 55, "y": 25, "role": "attacking_midfielder"},
    {"position": "ST", "x": 70, "y": 50, "role": "striker"}
]'::jsonb,
'balanced', 88,
ARRAY['defensive_stability', 'creativity', 'pressing'],
ARRAY['striker_isolation', 'width_dependency']),

-- 5-3-2 Defensive
('532_defensive', '5-3-2 Defensive', 'Ultra-defensive with five defenders and counter-attacking threat', '5-3-2',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RWB", "x": 25, "y": 85, "role": "wing_back"},
    {"position": "CB", "x": 25, "y": 70, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 50, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 30, "role": "centre_back"},
    {"position": "LWB", "x": 25, "y": 15, "role": "wing_back"},
    {"position": "CM", "x": 50, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 50, "y": 50, "role": "central_midfielder"},
    {"position": "CM", "x": 50, "y": 35, "role": "central_midfielder"},
    {"position": "ST", "x": 70, "y": 60, "role": "striker"},
    {"position": "ST", "x": 70, "y": 40, "role": "striker"}
]'::jsonb,
'defensive', 60,
ARRAY['defensive_solidity', 'counter_attack', 'set_pieces'],
ARRAY['attacking_limitation', 'possession_weakness']),

-- 4-1-4-1 Possession
('4141_possession', '4-1-4-1 Possession', 'Possession-based formation with deep-lying playmaker', '4-1-4-1',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "CDM", "x": 35, "y": 50, "role": "defensive_midfielder"},
    {"position": "RM", "x": 50, "y": 80, "role": "midfielder"},
    {"position": "CM", "x": 50, "y": 60, "role": "central_midfielder"},
    {"position": "CM", "x": 50, "y": 40, "role": "central_midfielder"},
    {"position": "LM", "x": 50, "y": 20, "role": "midfielder"},
    {"position": "ST", "x": 70, "y": 50, "role": "striker"}
]'::jsonb,
'possession', 70,
ARRAY['possession_control', 'passing_triangles', 'pressing'],
ARRAY['striker_isolation', 'pace_vulnerability']),

-- 3-4-3 Attacking
('343_attacking', '3-4-3 Attacking', 'Ultra-attacking formation with three forwards', '3-4-3',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "CB", "x": 25, "y": 70, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 50, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 30, "role": "centre_back"},
    {"position": "RM", "x": 45, "y": 80, "role": "midfielder"},
    {"position": "CM", "x": 45, "y": 60, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 40, "role": "central_midfielder"},
    {"position": "LM", "x": 45, "y": 20, "role": "midfielder"},
    {"position": "RW", "x": 70, "y": 75, "role": "winger"},
    {"position": "ST", "x": 70, "y": 50, "role": "striker"},
    {"position": "LW", "x": 70, "y": 25, "role": "winger"}
]'::jsonb,
'attacking', 65,
ARRAY['attacking_overload', 'width', 'pace'],
ARRAY['defensive_vulnerability', 'midfield_weakness']),

-- 4-5-1 Counter
('451_counter', '4-5-1 Counter', 'Defensive formation designed for counter-attacking', '4-5-1',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "RM", "x": 45, "y": 85, "role": "midfielder"},
    {"position": "CM", "x": 45, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 50, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 35, "role": "central_midfielder"},
    {"position": "LM", "x": 45, "y": 15, "role": "midfielder"},
    {"position": "ST", "x": 70, "y": 50, "role": "striker"}
]'::jsonb,
'counter_attack', 72,
ARRAY['defensive_stability', 'counter_attack', 'midfield_numbers'],
ARRAY['attacking_limitation', 'striker_isolation']),

-- 3-5-1-1 Modern
('3511_modern', '3-5-1-1 Modern', 'Modern tactical setup with attacking midfielder behind striker', '3-5-1-1',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "CB", "x": 25, "y": 70, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 50, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 30, "role": "centre_back"},
    {"position": "RWB", "x": 45, "y": 85, "role": "wing_back"},
    {"position": "CM", "x": 45, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 50, "role": "central_midfielder"},
    {"position": "CM", "x": 45, "y": 35, "role": "central_midfielder"},
    {"position": "LWB", "x": 45, "y": 15, "role": "wing_back"},
    {"position": "CAM", "x": 60, "y": 50, "role": "attacking_midfielder"},
    {"position": "ST", "x": 75, "y": 50, "role": "striker"}
]'::jsonb,
'balanced', 68,
ARRAY['midfield_control', 'creativity', 'flexibility'],
ARRAY['wide_vulnerability', 'attacking_midfielder_dependency']),

-- 4-3-2-1 Christmas Tree
('4321_christmas', '4-3-2-1 Christmas Tree', 'Narrow formation with two attacking midfielders', '4-3-2-1',
'[
    {"position": "GK", "x": 10, "y": 50, "role": "goalkeeper"},
    {"position": "RB", "x": 25, "y": 80, "role": "fullback"},
    {"position": "CB", "x": 25, "y": 65, "role": "centre_back"},
    {"position": "CB", "x": 25, "y": 35, "role": "centre_back"},
    {"position": "LB", "x": 25, "y": 20, "role": "fullback"},
    {"position": "CDM", "x": 40, "y": 50, "role": "defensive_midfielder"},
    {"position": "CM", "x": 50, "y": 65, "role": "central_midfielder"},
    {"position": "CM", "x": 50, "y": 35, "role": "central_midfielder"},
    {"position": "CAM", "x": 60, "y": 60, "role": "attacking_midfielder"},
    {"position": "CAM", "x": 60, "y": 40, "role": "attacking_midfielder"},
    {"position": "ST", "x": 75, "y": 50, "role": "striker"}
]'::jsonb,
'possession', 55,
ARRAY['central_overload', 'creativity', 'possession'],
ARRAY['width_lack', 'fullback_dependency']);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_formations_tactical_style ON formations(tactical_style);
CREATE INDEX IF NOT EXISTS idx_formations_popularity ON formations(popularity_rating DESC);
CREATE INDEX IF NOT EXISTS idx_team_formations_team_id ON team_formations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_formations_preference ON team_formations(preference_level);
CREATE INDEX IF NOT EXISTS idx_match_formations_match_id ON match_formations(match_id);
CREATE INDEX IF NOT EXISTS idx_match_formations_team_id ON match_formations(team_id);

-- Enable realtime for formations
ALTER PUBLICATION supabase_realtime ADD TABLE formations;
ALTER PUBLICATION supabase_realtime ADD TABLE team_formations;
ALTER PUBLICATION supabase_realtime ADD TABLE match_formations;
-- Create finished_matches table to store completed match results and player performance
-- This table will store all match data after 3D simulation completes

CREATE TABLE IF NOT EXISTS finished_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_id UUID REFERENCES fixtures(id) ON DELETE CASCADE,
    home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    season_number INTEGER NOT NULL,
    tier INTEGER NOT NULL,
    round INTEGER,
    
    -- Match statistics
    home_possession DECIMAL(5,2) DEFAULT 50.0,
    away_possession DECIMAL(5,2) DEFAULT 50.0,
    home_shots INTEGER DEFAULT 0,
    away_shots INTEGER DEFAULT 0,
    home_shots_on_target INTEGER DEFAULT 0,
    away_shots_on_target INTEGER DEFAULT 0,
    home_corners INTEGER DEFAULT 0,
    away_corners INTEGER DEFAULT 0,
    home_fouls INTEGER DEFAULT 0,
    away_fouls INTEGER DEFAULT 0,
    home_yellow_cards INTEGER DEFAULT 0,
    away_yellow_cards INTEGER DEFAULT 0,
    home_red_cards INTEGER DEFAULT 0,
    away_red_cards INTEGER DEFAULT 0,
    
    -- Match events (JSON array of goals, cards, substitutions)
    match_events JSONB DEFAULT '[]'::jsonb,
    
    -- Simulation metadata
    simulation_duration INTEGER, -- in seconds
    simulation_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_match_performance table for individual player stats
CREATE TABLE IF NOT EXISTS player_match_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finished_match_id UUID REFERENCES finished_matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Basic performance
    minutes_played INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    shots INTEGER DEFAULT 0,
    shots_on_target INTEGER DEFAULT 0,
    passes_completed INTEGER DEFAULT 0,
    passes_attempted INTEGER DEFAULT 0,
    pass_accuracy DECIMAL(5,2) DEFAULT 0.0,
    
    -- Defensive stats
    tackles INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    clearances INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    
    -- Disciplinary
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    fouls_suffered INTEGER DEFAULT 0,
    
    -- Performance rating (1-10)
    match_rating DECIMAL(3,1) DEFAULT 6.0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finished_matches_season ON finished_matches(season_number);
CREATE INDEX IF NOT EXISTS idx_finished_matches_tier ON finished_matches(tier);
CREATE INDEX IF NOT EXISTS idx_finished_matches_date ON finished_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_finished_matches_fixture ON finished_matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_player_performance_match ON player_match_performance(finished_match_id);
CREATE INDEX IF NOT EXISTS idx_player_performance_player ON player_match_performance(player_id);

-- Create function to automatically move completed fixtures to finished_matches
CREATE OR REPLACE FUNCTION process_completed_fixture(fixture_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    fixture_rec RECORD;
    finished_match_id UUID;
    current_season INTEGER;
BEGIN
    -- Get fixture details
    SELECT f.*, ht.tier, ht.name as home_name, at.name as away_name
    INTO fixture_rec
    FROM fixtures f
    JOIN teams ht ON f.home_team_id = ht.id
    JOIN teams at ON f.away_team_id = at.id
    WHERE f.id = fixture_uuid;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Fixture % not found', fixture_uuid;
        RETURN FALSE;
    END IF;
    
    -- Get current season
    SELECT season_number INTO current_season
    FROM global_season_status 
    WHERE season_status = 'active'
    ORDER BY season_number DESC 
    LIMIT 1;
    
    IF current_season IS NULL THEN
        current_season := 1;
    END IF;
    
    -- Insert into finished_matches
    INSERT INTO finished_matches (
        fixture_id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        match_date,
        season_number,
        tier,
        round
    ) VALUES (
        fixture_rec.id,
        fixture_rec.home_team_id,
        fixture_rec.away_team_id,
        COALESCE(fixture_rec.home_score, 0),
        COALESCE(fixture_rec.away_score, 0),
        fixture_rec.scheduled_at,
        current_season,
        fixture_rec.tier,
        fixture_rec.round
    ) RETURNING id INTO finished_match_id;
    
    -- Update fixture status to completed
    UPDATE fixtures 
    SET status = 'completed'
    WHERE id = fixture_uuid;
    
    RAISE NOTICE 'Moved fixture % to finished_matches with ID %', fixture_uuid, finished_match_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if season should end and start new one
CREATE OR REPLACE FUNCTION check_and_progress_season()
RETURNS BOOLEAN AS $$
DECLARE
    remaining_fixtures INTEGER;
    current_season INTEGER;
    new_season INTEGER;
BEGIN
    -- Count remaining scheduled fixtures
    SELECT COUNT(*) INTO remaining_fixtures
    FROM fixtures 
    WHERE status IN ('scheduled', 'live');
    
    RAISE NOTICE 'Remaining fixtures: %', remaining_fixtures;
    
    -- If no fixtures remaining, start new season
    IF remaining_fixtures = 0 THEN
        -- Get current season
        SELECT season_number INTO current_season
        FROM global_season_status 
        WHERE season_status = 'active'
        ORDER BY season_number DESC 
        LIMIT 1;
        
        IF current_season IS NULL THEN
            current_season := 1;
        END IF;
        
        new_season := current_season + 1;
        
        RAISE NOTICE 'Season % complete. Starting season %', current_season, new_season;
        
        -- Mark current season as completed
        UPDATE global_season_status 
        SET season_status = 'completed', 
            season_end_date = NOW()
        WHERE season_number = current_season;
        
        -- Create new season
        INSERT INTO global_season_status (
            season_number,
            season_status,
            season_start_date
        ) VALUES (
            new_season,
            'active',
            NOW()
        );
        
        -- Process promotions and relegations
        PERFORM process_promotions_relegations(current_season);
        
        -- Generate new fixtures for new season
        PERFORM generate_new_season_fixtures(new_season);
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to process promotions and relegations
CREATE OR REPLACE FUNCTION process_promotions_relegations(completed_season INTEGER)
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    promoted_teams UUID[];
    relegated_teams UUID[];
BEGIN
    RAISE NOTICE 'Processing promotions and relegations for season %', completed_season;
    
    -- Process each tier (except tier 1 for promotion and tier 5 for relegation)
    FOR tier_num IN 1..5 LOOP
        -- Get bottom 2 teams from current tier (except tier 5)
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
                LIMIT 2
            ) bottom_teams;
            
            -- Relegate teams
            UPDATE teams 
            SET tier = tier + 1 
            WHERE id = ANY(relegated_teams) AND tier < 5;
        END IF;
        
        -- Get top 2 teams from tier below (except tier 1)
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
                LIMIT 2
            ) top_teams;
            
            -- Promote teams
            UPDATE teams 
            SET tier = tier - 1 
            WHERE id = ANY(promoted_teams) AND tier > 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Promotions and relegations completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to generate fixtures for new season
CREATE OR REPLACE FUNCTION generate_new_season_fixtures(new_season INTEGER)
RETURNS VOID AS $$
DECLARE
    tier_num INTEGER;
    home_team RECORD;
    away_team RECORD;
    match_date TIMESTAMP;
    round_num INTEGER;
    season_uuid UUID;
    league_uuid UUID;
    fixture_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Generating fixtures for season %', new_season;
    
    -- Create season UUID
    season_uuid := gen_random_uuid();
    
    -- Loop through each tier
    FOR tier_num IN 1..5 LOOP
        league_uuid := gen_random_uuid();
        round_num := 1;
        
        RAISE NOTICE 'Processing Tier %', tier_num;
        
        -- Generate round-robin fixtures for this tier
        FOR home_team IN 
            SELECT id, name FROM teams WHERE tier = tier_num ORDER BY name
        LOOP
            FOR away_team IN 
                SELECT id, name FROM teams WHERE tier = tier_num AND id != home_team.id ORDER BY name
            LOOP
                -- Skip if we already have this matchup (avoid duplicates)
                IF home_team.id < away_team.id THEN
                    -- First leg (home vs away)
                    match_date := now() + (round_num * interval '2 days') + (tier_num * interval '4 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round
                    ) VALUES (
                        home_team.id,
                        away_team.id,
                        match_date,
                        'scheduled',
                        round_num
                    );
                    
                    fixture_count := fixture_count + 1;
                    
                    -- Second leg (away vs home) - later in the season
                    match_date := now() + ((round_num + 19) * interval '2 days') + (tier_num * interval '4 hours');
                    
                    INSERT INTO fixtures (
                        home_team_id, 
                        away_team_id, 
                        scheduled_at, 
                        status, 
                        round
                    ) VALUES (
                        away_team.id,
                        home_team.id,
                        match_date,
                        'scheduled',
                        round_num + 19
                    );
                    
                    fixture_count := fixture_count + 1;
                    round_num := round_num + 1;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    -- Apply proper sequencing to new fixtures
    PERFORM sequence_new_fixtures();
    
    RAISE NOTICE 'Generated % fixtures for season %', fixture_count, new_season;
END;
$$ LANGUAGE plpgsql;

-- Create function to sequence new fixtures in tier rotation
CREATE OR REPLACE FUNCTION sequence_new_fixtures()
RETURNS VOID AS $$
DECLARE
    fixture_rec RECORD;
    sequence_num INTEGER := 1;
    tier_order INTEGER[] := ARRAY[1, 2, 3, 4, 5];
    current_tier_index INTEGER := 1;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status = 'scheduled';
    
    -- Order fixtures in tier rotation
    WHILE sequence_num <= (SELECT COUNT(*) FROM fixtures WHERE status = 'scheduled') LOOP
        DECLARE
            current_tier INTEGER := tier_order[current_tier_index];
            fixture_id UUID;
        BEGIN
            -- Find next fixture for this tier that hasn't been sequenced
            SELECT f.id INTO fixture_id
            FROM fixtures f
            JOIN teams ht ON f.home_team_id = ht.id
            WHERE ht.tier = current_tier 
            AND f.status = 'scheduled' 
            AND f.sequence_order IS NULL
            ORDER BY f.scheduled_at
            LIMIT 1;
            
            -- If we found a fixture, assign sequence number
            IF fixture_id IS NOT NULL THEN
                UPDATE fixtures 
                SET sequence_order = sequence_num 
                WHERE id = fixture_id;
                
                sequence_num := sequence_num + 1;
            END IF;
            
            -- Move to next tier
            current_tier_index := current_tier_index + 1;
            IF current_tier_index > 5 THEN
                current_tier_index := 1;
            END IF;
        END;
    END LOOP;
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    RAISE NOTICE 'Fixtures sequenced and first match set to live';
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE finished_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE player_match_performance;
-- Assign formations to teams based on their tier and characteristics
-- This will give each team 2-4 formations they prefer to use

DO $$
DECLARE
    team_record RECORD;
    formation_record RECORD;
    primary_formation_id uuid;
    secondary_formation_id uuid;
    situational_formation_id uuid;
BEGIN
    -- Loop through all teams
    FOR team_record IN SELECT id, name, tier, elo_rating FROM teams LOOP
        
        -- Assign primary formation based on team tier and characteristics
        IF team_record.tier = 1 THEN
            -- Tier 1 teams prefer modern, attacking formations
            SELECT id INTO primary_formation_id 
            FROM formations 
            WHERE name IN ('433_modern', '4231_modern', '352_tactical')
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- Secondary formation - more balanced
            SELECT id INTO secondary_formation_id 
            FROM formations 
            WHERE name IN ('442_classic', '4141_possession', '3511_modern')
            AND id != primary_formation_id
            ORDER BY RANDOM() 
            LIMIT 1;
            
            -- Situational formation - defensive for tough away games
            SELECT id INTO situational_formation_id 
            FROM formations 
            WHERE name IN ('532_defensive', '451_counter')
            ORDER BY RANDOM() 
            LIMIT 1;
            
        ELSIF team_record.tier = 2 THEN
            -- Tier 2 teams prefer balanced formations
            SELECT id INTO primary_formation_id 
            FROM formations 
            WHERE name IN ('442_classic', '4231_modern', '352_tactical')
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO secondary_formation_id 
            FROM formations 
            WHERE name IN ('433_modern', '4141_possession', '451_counter')
            AND id != primary_formation_id
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO situational_formation_id 
            FROM formations 
            WHERE name IN ('532_defensive', '343_attacking')
            ORDER BY RANDOM() 
            LIMIT 1;
            
        ELSIF team_record.tier = 3 THEN
            -- Tier 3 teams prefer traditional formations
            SELECT id INTO primary_formation_id 
            FROM formations 
            WHERE name IN ('442_classic', '451_counter', '352_tactical')
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO secondary_formation_id 
            FROM formations 
            WHERE name IN ('4231_modern', '532_defensive')
            AND id != primary_formation_id
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO situational_formation_id 
            FROM formations 
            WHERE name IN ('343_attacking', '4141_possession')
            ORDER BY RANDOM() 
            LIMIT 1;
            
        ELSIF team_record.tier = 4 THEN
            -- Tier 4 teams prefer defensive, counter-attacking formations
            SELECT id INTO primary_formation_id 
            FROM formations 
            WHERE name IN ('451_counter', '532_defensive', '442_classic')
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO secondary_formation_id 
            FROM formations 
            WHERE name IN ('352_tactical', '4231_modern')
            AND id != primary_formation_id
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO situational_formation_id 
            FROM formations 
            WHERE name IN ('343_attacking', '433_modern')
            ORDER BY RANDOM() 
            LIMIT 1;
            
        ELSE -- Tier 5
            -- Tier 5 teams prefer simple, defensive formations
            SELECT id INTO primary_formation_id 
            FROM formations 
            WHERE name IN ('532_defensive', '451_counter', '442_classic')
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO secondary_formation_id 
            FROM formations 
            WHERE name IN ('352_tactical', '4141_possession')
            AND id != primary_formation_id
            ORDER BY RANDOM() 
            LIMIT 1;
            
            SELECT id INTO situational_formation_id 
            FROM formations 
            WHERE name IN ('343_attacking', '4321_christmas')
            ORDER BY RANDOM() 
            LIMIT 1;
        END IF;
        
        -- Insert primary formation (60-80% usage)
        INSERT INTO team_formations (team_id, formation_id, preference_level, usage_frequency, home_preference, vs_weaker_teams)
        VALUES (team_record.id, primary_formation_id, 'primary', 60 + (RANDOM() * 20)::integer, true, true);
        
        -- Insert secondary formation (20-35% usage)
        INSERT INTO team_formations (team_id, formation_id, preference_level, usage_frequency, away_preference)
        VALUES (team_record.id, secondary_formation_id, 'secondary', 20 + (RANDOM() * 15)::integer, true);
        
        -- Insert situational formation (5-15% usage) - for tough games
        INSERT INTO team_formations (team_id, formation_id, preference_level, usage_frequency, vs_stronger_teams, away_preference)
        VALUES (team_record.id, situational_formation_id, 'situational', 5 + (RANDOM() * 10)::integer, true, true);
        
        RAISE NOTICE 'Assigned formations to team: %', team_record.name;
    END LOOP;
    
    RAISE NOTICE 'Formation assignment completed for all teams';
END $$;
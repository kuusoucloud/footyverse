-- Function to select formation for a team in a match
-- This considers team preferences, opponent strength, and match context

CREATE OR REPLACE FUNCTION select_match_formation(
    p_team_id uuid,
    p_opponent_id uuid,
    p_is_home boolean DEFAULT true
) RETURNS uuid AS $$
DECLARE
    team_elo float;
    opponent_elo float;
    elo_difference float;
    selected_formation_id uuid;
    formation_record RECORD;
    total_weight integer := 0;
    random_value integer;
    current_weight integer := 0;
BEGIN
    -- Get team ELO ratings
    SELECT elo_rating INTO team_elo FROM teams WHERE id = p_team_id;
    SELECT elo_rating INTO opponent_elo FROM teams WHERE id = p_opponent_id;
    
    elo_difference := team_elo - opponent_elo;
    
    -- Create a weighted selection based on formation preferences and context
    FOR formation_record IN 
        SELECT 
            tf.formation_id,
            tf.usage_frequency,
            tf.preference_level,
            tf.vs_stronger_teams,
            tf.vs_weaker_teams,
            tf.home_preference,
            tf.away_preference,
            f.tactical_style
        FROM team_formations tf
        JOIN formations f ON tf.formation_id = f.id
        WHERE tf.team_id = p_team_id
    LOOP
        -- Calculate weight based on context
        current_weight := formation_record.usage_frequency;
        
        -- Adjust weight based on opponent strength
        IF elo_difference < -100 AND formation_record.vs_stronger_teams THEN
            current_weight := current_weight + 30; -- Boost defensive formations vs stronger teams
        ELSIF elo_difference > 100 AND formation_record.vs_weaker_teams THEN
            current_weight := current_weight + 20; -- Boost attacking formations vs weaker teams
        END IF;
        
        -- Adjust weight based on home/away preference
        IF p_is_home AND formation_record.home_preference THEN
            current_weight := current_weight + 15;
        ELSIF NOT p_is_home AND formation_record.away_preference THEN
            current_weight := current_weight + 15;
        END IF;
        
        -- Boost primary formation
        IF formation_record.preference_level = 'primary' THEN
            current_weight := current_weight + 25;
        ELSIF formation_record.preference_level = 'secondary' THEN
            current_weight := current_weight + 10;
        END IF;
        
        total_weight := total_weight + current_weight;
    END LOOP;
    
    -- Select formation using weighted random selection
    random_value := (RANDOM() * total_weight)::integer;
    current_weight := 0;
    
    FOR formation_record IN 
        SELECT 
            tf.formation_id,
            tf.usage_frequency,
            tf.preference_level,
            tf.vs_stronger_teams,
            tf.vs_weaker_teams,
            tf.home_preference,
            tf.away_preference
        FROM team_formations tf
        WHERE tf.team_id = p_team_id
    LOOP
        -- Recalculate weight (same logic as above)
        current_weight := formation_record.usage_frequency;
        
        IF elo_difference < -100 AND formation_record.vs_stronger_teams THEN
            current_weight := current_weight + 30;
        ELSIF elo_difference > 100 AND formation_record.vs_weaker_teams THEN
            current_weight := current_weight + 20;
        END IF;
        
        IF p_is_home AND formation_record.home_preference THEN
            current_weight := current_weight + 15;
        ELSIF NOT p_is_home AND formation_record.away_preference THEN
            current_weight := current_weight + 15;
        END IF;
        
        IF formation_record.preference_level = 'primary' THEN
            current_weight := current_weight + 25;
        ELSIF formation_record.preference_level = 'secondary' THEN
            current_weight := current_weight + 10;
        END IF;
        
        IF random_value <= current_weight THEN
            selected_formation_id := formation_record.formation_id;
            EXIT;
        END IF;
        
        random_value := random_value - current_weight;
    END LOOP;
    
    -- Fallback to primary formation if nothing selected
    IF selected_formation_id IS NULL THEN
        SELECT formation_id INTO selected_formation_id 
        FROM team_formations 
        WHERE team_id = p_team_id AND preference_level = 'primary' 
        LIMIT 1;
    END IF;
    
    RETURN selected_formation_id;
END;
$$ LANGUAGE plpgsql;
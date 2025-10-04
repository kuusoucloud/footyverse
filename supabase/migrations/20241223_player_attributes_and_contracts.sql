-- Add missing columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS skill_rating integer DEFAULT 50 CHECK (skill_rating >= 1 AND skill_rating <= 99),
ADD COLUMN IF NOT EXISTS market_value bigint DEFAULT 100000,
ADD COLUMN IF NOT EXISTS weekly_wage integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS contract_end date,
ADD COLUMN IF NOT EXISTS injury_status text DEFAULT 'fit',
ADD COLUMN IF NOT EXISTS form_rating integer DEFAULT 5 CHECK (form_rating >= 1 AND form_rating <= 10),
ADD COLUMN IF NOT EXISTS goals integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS assists integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS appearances integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS shirt_number integer CHECK (shirt_number >= 1 AND shirt_number <= 99),
ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'England';

-- Function to generate realistic attributes based on skill rating and position
CREATE OR REPLACE FUNCTION generate_player_attributes(skill_rating integer, player_position text)
RETURNS jsonb AS $$
DECLARE
    base_skill integer := skill_rating;
    variation integer := 15;
    attributes jsonb;
    pace integer;
    accel integer;
    stamina integer;
    strength integer;
    passing integer;
    vision integer;
    finishing integer;
    heading integer;
    marking integer;
    tackling integer;
    positioning integer;
    composure integer;
    reflexes integer;
    handling integer;
BEGIN
    pace := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    accel := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    stamina := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    strength := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    passing := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    vision := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    finishing := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    heading := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    marking := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    tackling := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    positioning := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    composure := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    reflexes := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));
    handling := GREATEST(1, LEAST(99, base_skill + (random() * variation * 2 - variation)::integer));

    CASE player_position
        WHEN 'GK' THEN
            reflexes := GREATEST(1, LEAST(99, reflexes + 20));
            handling := GREATEST(1, LEAST(99, handling + 20));
            positioning := GREATEST(1, LEAST(99, positioning + 15));
            pace := GREATEST(1, LEAST(99, pace - 15));
            finishing := GREATEST(1, LEAST(99, finishing - 25));
            
        WHEN 'DF' THEN
            marking := GREATEST(1, LEAST(99, marking + 15));
            tackling := GREATEST(1, LEAST(99, tackling + 15));
            heading := GREATEST(1, LEAST(99, heading + 10));
            strength := GREATEST(1, LEAST(99, strength + 10));
            finishing := GREATEST(1, LEAST(99, finishing - 15));
            
        WHEN 'MF' THEN
            passing := GREATEST(1, LEAST(99, passing + 15));
            vision := GREATEST(1, LEAST(99, vision + 15));
            stamina := GREATEST(1, LEAST(99, stamina + 10));
            
        WHEN 'FW' THEN
            finishing := GREATEST(1, LEAST(99, finishing + 20));
            pace := GREATEST(1, LEAST(99, pace + 15));
            accel := GREATEST(1, LEAST(99, accel + 15));
            marking := GREATEST(1, LEAST(99, marking - 15));
            tackling := GREATEST(1, LEAST(99, tackling - 15));
    END CASE;

    attributes := jsonb_build_object(
        'pace', pace,
        'accel', accel,
        'stamina', stamina,
        'strength', strength,
        'passing', passing,
        'vision', vision,
        'finishing', finishing,
        'heading', heading,
        'marking', marking,
        'tackling', tackling,
        'positioning', positioning,
        'composure', composure,
        'reflexes', reflexes,
        'handling', handling
    );

    RETURN attributes;
END;
$$ LANGUAGE plpgsql;

UPDATE players SET
    skill_rating = CASE 
        WHEN current_elo >= 800 THEN 75 + (random() * 20)::integer
        WHEN current_elo >= 700 THEN 65 + (random() * 15)::integer
        WHEN current_elo >= 600 THEN 55 + (random() * 15)::integer
        WHEN current_elo >= 500 THEN 45 + (random() * 15)::integer
        ELSE 35 + (random() * 15)::integer
    END,
    market_value = CASE 
        WHEN current_elo >= 800 THEN 5000000 + (random() * 45000000)::bigint
        WHEN current_elo >= 700 THEN 1000000 + (random() * 9000000)::bigint
        WHEN current_elo >= 600 THEN 200000 + (random() * 1800000)::bigint
        WHEN current_elo >= 500 THEN 50000 + (random() * 450000)::bigint
        ELSE 10000 + (random() * 90000)::bigint
    END,
    weekly_wage = CASE 
        WHEN current_elo >= 800 THEN 50000 + (random() * 150000)::integer
        WHEN current_elo >= 700 THEN 10000 + (random() * 40000)::integer
        WHEN current_elo >= 600 THEN 2000 + (random() * 8000)::integer
        WHEN current_elo >= 500 THEN 500 + (random() * 2500)::integer
        ELSE 200 + (random() * 800)::integer
    END,
    contract_end = CURRENT_DATE + INTERVAL '1 year' * (1 + (random() * 4)::integer),
    form_rating = 3 + (random() * 7)::integer,
    goals = (random() * 25)::integer,
    assists = (random() * 20)::integer,
    appearances = 15 + (random() * 25)::integer,
    nationality = CASE (random() * 10)::integer
        WHEN 0 THEN 'England'
        WHEN 1 THEN 'Spain'
        WHEN 2 THEN 'France'
        WHEN 3 THEN 'Germany'
        WHEN 4 THEN 'Italy'
        WHEN 5 THEN 'Brazil'
        WHEN 6 THEN 'Argentina'
        WHEN 7 THEN 'Portugal'
        WHEN 8 THEN 'Netherlands'
        ELSE 'Belgium'
    END
WHERE skill_rating IS NULL OR skill_rating = 50;

UPDATE players SET
    attributes = generate_player_attributes(skill_rating, position);

WITH numbered_players AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY current_elo DESC) as player_rank
    FROM players
)
UPDATE players 
SET shirt_number = CASE 
    WHEN np.player_rank <= 11 THEN np.player_rank
    ELSE 11 + (random() * 88)::integer + 1
END
FROM numbered_players np
WHERE players.id = np.id
AND players.shirt_number IS NULL;

WITH duplicate_shirts AS (
    SELECT 
        id,
        team_id,
        shirt_number,
        ROW_NUMBER() OVER (PARTITION BY team_id, shirt_number ORDER BY current_elo DESC) as rn
    FROM players
    WHERE shirt_number IS NOT NULL
)
UPDATE players 
SET shirt_number = 12 + (random() * 87)::integer
FROM duplicate_shirts ds
WHERE players.id = ds.id 
AND ds.rn > 1;

DROP FUNCTION generate_player_attributes(integer, text);
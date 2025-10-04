-- Fix fixture ordering and ensure only 1 live match at a time
-- Order fixtures in tier rotation: T1 → T2 → T3 → T4 → T5 → repeat

-- First, set all matches to scheduled
UPDATE fixtures SET status = 'scheduled' WHERE status IN ('live', 'completed');

-- Create a proper ordering system for fixtures
-- We'll use a sequence number to ensure proper tier rotation
DO $$
DECLARE
    fixture_rec RECORD;
    sequence_num INTEGER := 1;
    tier_order INTEGER[] := ARRAY[1, 2, 3, 4, 5];
    current_tier_index INTEGER := 1;
    fixtures_per_tier INTEGER;
    tier_fixture_count INTEGER[] := ARRAY[0, 0, 0, 0, 0];
BEGIN
    -- Get total fixtures per tier
    SELECT COUNT(*) / 5 INTO fixtures_per_tier FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Total fixtures per tier: %', fixtures_per_tier;
    
    -- Add sequence column if it doesn't exist
    BEGIN
        ALTER TABLE fixtures ADD COLUMN sequence_order INTEGER;
    EXCEPTION
        WHEN duplicate_column THEN
            -- Column already exists, just update it
            UPDATE fixtures SET sequence_order = NULL;
    END;
    
    -- Order fixtures in tier rotation
    WHILE sequence_num <= (SELECT COUNT(*) FROM fixtures WHERE status = 'scheduled') LOOP
        -- Get current tier
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
                tier_fixture_count[current_tier] := tier_fixture_count[current_tier] + 1;
            END IF;
            
            -- Move to next tier
            current_tier_index := current_tier_index + 1;
            IF current_tier_index > 5 THEN
                current_tier_index := 1;
            END IF;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixtures sequenced by tier: T1=%, T2=%, T3=%, T4=%, T5=%', 
        tier_fixture_count[1], tier_fixture_count[2], tier_fixture_count[3], 
        tier_fixture_count[4], tier_fixture_count[5];
END $$;

-- Set only the first fixture (sequence 1) to live
UPDATE fixtures 
SET status = 'live' 
WHERE sequence_order = 1;

-- Update scheduled_at times to reflect the proper sequence
-- Each match is 2 hours apart to allow for full match simulation
UPDATE fixtures 
SET scheduled_at = now() + (sequence_order * interval '2 hours')
WHERE sequence_order IS NOT NULL;

-- Show the first 10 fixtures in order
SELECT 
    f.sequence_order,
    ht.tier as home_tier,
    ht.name as home_team,
    at.name as away_team,
    f.status,
    f.scheduled_at
FROM fixtures f
JOIN teams ht ON f.home_team_id = ht.id
JOIN teams at ON f.away_team_id = at.id
WHERE f.sequence_order IS NOT NULL
ORDER BY f.sequence_order
LIMIT 10;
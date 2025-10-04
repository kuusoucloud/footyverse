-- Simple tier rotation sequencing - just ensure we cycle through tiers properly
-- This will fix the immediate issue of teams playing consecutive matches

CREATE OR REPLACE FUNCTION simple_tier_rotation_sequencing()
RETURNS VOID AS $$
DECLARE
    sequence_num INTEGER := 1;
    tier_cycle INTEGER := 1;
    fixture_id UUID;
    total_fixtures INTEGER;
BEGIN
    -- Clear existing sequence orders
    UPDATE fixtures SET sequence_order = NULL WHERE status IN ('scheduled', 'live');
    
    -- Get total fixture count
    SELECT COUNT(*) INTO total_fixtures FROM fixtures WHERE status = 'scheduled';
    
    RAISE NOTICE 'Sequencing % fixtures with simple tier rotation', total_fixtures;
    
    -- Simple tier rotation: T1, T2, T3, T4, T5, T1, T2, T3, T4, T5...
    WHILE sequence_num <= total_fixtures LOOP
        -- Find next fixture for current tier
        SELECT f.id INTO fixture_id
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        WHERE ht.tier = tier_cycle
        AND f.status = 'scheduled'
        AND f.sequence_order IS NULL
        ORDER BY f.round, f.scheduled_at
        LIMIT 1;
        
        -- If we found a fixture, assign sequence
        IF fixture_id IS NOT NULL THEN
            UPDATE fixtures 
            SET sequence_order = sequence_num 
            WHERE id = fixture_id;
            
            sequence_num := sequence_num + 1;
        END IF;
        
        -- Move to next tier (1->2->3->4->5->1...)
        tier_cycle := tier_cycle + 1;
        IF tier_cycle > 5 THEN
            tier_cycle := 1;
        END IF;
        
        -- Safety check to prevent infinite loop
        IF sequence_num > total_fixtures + 100 THEN
            RAISE NOTICE 'Safety exit at sequence %', sequence_num;
            EXIT;
        END IF;
    END LOOP;
    
    -- Set first fixture to live
    UPDATE fixtures 
    SET status = 'live' 
    WHERE sequence_order = 1;
    
    -- Update scheduled times to reflect proper sequence (2 hours apart)
    UPDATE fixtures 
    SET scheduled_at = now() + (sequence_order * interval '2 hours')
    WHERE sequence_order IS NOT NULL;
    
    RAISE NOTICE 'Simple tier rotation sequencing completed. Fixtures sequenced: %', sequence_num - 1;
END;
$$ LANGUAGE plpgsql;

-- Apply the simple sequencing
SELECT simple_tier_rotation_sequencing();
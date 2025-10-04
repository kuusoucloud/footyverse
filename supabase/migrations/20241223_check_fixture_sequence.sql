-- Check the current fixture sequence to verify team rotation is working
-- Show the first 20 fixtures in sequence order to identify any team repetition issues

DO $$
DECLARE
    fixture_rec RECORD;
    tier_rec RECORD;
    prev_home_team TEXT := '';
    prev_away_team TEXT := '';
    consecutive_count INTEGER := 0;
    max_consecutive INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking fixture sequence for team rotation issues...';
    RAISE NOTICE '=======================================================';
    
    -- Show first 20 fixtures in sequence order
    FOR fixture_rec IN 
        SELECT 
            f.sequence_order,
            ht.tier,
            ht.name as home_team,
            at.name as away_team,
            f.round,
            f.status,
            f.scheduled_at
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.sequence_order IS NOT NULL
        ORDER BY f.sequence_order
        LIMIT 20
    LOOP
        RAISE NOTICE 'Seq %, Tier %, Round %, Status: % vs %', 
            fixture_rec.sequence_order, 
            fixture_rec.tier, 
            fixture_rec.round,
            fixture_rec.status,
            fixture_rec.home_team || ' vs ' || fixture_rec.away_team;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for consecutive team appearances...';
    RAISE NOTICE '=============================================';
    
    -- Check for teams playing consecutive matches
    FOR fixture_rec IN 
        SELECT 
            f.sequence_order,
            ht.tier,
            ht.name as home_team,
            at.name as away_team
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        JOIN teams at ON f.away_team_id = at.id
        WHERE f.sequence_order IS NOT NULL
        ORDER BY f.sequence_order
        LIMIT 50
    LOOP
        -- Check if either team played in the previous match
        IF fixture_rec.home_team = prev_home_team OR 
           fixture_rec.home_team = prev_away_team OR
           fixture_rec.away_team = prev_home_team OR 
           fixture_rec.away_team = prev_away_team THEN
            
            consecutive_count := consecutive_count + 1;
            IF consecutive_count > max_consecutive THEN
                max_consecutive := consecutive_count;
            END IF;
            
            RAISE NOTICE 'CONSECUTIVE MATCH FOUND: Seq % - % vs %', 
                fixture_rec.sequence_order,
                fixture_rec.home_team, 
                fixture_rec.away_team;
        ELSE
            consecutive_count := 0;
        END IF;
        
        prev_home_team := fixture_rec.home_team;
        prev_away_team := fixture_rec.away_team;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Analysis Summary:';
    RAISE NOTICE '================';
    RAISE NOTICE 'Maximum consecutive appearances: %', max_consecutive;
    
    -- Show tier distribution in first 20 matches
    RAISE NOTICE '';
    RAISE NOTICE 'Tier distribution in first 20 matches:';
    FOR tier_rec IN 
        SELECT 
            ht.tier,
            COUNT(*) as match_count
        FROM fixtures f
        JOIN teams ht ON f.home_team_id = ht.id
        WHERE f.sequence_order IS NOT NULL AND f.sequence_order <= 20
        GROUP BY ht.tier
        ORDER BY ht.tier
    LOOP
        RAISE NOTICE 'Tier %: % matches', tier_rec.tier, tier_rec.match_count;
    END LOOP;
    
END $$;
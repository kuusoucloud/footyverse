-- Ensure all 5 tiers have teams (20 teams per tier = 100 total)
-- First, check current distribution
DO $$
DECLARE
    tier_counts INTEGER[];
    i INTEGER;
    teams_needed INTEGER;
    team_names TEXT[] := ARRAY[
        'Northfield United', 'Southgate FC', 'Eastbridge Athletic', 'Westmoor City',
        'Pinehurst Rovers', 'Maplewood United', 'Cedarville FC', 'Elmwood Athletic',
        'Birchfield City', 'Ashford Rovers', 'Willowbrook United', 'Hazelwood FC',
        'Rosewood Athletic', 'Thornbury City', 'Fairfield Rovers', 'Greenhill United',
        'Brookside FC', 'Hillcrest Athletic', 'Valleyview City', 'Ridgewood Rovers'
    ];
    team_name TEXT;
    team_count INTEGER;
BEGIN
    -- Check current team distribution
    FOR i IN 1..5 LOOP
        SELECT COUNT(*) INTO team_count FROM teams WHERE tier = i;
        RAISE NOTICE 'Tier % currently has % teams', i, team_count;
        
        -- If tier has fewer than 20 teams, add more
        IF team_count < 20 THEN
            teams_needed := 20 - team_count;
            RAISE NOTICE 'Adding % teams to Tier %', teams_needed, i;
            
            -- Add teams to reach 20 per tier
            FOR j IN 1..teams_needed LOOP
                team_name := team_names[((j-1) % array_length(team_names, 1)) + 1] || ' T' || i || 'E' || j;
                
                INSERT INTO teams (
                    name,
                    tier,
                    elo,
                    primary_color,
                    secondary_color,
                    crest_url,
                    logo_url,
                    budget,
                    wage_budget
                ) VALUES (
                    team_name,
                    i,
                    1200 + (random() * 400)::INTEGER, -- ELO between 1200-1600
                    '#' || lpad(to_hex((random() * 16777215)::INTEGER), 6, '0'),
                    '#' || lpad(to_hex((random() * 16777215)::INTEGER), 6, '0'),
                    'https://api.dicebear.com/7.x/shapes/svg?seed=' || replace(team_name, ' ', ''),
                    'https://api.dicebear.com/7.x/shapes/svg?seed=' || replace(team_name, ' ', ''),
                    (50 + random() * 200) * 1000000, -- Budget 50M-250M
                    (10 + random() * 40) * 1000000   -- Wage budget 10M-50M
                );
            END LOOP;
        END IF;
    END LOOP;
    
    -- Final count
    SELECT COUNT(*) INTO team_count FROM teams;
    RAISE NOTICE 'Total teams in database: %', team_count;
END $$;
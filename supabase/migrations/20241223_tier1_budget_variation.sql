-- Set specific Tier 1 clubs to £100M, others to £50M, and scale down other tiers
-- Creates realistic budget variation within each tier

DO $$
DECLARE
  team_record RECORD;
  base_transfer_budget bigint;
  base_wage_budget bigint;
  random_variation numeric;
  final_transfer_budget bigint;
  final_wage_budget bigint;
BEGIN
  -- Update budgets for all teams with specific variations
  FOR team_record IN 
    SELECT id, name, tier FROM teams ORDER BY tier ASC, name ASC
  LOOP
    -- Set base budgets by tier and specific team names
    CASE team_record.tier
      WHEN 1 THEN 
        -- Special Tier 1 clubs get £100M, others get £50M
        IF team_record.name IN ('Thornfield City', 'Millbrook United', 'Riverside Wanderers', 'Bluewater FC') THEN
          base_transfer_budget := 100000000; -- £100M for top Tier 1 clubs
          base_wage_budget := 3500000; -- £3.5M weekly wage budget
        ELSE
          base_transfer_budget := 50000000; -- £50M for other Tier 1 clubs
          base_wage_budget := 2500000; -- £2.5M weekly wage budget
        END IF;
      WHEN 2 THEN 
        base_transfer_budget := 30000000; -- £30M base for Tier 2
        base_wage_budget := 1500000; -- £1.5M weekly wage budget
      WHEN 3 THEN 
        base_transfer_budget := 15000000; -- £15M base for Tier 3
        base_wage_budget := 800000; -- £800K weekly wage budget
      WHEN 4 THEN 
        base_transfer_budget := 8000000; -- £8M base for Tier 4
        base_wage_budget := 450000; -- £450K weekly wage budget
      WHEN 5 THEN 
        base_transfer_budget := 4000000; -- £4M base for Tier 5
        base_wage_budget := 250000; -- £250K weekly wage budget
      ELSE 
        base_transfer_budget := 1000000; -- £1M default
        base_wage_budget := 100000; -- £100K default
    END CASE;
    
    -- Add random variation (±25% for transfer budget, ±15% for wage budget)
    random_variation := (RANDOM() * 0.5 - 0.25); -- -25% to +25%
    final_transfer_budget := base_transfer_budget + (base_transfer_budget * random_variation)::bigint;
    
    random_variation := (RANDOM() * 0.3 - 0.15); -- -15% to +15%
    final_wage_budget := base_wage_budget + (base_wage_budget * random_variation)::bigint;
    
    -- Ensure minimum budgets
    IF final_transfer_budget < 500000 THEN
      final_transfer_budget := 500000; -- Minimum £500K transfer budget
    END IF;
    
    IF final_wage_budget < 50000 THEN
      final_wage_budget := 50000; -- Minimum £50K weekly wage budget
    END IF;
    
    -- Update team budgets
    UPDATE teams 
    SET 
      transfer_budget = final_transfer_budget,
      weekly_wage_budget = final_wage_budget
    WHERE id = team_record.id;
    
    RAISE NOTICE 'Updated % (Tier %): Transfer Budget = £%, Weekly Wages = £%', 
      team_record.name, team_record.tier, 
      final_transfer_budget, final_wage_budget;
  END LOOP;
  
  RAISE NOTICE 'Updated all team budgets with Tier 1 variation and scaled tiers';
  
END;
$$;
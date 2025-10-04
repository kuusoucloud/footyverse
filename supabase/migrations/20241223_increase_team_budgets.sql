-- Significantly increase team transfer budgets across all tiers
-- Tier 1 clubs get around £50M, scaling down for lower tiers

DO $$
DECLARE
  team_record RECORD;
  base_transfer_budget bigint;
  base_wage_budget bigint;
  random_variation numeric;
  final_transfer_budget bigint;
  final_wage_budget bigint;
BEGIN
  -- Update budgets for all teams based on tier
  FOR team_record IN 
    SELECT id, name, tier FROM teams ORDER BY tier ASC, name ASC
  LOOP
    -- Set base budgets by tier (much higher amounts)
    CASE team_record.tier
      WHEN 1 THEN 
        base_transfer_budget := 50000000; -- £50M base for Tier 1
        base_wage_budget := 2000000; -- £2M weekly wage budget
      WHEN 2 THEN 
        base_transfer_budget := 25000000; -- £25M base for Tier 2
        base_wage_budget := 1200000; -- £1.2M weekly wage budget
      WHEN 3 THEN 
        base_transfer_budget := 12000000; -- £12M base for Tier 3
        base_wage_budget := 700000; -- £700K weekly wage budget
      WHEN 4 THEN 
        base_transfer_budget := 6000000; -- £6M base for Tier 4
        base_wage_budget := 400000; -- £400K weekly wage budget
      WHEN 5 THEN 
        base_transfer_budget := 3000000; -- £3M base for Tier 5
        base_wage_budget := 200000; -- £200K weekly wage budget
      ELSE 
        base_transfer_budget := 1000000; -- £1M default
        base_wage_budget := 100000; -- £100K default
    END CASE;
    
    -- Add random variation (±30% for transfer budget, ±20% for wage budget)
    random_variation := (RANDOM() * 0.6 - 0.3); -- -30% to +30%
    final_transfer_budget := base_transfer_budget + (base_transfer_budget * random_variation)::bigint;
    
    random_variation := (RANDOM() * 0.4 - 0.2); -- -20% to +20%
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
  
  RAISE NOTICE 'Updated all team budgets with significantly higher amounts';
  
END;
$$;
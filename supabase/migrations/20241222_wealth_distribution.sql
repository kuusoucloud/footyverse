-- Implement realistic wealth distribution across tiers

-- Update team budgets based on tier with realistic wealth gaps
UPDATE teams SET 
  transfer_budget = CASE tier
    -- Tier 1 (Premier Division) - Mega rich clubs
    WHEN 1 THEN 
      CASE 
        WHEN random() < 0.3 THEN 200000000 + (random() * 100000000)::INTEGER  -- Top 6 clubs: £200-300M
        WHEN random() < 0.6 THEN 80000000 + (random() * 70000000)::INTEGER    -- Mid-table: £80-150M  
        ELSE 40000000 + (random() * 40000000)::INTEGER                        -- Bottom clubs: £40-80M
      END
    -- Tier 2 (Championship) - Rich but not mega rich
    WHEN 2 THEN 15000000 + (random() * 25000000)::INTEGER                     -- £15-40M
    -- Tier 3 (League One) - Moderate budgets
    WHEN 3 THEN 3000000 + (random() * 7000000)::INTEGER                       -- £3-10M
    -- Tier 4 (League Two) - Limited budgets
    WHEN 4 THEN 500000 + (random() * 2500000)::INTEGER                        -- £0.5-3M
    -- Tier 5 (National League) - Very poor
    WHEN 5 THEN 100000 + (random() * 400000)::INTEGER                         -- £0.1-0.5M
  END,
  wage_budget = CASE tier
    -- Weekly wage budgets (annual wage budget / 52)
    WHEN 1 THEN 
      CASE 
        WHEN random() < 0.3 THEN 6000000 + (random() * 4000000)::INTEGER      -- £6-10M per week
        WHEN random() < 0.6 THEN 2500000 + (random() * 2500000)::INTEGER      -- £2.5-5M per week
        ELSE 1000000 + (random() * 1500000)::INTEGER                          -- £1-2.5M per week
      END
    WHEN 2 THEN 400000 + (random() * 600000)::INTEGER                         -- £400k-1M per week
    WHEN 3 THEN 80000 + (random() * 120000)::INTEGER                          -- £80-200k per week
    WHEN 4 THEN 20000 + (random() * 30000)::INTEGER                           -- £20-50k per week
    WHEN 5 THEN 5000 + (random() * 15000)::INTEGER                            -- £5-20k per week
  END;

-- Update team ELO ratings to reflect their financial power (richer teams tend to be better)
UPDATE teams SET 
  elo = CASE tier
    WHEN 1 THEN 1600 + (random() * 400)::INTEGER  -- 1600-2000 ELO
    WHEN 2 THEN 1400 + (random() * 300)::INTEGER  -- 1400-1700 ELO  
    WHEN 3 THEN 1200 + (random() * 250)::INTEGER  -- 1200-1450 ELO
    WHEN 4 THEN 1000 + (random() * 200)::INTEGER  -- 1000-1200 ELO
    WHEN 5 THEN 800 + (random() * 150)::INTEGER   -- 800-950 ELO
  END;

-- Create wealth categories for teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS wealth_category TEXT;

UPDATE teams SET 
  wealth_category = CASE 
    WHEN tier = 1 AND transfer_budget > 150000000 THEN 'mega_rich'
    WHEN tier = 1 AND transfer_budget > 80000000 THEN 'rich'
    WHEN tier = 1 THEN 'moderate'
    WHEN tier = 2 AND transfer_budget > 25000000 THEN 'moderate'
    WHEN tier = 2 THEN 'limited'
    WHEN tier = 3 THEN 'limited'
    WHEN tier = 4 THEN 'poor'
    WHEN tier = 5 THEN 'very_poor'
  END;
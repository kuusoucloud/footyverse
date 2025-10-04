-- Assign team budgets based on tier with variation and set player wages based on skill and team finances

-- Add budget columns if they don't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS transfer_budget BIGINT DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS weekly_wage_budget BIGINT DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS wage INTEGER DEFAULT 0;

-- Update team budgets based on tier with realistic variation
UPDATE teams 
SET 
  transfer_budget = CASE tier
    -- Tier 1: £10M - £200M transfer budget
    WHEN 1 THEN 
      CASE wealth_category
        WHEN 'mega_rich' THEN 100000000 + (RANDOM() * 100000000)::BIGINT  -- £100M-£200M
        WHEN 'rich' THEN 50000000 + (RANDOM() * 50000000)::BIGINT         -- £50M-£100M
        WHEN 'moderate' THEN 20000000 + (RANDOM() * 30000000)::BIGINT     -- £20M-£50M
        WHEN 'limited' THEN 10000000 + (RANDOM() * 15000000)::BIGINT      -- £10M-£25M
        ELSE 5000000 + (RANDOM() * 10000000)::BIGINT                      -- £5M-£15M
      END
    -- Tier 2: £2M - £50M transfer budget  
    WHEN 2 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 30000000 + (RANDOM() * 20000000)::BIGINT    -- £30M-£50M
        WHEN 'rich' THEN 15000000 + (RANDOM() * 15000000)::BIGINT         -- £15M-£30M
        WHEN 'moderate' THEN 5000000 + (RANDOM() * 10000000)::BIGINT      -- £5M-£15M
        WHEN 'limited' THEN 2000000 + (RANDOM() * 5000000)::BIGINT        -- £2M-£7M
        ELSE 1000000 + (RANDOM() * 3000000)::BIGINT                       -- £1M-£4M
      END
    -- Tier 3: £500K - £10M transfer budget
    WHEN 3 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 5000000 + (RANDOM() * 5000000)::BIGINT      -- £5M-£10M
        WHEN 'rich' THEN 2000000 + (RANDOM() * 3000000)::BIGINT           -- £2M-£5M
        WHEN 'moderate' THEN 1000000 + (RANDOM() * 2000000)::BIGINT       -- £1M-£3M
        WHEN 'limited' THEN 500000 + (RANDOM() * 1000000)::BIGINT         -- £500K-£1.5M
        ELSE 200000 + (RANDOM() * 500000)::BIGINT                         -- £200K-£700K
      END
    -- Tier 4: £100K - £2M transfer budget
    WHEN 4 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 1000000 + (RANDOM() * 1000000)::BIGINT      -- £1M-£2M
        WHEN 'rich' THEN 500000 + (RANDOM() * 500000)::BIGINT             -- £500K-£1M
        WHEN 'moderate' THEN 250000 + (RANDOM() * 250000)::BIGINT         -- £250K-£500K
        WHEN 'limited' THEN 100000 + (RANDOM() * 150000)::BIGINT          -- £100K-£250K
        ELSE 50000 + (RANDOM() * 100000)::BIGINT                          -- £50K-£150K
      END
    -- Tier 5: £25K - £500K transfer budget
    ELSE
      CASE wealth_category
        WHEN 'mega_rich' THEN 250000 + (RANDOM() * 250000)::BIGINT        -- £250K-£500K
        WHEN 'rich' THEN 100000 + (RANDOM() * 150000)::BIGINT             -- £100K-£250K
        WHEN 'moderate' THEN 50000 + (RANDOM() * 75000)::BIGINT           -- £50K-£125K
        WHEN 'limited' THEN 25000 + (RANDOM() * 50000)::BIGINT            -- £25K-£75K
        ELSE 10000 + (RANDOM() * 25000)::BIGINT                           -- £10K-£35K
      END
  END,
  weekly_wage_budget = CASE tier
    -- Tier 1: £500K - £5M per week
    WHEN 1 THEN 
      CASE wealth_category
        WHEN 'mega_rich' THEN 2500000 + (RANDOM() * 2500000)::BIGINT      -- £2.5M-£5M/week
        WHEN 'rich' THEN 1500000 + (RANDOM() * 1000000)::BIGINT           -- £1.5M-£2.5M/week
        WHEN 'moderate' THEN 800000 + (RANDOM() * 700000)::BIGINT         -- £800K-£1.5M/week
        WHEN 'limited' THEN 500000 + (RANDOM() * 300000)::BIGINT          -- £500K-£800K/week
        ELSE 300000 + (RANDOM() * 200000)::BIGINT                         -- £300K-£500K/week
      END
    -- Tier 2: £100K - £1M per week
    WHEN 2 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 600000 + (RANDOM() * 400000)::BIGINT        -- £600K-£1M/week
        WHEN 'rich' THEN 300000 + (RANDOM() * 300000)::BIGINT             -- £300K-£600K/week
        WHEN 'moderate' THEN 150000 + (RANDOM() * 150000)::BIGINT         -- £150K-£300K/week
        WHEN 'limited' THEN 100000 + (RANDOM() * 100000)::BIGINT          -- £100K-£200K/week
        ELSE 50000 + (RANDOM() * 75000)::BIGINT                           -- £50K-£125K/week
      END
    -- Tier 3: £25K - £200K per week
    WHEN 3 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 100000 + (RANDOM() * 100000)::BIGINT        -- £100K-£200K/week
        WHEN 'rich' THEN 60000 + (RANDOM() * 60000)::BIGINT               -- £60K-£120K/week
        WHEN 'moderate' THEN 35000 + (RANDOM() * 35000)::BIGINT           -- £35K-£70K/week
        WHEN 'limited' THEN 25000 + (RANDOM() * 25000)::BIGINT            -- £25K-£50K/week
        ELSE 15000 + (RANDOM() * 20000)::BIGINT                           -- £15K-£35K/week
      END
    -- Tier 4: £10K - £75K per week
    WHEN 4 THEN
      CASE wealth_category
        WHEN 'mega_rich' THEN 50000 + (RANDOM() * 25000)::BIGINT          -- £50K-£75K/week
        WHEN 'rich' THEN 30000 + (RANDOM() * 20000)::BIGINT               -- £30K-£50K/week
        WHEN 'moderate' THEN 20000 + (RANDOM() * 15000)::BIGINT           -- £20K-£35K/week
        WHEN 'limited' THEN 15000 + (RANDOM() * 10000)::BIGINT            -- £15K-£25K/week
        ELSE 10000 + (RANDOM() * 10000)::BIGINT                           -- £10K-£20K/week
      END
    -- Tier 5: £5K - £25K per week
    ELSE
      CASE wealth_category
        WHEN 'mega_rich' THEN 15000 + (RANDOM() * 10000)::BIGINT          -- £15K-£25K/week
        WHEN 'rich' THEN 10000 + (RANDOM() * 8000)::BIGINT                -- £10K-£18K/week
        WHEN 'moderate' THEN 7000 + (RANDOM() * 5000)::BIGINT             -- £7K-£12K/week
        WHEN 'limited' THEN 5000 + (RANDOM() * 3000)::BIGINT              -- £5K-£8K/week
        ELSE 3000 + (RANDOM() * 3000)::BIGINT                             -- £3K-£6K/week
      END
  END;

-- Now assign player wages based on skill rating and team's wage budget
WITH team_wage_data AS (
  SELECT 
    t.id as team_id,
    t.weekly_wage_budget,
    COUNT(p.id) as player_count,
    -- Calculate base wage per player (70% of budget distributed equally, 30% for skill bonuses)
    (t.weekly_wage_budget * 0.7 / COUNT(p.id))::INTEGER as base_wage_per_player,
    (t.weekly_wage_budget * 0.3)::BIGINT as skill_bonus_pool
  FROM teams t
  JOIN players p ON t.id = p.team_id
  GROUP BY t.id, t.weekly_wage_budget
),
player_wage_calculations AS (
  SELECT 
    p.id,
    p.team_id,
    p.skill_rating,
    twd.base_wage_per_player,
    twd.skill_bonus_pool,
    -- Calculate skill multiplier (0.5x to 2.5x based on skill 0-99)
    (0.5 + (COALESCE(p.skill_rating, 50) / 99.0) * 2.0) as skill_multiplier,
    -- Calculate final wage
    (twd.base_wage_per_player * (0.5 + (COALESCE(p.skill_rating, 50) / 99.0) * 2.0))::INTEGER as calculated_wage
  FROM players p
  JOIN team_wage_data twd ON p.team_id = twd.team_id
)
UPDATE players 
SET wage = pwc.calculated_wage
FROM player_wage_calculations pwc
WHERE players.id = pwc.id;
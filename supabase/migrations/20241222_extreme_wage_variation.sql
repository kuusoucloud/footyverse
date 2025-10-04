-- Create extreme wage variation with top players earning up to £300,000 per week
-- Much more dramatic swings between skill levels

UPDATE players 
SET weekly_wage = CASE 
  -- Superstar players (95+ skill): £150k-£300k per week
  WHEN skill_rating >= 95 THEN 
    (150000 + (RANDOM() * 150000))::INTEGER
  
  -- World class players (90-94 skill): £80k-£200k per week
  WHEN skill_rating >= 90 THEN 
    (80000 + (RANDOM() * 120000))::INTEGER
  
  -- Elite players (85-89 skill): £40k-£100k per week  
  WHEN skill_rating >= 85 THEN 
    (40000 + (RANDOM() * 60000))::INTEGER
    
  -- Very good players (80-84 skill): £20k-£60k per week
  WHEN skill_rating >= 80 THEN 
    (20000 + (RANDOM() * 40000))::INTEGER
    
  -- Good players (75-79 skill): £10k-£35k per week
  WHEN skill_rating >= 75 THEN 
    (10000 + (RANDOM() * 25000))::INTEGER
    
  -- Above average players (70-74 skill): £5k-£20k per week
  WHEN skill_rating >= 70 THEN 
    (5000 + (RANDOM() * 15000))::INTEGER
    
  -- Average players (65-69 skill): £2k-£12k per week
  WHEN skill_rating >= 65 THEN 
    (2000 + (RANDOM() * 10000))::INTEGER
    
  -- Below average players (60-64 skill): £800-£5k per week
  WHEN skill_rating >= 60 THEN 
    (800 + (RANDOM() * 4200))::INTEGER
    
  -- Poor players (55-59 skill): £300-£2k per week
  WHEN skill_rating >= 55 THEN 
    (300 + (RANDOM() * 1700))::INTEGER
    
  -- Very poor players (50-54 skill): £100-£800 per week
  WHEN skill_rating >= 50 THEN 
    (100 + (RANDOM() * 700))::INTEGER
    
  -- Terrible players (45-49 skill): £50-£300 per week
  WHEN skill_rating >= 45 THEN 
    (50 + (RANDOM() * 250))::INTEGER
    
  -- Amateur level players (below 45): £1-£100 per week
  ELSE 
    (1 + (RANDOM() * 99))::INTEGER
END;

-- Add additional wage multipliers for club wealth and player form
UPDATE players 
SET weekly_wage = (
  SELECT GREATEST(1, (
    p.weekly_wage * 
    -- Club wealth multiplier (affects wage budget)
    CASE t.wealth_category
      WHEN 'oil_money' THEN 1.5      -- Oil money clubs pay 50% more
      WHEN 'very_rich' THEN 1.3      -- Very rich clubs pay 30% more
      WHEN 'rich' THEN 1.15          -- Rich clubs pay 15% more
      WHEN 'moderate' THEN 1.0       -- Moderate clubs baseline
      WHEN 'poor' THEN 0.8           -- Poor clubs pay 20% less
      ELSE 0.7                       -- Very poor clubs pay 30% less
    END *
    -- Form multiplier (good form = wage bonuses)
    CASE 
      WHEN p.form >= 85 THEN 1.2     -- Excellent form: 20% bonus
      WHEN p.form >= 75 THEN 1.1     -- Good form: 10% bonus
      WHEN p.form >= 60 THEN 1.0     -- Average form: no change
      WHEN p.form >= 45 THEN 0.95    -- Poor form: 5% reduction
      ELSE 0.9                       -- Terrible form: 10% reduction
    END
  )::INTEGER)
)
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE players.id = p.id;
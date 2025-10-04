-- Update player wages and market values with realistic variation based on skill_rating, form, and club finances

-- First, add form column if it doesn't exist (0-100 scale)
ALTER TABLE players ADD COLUMN IF NOT EXISTS form INTEGER DEFAULT 50;

-- Update player form with realistic variation (0-100 scale)
UPDATE players 
SET form = CASE 
  WHEN skill_rating >= 90 THEN 70 + (RANDOM() * 30)::INTEGER  -- Top players: 70-100 form
  WHEN skill_rating >= 80 THEN 60 + (RANDOM() * 35)::INTEGER  -- Good players: 60-95 form
  WHEN skill_rating >= 70 THEN 50 + (RANDOM() * 40)::INTEGER  -- Average players: 50-90 form
  WHEN skill_rating >= 60 THEN 40 + (RANDOM() * 45)::INTEGER  -- Below average: 40-85 form
  ELSE 30 + (RANDOM() * 50)::INTEGER                          -- Poor players: 30-80 form
END;

-- Update weekly wages based on skill_rating with much more variation (£1 to £300,000 per week)
UPDATE players 
SET weekly_wage = CASE 
  -- World class players (90+ skill): £50k-£300k per week
  WHEN skill_rating >= 90 THEN 
    (50000 + (RANDOM() * 250000))::INTEGER
  
  -- Excellent players (85-89 skill): £25k-£80k per week  
  WHEN skill_rating >= 85 THEN 
    (25000 + (RANDOM() * 55000))::INTEGER
    
  -- Very good players (80-84 skill): £15k-£40k per week
  WHEN skill_rating >= 80 THEN 
    (15000 + (RANDOM() * 25000))::INTEGER
    
  -- Good players (75-79 skill): £8k-£25k per week
  WHEN skill_rating >= 75 THEN 
    (8000 + (RANDOM() * 17000))::INTEGER
    
  -- Above average players (70-74 skill): £4k-£15k per week
  WHEN skill_rating >= 70 THEN 
    (4000 + (RANDOM() * 11000))::INTEGER
    
  -- Average players (65-69 skill): £2k-£8k per week
  WHEN skill_rating >= 65 THEN 
    (2000 + (RANDOM() * 6000))::INTEGER
    
  -- Below average players (60-64 skill): £1k-£4k per week
  WHEN skill_rating >= 60 THEN 
    (1000 + (RANDOM() * 3000))::INTEGER
    
  -- Poor players (55-59 skill): £500-£2k per week
  WHEN skill_rating >= 55 THEN 
    (500 + (RANDOM() * 1500))::INTEGER
    
  -- Very poor players (50-54 skill): £200-£1k per week
  WHEN skill_rating >= 50 THEN 
    (200 + (RANDOM() * 800))::INTEGER
    
  -- Terrible players (below 50): £1-£500 per week
  ELSE 
    (1 + (RANDOM() * 499))::INTEGER
END;

-- Update market values based on skill_rating, form, age, and club wealth (£1 to £120M)
UPDATE players 
SET market_value = (
  SELECT CASE 
    -- World class players (90+ skill): £20M-£120M
    WHEN p.skill_rating >= 90 THEN 
      GREATEST(1, (
        20000000 + (RANDOM() * 100000000) * 
        -- Form multiplier (0.7-1.3)
        (0.7 + (p.form / 100.0) * 0.6) *
        -- Age multiplier (peak at 25-28)
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        -- Club wealth multiplier (richer clubs inflate values)
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.3
          WHEN 'very_rich' THEN 1.2
          WHEN 'rich' THEN 1.1
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.9
          ELSE 0.8
        END
      )::INTEGER)
    
    -- Excellent players (85-89 skill): £8M-£50M
    WHEN p.skill_rating >= 85 THEN 
      GREATEST(1, (
        8000000 + (RANDOM() * 42000000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.3
          WHEN 'very_rich' THEN 1.2
          WHEN 'rich' THEN 1.1
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.9
          ELSE 0.8
        END
      )::INTEGER)
    
    -- Very good players (80-84 skill): £3M-£25M
    WHEN p.skill_rating >= 80 THEN 
      GREATEST(1, (
        3000000 + (RANDOM() * 22000000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.2
          WHEN 'very_rich' THEN 1.15
          WHEN 'rich' THEN 1.1
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.9
          ELSE 0.8
        END
      )::INTEGER)
    
    -- Good players (75-79 skill): £1M-£12M
    WHEN p.skill_rating >= 75 THEN 
      GREATEST(1, (
        1000000 + (RANDOM() * 11000000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.2
          WHEN 'very_rich' THEN 1.15
          WHEN 'rich' THEN 1.1
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.9
          ELSE 0.8
        END
      )::INTEGER)
    
    -- Above average players (70-74 skill): £300k-£5M
    WHEN p.skill_rating >= 70 THEN 
      GREATEST(1, (
        300000 + (RANDOM() * 4700000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.15
          WHEN 'very_rich' THEN 1.1
          WHEN 'rich' THEN 1.05
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.95
          ELSE 0.9
        END
      )::INTEGER)
    
    -- Average players (65-69 skill): £100k-£2M
    WHEN p.skill_rating >= 65 THEN 
      GREATEST(1, (
        100000 + (RANDOM() * 1900000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END *
        CASE t.wealth_category
          WHEN 'oil_money' THEN 1.1
          WHEN 'very_rich' THEN 1.05
          WHEN 'rich' THEN 1.0
          WHEN 'moderate' THEN 1.0
          WHEN 'poor' THEN 0.95
          ELSE 0.9
        END
      )::INTEGER)
    
    -- Below average players (60-64 skill): £25k-£800k
    WHEN p.skill_rating >= 60 THEN 
      GREATEST(1, (
        25000 + (RANDOM() * 775000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END
      )::INTEGER)
    
    -- Poor players (55-59 skill): £5k-£200k
    WHEN p.skill_rating >= 55 THEN 
      GREATEST(1, (
        5000 + (RANDOM() * 195000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END
      )::INTEGER)
    
    -- Very poor players (50-54 skill): £1k-£50k
    WHEN p.skill_rating >= 50 THEN 
      GREATEST(1, (
        1000 + (RANDOM() * 49000) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END
      )::INTEGER)
    
    -- Terrible players (below 50): £1-£10k
    ELSE 
      GREATEST(1, (
        1 + (RANDOM() * 9999) * 
        (0.7 + (p.form / 100.0) * 0.6) *
        CASE 
          WHEN p.age BETWEEN 25 AND 28 THEN 1.0
          WHEN p.age BETWEEN 22 AND 24 THEN 0.9
          WHEN p.age BETWEEN 29 AND 31 THEN 0.85
          WHEN p.age BETWEEN 19 AND 21 THEN 0.7
          WHEN p.age BETWEEN 32 AND 34 THEN 0.6
          ELSE 0.4
        END
      )::INTEGER)
  END
)
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE players.id = p.id;
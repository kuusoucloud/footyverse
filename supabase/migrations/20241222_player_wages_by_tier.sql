-- Update player wages and market values based on team tier and ability

-- Update player wages based on their team's tier and their ability
UPDATE players SET 
  weekly_wage = CASE 
    WHEN teams.tier = 1 THEN 
      CASE 
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 240 
        THEN 150000 + (random() * 200000)::INTEGER  -- Star players: £150-350k/week
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 180 
        THEN 50000 + (random() * 100000)::INTEGER   -- Good players: £50-150k/week
        ELSE 15000 + (random() * 35000)::INTEGER    -- Squad players: £15-50k/week
      END
    WHEN teams.tier = 2 THEN 
      CASE 
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 200 
        THEN 25000 + (random() * 25000)::INTEGER    -- Star players: £25-50k/week
        ELSE 8000 + (random() * 17000)::INTEGER     -- Regular players: £8-25k/week
      END
    WHEN teams.tier = 3 THEN 
      CASE 
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 180 
        THEN 5000 + (random() * 10000)::INTEGER     -- Star players: £5-15k/week
        ELSE 2000 + (random() * 6000)::INTEGER      -- Regular players: £2-8k/week
      END
    WHEN teams.tier = 4 THEN 
      CASE 
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 160 
        THEN 2000 + (random() * 3000)::INTEGER      -- Star players: £2-5k/week
        ELSE 800 + (random() * 1700)::INTEGER       -- Regular players: £800-2.5k/week
      END
    WHEN teams.tier = 5 THEN 
      CASE 
        WHEN (players.attributes->>'pace')::INTEGER + (players.attributes->>'finishing')::INTEGER + (players.attributes->>'passing')::INTEGER > 140 
        THEN 1000 + (random() * 1500)::INTEGER      -- Star players: £1-2.5k/week
        ELSE 400 + (random() * 800)::INTEGER        -- Regular players: £400-1.2k/week
      END
  END,
  market_value = CASE 
    WHEN teams.tier = 1 THEN (players.market_value * (2.0 + random()))::INTEGER  -- Premier League premium
    WHEN teams.tier = 2 THEN (players.market_value * (1.2 + random() * 0.5))::INTEGER
    WHEN teams.tier = 3 THEN (players.market_value * (0.8 + random() * 0.3))::INTEGER
    WHEN teams.tier = 4 THEN (players.market_value * (0.4 + random() * 0.2))::INTEGER
    WHEN teams.tier = 5 THEN (players.market_value * (0.2 + random() * 0.1))::INTEGER
  END
FROM teams 
WHERE players.team_id = teams.id;
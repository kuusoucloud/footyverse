ALTER TABLE players 
ADD COLUMN IF NOT EXISTS contract_years_remaining INTEGER DEFAULT 0;

UPDATE players 
SET contract_end = CURRENT_DATE + INTERVAL '1 year' * (1 + FLOOR(RANDOM() * 5))
WHERE contract_end IS NULL OR contract_end < CURRENT_DATE;

UPDATE players 
SET contract_years_remaining = GREATEST(1, LEAST(5, EXTRACT(YEAR FROM AGE(contract_end, CURRENT_DATE)) + 1))
WHERE contract_end IS NOT NULL;
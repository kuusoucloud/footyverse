-- Update transfer window management for 38 match seasons
-- Winter window now opens at match 18-28 instead of 15-25

CREATE OR REPLACE FUNCTION manage_transfer_windows()
RETURNS VOID AS $$
DECLARE
  tier_record RECORD;
  season_record RECORD;
BEGIN
  -- Check each tier's season progress
  FOR tier_record IN SELECT DISTINCT tier FROM teams LOOP
    -- Get current season info
    SELECT * INTO season_record
    FROM season_progression 
    WHERE tier = tier_record.tier 
    AND season_status = 'active'
    ORDER BY season_number DESC 
    LIMIT 1;
    
    IF season_record IS NOT NULL THEN
      -- Summer transfer window: Opens at start of season (0-5 matches)
      IF season_record.matches_completed >= 0 AND season_record.matches_completed <= 5 THEN
        -- Open summer window if not already open
        INSERT INTO transfer_window_schedule (tier, season_number, window_type, matches_trigger, is_active, opened_at)
        VALUES (tier_record.tier, season_record.season_number, 'summer', 0, TRUE, NOW())
        ON CONFLICT DO NOTHING;
        
        -- Close winter window if open
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'winter' 
        AND is_active = TRUE;
      END IF;
      
      -- Close summer window after 10 matches
      IF season_record.matches_completed > 10 THEN
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'summer' 
        AND is_active = TRUE;
      END IF;
      
      -- Winter transfer window: Opens mid-season (18-28 matches) - updated for 38 match season
      IF season_record.matches_completed >= 18 AND season_record.matches_completed <= 28 THEN
        -- Open winter window if not already open
        INSERT INTO transfer_window_schedule (tier, season_number, window_type, matches_trigger, is_active, opened_at)
        VALUES (tier_record.tier, season_record.season_number, 'winter', 18, TRUE, NOW())
        ON CONFLICT DO NOTHING;
      END IF;
      
      -- Close winter window after 28 matches - updated for 38 match season
      IF season_record.matches_completed > 28 THEN
        UPDATE transfer_window_schedule 
        SET is_active = FALSE, closed_at = NOW()
        WHERE tier = tier_record.tier 
        AND season_number = season_record.season_number 
        AND window_type = 'winter' 
        AND is_active = TRUE;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
-- Update orchestration system to run more frequently and force immediate execution
-- This ensures matches and fixtures are created right away

-- Update the orchestration timing to be more aggressive
UPDATE orchestration_status 
SET last_run = NOW() - INTERVAL '5 minutes', -- Force it to run immediately
    is_running = FALSE,
    run_count = 0
WHERE id = 1;

-- Create function to force orchestration run
CREATE OR REPLACE FUNCTION force_orchestration_run()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orchestration_status 
  SET last_run = NOW() - INTERVAL '5 minutes',
      is_running = FALSE
  WHERE id = 1;
END;
$$;

-- Run it immediately
SELECT force_orchestration_run();
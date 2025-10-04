-- Create server-side continuous match system
-- This ensures all clients see the same state regardless of when they visit

-- Create a function that runs the orchestrator via HTTP
CREATE OR REPLACE FUNCTION run_orchestrator_http()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_data jsonb;
BEGIN
  -- Use pg_net to call the orchestrator function
  SELECT INTO response_data
    net.http_post(
      url := 'https://61a6679e-1b7a-4a09-82c9-a4f4b6c4294e.supabase.co/functions/v1/supabase-functions-match-orchestrator',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('server_triggered', true)
    );
END;
$$;

-- Create a trigger function that runs on a schedule
CREATE OR REPLACE FUNCTION continuous_orchestration()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  last_run_time timestamp with time zone;
  should_run boolean := false;
BEGIN
  -- Get the last run time
  SELECT last_run INTO last_run_time
  FROM orchestration_status 
  WHERE id = 1;
  
  -- Check if we should run (every 30 seconds)
  IF last_run_time IS NULL OR last_run_time < NOW() - INTERVAL '30 seconds' THEN
    should_run := true;
  END IF;
  
  -- Run orchestration if needed
  IF should_run THEN
    PERFORM run_orchestrator_http();
  END IF;
END;
$$;

-- Enable pg_net extension for HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a simple heartbeat table to trigger continuous execution
CREATE TABLE IF NOT EXISTS orchestration_heartbeat (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_beat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO orchestration_heartbeat (id, last_beat) 
VALUES (1, NOW())
ON CONFLICT (id) DO UPDATE SET last_beat = NOW();

-- Create trigger to run orchestration on heartbeat updates
CREATE OR REPLACE FUNCTION trigger_orchestration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM continuous_orchestration();
  RETURN NEW;
END;
$$;

-- Create trigger on heartbeat table
DROP TRIGGER IF EXISTS orchestration_trigger ON orchestration_heartbeat;
CREATE TRIGGER orchestration_trigger
  AFTER UPDATE ON orchestration_heartbeat
  FOR EACH ROW
  EXECUTE FUNCTION trigger_orchestration();

-- Enable realtime for heartbeat so we can update it from clients
ALTER PUBLICATION supabase_realtime ADD TABLE orchestration_heartbeat;
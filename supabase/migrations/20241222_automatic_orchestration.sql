-- Create automatic orchestration system using database functions
-- This creates a simple system that tracks when orchestration should run

-- Create orchestration status table
CREATE TABLE IF NOT EXISTS orchestration_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_run TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_running BOOLEAN DEFAULT FALSE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial status
INSERT INTO orchestration_status (id, last_run, is_running, run_count) 
VALUES (1, NOW(), FALSE, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to check if orchestration should run
CREATE OR REPLACE FUNCTION should_run_orchestration()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  last_run_time TIMESTAMP WITH TIME ZONE;
  is_currently_running BOOLEAN;
BEGIN
  SELECT last_run, is_running 
  INTO last_run_time, is_currently_running
  FROM orchestration_status 
  WHERE id = 1;
  
  -- Run if it's been more than 2 minutes since last run and not currently running
  RETURN (
    NOT COALESCE(is_currently_running, FALSE) AND 
    (last_run_time IS NULL OR last_run_time < NOW() - INTERVAL '2 minutes')
  );
END;
$$;

-- Create function to mark orchestration as started
CREATE OR REPLACE FUNCTION mark_orchestration_started()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orchestration_status 
  SET is_running = TRUE, last_run = NOW()
  WHERE id = 1;
END;
$$;

-- Create function to mark orchestration as completed
CREATE OR REPLACE FUNCTION mark_orchestration_completed()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orchestration_status 
  SET is_running = FALSE, run_count = run_count + 1
  WHERE id = 1;
END;
$$;

-- Enable realtime for orchestration status so clients can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE orchestration_status;
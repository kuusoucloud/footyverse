-- Add additional indexes for optimal performance on dynamic data queries
-- These will be crucial for fast reads/writes during season simulation

-- Fixtures performance indexes
CREATE INDEX IF NOT EXISTS idx_fixtures_status_scheduled_at ON fixtures(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_fixtures_round ON fixtures(round);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures(home_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures(away_team_id);

-- Player performance indexes for transfers and form
CREATE INDEX IF NOT EXISTS idx_players_market_value ON players(market_value DESC) WHERE market_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_form_rating ON players(form_rating DESC) WHERE form_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_transfer_listed ON players(transfer_listed) WHERE transfer_listed = true;
CREATE INDEX IF NOT EXISTS idx_players_injury_status ON players(injury_status) WHERE injury_status IS NOT NULL;

-- Team financial indexes
CREATE INDEX IF NOT EXISTS idx_teams_transfer_budget ON teams(transfer_budget DESC);
CREATE INDEX IF NOT EXISTS idx_teams_tier_elo ON teams(tier, elo_rating DESC);

-- Transfer system indexes
CREATE INDEX IF NOT EXISTS idx_transfer_bids_status ON transfer_bids(status, bid_date DESC);
CREATE INDEX IF NOT EXISTS idx_transfer_bids_player ON transfer_bids(player_id, status);
CREATE INDEX IF NOT EXISTS idx_player_interests_team ON player_interests(team_id, interest_level DESC);

-- Match performance indexes
CREATE INDEX IF NOT EXISTS idx_finished_matches_date ON finished_matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_finished_matches_tier ON finished_matches(tier, match_date DESC);
CREATE INDEX IF NOT EXISTS idx_player_match_performance_rating ON player_match_performance(match_rating DESC);

-- Injury tracking indexes
CREATE INDEX IF NOT EXISTS idx_player_injuries_active ON player_injuries(is_active, expected_return) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_player_injuries_recovery ON player_injuries(recovery_weeks_completed, recovery_weeks_needed);

-- Season progression indexes
CREATE INDEX IF NOT EXISTS idx_season_progression_status ON season_progression(season_status, tier);
CREATE INDEX IF NOT EXISTS idx_global_season_status_current ON global_season_status(season_number DESC);

-- Standings performance indexes
CREATE INDEX IF NOT EXISTS idx_team_standings_points ON team_standings(league_id, points DESC);
CREATE INDEX IF NOT EXISTS idx_team_standings_form ON team_standings(form_last5) WHERE form_last5 IS NOT NULL;

-- Transfer window indexes
CREATE INDEX IF NOT EXISTS idx_transfer_windows_active ON transfer_windows(is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transfer_window_schedule_active ON transfer_window_schedule(is_active, season_number, tier) WHERE is_active = true;

-- Orchestration indexes
CREATE INDEX IF NOT EXISTS idx_orchestration_heartbeat_recent ON orchestration_heartbeat(last_beat DESC);
CREATE INDEX IF NOT EXISTS idx_fixture_generation_log_recent ON fixture_generation_log(created_at DESC, status);

DO $$
BEGIN
  RAISE NOTICE 'Performance indexes created for all dynamic data tables';
  RAISE NOTICE 'Database is optimized for:';
  RAISE NOTICE '✓ Fast fixture queries by status and date';
  RAISE NOTICE '✓ Efficient player transfer searches';
  RAISE NOTICE '✓ Quick team financial lookups';
  RAISE NOTICE '✓ Optimized standings calculations';
  RAISE NOTICE '✓ Fast injury tracking and recovery';
  RAISE NOTICE '✓ Efficient match performance queries';
  RAISE NOTICE '✓ Quick transfer window management';
END;
$$;
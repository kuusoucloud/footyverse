import { createClient } from '@/utils/supabase/client';

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  matchEvents: any[];
  matchStats: {
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number;
    awayCorners: number;
    homeFouls: number;
    awayFouls: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
  };
  playerPerformances?: PlayerPerformance[];
  simulationDuration?: number;
}

export interface PlayerPerformance {
  player_id: string;
  team_id: string;
  minutes_played: number;
  goals: number;
  assists: number;
  shots: number;
  shots_on_target: number;
  passes_completed: number;
  passes_attempted: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  yellow_cards: number;
  red_cards: number;
  fouls_committed: number;
  fouls_suffered: number;
  match_rating: number;
}

class MatchOrchestrator {
  private supabase = createClient();

  /**
   * Complete a match and store results in finished_matches table
   */
  async completeMatch(fixtureId: string, matchResult: MatchResult): Promise<{
    success: boolean;
    seasonProgressed?: boolean;
    error?: string;
  }> {
    try {
      const response = await this.supabase.functions.invoke('supabase-functions-match-orchestrator', {
        body: {
          action: 'complete_match',
          fixtureId,
          matchData: {
            ...matchResult,
            playerPerformances: matchResult.playerPerformances || []
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to complete match:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Advance to the next match in the sequence
   */
  async advanceToNextMatch(): Promise<{
    success: boolean;
    nextMatchId?: string;
    sequenceOrder?: number;
    error?: string;
  }> {
    try {
      const response = await this.supabase.functions.invoke('supabase-functions-match-orchestrator', {
        body: {
          action: 'advance_to_next_match'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to advance to next match:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if season should progress and handle automatic season generation
   */
  async checkSeasonProgress(): Promise<{
    success: boolean;
    seasonProgressed?: boolean;
    error?: string;
  }> {
    try {
      const response = await this.supabase.functions.invoke('supabase-functions-match-orchestrator', {
        body: {
          action: 'check_season_progress'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to check season progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get finished matches for a specific season
   */
  async getFinishedMatches(seasonNumber?: number, tier?: number, limit: number = 50) {
    try {
      let query = this.supabase
        .from('finished_matches')
        .select(`
          *,
          home_team:teams!finished_matches_home_team_id_fkey(id, name, tier, logo_url, crest_url),
          away_team:teams!finished_matches_away_team_id_fkey(id, name, tier, logo_url, crest_url)
        `)
        .order('match_date', { ascending: false })
        .limit(limit);

      if (seasonNumber) {
        query = query.eq('season_number', seasonNumber);
      }

      if (tier) {
        query = query.eq('tier', tier);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        success: true,
        matches: data || []
      };
    } catch (error) {
      console.error('Failed to get finished matches:', error);
      return {
        success: false,
        matches: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get player performance data for a specific match
   */
  async getPlayerPerformance(finishedMatchId: string) {
    try {
      const { data, error } = await this.supabase
        .from('player_match_performance')
        .select(`
          *,
          player:players(id, name, position),
          team:teams(id, name, tier)
        `)
        .eq('finished_match_id', finishedMatchId)
        .order('match_rating', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        performances: data || []
      };
    } catch (error) {
      console.error('Failed to get player performance:', error);
      return {
        success: false,
        performances: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current season statistics
   */
  async getCurrentSeasonStats() {
    try {
      // Get current season
      const { data: seasonData } = await this.supabase
        .from('global_season_status')
        .select('season_number')
        .eq('season_status', 'active')
        .order('season_number', { ascending: false })
        .limit(1);

      const currentSeason = seasonData?.[0]?.season_number || 1;

      // Get remaining fixtures
      const { data: remainingFixtures } = await this.supabase
        .from('fixtures')
        .select('id, status')
        .in('status', ['scheduled', 'live']);

      // Get completed matches this season
      const { data: completedMatches } = await this.supabase
        .from('finished_matches')
        .select('id')
        .eq('season_number', currentSeason);

      return {
        success: true,
        currentSeason,
        remainingFixtures: remainingFixtures?.length || 0,
        completedMatches: completedMatches?.length || 0,
        liveMatches: remainingFixtures?.filter(f => f.status === 'live').length || 0
      };
    } catch (error) {
      console.error('Failed to get season stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const matchOrchestrator = new MatchOrchestrator();
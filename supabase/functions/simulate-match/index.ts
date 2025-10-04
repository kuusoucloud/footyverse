import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from "@shared/cors.ts";
import { simulateMatch, processInjuryRecoveries, getTeamInjuryReport } from "@shared/match-simulator.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { match_id, action } = await req.json().catch(() => ({ match_id: null, action: 'simulate' }));

    if (action === 'process_injuries') {
      const recoveredCount = await processInjuryRecoveries(supabase);
      return new Response(JSON.stringify({
        success: true,
        message: `Processed injury recoveries: ${recoveredCount} players recovered`,
        recovered_count: recoveredCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'injury_report' && match_id) {
      // Get injury report for teams in a match
      const { data: match } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id')
        .eq('id', match_id)
        .single();

      if (!match) {
        throw new Error('Match not found');
      }

      const [homeReport, awayReport] = await Promise.all([
        getTeamInjuryReport(supabase, match.home_team_id),
        getTeamInjuryReport(supabase, match.away_team_id)
      ]);

      return new Response(JSON.stringify({
        success: true,
        home_team_injuries: homeReport,
        away_team_injuries: awayReport
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!match_id) {
      throw new Error('Match ID is required');
    }

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*)
      `)
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      throw new Error(`Match not found: ${matchError?.message}`);
    }

    // Get players for both teams (including injury status)
    const [homePlayersRes, awayPlayersRes] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('team_id', match.home_team_id),
      supabase
        .from('players')
        .select('*')
        .eq('team_id', match.away_team_id)
    ]);

    const homePlayers = homePlayersRes.data || [];
    const awayPlayers = awayPlayersRes.data || [];

    // Check if teams have enough fit players
    const fitHomePlayers = homePlayers.filter(p => p.injury_status === 'fit');
    const fitAwayPlayers = awayPlayers.filter(p => p.injury_status === 'fit');

    if (fitHomePlayers.length < 7 || fitAwayPlayers.length < 7) {
      // Not enough players to play - forfeit or postpone
      await supabase
        .from('matches')
        .update({
          status: 'postponed',
          home_score: fitHomePlayers.length < 7 ? 0 : 3,
          away_score: fitAwayPlayers.length < 7 ? 0 : 3,
          minute: 90
        })
        .eq('id', match_id);

      return new Response(JSON.stringify({
        success: true,
        message: `Match postponed due to insufficient players`,
        home_fit_players: fitHomePlayers.length,
        away_fit_players: fitAwayPlayers.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Simulate the match with injury system
    const matchResult = await simulateMatch(
      supabase,
      match_id,
      match.home_team,
      match.away_team,
      homePlayers,
      awayPlayers
    );

    // Update match with results
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: matchResult.status,
        home_score: matchResult.home_score,
        away_score: matchResult.away_score,
        minute: matchResult.minute,
        events: matchResult.events
      })
      .eq('id', match_id);

    if (updateError) {
      throw new Error(`Failed to update match: ${updateError.message}`);
    }

    // Update team standings
    const homePoints = matchResult.home_score > matchResult.away_score ? 3 : 
                     matchResult.home_score === matchResult.away_score ? 1 : 0;
    const awayPoints = matchResult.away_score > matchResult.home_score ? 3 : 
                     matchResult.away_score === matchResult.home_score ? 1 : 0;

    // Update home team standings
    await supabase.rpc('sql', {
      query: `
        UPDATE team_standings 
        SET matches_played = matches_played + 1,
            wins = wins + ${homePoints === 3 ? 1 : 0},
            draws = draws + ${homePoints === 1 ? 1 : 0},
            losses = losses + ${homePoints === 0 ? 1 : 0},
            goals_for = goals_for + ${matchResult.home_score},
            goals_against = goals_against + ${matchResult.away_score},
            points = points + ${homePoints}
        WHERE team_id = '${match.home_team_id}'
      `
    });

    // Update away team standings
    await supabase.rpc('sql', {
      query: `
        UPDATE team_standings 
        SET matches_played = matches_played + 1,
            wins = wins + ${awayPoints === 3 ? 1 : 0},
            draws = draws + ${awayPoints === 1 ? 1 : 0},
            losses = losses + ${awayPoints === 0 ? 1 : 0},
            goals_for = goals_for + ${matchResult.away_score},
            goals_against = goals_against + ${matchResult.home_score},
            points = points + ${awayPoints}
        WHERE team_id = '${match.away_team_id}'
      `
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Match simulated successfully with injury system',
      match_result: {
        home_team: match.home_team.name,
        away_team: match.away_team.name,
        score: `${matchResult.home_score}-${matchResult.away_score}`,
        events: matchResult.events.length,
        injuries: matchResult.injuries.length,
        injury_details: matchResult.injuries
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Match simulation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
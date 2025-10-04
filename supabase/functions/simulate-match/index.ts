import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from "@shared/cors.ts";
import { MatchSimulator } from "@shared/match-simulator.ts";
import { calculateEloChange } from "@shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const fixture_id = url.searchParams.get('fixture_id');

    if (!fixture_id) {
      return createErrorResponse('fixture_id is required');
    }

    // Get fixture with teams and players
    const { data: fixture } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*),
        away_team:teams!fixtures_away_team_id_fkey(*)
      `)
      .eq('id', fixture_id)
      .single();

    if (!fixture) {
      return createErrorResponse('Fixture not found');
    }

    if (fixture.status !== 'scheduled') {
      return createErrorResponse('Fixture is not scheduled');
    }

    // Get players for both teams
    const { data: homePlayers } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', fixture.home_team_id)
      .order('current_elo', { ascending: false });

    const { data: awayPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', fixture.away_team_id)
      .order('current_elo', { ascending: false });

    if (!homePlayers || !awayPlayers) {
      return createErrorResponse('Players not found');
    }

    // Update fixture status to live
    await supabase
      .from('fixtures')
      .update({ status: 'live' })
      .eq('id', fixture_id);

    // Create match record
    const { data: match } = await supabase
      .from('matches')
      .insert({
        fixture_id: fixture_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!match) {
      throw new Error('Failed to create match record');
    }

    // Initialize match simulator
    const simulator = new MatchSimulator(homePlayers, awayPlayers);
    const matchChannel = fixture.match_channel || `match_${fixture_id}`;

    // Simulation loop
    const tickRate = 100; // 10Hz
    const emitRate = 200; // 5Hz for client updates
    let lastEmit = 0;

    const simulationInterval = setInterval(async () => {
      const state = simulator.simulateStep(1/10);
      const now = Date.now();

      // Emit state to realtime channel
      if (now - lastEmit >= emitRate) {
        await supabase.realtime.send({
          type: 'broadcast',
          event: 'match_tick',
          payload: {
            match_id: match.id,
            state
          }
        });
        lastEmit = now;
      }

      // Check for events
      const events = simulator.getEvents();
      for (const event of events) {
        await supabase
          .from('events')
          .insert({
            match_id: match.id,
            minute: event.minute,
            second: event.second,
            type: event.type,
            payload: event.payload
          });

        // Emit event to realtime
        await supabase.realtime.send({
          type: 'broadcast',
          event: 'match_event',
          payload: {
            match_id: match.id,
            event
          }
        });
      }

      // Check if match is finished
      if (simulator.isMatchFinished()) {
        clearInterval(simulationInterval);
        await finishMatch(supabase, match, fixture, state, homePlayers, awayPlayers);
      }
    }, tickRate);

    return createResponse({
      message: 'Match simulation started',
      match_id: match.id,
      channel: matchChannel
    });

  } catch (error) {
    console.error('Simulate match error:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function finishMatch(supabase: any, match: any, fixture: any, finalState: any, homePlayers: any[], awayPlayers: any[]) {
  const homeGoals = finalState.score[0];
  const awayGoals = finalState.score[1];
  
  // Update match record
  await supabase
    .from('matches')
    .update({
      ended_at: new Date().toISOString(),
      home_goals: homeGoals,
      away_goals: awayGoals,
      state_blob: finalState
    })
    .eq('id', match.id);

  // Update fixture status
  await supabase
    .from('fixtures')
    .update({ status: 'finished' })
    .eq('id', fixture.id);

  // Calculate team result for ELO
  let homeResult, awayResult;
  if (homeGoals > awayGoals) {
    homeResult = 1; awayResult = 0;
  } else if (homeGoals < awayGoals) {
    homeResult = 0; awayResult = 1;
  } else {
    homeResult = 0.5; awayResult = 0.5;
  }

  // Update player ELOs
  const allPlayers = [...homePlayers, ...awayPlayers];
  for (const player of allPlayers) {
    const isHome = homePlayers.some(p => p.id === player.id);
    const teamResult = isHome ? homeResult : awayResult;
    const eloChange = calculateEloChange(player.current_elo, teamResult);
    const newElo = player.current_elo + eloChange;

    await supabase
      .from('players')
      .update({ current_elo: newElo })
      .eq('id', player.id);

    // Record ELO history
    await supabase
      .from('elo_history')
      .insert({
        entity_type: 'player',
        entity_id: player.id,
        match_id: match.id,
        delta: eloChange,
        before_elo: player.current_elo,
        after_elo: newElo,
        reason: 'match_result'
      });
  }

  // Update team ELOs (average of players)
  const homeAvgElo = homePlayers.reduce((sum, p) => sum + (p.current_elo + calculateEloChange(p.current_elo, homeResult)), 0) / homePlayers.length;
  const awayAvgElo = awayPlayers.reduce((sum, p) => sum + (p.current_elo + calculateEloChange(p.current_elo, awayResult)), 0) / awayPlayers.length;

  await supabase
    .from('teams')
    .update({ elo: homeAvgElo })
    .eq('id', fixture.home_team_id);

  await supabase
    .from('teams')
    .update({ elo: awayAvgElo })
    .eq('id', fixture.away_team_id);

  // Update standings
  await updateStandings(supabase, fixture, homeGoals, awayGoals);

  // Emit final result
  await supabase.realtime.send({
    type: 'broadcast',
    event: 'match_final',
    payload: {
      match_id: match.id,
      result: { home: homeGoals, away: awayGoals },
      final_state: finalState
    }
  });
}

async function updateStandings(supabase: any, fixture: any, homeGoals: number, awayGoals: number) {
  // Update home team standings
  const homeResult = homeGoals > awayGoals ? 'W' : homeGoals < awayGoals ? 'L' : 'D';
  const homePoints = homeGoals > awayGoals ? 3 : homeGoals < awayGoals ? 0 : 1;

  await supabase.rpc('update_team_standings', {
    p_team_id: fixture.home_team_id,
    p_league_id: fixture.league_id,
    p_season_id: fixture.season_id,
    p_goals_for: homeGoals,
    p_goals_against: awayGoals,
    p_result: homeResult
  });

  // Update away team standings
  const awayResult = awayGoals > homeGoals ? 'W' : awayGoals < homeGoals ? 'L' : 'D';
  const awayPoints = awayGoals > homeGoals ? 3 : awayGoals < homeGoals ? 0 : 1;

  await supabase.rpc('update_team_standings', {
    p_team_id: fixture.away_team_id,
    p_league_id: fixture.league_id,
    p_season_id: fixture.season_id,
    p_goals_for: awayGoals,
    p_goals_against: homeGoals,
    p_result: awayResult
  });
}
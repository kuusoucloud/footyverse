import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from "@shared/cors.ts";
import { MatchSimulator } from "@shared/match-simulator.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const { fixture_id } = await req.json();

      // Get fixture details
      const { data: fixture, error: fixtureError } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(*),
          away_team:teams!fixtures_away_team_id_fkey(*)
        `)
        .eq('id', fixture_id)
        .single();

      if (fixtureError) throw fixtureError;

      // Get players for both teams
      const { data: homePlayers, error: homeError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.home_team_id)
        .limit(11);

      const { data: awayPlayers, error: awayError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.away_team_id)
        .limit(11);

      if (homeError || awayError) throw homeError || awayError;

      // Initialize match simulator
      const simulator = new MatchSimulator(
        homePlayers || [],
        awayPlayers || [],
        Date.now()
      );

      // Create match channel for real-time updates
      const channel = supabase.channel(`match_${fixture_id}`);

      // Simulation loop
      const simulationInterval = setInterval(async () => {
        try {
          const matchState = simulator.simulateStep(0.1); // 10 FPS
          
          // Broadcast match state
          await channel.send({
            type: 'broadcast',
            event: 'match_tick',
            payload: matchState
          });

          // Check for events
          const events = simulator.getEvents();
          if (events.length > 0) {
            const latestEvent = events[events.length - 1];
            await channel.send({
              type: 'broadcast',
              event: 'match_event',
              payload: latestEvent
            });
          }

          // Check if match is finished
          if (simulator.isMatchFinished()) {
            clearInterval(simulationInterval);
            
            // Update fixture status
            await supabase
              .from('fixtures')
              .update({ 
                status: 'finished',
                home_score: matchState.score[0],
                away_score: matchState.score[1]
              })
              .eq('id', fixture_id);

            // Send final result
            await channel.send({
              type: 'broadcast',
              event: 'match_final',
              payload: {
                fixture_id,
                final_score: matchState.score,
                events: events
              }
            });

            // Unsubscribe channel
            await supabase.removeChannel(channel);
          }
        } catch (error) {
          console.error('Simulation error:', error);
          clearInterval(simulationInterval);
        }
      }, 100); // 10 FPS

      // Subscribe to channel
      await channel.subscribe();

      return createResponse({ 
        message: 'Match simulation started',
        fixture_id,
        channel: `match_${fixture_id}`
      });
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Simulate match error:', error);
    return createErrorResponse(error.message, 500);
  }
});
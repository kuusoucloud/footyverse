import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from "@shared/cors.ts";
import { calculateOdds } from "@shared/utils.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      // Get fixtures with optional status filter
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      
      let query = supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(*),
          away_team:teams!fixtures_away_team_id_fkey(*),
          league:leagues(*)
        `)
        .order('scheduled_at', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      // Special handling for live matches - only return 1
      if (status === 'live') {
        query = query.limit(1);
      }

      const { data: fixtures, error } = await query;

      if (error) throw error;

      // Add odds to each fixture
      const fixturesWithOdds = fixtures?.map(fixture => ({
        ...fixture,
        odds: calculateOdds(fixture.home_team.elo, fixture.away_team.elo)
      })) || [];

      return createResponse(fixturesWithOdds);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.action === 'generate') {
        // Generate fixtures for a league
        const { league_id } = body;
        
        // Get teams in the league
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('league_id', league_id);

        if (teamsError) throw teamsError;
        if (!teams || teams.length < 2) {
          throw new Error('Not enough teams in league');
        }

        // Generate round-robin fixtures
        const fixtures = [];
        const now = new Date();
        
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const homeTeam = teams[i];
            const awayTeam = teams[j];
            
            // Schedule match for next available slot
            const scheduledAt = new Date(now.getTime() + fixtures.length * 2 * 60 * 60 * 1000); // 2 hours apart
            
            fixtures.push({
              league_id,
              season_id: '2024',
              round: Math.floor(fixtures.length / (teams.length / 2)) + 1,
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              scheduled_at: scheduledAt.toISOString(),
              status: 'scheduled'
            });
          }
        }

        const { data, error } = await supabase
          .from('fixtures')
          .insert(fixtures)
          .select();

        if (error) throw error;
        return createResponse(data);
      }

      if (body.action === 'start_live_match') {
        // Ensure only 1 live match at a time
        await supabase
          .from('fixtures')
          .update({ status: 'finished' })
          .eq('status', 'live');

        // Start a new live match
        const { data: scheduledFixtures } = await supabase
          .from('fixtures')
          .select('*')
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true })
          .limit(1);

        if (scheduledFixtures && scheduledFixtures.length > 0) {
          const fixture = scheduledFixtures[0];
          
          const { data, error } = await supabase
            .from('fixtures')
            .update({ 
              status: 'live',
              match_channel: `match_${fixture.id}`
            })
            .eq('id', fixture.id)
            .select();

          if (error) throw error;
          
          // Start the match simulation
          await supabase.functions.invoke('supabase-functions-simulate-match', {
            body: { fixture_id: fixture.id }
          });

          return createResponse(data);
        }
      }
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Fixtures error:', error);
    return createErrorResponse(error.message, 500);
  }
});
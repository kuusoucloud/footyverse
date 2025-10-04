import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from "@shared/cors.ts";
import { calculateOdds } from "@shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (req.method === 'GET') {
      const status = url.searchParams.get('status');
      const league_id = url.searchParams.get('league_id');

      let query = supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, primary_color, secondary_color, elo),
          away_team:teams!fixtures_away_team_id_fkey(id, name, primary_color, secondary_color, elo),
          league:leagues(id, name, tier)
        `)
        .order('scheduled_at', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      if (league_id) {
        query = query.eq('league_id', league_id);
      }

      const { data: fixtures, error } = await query.limit(50);

      if (error) {
        throw new Error(`Failed to fetch fixtures: ${error.message}`);
      }

      // Add odds to each fixture
      const fixturesWithOdds = fixtures?.map(fixture => {
        const odds = calculateOdds(
          fixture.home_team.elo,
          fixture.away_team.elo
        );
        return { ...fixture, odds };
      });

      return createResponse(fixturesWithOdds || []);
    }

    if (req.method === 'POST' && action === 'generate') {
      const league_id = url.searchParams.get('league_id');
      
      if (!league_id) {
        return createErrorResponse('league_id is required');
      }

      // Get league and teams
      const { data: league } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', league_id)
        .single();

      if (!league) {
        return createErrorResponse('League not found');
      }

      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .eq('tier', league.tier);

      if (!teams || teams.length === 0) {
        return createErrorResponse('No teams found for this league');
      }

      // Generate double round-robin fixtures
      const fixtures = [];
      const now = new Date();
      let matchDay = 0;

      // Home and away fixtures
      for (let round = 0; round < 2; round++) {
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const homeTeam = round === 0 ? teams[i] : teams[j];
            const awayTeam = round === 0 ? teams[j] : teams[i];
            
            const scheduledAt = new Date(now);
            scheduledAt.setDate(now.getDate() + matchDay);
            scheduledAt.setHours(15, 0, 0, 0); // 3 PM kickoff

            fixtures.push({
              season_id: league.season_id,
              league_id: league.id,
              round: Math.floor(matchDay / (teams.length / 2)) + 1,
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              scheduled_at: scheduledAt.toISOString(),
              match_channel: `match_${crypto.randomUUID()}`
            });

            matchDay++;
          }
        }
      }

      // Insert fixtures in batches
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < fixtures.length; i += batchSize) {
        const batch = fixtures.slice(i, i + batchSize);
        const { error } = await supabase
          .from('fixtures')
          .insert(batch);

        if (error) {
          throw new Error(`Failed to insert fixtures: ${error.message}`);
        }

        insertedCount += batch.length;
      }

      return createResponse({
        message: `Generated ${insertedCount} fixtures for league ${league.name}`,
        fixtures: insertedCount
      });
    }

    return createErrorResponse('Invalid request', 400);

  } catch (error) {
    console.error('Fixtures error:', error);
    return createErrorResponse(error.message, 500);
  }
});
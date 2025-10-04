import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createResponse, createErrorResponse } from "@shared/cors.ts";
import { generateTeams, generatePlayersForTeam } from "@shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json().catch(() => ({ action: 'seed' }));

    if (action === 'seed') {
      // Check if teams already exist
      const { data: existingTeams } = await supabase
        .from('teams')
        .select('id')
        .limit(1);

      if (existingTeams && existingTeams.length > 0) {
        return createResponse({ message: 'Data already seeded' });
      }

      // Generate and insert teams (100 teams across 5 tiers)
      const teams = generateTeams(100);
      const { error: teamsError } = await supabase
        .from('teams')
        .insert(teams);

      if (teamsError) {
        throw new Error(`Failed to insert teams: ${teamsError.message}`);
      }

      // Generate and insert players for each team
      const allPlayers = [];
      for (const team of teams) {
        const players = generatePlayersForTeam(team, 23);
        allPlayers.push(...players);
      }

      // Insert players in batches
      const batchSize = 100;
      for (let i = 0; i < allPlayers.length; i += batchSize) {
        const batch = allPlayers.slice(i, i + batchSize);
        const { error: playersError } = await supabase
          .from('players')
          .insert(batch);

        if (playersError) {
          throw new Error(`Failed to insert players batch: ${playersError.message}`);
        }
      }

      // Update team ELO based on average player ELO
      for (const team of teams) {
        const teamPlayers = allPlayers.filter(p => p.team_id === team.id);
        const avgElo = teamPlayers.reduce((sum, p) => sum + p.current_elo, 0) / teamPlayers.length;
        
        await supabase
          .from('teams')
          .update({ elo: avgElo })
          .eq('id', team.id);
      }

      // Create team standings for each league
      const { data: leagues } = await supabase
        .from('leagues')
        .select('*');

      if (leagues) {
        for (const league of leagues) {
          const leagueTeams = teams.filter(t => t.tier === league.tier);
          const standings = leagueTeams.map(team => ({
            season_id: league.season_id,
            league_id: league.id,
            team_id: team.id
          }));

          await supabase
            .from('team_standings')
            .insert(standings);
        }
      }

      return createResponse({
        message: 'Successfully seeded football data',
        teams: teams.length,
        players: allPlayers.length
      });
    }

    if (action === 'generate_fixtures') {
      // Generate fixtures for all leagues
      const { data: leagues } = await supabase
        .from('leagues')
        .select('*');

      if (!leagues) throw new Error('No leagues found');

      let totalFixtures = 0;

      for (const league of leagues) {
        // Get teams in this league
        const { data: teams } = await supabase
          .from('teams')
          .select('*')
          .eq('tier', league.tier)
          .limit(20); // 20 teams per league

        if (!teams || teams.length < 2) continue;

        // Generate round-robin fixtures
        const fixtures = [];
        const now = new Date();
        
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const homeTeam = teams[i];
            const awayTeam = teams[j];
            
            // Schedule match for next available slot (every 2 hours)
            const scheduledAt = new Date(now.getTime() + fixtures.length * 2 * 60 * 60 * 1000);
            
            fixtures.push({
              league_id: league.id,
              season_id: league.season_id,
              round: Math.floor(fixtures.length / (teams.length / 2)) + 1,
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              scheduled_at: scheduledAt.toISOString(),
              status: 'scheduled'
            });
          }
        }

        const { error } = await supabase
          .from('fixtures')
          .insert(fixtures);

        if (error) throw error;
        totalFixtures += fixtures.length;
      }

      return createResponse({
        message: 'Successfully generated fixtures',
        fixtures: totalFixtures
      });
    }

    if (action === 'start_live_match') {
      // Ensure only 1 live match at a time
      await supabase
        .from('fixtures')
        .update({ status: 'finished' })
        .eq('status', 'live');

      // Start a new live match from scheduled fixtures
      const { data: scheduledFixtures } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(*),
          away_team:teams!fixtures_away_team_id_fkey(*),
          league:leagues(*)
        `)
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
        const { error: simError } = await supabase.functions.invoke('supabase-functions-simulate-match', {
          body: { fixture_id: fixture.id }
        });

        if (simError) {
          console.error('Failed to start simulation:', simError);
        }

        return createResponse({
          message: 'Live match started',
          fixture: data[0]
        });
      } else {
        return createResponse({
          message: 'No scheduled matches available'
        });
      }
    }

    return createErrorResponse('Invalid action', 400);

  } catch (error) {
    console.error('Seed data error:', error);
    return createErrorResponse(error.message, 500);
  }
});
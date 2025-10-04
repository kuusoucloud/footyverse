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

    // Check if teams already exist
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id')
      .limit(1);

    if (existingTeams && existingTeams.length > 0) {
      return createResponse({ message: 'Data already seeded' });
    }

    // Generate and insert teams
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

  } catch (error) {
    console.error('Seed data error:', error);
    return createErrorResponse(error.message, 500);
  }
});
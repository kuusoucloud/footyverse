import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { removeActiveSimulation } from '@/lib/simulation-manager';

export async function POST(request: NextRequest) {
  try {
    const { fixtureId, finalState, playerPerformances } = await request.json();
    const supabase = createClient();

    // Get fixture details
    const { data: fixture } = await supabase
      .from('fixtures')
      .select(`
        *,
        home_team:teams!fixtures_home_team_id_fkey(*),
        away_team:teams!fixtures_away_team_id_fkey(*)
      `)
      .eq('id', fixtureId)
      .single();

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // Create finished match record
    const { data: finishedMatch, error: matchError } = await supabase
      .from('finished_matches')
      .insert({
        fixture_id: fixtureId,
        home_team_id: fixture.home_team_id,
        away_team_id: fixture.away_team_id,
        home_score: finalState.homeScore,
        away_score: finalState.awayScore,
        match_date: new Date().toISOString(),
        season_number: fixture.season_number || 1,
        round: fixture.round,
        tier: fixture.home_team.tier,
        match_events: finalState.events,
        match_stats: {
          homePossession: finalState.possession.home,
          awayPossession: finalState.possession.away,
          homeShots: finalState.homePlayers.reduce((sum: number, p: any) => sum + p.stats.shots, 0),
          awayShots: finalState.awayPlayers.reduce((sum: number, p: any) => sum + p.stats.shots, 0),
          homeFouls: finalState.homePlayers.reduce((sum: number, p: any) => sum + p.stats.fouls, 0),
          awayFouls: finalState.awayPlayers.reduce((sum: number, p: any) => sum + p.stats.fouls, 0)
        }
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating finished match:', matchError);
      return NextResponse.json({ error: 'Failed to save match' }, { status: 500 });
    }

    // Save player performances
    if (playerPerformances && playerPerformances.length > 0) {
      const performanceRecords = playerPerformances.map((perf: any) => ({
        ...perf,
        finished_match_id: finishedMatch.id
      }));

      const { error: perfError } = await supabase
        .from('player_match_performance')
        .insert(performanceRecords);

      if (perfError) {
        console.error('Error saving player performances:', perfError);
      }
    }

    // Update player forms based on match performance
    for (const player of [...finalState.homePlayers, ...finalState.awayPlayers]) {
      const formChange = calculateFormChange(player);
      
      await supabase
        .from('players')
        .update({ 
          form: Math.max(1, Math.min(10, (player.form || 5) + formChange)),
          // Update market value based on performance
          market_value: await calculateNewMarketValue(supabase, player)
        })
        .eq('id', player.id);
    }

    // Update team standings
    await updateStandings(supabase, fixture, finalState);

    // Update fixture status
    await supabase
      .from('fixtures')
      .update({ status: 'finished' })
      .eq('id', fixtureId);

    // Remove simulation from memory
    removeActiveSimulation(fixtureId);

    // Check if season should progress
    const { data: remainingFixtures } = await supabase
      .from('fixtures')
      .select('id')
      .in('status', ['scheduled', 'live']);

    let seasonProgressed = false;
    if (!remainingFixtures || remainingFixtures.length === 0) {
      // All matches completed, progress season
      await progressSeason(supabase);
      seasonProgressed = true;
    }

    return NextResponse.json({ 
      success: true, 
      matchId: finishedMatch.id,
      seasonProgressed
    });

  } catch (error) {
    console.error('Error completing 3D simulation:', error);
    return NextResponse.json({ error: 'Failed to complete match' }, { status: 500 });
  }
}

// Helper functions
function calculateFormChange(player: any): number {
  let formChange = 0;
  
  // Goals boost form significantly
  formChange += player.stats.goals * 0.5;
  
  // Assists boost form
  formChange += player.stats.assists * 0.3;
  
  // Match rating affects form
  if (player.matchRating >= 8) formChange += 0.3;
  else if (player.matchRating >= 7) formChange += 0.1;
  else if (player.matchRating < 5) formChange -= 0.2;
  else if (player.matchRating < 4) formChange -= 0.4;
  
  // Cards hurt form
  formChange -= player.stats.cards * 0.2;
  
  // Fouls hurt form slightly
  formChange -= player.stats.fouls * 0.05;
  
  return Math.max(-1, Math.min(1, formChange));
}

async function calculateNewMarketValue(supabase: any, player: any): Promise<number> {
  const { data: currentPlayer } = await supabase
    .from('players')
    .select('market_value, overall_rating')
    .eq('id', player.id)
    .single();

  if (!currentPlayer) return player.market_value || 1000000;

  let valueMultiplier = 1.0;
  
  // Performance affects value
  if (player.matchRating >= 8) valueMultiplier += 0.02;
  else if (player.matchRating >= 7) valueMultiplier += 0.01;
  else if (player.matchRating < 5) valueMultiplier -= 0.01;
  
  // Goals and assists boost value
  valueMultiplier += (player.stats.goals * 0.01);
  valueMultiplier += (player.stats.assists * 0.005);
  
  // Form affects long-term value
  if (player.form >= 8) valueMultiplier += 0.005;
  else if (player.form <= 3) valueMultiplier -= 0.01;
  
  return Math.max(50000, Math.floor(currentPlayer.market_value * valueMultiplier));
}

async function updateStandings(supabase: any, fixture: any, finalState: any) {
  const homePoints = finalState.homeScore > finalState.awayScore ? 3 : 
                   finalState.homeScore === finalState.awayScore ? 1 : 0;
  const awayPoints = finalState.awayScore > finalState.homeScore ? 3 : 
                    finalState.awayScore === finalState.homeScore ? 1 : 0;

  // Update home team standings
  await supabase.rpc('update_team_standings', {
    team_id: fixture.home_team_id,
    goals_for: finalState.homeScore,
    goals_against: finalState.awayScore,
    points: homePoints,
    season_number: fixture.season_number || 1
  });

  // Update away team standings
  await supabase.rpc('update_team_standings', {
    team_id: fixture.away_team_id,
    goals_for: finalState.awayScore,
    goals_against: finalState.homeScore,
    points: awayPoints,
    season_number: fixture.season_number || 1
  });
}

async function progressSeason(supabase: any) {
  try {
    // Call the season progression function
    await supabase.rpc('progress_season_and_generate_fixtures');
  } catch (error) {
    console.error('Error progressing season:', error);
  }
}
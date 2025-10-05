import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Match3DSimulator, setActiveSimulation } from '@/lib/simulation-manager';

export async function POST(request: NextRequest) {
  try {
    const { fixtureId } = await request.json();
    const supabase = createClient();

    // Get fixture and team data
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

    // Get players for both teams
    const [homePlayersData, awayPlayersData] = await Promise.all([
      supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.home_team.id)
        .order('overall_rating', { ascending: false }),
      supabase
        .from('players')
        .select('*')
        .eq('team_id', fixture.away_team.id)
        .order('overall_rating', { ascending: false })
    ]);

    // Get formations
    const [homeFormationData, awayFormationData] = await Promise.all([
      supabase
        .from('teams')
        .select('formations')
        .eq('id', fixture.home_team.id)
        .single(),
      supabase
        .from('teams')
        .select('formations')
        .eq('id', fixture.away_team.id)
        .single()
    ]);

    const formations = {
      home: homeFormationData.data?.formations || null,
      away: awayFormationData.data?.formations || null
    };

    // Create simulation instance
    const simulator = new Match3DSimulator(
      fixture,
      fixture.home_team,
      fixture.away_team,
      homePlayersData.data || [],
      awayPlayersData.data || [],
      formations
    );

    setActiveSimulation(fixtureId, simulator);

    // Update fixture status to live
    await supabase
      .from('fixtures')
      .update({ status: 'live' })
      .eq('id', fixtureId);

    return NextResponse.json(simulator.simulateTick());
  } catch (error) {
    console.error('Error starting 3D simulation:', error);
    return NextResponse.json({ error: 'Failed to start simulation' }, { status: 500 });
  }
}
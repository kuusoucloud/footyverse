import { NextRequest, NextResponse } from 'next/server';
import { getActiveSimulation } from '@/lib/simulation-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { fixtureId: string } }
) {
  try {
    const fixtureId = params.fixtureId;
    const simulator = getActiveSimulation(fixtureId);

    if (!simulator) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    // Get next simulation tick
    const updatedState = simulator.simulateTick();
    
    return NextResponse.json(updatedState);
  } catch (error) {
    console.error('Error in simulation tick:', error);
    return NextResponse.json({ error: 'Simulation error' }, { status: 500 });
  }
}
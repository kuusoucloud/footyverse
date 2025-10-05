import { NextRequest, NextResponse } from 'next/server';

// Import the active simulations from the start route
// In a production app, you'd use Redis or another shared store
const activeSimulations = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { fixtureId: string } }
) {
  try {
    const fixtureId = params.fixtureId;
    const simulator = activeSimulations.get(fixtureId);

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

// Export the activeSimulations for use in other routes
export { activeSimulations };
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 3D Match Simulation Engine
class Match3DSimulator {
  private matchState: any;
  private homeTeam: any;
  private awayTeam: any;
  private homePlayers: any[];
  private awayPlayers: any[];
  private formations: { home: any; away: any };
  
  constructor(fixture: any, homeTeam: any, awayTeam: any, homePlayers: any[], awayPlayers: any[], formations: any) {
    this.homeTeam = homeTeam;
    this.awayTeam = awayTeam;
    this.homePlayers = homePlayers;
    this.awayPlayers = awayPlayers;
    this.formations = formations;
    
    this.matchState = {
      minute: 0,
      second: 0,
      half: 1,
      phase: 'kickoff',
      homeScore: 0,
      awayScore: 0,
      homePlayers: this.initializePlayers(homePlayers, true),
      awayPlayers: this.initializePlayers(awayPlayers, false),
      ball: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isInPlay: true,
        lastTouchedBy: null
      },
      events: [],
      possession: { home: 50, away: 50 },
      lastEvent: null,
      referee: {
        position: { x: 0, y: 0, z: 0 },
        decision: null
      }
    };
  }

  private initializePlayers(players: any[], isHome: boolean) {
    const formation = isHome ? this.formations.home : this.formations.away;
    const positions = this.getFormationPositions(formation, isHome);
    
    return players.slice(0, 11).map((player, index) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      team_id: player.team_id,
      overall_rating: player.overall_rating || 70,
      form: player.form || 5,
      currentPos: positions[index] || { x: 0, y: 0, z: 0 },
      targetPos: positions[index] || { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      hasBall: false,
      isSelected: false,
      stamina: 100,
      matchRating: 6.0,
      stats: {
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 0,
        tackles: 0,
        fouls: 0,
        cards: 0
      }
    }));
  }

  private getFormationPositions(formation: any, isHome: boolean) {
    // Default 4-4-2 positions if no formation
    const defaultPositions = isHome ? [
      { x: -45, y: 0, z: 0 },    // GK
      { x: -30, y: 0, z: -20 },  // LB
      { x: -30, y: 0, z: -7 },   // CB
      { x: -30, y: 0, z: 7 },    // CB
      { x: -30, y: 0, z: 20 },   // RB
      { x: -10, y: 0, z: -15 },  // LM
      { x: -10, y: 0, z: -5 },   // CM
      { x: -10, y: 0, z: 5 },    // CM
      { x: -10, y: 0, z: 15 },   // RM
      { x: 10, y: 0, z: -8 },    // ST
      { x: 10, y: 0, z: 8 }      // ST
    ] : [
      { x: 45, y: 0, z: 0 },     // GK
      { x: 30, y: 0, z: 20 },    // RB
      { x: 30, y: 0, z: 7 },     // CB
      { x: 30, y: 0, z: -7 },    // CB
      { x: 30, y: 0, z: -20 },   // LB
      { x: 10, y: 0, z: 15 },    // RM
      { x: 10, y: 0, z: 5 },     // CM
      { x: 10, y: 0, z: -5 },    // CM
      { x: 10, y: 0, z: -15 },   // LM
      { x: -10, y: 0, z: 8 },    // ST
      { x: -10, y: 0, z: -8 }    // ST
    ];

    if (!formation?.positions) return defaultPositions;

    return formation.positions.map((pos: any) => ({
      x: isHome ? (pos.x - 50) * 1.05 : (50 - pos.x) * 1.05,
      y: 0,
      z: isHome ? (pos.y - 50) * 0.68 : (50 - pos.y) * 0.68
    }));
  }

  public simulateTick() {
    // Advance time (30 minutes real time = 90 minutes game time)
    // So 1 real second = 3 game seconds
    this.matchState.second += 3;
    
    if (this.matchState.second >= 60) {
      this.matchState.minute++;
      this.matchState.second = 0;
    }

    // Half time
    if (this.matchState.minute === 45 && this.matchState.half === 1) {
      this.matchState.phase = 'halftime';
      this.matchState.half = 2;
      this.matchState.minute = 45;
      return this.matchState;
    }

    // Full time
    if (this.matchState.minute >= 90) {
      this.matchState.phase = 'fulltime';
      return this.matchState;
    }

    // Update player positions based on game phase
    this.updatePlayerPositions();
    
    // Update ball position
    this.updateBallPosition();
    
    // Check for events
    this.checkForEvents();
    
    // Update possession
    this.updatePossession();
    
    // Update player ratings
    this.updatePlayerRatings();

    return this.matchState;
  }

  private updatePlayerPositions() {
    const ballPos = this.matchState.ball.position;
    
    [...this.matchState.homePlayers, ...this.matchState.awayPlayers].forEach(player => {
      // Basic AI movement towards ball or position
      const isHome = this.matchState.homePlayers.includes(player);
      const distanceToBall = Math.sqrt(
        Math.pow(player.currentPos.x - ballPos.x, 2) + 
        Math.pow(player.currentPos.z - ballPos.z, 2)
      );
      
      // Player with ball stays put, others move towards tactical positions
      if (player.hasBall) {
        // Ball carrier moves forward
        player.targetPos.x += isHome ? 2 : -2;
      } else if (distanceToBall < 10) {
        // Players near ball move towards it
        const direction = {
          x: (ballPos.x - player.currentPos.x) * 0.1,
          z: (ballPos.z - player.currentPos.z) * 0.1
        };
        player.targetPos.x = player.currentPos.x + direction.x;
        player.targetPos.z = player.currentPos.z + direction.z;
      } else {
        // Return to formation position
        const formationPos = this.getFormationPositions(
          isHome ? this.formations.home : this.formations.away, 
          isHome
        );
        const playerIndex = isHome ? 
          this.matchState.homePlayers.indexOf(player) : 
          this.matchState.awayPlayers.indexOf(player);
        
        if (formationPos[playerIndex]) {
          player.targetPos = { ...formationPos[playerIndex] };
        }
      }
      
      // Clamp positions to pitch boundaries
      player.targetPos.x = Math.max(-52, Math.min(52, player.targetPos.x));
      player.targetPos.z = Math.max(-34, Math.min(34, player.targetPos.z));
    });
  }

  private updateBallPosition() {
    const ballCarrier = [...this.matchState.homePlayers, ...this.matchState.awayPlayers]
      .find(p => p.hasBall);
    
    if (ballCarrier) {
      this.matchState.ball.position = {
        x: ballCarrier.currentPos.x,
        y: 0,
        z: ballCarrier.currentPos.z
      };
    }
  }

  private checkForEvents() {
    const minute = this.matchState.minute;
    const second = this.matchState.second;
    
    // Goal probability (higher for better teams)
    const homeStrength = this.calculateTeamStrength(this.matchState.homePlayers);
    const awayStrength = this.calculateTeamStrength(this.matchState.awayPlayers);
    
    const homeGoalChance = (homeStrength / (homeStrength + awayStrength)) * 0.0008; // ~0.08% per tick
    const awayGoalChance = (awayStrength / (homeStrength + awayStrength)) * 0.0006; // Away disadvantage
    
    if (Math.random() < homeGoalChance) {
      this.createGoalEvent(true, minute, second);
    } else if (Math.random() < awayGoalChance) {
      this.createGoalEvent(false, minute, second);
    }
    
    // Foul probability
    if (Math.random() < 0.001) {
      this.createFoulEvent(minute, second);
    }
    
    // Card probability
    if (Math.random() < 0.0005) {
      this.createCardEvent(minute, second);
    }
  }

  private createGoalEvent(isHome: boolean, minute: number, second: number) {
    const players = isHome ? this.matchState.homePlayers : this.matchState.awayPlayers;
    const scorer = players[Math.floor(Math.random() * Math.min(players.length, 11))];
    
    if (isHome) {
      this.matchState.homeScore++;
    } else {
      this.matchState.awayScore++;
    }
    
    scorer.stats.goals++;
    scorer.matchRating += 1.0;
    
    const event = {
      minute,
      second,
      type: 'goal' as const,
      player_id: scorer.id,
      team_id: scorer.team_id,
      description: `⚽ Goal by ${scorer.name}!`,
      position: { ...scorer.currentPos }
    };
    
    this.matchState.events.push(event);
    this.matchState.lastEvent = event;
    
    // Clear last event after 3 seconds
    setTimeout(() => {
      if (this.matchState.lastEvent === event) {
        this.matchState.lastEvent = null;
      }
    }, 3000);
  }

  private createFoulEvent(minute: number, second: number) {
    const allPlayers = [...this.matchState.homePlayers, ...this.matchState.awayPlayers];
    const fouler = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    
    fouler.stats.fouls++;
    fouler.matchRating -= 0.1;
    
    const event = {
      minute,
      second,
      type: 'foul' as const,
      player_id: fouler.id,
      team_id: fouler.team_id,
      description: `Foul by ${fouler.name}`,
      position: { ...fouler.currentPos }
    };
    
    this.matchState.events.push(event);
    this.matchState.phase = 'freekick';
    
    setTimeout(() => {
      this.matchState.phase = 'play';
    }, 2000);
  }

  private createCardEvent(minute: number, second: number) {
    const allPlayers = [...this.matchState.homePlayers, ...this.matchState.awayPlayers];
    const cardedPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    const isRed = Math.random() < 0.2; // 20% chance of red card
    
    cardedPlayer.stats.cards++;
    cardedPlayer.matchRating -= isRed ? 2.0 : 0.5;
    
    const event = {
      minute,
      second,
      type: (isRed ? 'red_card' : 'yellow_card') as const,
      player_id: cardedPlayer.id,
      team_id: cardedPlayer.team_id,
      description: `${isRed ? '🟥 Red' : '🟨 Yellow'} card for ${cardedPlayer.name}`,
      position: { ...cardedPlayer.currentPos }
    };
    
    this.matchState.events.push(event);
    this.matchState.lastEvent = event;
    
    setTimeout(() => {
      if (this.matchState.lastEvent === event) {
        this.matchState.lastEvent = null;
      }
    }, 3000);
  }

  private calculateTeamStrength(players: any[]) {
    return players.reduce((sum, p) => sum + (p.overall_rating * (p.form / 5)), 0) / players.length;
  }

  private updatePossession() {
    // Simple possession calculation based on team strength and current events
    const homeStrength = this.calculateTeamStrength(this.matchState.homePlayers);
    const awayStrength = this.calculateTeamStrength(this.matchState.awayPlayers);
    
    const totalStrength = homeStrength + awayStrength;
    this.matchState.possession.home = Math.round((homeStrength / totalStrength) * 100);
    this.matchState.possession.away = 100 - this.matchState.possession.home;
  }

  private updatePlayerRatings() {
    [...this.matchState.homePlayers, ...this.matchState.awayPlayers].forEach(player => {
      // Gradual rating changes based on performance
      const baseRating = 6.0;
      const performanceBonus = (player.stats.goals * 1.0) + (player.stats.assists * 0.5) - (player.stats.fouls * 0.1);
      player.matchRating = Math.max(1.0, Math.min(10.0, baseRating + performanceBonus));
      
      // Update stats occasionally
      if (Math.random() < 0.01) {
        player.stats.passes++;
      }
      if (Math.random() < 0.005) {
        player.stats.tackles++;
        player.matchRating += 0.1;
      }
    });
  }
}

// Global simulation instances - using a module-level Map
const activeSimulations = new Map<string, Match3DSimulator>();

// Export a function to access simulations from other routes
export function getActiveSimulation(fixtureId: string) {
  return activeSimulations.get(fixtureId);
}

export function setActiveSimulation(fixtureId: string, simulator: Match3DSimulator) {
  activeSimulations.set(fixtureId, simulator);
}

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

    activeSimulations.set(fixtureId, simulator);

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
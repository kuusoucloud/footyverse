// Simulation Manager - Handles active 3D match simulations
import { createClient } from '@/utils/supabase/server';

// 3D Match Simulation Engine
export class Match3DSimulator {
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
        position: { x: 0, y: 0.11, z: 0 },
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
    
    // Give ball to a random midfielder at kickoff
    const allPlayers = [...this.matchState.homePlayers, ...this.matchState.awayPlayers];
    const midfielders = allPlayers.filter(p => 
      p.position.includes('M') || p.position.includes('CM')
    );
    if (midfielders.length > 0) {
      const randomMidfielder = midfielders[Math.floor(Math.random() * midfielders.length)];
      randomMidfielder.hasBall = true;
      this.matchState.ball.lastTouchedBy = randomMidfielder.id;
    }
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
      const isHome = this.matchState.homePlayers.includes(player);
      const distanceToBall = Math.sqrt(
        Math.pow(player.currentPos.x - ballPos.x, 2) + 
        Math.pow(player.currentPos.z - ballPos.z, 2)
      );
      
      // More dynamic movement patterns
      if (player.hasBall) {
        // Ball carrier moves forward aggressively
        const direction = isHome ? 1 : -1;
        player.targetPos.x += direction * (2 + Math.random() * 2);
        player.targetPos.z += (Math.random() - 0.5) * 3;
      } else if (distanceToBall < 15) {
        // Players near ball move towards it with some randomness
        const direction = {
          x: (ballPos.x - player.currentPos.x) * (0.3 + Math.random() * 0.4),
          z: (ballPos.z - player.currentPos.z) * (0.3 + Math.random() * 0.4)
        };
        player.targetPos.x = player.currentPos.x + direction.x;
        player.targetPos.z = player.currentPos.z + direction.z;
      } else {
        // Return to formation position with some variation
        const formationPos = this.getFormationPositions(
          isHome ? this.formations.home : this.formations.away, 
          isHome
        );
        const playerIndex = isHome ? 
          this.matchState.homePlayers.indexOf(player) : 
          this.matchState.awayPlayers.indexOf(player);
        
        if (formationPos[playerIndex]) {
          // Add some tactical variation to formation positions
          const variation = {
            x: (Math.random() - 0.5) * 8,
            z: (Math.random() - 0.5) * 6
          };
          
          player.targetPos.x = formationPos[playerIndex].x + variation.x;
          player.targetPos.z = formationPos[playerIndex].z + variation.z;
        }
      }
      
      // Clamp positions to pitch boundaries with some buffer
      player.targetPos.x = Math.max(-50, Math.min(50, player.targetPos.x));
      player.targetPos.z = Math.max(-32, Math.min(32, player.targetPos.z));
      
      // Gradually move current position towards target (this is key!)
      const moveSpeed = 0.1 + (player.overall_rating / 1000);
      player.currentPos.x += (player.targetPos.x - player.currentPos.x) * moveSpeed;
      player.currentPos.z += (player.targetPos.z - player.currentPos.z) * moveSpeed;
      
      // Update velocity for animation purposes
      player.velocity.x = (player.targetPos.x - player.currentPos.x) * 0.1;
      player.velocity.z = (player.targetPos.z - player.currentPos.z) * 0.1;
    });
  }

  private updateBallPosition() {
    const ballCarrier = [...this.matchState.homePlayers, ...this.matchState.awayPlayers]
      .find(p => p.hasBall);
    
    if (ballCarrier) {
      // Ball follows player with slight offset
      this.matchState.ball.position = {
        x: ballCarrier.currentPos.x + (Math.random() - 0.5) * 0.5,
        y: 0.11 + Math.sin(Date.now() * 0.01) * 0.05, // Slight bounce
        z: ballCarrier.currentPos.z + 0.8 + (Math.random() - 0.5) * 0.3
      };
      
      // Ball velocity matches player movement
      this.matchState.ball.velocity = {
        x: ballCarrier.velocity.x * 2,
        y: 0,
        z: ballCarrier.velocity.z * 2
      };
    } else {
      // Ball moves independently (loose ball)
      this.matchState.ball.velocity.x *= 0.95; // Friction
      this.matchState.ball.velocity.z *= 0.95;
      
      this.matchState.ball.position.x += this.matchState.ball.velocity.x * 0.1;
      this.matchState.ball.position.z += this.matchState.ball.velocity.z * 0.1;
      
      // Ball physics - bounce and settle
      if (this.matchState.ball.position.y > 0.11) {
        this.matchState.ball.velocity.y -= 0.5; // Gravity
      } else {
        this.matchState.ball.position.y = 0.11;
        this.matchState.ball.velocity.y = 0;
      }
      
      // Assign ball to nearest player if close enough
      const nearestPlayer = [...this.matchState.homePlayers, ...this.matchState.awayPlayers]
        .reduce((nearest, player) => {
          const distToBall = Math.sqrt(
            Math.pow(player.currentPos.x - this.matchState.ball.position.x, 2) + 
            Math.pow(player.currentPos.z - this.matchState.ball.position.z, 2)
          );
          const nearestDist = Math.sqrt(
            Math.pow(nearest.currentPos.x - this.matchState.ball.position.x, 2) + 
            Math.pow(nearest.currentPos.z - this.matchState.ball.position.z, 2)
          );
          return distToBall < nearestDist ? player : nearest;
        });
      
      const distanceToNearest = Math.sqrt(
        Math.pow(nearestPlayer.currentPos.x - this.matchState.ball.position.x, 2) + 
        Math.pow(nearestPlayer.currentPos.z - this.matchState.ball.position.z, 2)
      );
      
      if (distanceToNearest < 1.5) {
        // Clear all ball possession first
        [...this.matchState.homePlayers, ...this.matchState.awayPlayers].forEach(p => p.hasBall = false);
        // Assign to nearest player
        nearestPlayer.hasBall = true;
        this.matchState.ball.lastTouchedBy = nearestPlayer.id;
      }
    }
    
    // Keep ball on pitch
    this.matchState.ball.position.x = Math.max(-52, Math.min(52, this.matchState.ball.position.x));
    this.matchState.ball.position.z = Math.max(-34, Math.min(34, this.matchState.ball.position.z));
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

    const eventType = isRed ? 'red_card' : 'yellow_card';
    const event = {
      minute,
      second,
      type: eventType as 'red_card' | 'yellow_card',
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

// Global simulation instances
const activeSimulations = new Map<string, Match3DSimulator>();

export function getActiveSimulation(fixtureId: string) {
  return activeSimulations.get(fixtureId);
}

export function setActiveSimulation(fixtureId: string, simulator: Match3DSimulator) {
  activeSimulations.set(fixtureId, simulator);
}

export function removeActiveSimulation(fixtureId: string) {
  activeSimulations.delete(fixtureId);
}
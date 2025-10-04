import { MatchState, PlayerState, MatchEvent, Player } from './types.ts';

export class MatchSimulator {
  private matchState: MatchState;
  private events: MatchEvent[] = [];
  private lastEventTime: number = 0;
  private homeTeamId: string;
  private awayTeamId: string;

  constructor(homePlayers: Player[], awayPlayers: Player[], startTime: number) {
    this.homeTeamId = homePlayers[0]?.team_id || '';
    this.awayTeamId = awayPlayers[0]?.team_id || '';

    // Initialize match state
    this.matchState = {
      clock: 0,
      score: [0, 0],
      phase: 'kickoff',
      ball: {
        pos: [0, 0, 0.11], // Center of pitch, on ground
        vel: [0, 0, 0]
      },
      players: this.initializePlayers(homePlayers, awayPlayers),
      active_event: null
    };

    // Add kickoff event
    this.events.push({
      id: crypto.randomUUID(),
      type: 'kickoff',
      minute: 0,
      second: 0,
      player_id: this.matchState.players[0]?.id || '',
      team_id: this.homeTeamId,
      position: [0, 0],
      metadata: {}
    });
  }

  private initializePlayers(homePlayers: Player[], awayPlayers: Player[]): PlayerState[] {
    const players: PlayerState[] = [];

    // Home team formation (4-4-2)
    const homePositions = [
      [-45, 0], // GK
      [-35, -20], [-35, -7], [-35, 7], [-35, 20], // Defense
      [-20, -20], [-20, -7], [-20, 7], [-20, 20], // Midfield
      [-10, -10], [-10, 10] // Forward
    ];

    // Away team formation (4-4-2) - mirrored
    const awayPositions = [
      [45, 0], // GK
      [35, -20], [35, -7], [35, 7], [35, 20], // Defense
      [20, -20], [20, -7], [20, 7], [20, 20], // Midfield
      [10, -10], [10, 10] // Forward
    ];

    // Initialize home players
    homePlayers.slice(0, 11).forEach((player, i) => {
      const pos = homePositions[i] || [0, 0];
      players.push({
        id: player.id,
        team_id: player.team_id,
        pos: [pos[0], pos[1], 0],
        facing: 0,
        speed: 0,
        stamina: 100,
        anim_state: 'idle',
        has_ball: false
      });
    });

    // Initialize away players
    awayPlayers.slice(0, 11).forEach((player, i) => {
      const pos = awayPositions[i] || [0, 0];
      players.push({
        id: player.id,
        team_id: player.team_id,
        pos: [pos[0], pos[1], 0],
        facing: Math.PI, // Face opposite direction
        speed: 0,
        stamina: 100,
        anim_state: 'idle',
        has_ball: false
      });
    });

    return players;
  }

  simulateStep(deltaTime: number): MatchState {
    this.matchState.clock += deltaTime;
    
    // Match phases
    if (this.matchState.clock > 5400) { // 90 minutes
      this.matchState.phase = 'finished';
      return this.matchState;
    } else if (this.matchState.clock > 2700) { // 45 minutes
      this.matchState.phase = 'second_half';
    } else if (this.matchState.clock > 10) { // After kickoff
      this.matchState.phase = 'open_play';
    }

    // Update ball physics
    this.updateBallPhysics(deltaTime);

    // Update players
    this.updatePlayers(deltaTime);

    // Check for events
    this.checkForEvents();

    return { ...this.matchState };
  }

  private updateBallPhysics(deltaTime: number) {
    const ball = this.matchState.ball;
    
    // Apply drag
    const drag = 0.98;
    ball.vel[0] *= drag;
    ball.vel[1] *= drag;
    ball.vel[2] *= drag;

    // Apply gravity to Z velocity
    ball.vel[2] -= 9.81 * deltaTime;

    // Update position
    ball.pos[0] += ball.vel[0] * deltaTime;
    ball.pos[1] += ball.vel[1] * deltaTime;
    ball.pos[2] += ball.vel[2] * deltaTime;

    // Bounce off ground
    if (ball.pos[2] <= 0.11) {
      ball.pos[2] = 0.11;
      ball.vel[2] = Math.abs(ball.vel[2]) * 0.7; // Bounce with energy loss
    }

    // Pitch boundaries (105m x 68m)
    if (Math.abs(ball.pos[0]) > 52.5) {
      ball.pos[0] = Math.sign(ball.pos[0]) * 52.5;
      ball.vel[0] *= -0.5;
    }
    if (Math.abs(ball.pos[1]) > 34) {
      ball.pos[1] = Math.sign(ball.pos[1]) * 34;
      ball.vel[1] *= -0.5;
    }

    // Stop very slow ball
    if (Math.abs(ball.vel[0]) < 0.1 && Math.abs(ball.vel[1]) < 0.1 && ball.pos[2] <= 0.12) {
      ball.vel = [0, 0, 0];
    }
  }

  private updatePlayers(deltaTime: number) {
    const ball = this.matchState.ball;
    let closestPlayer: PlayerState | null = null;
    let closestDistance = Infinity;

    // Find closest player to ball
    this.matchState.players.forEach(player => {
      const distance = Math.sqrt(
        Math.pow(player.pos[0] - ball.pos[0], 2) +
        Math.pow(player.pos[1] - ball.pos[1], 2)
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPlayer = player;
      }
    });

    // Update each player
    this.matchState.players.forEach(player => {
      // Reset ball possession
      player.has_ball = false;

      // Simple AI: move toward ball if close enough
      if (closestDistance < 30 && closestPlayer?.id === player.id) {
        const dx = ball.pos[0] - player.pos[0];
        const dy = ball.pos[1] - player.pos[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          // Move toward ball
          const maxSpeed = 8; // m/s
          const moveSpeed = Math.min(maxSpeed, distance * 2);
          
          player.pos[0] += (dx / distance) * moveSpeed * deltaTime;
          player.pos[1] += (dy / distance) * moveSpeed * deltaTime;
          player.facing = Math.atan2(dy, dx);
          player.speed = moveSpeed;
          player.anim_state = 'run';
        } else {
          // Close to ball - take possession
          player.has_ball = true;
          player.anim_state = 'idle';
          player.speed = 0;

          // Simple decision making
          if (Math.random() < 0.01) { // 1% chance per frame to kick
            this.kickBall(player);
          }
        }
      } else {
        // Return to formation position
        player.anim_state = 'idle';
        player.speed = 0;
      }

      // Drain stamina
      player.stamina = Math.max(0, player.stamina - deltaTime * 0.1);
    });
  }

  private kickBall(player: PlayerState) {
    const ball = this.matchState.ball;
    const isHomeTeam = player.team_id === this.homeTeamId;
    
    // Determine kick direction (toward opponent goal)
    const targetX = isHomeTeam ? 52.5 : -52.5;
    const targetY = (Math.random() - 0.5) * 14.6; // Goal width
    
    const dx = targetX - ball.pos[0];
    const dy = targetY - ball.pos[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Kick power based on distance and player attributes
    const power = Math.min(25, distance * 0.3 + Math.random() * 10);
    
    ball.vel[0] = (dx / distance) * power;
    ball.vel[1] = (dy / distance) * power;
    ball.vel[2] = Math.random() * 5; // Some lift

    // Check if it's a shot
    const distanceToGoal = Math.abs(ball.pos[0] - targetX);
    if (distanceToGoal < 30) {
      this.addEvent('shot', player, [ball.pos[0], ball.pos[1]]);
      
      // Check for goal
      if (Math.abs(ball.pos[1]) < 7.32 && Math.abs(ball.pos[0] - targetX) < 2) {
        this.addEvent('goal', player, [targetX, targetY]);
        if (isHomeTeam) {
          this.matchState.score[0]++;
        } else {
          this.matchState.score[1]++;
        }
      }
    }
  }

  private checkForEvents() {
    // Random events based on time
    const currentMinute = Math.floor(this.matchState.clock / 60);
    
    if (currentMinute > this.lastEventTime && Math.random() < 0.02) {
      const randomPlayer = this.matchState.players[Math.floor(Math.random() * this.matchState.players.length)];
      
      if (Math.random() < 0.1) {
        this.addEvent('card', randomPlayer, [randomPlayer.pos[0], randomPlayer.pos[1]], { card_type: 'yellow' });
      } else if (Math.random() < 0.05) {
        this.addEvent('foul', randomPlayer, [randomPlayer.pos[0], randomPlayer.pos[1]]);
      }
      
      this.lastEventTime = currentMinute;
    }
  }

  private addEvent(type: string, player: PlayerState, position: [number, number], metadata: any = {}) {
    const minute = Math.floor(this.matchState.clock / 60);
    const second = Math.floor(this.matchState.clock % 60);
    
    const event: MatchEvent = {
      id: crypto.randomUUID(),
      type,
      minute,
      second,
      player_id: player.id,
      team_id: player.team_id,
      position,
      metadata
    };
    
    this.events.push(event);
    this.matchState.active_event = type;
    
    // Clear active event after 3 seconds
    setTimeout(() => {
      if (this.matchState.active_event === type) {
        this.matchState.active_event = null;
      }
    }, 3000);
  }

  getEvents(): MatchEvent[] {
    return [...this.events];
  }

  isMatchFinished(): boolean {
    return this.matchState.phase === 'finished';
  }

  getCurrentState(): MatchState {
    return { ...this.matchState };
  }
}
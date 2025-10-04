import { MatchState, PlayerState, MatchEvent, Player } from './types';

export class MatchSimulator {
  private homeTeam: Player[];
  private awayTeam: Player[];
  private state: MatchState;
  private events: MatchEvent[] = [];
  private rng: () => number;

  constructor(homeTeam: Player[], awayTeam: Player[], seed: number = Date.now()) {
    this.homeTeam = homeTeam.slice(0, 11); // Starting XI
    this.awayTeam = awayTeam.slice(0, 11);
    this.rng = this.createSeededRandom(seed);
    this.state = this.initializeMatch();
  }

  private createSeededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  private initializeMatch(): MatchState {
    const players: PlayerState[] = [];

    // Initialize home team players
    this.homeTeam.forEach((player, index) => {
      const pos = this.getInitialPosition(player.position, index, true);
      players.push({
        id: player.id,
        team_id: player.team_id,
        pos,
        facing: 0,
        speed: 0,
        anim_state: 'idle',
        has_ball: false,
        stamina: 100
      });
    });

    // Initialize away team players
    this.awayTeam.forEach((player, index) => {
      const pos = this.getInitialPosition(player.position, index, false);
      players.push({
        id: player.id,
        team_id: player.team_id,
        pos,
        facing: Math.PI,
        speed: 0,
        anim_state: 'idle',
        has_ball: false,
        stamina: 100
      });
    });

    return {
      clock: 0,
      ball: { pos: [0, 0, 0.1], vel: [0, 0, 0] },
      players,
      score: [0, 0],
      phase: 'kickoff',
      active_event: undefined
    };
  }

  private getInitialPosition(position: string, index: number, isHome: boolean): [number, number, number] {
    const side = isHome ? -1 : 1;
    const formations = {
      'GK': [0 * side, -40 * side, 0],
      'DF': [
        [-20, -25 * side, 0], [20, -25 * side, 0], [-10, -30 * side, 0], [10, -30 * side, 0]
      ],
      'MF': [
        [-15, -10 * side, 0], [15, -10 * side, 0], [-25, -5 * side, 0], [25, -5 * side, 0]
      ],
      'FW': [
        [-10, 10 * side, 0], [10, 10 * side, 0]
      ]
    };

    if (position === 'GK') return formations.GK as [number, number, number];
    
    const positionGroup = formations[position as keyof typeof formations] as number[][];
    if (positionGroup && positionGroup[index % positionGroup.length]) {
      return positionGroup[index % positionGroup.length] as [number, number, number];
    }
    
    return [0, 0, 0];
  }

  public simulateStep(deltaTime: number = 1/10): MatchState {
    this.state.clock += deltaTime;
    
    // Update ball physics
    this.updateBallPhysics(deltaTime);
    
    // Update player positions and actions
    this.updatePlayers(deltaTime);
    
    // Check for events
    this.checkForEvents();
    
    // Reduce stamina
    this.updateStamina(deltaTime);
    
    return { ...this.state };
  }

  private updateBallPhysics(deltaTime: number) {
    const ball = this.state.ball;
    
    // Apply velocity
    ball.pos[0] += ball.vel[0] * deltaTime;
    ball.pos[1] += ball.vel[1] * deltaTime;
    ball.pos[2] += ball.vel[2] * deltaTime;
    
    // Apply drag
    const drag = 0.98;
    ball.vel[0] *= drag;
    ball.vel[1] *= drag;
    ball.vel[2] *= drag;
    
    // Ground collision
    if (ball.pos[2] <= 0.1) {
      ball.pos[2] = 0.1;
      ball.vel[2] = Math.abs(ball.vel[2]) * 0.6; // Bounce
    }
    
    // Pitch boundaries (105m x 68m)
    if (Math.abs(ball.pos[0]) > 52.5) {
      ball.pos[0] = Math.sign(ball.pos[0]) * 52.5;
      ball.vel[0] *= -0.8;
    }
    if (Math.abs(ball.pos[1]) > 34) {
      ball.pos[1] = Math.sign(ball.pos[1]) * 34;
      ball.vel[1] *= -0.8;
    }
  }

  private updatePlayers(deltaTime: number) {
    this.state.players.forEach(player => {
      const playerData = [...this.homeTeam, ...this.awayTeam].find(p => p.id === player.id);
      if (!playerData) return;

      // Simple AI movement towards ball
      const ballPos = this.state.ball.pos;
      const dx = ballPos[0] - player.pos[0];
      const dy = ballPos[1] - player.pos[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) {
        const speed = (playerData.attributes.pace / 100) * 8 * (player.stamina / 100);
        player.pos[0] += (dx / distance) * speed * deltaTime;
        player.pos[1] += (dy / distance) * speed * deltaTime;
        player.facing = Math.atan2(dy, dx);
        player.anim_state = 'run';
        player.speed = speed;
      } else {
        player.anim_state = 'idle';
        player.speed = 0;
        
        // Check if player can take possession
        if (distance < 1.5 && !this.state.players.some(p => p.has_ball)) {
          player.has_ball = true;
          this.state.ball.vel = [0, 0, 0];
        }
      }
    });
  }

  private checkForEvents() {
    const minute = Math.floor(this.state.clock / 60);
    const second = Math.floor(this.state.clock % 60);
    
    // Random event generation
    if (this.rng() < 0.001) { // 0.1% chance per tick
      const eventType = this.rng() < 0.3 ? 'shot' : 'foul';
      
      if (eventType === 'shot') {
        this.handleShotEvent(minute, second);
      } else {
        this.handleFoulEvent(minute, second);
      }
    }
  }

  private handleShotEvent(minute: number, second: number) {
    const shooter = this.state.players.find(p => p.has_ball);
    if (!shooter) return;

    const shooterData = [...this.homeTeam, ...this.awayTeam].find(p => p.id === shooter.id);
    if (!shooterData) return;

    const shotPower = shooterData.attributes.finishing / 100;
    const isGoal = this.rng() < shotPower * 0.3; // 30% max chance

    if (isGoal) {
      const isHomeTeam = this.homeTeam.some(p => p.id === shooter.id);
      if (isHomeTeam) {
        this.state.score[0]++;
      } else {
        this.state.score[1]++;
      }

      this.events.push({
        type: 'goal',
        minute,
        second,
        payload: { player_id: shooter.id, team_id: shooter.team_id }
      });

      // Celebration animation
      this.state.players
        .filter(p => p.team_id === shooter.team_id)
        .forEach(p => p.anim_state = 'celebrate');
    } else {
      this.events.push({
        type: 'shot',
        minute,
        second,
        payload: { player_id: shooter.id, team_id: shooter.team_id }
      });
    }

    shooter.has_ball = false;
    shooter.anim_state = 'kick';
  }

  private handleFoulEvent(minute: number, second: number) {
    const players = this.state.players.filter(p => p.speed > 0);
    if (players.length < 2) return;

    const fouler = players[Math.floor(this.rng() * players.length)];
    
    this.events.push({
      type: 'foul',
      minute,
      second,
      payload: { player_id: fouler.id, team_id: fouler.team_id }
    });
  }

  private updateStamina(deltaTime: number) {
    this.state.players.forEach(player => {
      const staminaDrain = player.speed > 0 ? 0.1 * deltaTime : 0.05 * deltaTime;
      player.stamina = Math.max(0, player.stamina - staminaDrain);
    });
  }

  public getEvents(): MatchEvent[] {
    return [...this.events];
  }

  public isMatchFinished(): boolean {
    return this.state.clock >= 5400; // 90 minutes
  }
}
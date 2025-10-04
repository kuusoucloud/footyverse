export interface Team {
  id: string;
  name: string;
  tier: number;
  crest_url?: string;
  primary_color: string;
  secondary_color: string;
  elo: number;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  age: number;
  height_cm: number;
  weight_kg: number;
  foot: 'L' | 'R';
  base_elo: number;
  current_elo: number;
  attributes: {
    pace: number;
    accel: number;
    stamina: number;
    strength: number;
    passing: number;
    vision: number;
    finishing: number;
    heading: number;
    marking: number;
    tackling: number;
    reflexes: number;
    handling: number;
    positioning: number;
    composure: number;
  };
}

export interface Fixture {
  id: string;
  season_id: string;
  league_id: string;
  round: number;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'finished';
  match_channel?: string;
}

export interface MatchState {
  clock: number; // seconds
  ball: {
    pos: [number, number, number];
    vel: [number, number, number];
  };
  players: PlayerState[];
  score: [number, number]; // [home, away]
  phase: 'kickoff' | 'open_play' | 'set_piece';
  active_event?: string;
}

export interface PlayerState {
  id: string;
  team_id: string;
  pos: [number, number, number];
  facing: number; // radians
  speed: number;
  anim_state: 'idle' | 'run' | 'kick' | 'slide' | 'celebrate';
  has_ball: boolean;
  stamina: number; // 0-100
}

export interface MatchEvent {
  type: 'kickoff' | 'shot' | 'goal' | 'card' | 'substitution' | 'foul' | 'offside' | 'save';
  minute: number;
  second: number;
  payload: any;
}

export interface Odds {
  home: number;
  draw: number;
  away: number;
}
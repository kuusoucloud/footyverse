import { create } from 'zustand';

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
  home_team: Team;
  away_team: Team;
  league: {
    id: string;
    name: string;
    tier: number;
  };
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface MatchState {
  clock: number;
  ball: {
    pos: [number, number, number];
    vel: [number, number, number];
  };
  players: PlayerState[];
  score: [number, number];
  phase: 'kickoff' | 'open_play' | 'set_piece';
  active_event?: string;
}

export interface PlayerState {
  id: string;
  team_id: string;
  pos: [number, number, number];
  facing: number;
  speed: number;
  anim_state: 'idle' | 'run' | 'kick' | 'slide' | 'celebrate';
  has_ball: boolean;
  stamina: number;
}

export interface MatchEvent {
  type: 'kickoff' | 'shot' | 'goal' | 'card' | 'substitution' | 'foul' | 'offside' | 'save';
  minute: number;
  second: number;
  payload: any;
}

interface FootballStore {
  // State
  fixtures: Fixture[];
  selectedFixture: Fixture | null;
  currentMatch: MatchState | null;
  matchEvents: MatchEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setFixtures: (fixtures: Fixture[]) => void;
  setSelectedFixture: (fixture: Fixture | null) => void;
  setCurrentMatch: (match: MatchState | null) => void;
  addMatchEvent: (event: MatchEvent) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMatchData: () => void;
}

export const useFootballStore = create<FootballStore>((set) => ({
  // Initial state
  fixtures: [],
  selectedFixture: null,
  currentMatch: null,
  matchEvents: [],
  isLoading: false,
  error: null,

  // Actions
  setFixtures: (fixtures) => set({ fixtures }),
  setSelectedFixture: (fixture) => set({ selectedFixture: fixture }),
  setCurrentMatch: (match) => set({ currentMatch: match }),
  addMatchEvent: (event) => set((state) => ({ 
    matchEvents: [...state.matchEvents, event] 
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearMatchData: () => set({ 
    currentMatch: null, 
    matchEvents: [], 
    selectedFixture: null 
  }),
}));
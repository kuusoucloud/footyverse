import { Team, Player, Odds } from './types';

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

// Team name generation
const CITIES = [
  'Manchester', 'Liverpool', 'London', 'Birmingham', 'Leeds', 'Sheffield', 'Bristol',
  'Newcastle', 'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Cardiff', 'Belfast',
  'Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Swansea', 'Plymouth'
];

const CLUB_SUFFIXES = [
  'United', 'City', 'Town', 'FC', 'Rovers', 'Wanderers', 'Athletic', 'Albion',
  'County', 'Rangers', 'Hotspur', 'Villa', 'Wednesday', 'Forest', 'Orient'
];

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan', 'Jacob',
  'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott',
  'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Patrick', 'Frank'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell'
];

export function generateTeams(count: number = 100): Team[] {
  const rng = new SeededRandom(12345);
  const teams: Team[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      const city = rng.choice(CITIES);
      const suffix = rng.choice(CLUB_SUFFIXES);
      name = `${city} ${suffix}`;
    } while (usedNames.has(name));
    
    usedNames.add(name);
    
    const tier = Math.floor(i / 20) + 1; // 20 teams per tier
    
    teams.push({
      id: crypto.randomUUID(),
      name,
      tier,
      primary_color: `#${Math.floor(rng.next() * 16777215).toString(16).padStart(6, '0')}`,
      secondary_color: `#${Math.floor(rng.next() * 16777215).toString(16).padStart(6, '0')}`,
      elo: 1000.0
    });
  }

  return teams;
}

export function generatePlayersForTeam(team: Team, count: number = 23): Player[] {
  const rng = new SeededRandom(team.name.charCodeAt(0) * 1000);
  const players: Player[] = [];
  
  // Position distribution: 2 GK, 8 DF, 8 MF, 5 FW
  const positions: Array<'GK' | 'DF' | 'MF' | 'FW'> = [
    'GK', 'GK',
    'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
    'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF', 'MF',
    'FW', 'FW', 'FW', 'FW', 'FW'
  ];

  for (let i = 0; i < Math.min(count, positions.length); i++) {
    const firstName = rng.choice(FIRST_NAMES);
    const lastName = rng.choice(LAST_NAMES);
    const position = positions[i];
    
    // Generate attributes based on position
    const baseAttributes = {
      pace: rng.nextInt(30, 80),
      accel: rng.nextInt(30, 80),
      stamina: rng.nextInt(40, 90),
      strength: rng.nextInt(30, 80),
      passing: rng.nextInt(30, 80),
      vision: rng.nextInt(30, 80),
      finishing: rng.nextInt(20, 70),
      heading: rng.nextInt(30, 80),
      marking: rng.nextInt(30, 80),
      tackling: rng.nextInt(30, 80),
      reflexes: rng.nextInt(20, 70),
      handling: rng.nextInt(20, 70),
      positioning: rng.nextInt(40, 85),
      composure: rng.nextInt(30, 80)
    };

    // Boost relevant attributes by position
    if (position === 'GK') {
      baseAttributes.reflexes = rng.nextInt(60, 95);
      baseAttributes.handling = rng.nextInt(60, 95);
      baseAttributes.positioning = rng.nextInt(70, 95);
    } else if (position === 'DF') {
      baseAttributes.marking = rng.nextInt(60, 90);
      baseAttributes.tackling = rng.nextInt(60, 90);
      baseAttributes.heading = rng.nextInt(60, 90);
      baseAttributes.strength = rng.nextInt(60, 90);
    } else if (position === 'MF') {
      baseAttributes.passing = rng.nextInt(60, 90);
      baseAttributes.vision = rng.nextInt(60, 90);
      baseAttributes.stamina = rng.nextInt(70, 95);
    } else if (position === 'FW') {
      baseAttributes.finishing = rng.nextInt(60, 90);
      baseAttributes.pace = rng.nextInt(60, 90);
      baseAttributes.accel = rng.nextInt(60, 90);
    }

    players.push({
      id: crypto.randomUUID(),
      team_id: team.id,
      name: `${firstName} ${lastName}`,
      position,
      age: rng.nextInt(18, 35),
      height_cm: rng.nextInt(165, 200),
      weight_kg: rng.nextInt(60, 95),
      foot: rng.next() > 0.8 ? 'L' : 'R',
      base_elo: 500.0,
      current_elo: 500.0,
      attributes: baseAttributes
    });
  }

  return players;
}

export function calculateOdds(homeElo: number, awayElo: number, homeAdvantage: number = 50): Odds {
  const eloDiff = homeElo - awayElo + homeAdvantage;
  
  // Logistic function for win probability
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const awayWinProb = 1 / (1 + Math.pow(10, eloDiff / 400));
  
  // Draw probability (higher for closer teams)
  const drawProb = 0.25 + (0.1 * Math.exp(-Math.abs(eloDiff) / 200));
  
  // Normalize probabilities
  const total = homeWinProb + awayWinProb + drawProb;
  const normalizedHome = homeWinProb / total;
  const normalizedAway = awayWinProb / total;
  const normalizedDraw = drawProb / total;
  
  // Apply bookmaker margin (5%)
  const margin = 1.05;
  
  return {
    home: parseFloat((margin / normalizedHome).toFixed(2)),
    draw: parseFloat((margin / normalizedDraw).toFixed(2)),
    away: parseFloat((margin / normalizedAway).toFixed(2))
  };
}

export function calculateEloChange(
  playerElo: number,
  teamResult: number, // 1 = win, 0.5 = draw, 0 = loss
  performanceBonus: number = 0,
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (1000 - playerElo) / 400));
  const baseChange = kFactor * (teamResult - expectedScore);
  const totalChange = baseChange + performanceBonus;
  
  // Cap the change to prevent runaway ratings
  return Math.max(-40, Math.min(40, totalChange));
}
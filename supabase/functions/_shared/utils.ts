import { Team, Player, Odds } from './types.ts';

export function calculateOdds(homeElo: number, awayElo: number, homeAdvantage: number = 50): Odds {
  const eloDiff = homeElo - awayElo + homeAdvantage;
  
  // Logistic model for home win probability
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  
  // Draw probability based on rating gap (closer teams = more draws)
  const ratingGap = Math.abs(eloDiff);
  const baseDraw = 0.25;
  const drawProb = baseDraw * Math.exp(-ratingGap / 200);
  
  // Away win probability
  const awayWinProb = 1 - homeWinProb - drawProb;
  
  // Apply 6% margin
  const margin = 0.06;
  const totalProb = homeWinProb + drawProb + awayWinProb;
  
  const adjustedHome = homeWinProb / totalProb * (1 - margin);
  const adjustedDraw = drawProb / totalProb * (1 - margin);
  const adjustedAway = awayWinProb / totalProb * (1 - margin);
  
  return {
    home: parseFloat((1 / adjustedHome).toFixed(2)),
    draw: parseFloat((1 / adjustedDraw).toFixed(2)),
    away: parseFloat((1 / adjustedAway).toFixed(2))
  };
}

export function generateTeams(count: number): Team[] {
  const teamNames = [
    'Arsenal', 'Chelsea', 'Liverpool', 'Manchester United', 'Manchester City',
    'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
    'Crystal Palace', 'Fulham', 'Brentford', 'Wolves', 'Everton',
    'Nottingham Forest', 'Bournemouth', 'Sheffield United', 'Burnley', 'Luton',
    'Leicester City', 'Leeds United', 'Southampton', 'Norwich City', 'Watford',
    'Birmingham City', 'Blackburn Rovers', 'Cardiff City', 'Coventry City', 'Hull City',
    'Ipswich Town', 'Middlesbrough', 'Millwall', 'Plymouth Argyle', 'Preston North End',
    'Queens Park Rangers', 'Rotherham United', 'Stoke City', 'Sunderland', 'Swansea City',
    'Bolton Wanderers', 'Bristol Rovers', 'Burton Albion', 'Cambridge United', 'Charlton Athletic',
    'Cheltenham Town', 'Derby County', 'Exeter City', 'Fleetwood Town', 'Forest Green Rovers',
    'Lincoln City', 'Northampton Town', 'Oxford United', 'Peterborough United', 'Port Vale',
    'Portsmouth', 'Shrewsbury Town', 'Stevenage', 'Wigan Athletic', 'Wycombe Wanderers',
    'AFC Wimbledon', 'Accrington Stanley', 'Barrow', 'Bradford City', 'Carlisle United',
    'Colchester United', 'Crawley Town', 'Crewe Alexandra', 'Doncaster Rovers', 'Gillingham',
    'Grimsby Town', 'Harrogate Town', 'Mansfield Town', 'Milton Keynes Dons', 'Morecambe',
    'Newport County', 'Notts County', 'Salford City', 'Stockport County', 'Sutton United',
    'Tranmere Rovers', 'Wrexham', 'Aldershot Town', 'Altrincham', 'Barnet',
    'Boreham Wood', 'Bromley', 'Chesterfield', 'Dagenham & Redbridge', 'Dorking Wanderers',
    'Eastleigh', 'Ebbsfleet United', 'FC Halifax Town', 'Gateshead', 'Kidderminster Harriers',
    'Maidenhead United', 'Oldham Athletic', 'Rochdale', 'Solihull Moors', 'Southend United',
    'Torquay United', 'Wealdstone', 'Woking', 'Yeovil Town', 'York City'
  ];

  const colors = [
    '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
    '#FFA500', '#FFC0CB', '#A52A2A', '#808080', '#000000', '#FFFFFF'
  ];

  const teams: Team[] = [];
  const teamsPerTier = 20;

  for (let i = 0; i < count; i++) {
    const tier = Math.floor(i / teamsPerTier) + 1;
    const baseElo = 1200 - (tier - 1) * 200; // Tier 1: ~1200, Tier 5: ~400
    const eloVariation = Math.random() * 200 - 100; // ±100 variation
    
    teams.push({
      id: crypto.randomUUID(),
      name: teamNames[i % teamNames.length] + (i >= teamNames.length ? ` ${Math.floor(i / teamNames.length) + 1}` : ''),
      tier,
      crest_url: null,
      primary_color: colors[Math.floor(Math.random() * colors.length)],
      secondary_color: colors[Math.floor(Math.random() * colors.length)],
      elo: Math.max(300, baseElo + eloVariation),
      created_at: new Date().toISOString()
    });
  }

  return teams;
}

export function generatePlayersForTeam(team: Team, count: number): Player[] {
  const firstNames = [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark',
    'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
    'George', 'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
  ];

  const positions = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
  const players: Player[] = [];

  // Ensure we have at least 2 GK, 8 DF, 8 MF, 5 FW
  const positionCounts = { GK: 2, DF: 8, MF: 8, FW: 5 };
  const positionOrder: ('GK' | 'DF' | 'MF' | 'FW')[] = [];

  // Fill required positions
  Object.entries(positionCounts).forEach(([pos, count]) => {
    for (let i = 0; i < count; i++) {
      positionOrder.push(pos as 'GK' | 'DF' | 'MF' | 'FW');
    }
  });

  for (let i = 0; i < count; i++) {
    const position = positionOrder[i] || positions[Math.floor(Math.random() * positions.length)];
    const baseElo = team.elo / 2; // Player base ELO is roughly half team ELO
    const eloVariation = Math.random() * 200 - 100; // ±100 variation
    
    // Position-based attribute generation
    const attributes = generatePlayerAttributes(position);
    
    players.push({
      id: crypto.randomUUID(),
      team_id: team.id,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      position,
      age: Math.floor(Math.random() * 20) + 18, // 18-37
      height_cm: Math.floor(Math.random() * 30) + 170, // 170-199cm
      weight_kg: Math.floor(Math.random() * 30) + 65, // 65-94kg
      foot: Math.random() > 0.8 ? 'L' : 'R', // 20% left-footed
      base_elo: Math.max(200, baseElo + eloVariation),
      current_elo: Math.max(200, baseElo + eloVariation),
      attributes,
      created_at: new Date().toISOString()
    });
  }

  return players;
}

function generatePlayerAttributes(position: string) {
  const base = 50;
  const variation = 30;
  
  const attributes = {
    pace: base + Math.floor(Math.random() * variation),
    accel: base + Math.floor(Math.random() * variation),
    stamina: base + Math.floor(Math.random() * variation),
    strength: base + Math.floor(Math.random() * variation),
    passing: base + Math.floor(Math.random() * variation),
    vision: base + Math.floor(Math.random() * variation),
    finishing: base + Math.floor(Math.random() * variation),
    heading: base + Math.floor(Math.random() * variation),
    marking: base + Math.floor(Math.random() * variation),
    tackling: base + Math.floor(Math.random() * variation),
    reflexes: base + Math.floor(Math.random() * variation),
    handling: base + Math.floor(Math.random() * variation),
    positioning: base + Math.floor(Math.random() * variation),
    composure: base + Math.floor(Math.random() * variation)
  };

  // Position-specific boosts
  switch (position) {
    case 'GK':
      attributes.reflexes += 20;
      attributes.handling += 20;
      attributes.positioning += 15;
      break;
    case 'DF':
      attributes.marking += 15;
      attributes.tackling += 15;
      attributes.heading += 10;
      attributes.strength += 10;
      break;
    case 'MF':
      attributes.passing += 15;
      attributes.vision += 15;
      attributes.stamina += 10;
      break;
    case 'FW':
      attributes.finishing += 20;
      attributes.pace += 15;
      attributes.accel += 10;
      break;
  }

  // Cap at 99
  Object.keys(attributes).forEach(key => {
    attributes[key as keyof typeof attributes] = Math.min(99, attributes[key as keyof typeof attributes]);
  });

  return attributes;
}

export function updatePlayerElo(
  player: Player,
  matchResult: 'win' | 'draw' | 'loss',
  performance: {
    goals?: number;
    assists?: number;
    cleanSheet?: boolean;
    errors?: number;
    rating?: number;
    minutes?: number;
  }
): number {
  const K = 32; // ELO K-factor
  const maxDelta = 40; // Cap per-match change
  
  // Base team result delta
  let baseDelta = 0;
  switch (matchResult) {
    case 'win': baseDelta = 16; break;
    case 'draw': baseDelta = 0; break;
    case 'loss': baseDelta = -16; break;
  }
  
  // Performance bonuses/penalties
  let performanceDelta = 0;
  if (performance.goals) performanceDelta += performance.goals * 5;
  if (performance.assists) performanceDelta += performance.assists * 3;
  if (performance.cleanSheet && ['GK', 'DF'].includes(player.position)) performanceDelta += 3;
  if (performance.errors) performanceDelta -= performance.errors * 5;
  if (performance.rating) {
    if (performance.rating >= 8) performanceDelta += 5;
    else if (performance.rating <= 5) performanceDelta -= 5;
  }
  
  // Minutes played factor (less than 60 minutes = reduced impact)
  const minutesFactor = performance.minutes ? Math.min(1, performance.minutes / 60) : 1;
  
  const totalDelta = (baseDelta + performanceDelta) * minutesFactor;
  const cappedDelta = Math.max(-maxDelta, Math.min(maxDelta, totalDelta));
  
  return Math.max(100, player.current_elo + cappedDelta);
}
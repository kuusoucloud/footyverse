// Enhanced match simulator with injury system
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury';
  player_id?: string;
  team_id: string;
  description: string;
  severity?: 'minor' | 'moderate' | 'major' | 'career_ending';
}

export interface MatchState {
  minute: number;
  home_score: number;
  away_score: number;
  events: MatchEvent[];
  injuries: MatchEvent[];
  home_team_id: string;
  away_team_id: string;
  status: 'live' | 'completed';
}

// Calculate injury probability based on various factors
const calculateInjuryProbability = (player: any, matchMinute: number, matchIntensity: number = 1.0): number => {
  let baseProbability = 0.02; // 2% base chance per match
  
  // Age factor - older players more injury prone
  if (player.age >= 35) baseProbability *= 2.0;
  else if (player.age >= 30) baseProbability *= 1.5;
  else if (player.age <= 20) baseProbability *= 1.2; // Young players also slightly more prone
  
  // Physical attribute factor - lower physical = higher injury risk
  const physicalFactor = (100 - (player.physical || 70)) / 100;
  baseProbability += physicalFactor * 0.01;
  
  // Career injuries factor - players with more injuries are more prone
  const injuryHistory = player.career_injuries || 0;
  baseProbability += injuryHistory * 0.005;
  
  // Match minute factor - more injuries in later stages
  if (matchMinute > 75) baseProbability *= 1.8;
  else if (matchMinute > 60) baseProbability *= 1.4;
  else if (matchMinute > 45) baseProbability *= 1.2;
  
  // Match intensity factor
  baseProbability *= matchIntensity;
  
  // Current injury status - injured players can't get injured again
  if (player.injury_status !== 'fit') baseProbability = 0;
  
  return Math.min(baseProbability, 0.15); // Cap at 15% per match
};

// Determine injury severity
const determineInjurySeverity = (player: any): string => {
  const random = Math.random();
  
  // Age affects severity
  let severityModifier = 0;
  if (player.age >= 35) severityModifier += 0.1;
  else if (player.age >= 30) severityModifier += 0.05;
  
  // Career injuries affect severity
  const injuryHistory = player.career_injuries || 0;
  severityModifier += injuryHistory * 0.02;
  
  // Determine severity with modifiers
  if (random < 0.02 + severityModifier) return 'career_ending'; // 2-5% chance
  else if (random < 0.15 + severityModifier) return 'major'; // 13-18% chance
  else if (random < 0.35 + severityModifier) return 'moderate'; // 20-25% chance
  else return 'minor'; // 60-65% chance
};

export const simulateMatch = async (
  supabase: any,
  matchId: string,
  homeTeam: any,
  awayTeam: any,
  homePlayers: any[],
  awayPlayers: any[]
): Promise<MatchState> => {
  const events: MatchEvent[] = [];
  const injuries: MatchEvent[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let currentMinute = 0;

  // Calculate team strengths (only include fit players)
  const fitHomePlayers = homePlayers.filter(p => p.injury_status === 'fit');
  const fitAwayPlayers = awayPlayers.filter(p => p.injury_status === 'fit');
  
  const homeStrength = fitHomePlayers.reduce((sum, p) => sum + (p.overall_rating || 70), 0) / Math.max(fitHomePlayers.length, 1);
  const awayStrength = fitAwayPlayers.reduce((sum, p) => sum + (p.overall_rating || 70), 0) / Math.max(fitAwayPlayers.length, 1);
  
  // Home advantage
  const adjustedHomeStrength = homeStrength * 1.1;
  
  // Match intensity based on team strength difference
  const strengthDifference = Math.abs(adjustedHomeStrength - awayStrength);
  const matchIntensity = 1.0 + (strengthDifference / 100); // Higher intensity for mismatched teams

  // Simulate match minute by minute (simplified to key minutes)
  const keyMinutes = [15, 30, 45, 60, 75, 90];
  
  for (const minute of keyMinutes) {
    currentMinute = minute;
    
    // Check for injuries for all players on the pitch
    const allActivePlayers = [...fitHomePlayers.slice(0, 11), ...fitAwayPlayers.slice(0, 11)];
    
    for (const player of allActivePlayers) {
      const injuryChance = calculateInjuryProbability(player, minute, matchIntensity);
      
      if (Math.random() < injuryChance) {
        const severity = determineInjurySeverity(player);
        const teamId = fitHomePlayers.includes(player) ? homeTeam.id : awayTeam.id;
        
        // Apply injury to database
        try {
          await supabase.rpc('apply_match_injury', {
            player_id: player.id,
            match_id: matchId,
            injury_severity: severity
          });
          
          const injuryEvent: MatchEvent = {
            minute,
            type: 'injury',
            player_id: player.id,
            team_id: teamId,
            description: `${player.name} suffers ${severity} injury`,
            severity
          };
          
          events.push(injuryEvent);
          injuries.push(injuryEvent);
          
          // Remove player from active players if major injury
          if (severity === 'major' || severity === 'career_ending') {
            const playerIndex = fitHomePlayers.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
              fitHomePlayers.splice(playerIndex, 1);
            } else {
              const awayIndex = fitAwayPlayers.findIndex(p => p.id === player.id);
              if (awayIndex !== -1) fitAwayPlayers.splice(awayIndex, 1);
            }
          }
        } catch (error) {
          console.error('Error applying injury:', error);
        }
      }
    }
    
    // Goal probability calculation (reduced if team has injuries)
    const homeInjuryFactor = Math.max(0.7, 1 - (injuries.filter(i => i.team_id === homeTeam.id).length * 0.1));
    const awayInjuryFactor = Math.max(0.7, 1 - (injuries.filter(i => i.team_id === awayTeam.id).length * 0.1));
    
    const homeGoalChance = (adjustedHomeStrength / (adjustedHomeStrength + awayStrength)) * 0.15 * homeInjuryFactor;
    const awayGoalChance = (awayStrength / (adjustedHomeStrength + awayStrength)) * 0.12 * awayInjuryFactor;

    // Check for goals
    if (Math.random() < homeGoalChance) {
      homeScore++;
      const scorer = fitHomePlayers[Math.floor(Math.random() * Math.min(fitHomePlayers.length, 11))];
      events.push({
        minute,
        type: 'goal',
        player_id: scorer?.id,
        team_id: homeTeam.id,
        description: `Goal by ${scorer?.name || 'Unknown'}`
      });
    }

    if (Math.random() < awayGoalChance) {
      awayScore++;
      const scorer = fitAwayPlayers[Math.floor(Math.random() * Math.min(fitAwayPlayers.length, 11))];
      events.push({
        minute,
        type: 'goal',
        player_id: scorer?.id,
        team_id: awayTeam.id,
        description: `Goal by ${scorer?.name || 'Unknown'}`
      });
    }

    // Cards (increased chance with injuries/intensity)
    const cardChance = 0.08 * matchIntensity;
    if (Math.random() < cardChance) {
      const allPlayers = [...fitHomePlayers.slice(0, 11), ...fitAwayPlayers.slice(0, 11)];
      const cardedPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      const isRed = Math.random() < 0.15; // 15% chance of red card
      
      if (cardedPlayer) {
        events.push({
          minute,
          type: isRed ? 'red_card' : 'yellow_card',
          player_id: cardedPlayer.id,
          team_id: fitHomePlayers.includes(cardedPlayer) ? homeTeam.id : awayTeam.id,
          description: `${isRed ? 'Red' : 'Yellow'} card for ${cardedPlayer.name}`
        });
      }
    }
  }

  return {
    minute: 90,
    home_score: homeScore,
    away_score: awayScore,
    events,
    injuries,
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    status: 'completed'
  };
};

// Process injury recoveries (called periodically)
export const processInjuryRecoveries = async (supabase: any): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('process_injury_recoveries');
    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error processing injury recoveries:', error);
    return 0;
  }
};

// Get injury report for a team
export const getTeamInjuryReport = async (supabase: any, teamId: string) => {
  try {
    const { data: injuries } = await supabase
      .from('player_injuries')
      .select(`
        *,
        player:players(name, position, age, overall_rating)
      `)
      .eq('is_active', true)
      .in('player_id', 
        supabase.from('players').select('id').eq('team_id', teamId)
      );

    const { data: players } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .neq('injury_status', 'fit');

    return {
      active_injuries: injuries || [],
      injured_players: players || [],
      total_injured: (players || []).length,
      fit_players: await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .eq('injury_status', 'fit')
        .then(res => res.data?.length || 0)
    };
  } catch (error) {
    console.error('Error getting injury report:', error);
    return {
      active_injuries: [],
      injured_players: [],
      total_injured: 0,
      fit_players: 0
    };
  }
};
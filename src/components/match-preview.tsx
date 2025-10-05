"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  TrendingUp,
  Users,
  Target,
  Activity,
  Star,
  MapPin,
  Shirt,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  shirt_number?: number;
  overall_rating?: number;
  current_elo: number;
  market_value?: number;
  injury_status?: string;
  form_rating?: number;
  nationality?: string;
  attributes?: any;
}

interface Team {
  id: string;
  name: string;
  tier: number;
  logo_url?: string;
  crest_url?: string;
  elo_rating?: number;
  primary_color: string;
  secondary_color: string;
}

interface Formation {
  id: string;
  name: string;
  display_name: string;
  formation_code: string;
  description?: string | null;
  positions: Array<{
    position: string;
    x: number;
    y: number;
    role: string;
  }>;
  tactical_style: string;
  strengths: string[];
  weaknesses: string[];
}

interface MatchPreviewData {
  fixture: {
    id: string;
    scheduled_at: string;
    round: number;
    odds?: {
      home: number;
      away: number;
      draw: number;
    };
  };
  home_team: Team;
  away_team: Team;
  home_players: Player[];
  away_players: Player[];
  home_form: string[];
  away_form: string[];
  home_formation: Formation | null;
  away_formation: Formation | null;
  head_to_head: any[];
}

interface SoccerFieldProps {
  homeTeam: Team;
  awayTeam: Team;
  homePlayers: Player[];
  awayPlayers: Player[];
  homeFormation: Formation | null;
  awayFormation: Formation | null;
}

function SoccerField({
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  homeFormation,
  awayFormation,
}: SoccerFieldProps) {
  // Use formation positions if available, otherwise fall back to default 4-4-2
  const getPlayerPositions = (
    players: Player[],
    formation: Formation | null,
    isHome: boolean,
  ) => {
    const positions: { [key: string]: { x: number; y: number } } = {};

    if (formation && formation.positions) {
      // Match players to formation positions based on their roles
      const formationPositions = formation.positions.map((pos) => ({
        ...pos,
        x: isHome ? pos.x : 100 - pos.x, // Mirror for away team
        y: isHome ? pos.y : 100 - pos.y, // Mirror for away team
      }));

      // Group players by position type using the actual database values
      const playersByPosition = {
        GK: players.filter(p => p.position === 'GK'),
        DF: players.filter(p => p.position === 'DF'),
        MF: players.filter(p => p.position === 'MF'),
        FW: players.filter(p => p.position === 'FW')
      };

      // Sort each group by rating
      Object.keys(playersByPosition).forEach(key => {
        playersByPosition[key as keyof typeof playersByPosition].sort((a, b) => 
          (b.overall_rating || 0) - (a.overall_rating || 0)
        );
      });

      const assignedPlayers = new Set<string>();
      
      // Assign players to formation positions based on role matching
      formationPositions.forEach((formationPos, index) => {
        let selectedPlayer: Player | null = null;
        
        // Match formation role to player position - more flexible matching
        const role = formationPos.role.toLowerCase();
        
        if (role.includes('goalkeeper') || role.includes('gk')) {
          selectedPlayer = playersByPosition.GK.find(p => !assignedPlayers.has(p.id)) || null;
        } else if (role.includes('defender') || role.includes('defence') || role.includes('back') || role.includes('cb') || role.includes('lb') || role.includes('rb')) {
          selectedPlayer = playersByPosition.DF.find(p => !assignedPlayers.has(p.id)) || null;
        } else if (role.includes('midfielder') || role.includes('midfield') || role.includes('mid') || role.includes('cm') || role.includes('cdm') || role.includes('cam')) {
          selectedPlayer = playersByPosition.MF.find(p => !assignedPlayers.has(p.id)) || null;
        } else if (role.includes('forward') || role.includes('striker') || role.includes('winger') || role.includes('attacker') || role.includes('attack') || role.includes('st') || role.includes('lw') || role.includes('rw')) {
          selectedPlayer = playersByPosition.FW.find(p => !assignedPlayers.has(p.id)) || null;
        } else {
          // If role doesn't match any category, try to infer from position on field
          // Positions closer to goal (lower x for home, higher x for away) are more defensive
          const isDefensivePosition = isHome ? formationPos.x < 40 : formationPos.x > 60;
          const isMidfieldPosition = isHome ? (formationPos.x >= 40 && formationPos.x < 70) : (formationPos.x <= 60 && formationPos.x > 30);
          
          if (isDefensivePosition && formationPos.x !== 10 && formationPos.x !== 90) { // Not goalkeeper position
            selectedPlayer = playersByPosition.DF.find(p => !assignedPlayers.has(p.id)) || null;
          } else if (isMidfieldPosition) {
            selectedPlayer = playersByPosition.MF.find(p => !assignedPlayers.has(p.id)) || null;
          } else {
            selectedPlayer = playersByPosition.FW.find(p => !assignedPlayers.has(p.id)) || null;
          }
        }
        
        // Fallback: if no specific match found, use best available player
        if (!selectedPlayer) {
          const allAvailable = [...playersByPosition.GK, ...playersByPosition.DF, ...playersByPosition.MF, ...playersByPosition.FW]
            .filter(p => !assignedPlayers.has(p.id))
            .sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
          selectedPlayer = allAvailable[0] || null;
        }
        
        if (selectedPlayer) {
          positions[selectedPlayer.id] = { x: formationPos.x, y: formationPos.y };
          assignedPlayers.add(selectedPlayer.id);
        }
      });
    } else {
      // Fall back to default 4-4-2 positions with proper player sorting
      const sortedPlayers = [...players].sort((a, b) => {
        const positionOrder = { 'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3 };
        
        const aOrder = positionOrder[a.position as keyof typeof positionOrder] ?? 99;
        const bOrder = positionOrder[b.position as keyof typeof positionOrder] ?? 99;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (b.overall_rating || 0) - (a.overall_rating || 0);
      });

      const defaultPositions = isHome
        ? [
            { x: 10, y: 50 }, // GK
            { x: 25, y: 20 }, // LB
            { x: 25, y: 35 }, // CB
            { x: 25, y: 65 }, // CB
            { x: 25, y: 80 }, // RB
            { x: 45, y: 15 }, // LM
            { x: 45, y: 35 }, // CM
            { x: 45, y: 65 }, // CM
            { x: 45, y: 85 }, // RM
            { x: 70, y: 35 }, // ST
            { x: 70, y: 65 }, // ST
          ]
        : [
            { x: 90, y: 50 }, // GK
            { x: 75, y: 80 }, // RB
            { x: 75, y: 65 }, // CB
            { x: 75, y: 35 }, // CB
            { x: 75, y: 20 }, // LB
            { x: 55, y: 85 }, // RM
            { x: 55, y: 65 }, // CM
            { x: 55, y: 35 }, // CM
            { x: 55, y: 15 }, // LM
            { x: 30, y: 65 }, // ST
            { x: 30, y: 35 }, // ST
          ];

      sortedPlayers.slice(0, 11).forEach((player, index) => {
        if (defaultPositions[index]) {
          positions[player.id] = defaultPositions[index];
        }
      });
    }

    return positions;
  };

  const homePositions = getPlayerPositions(homePlayers, homeFormation, true);
  const awayPositions = getPlayerPositions(awayPlayers, awayFormation, false);

  // Get players that have been assigned positions
  const getAssignedPlayers = (players: Player[], positions: { [key: string]: { x: number; y: number } }) => {
    return players.filter(player => positions[player.id]);
  };

  const assignedHomePlayers = getAssignedPlayers(homePlayers, homePositions);
  const assignedAwayPlayers = getAssignedPlayers(awayPlayers, awayPositions);

  // Sort players for consistent rendering (same logic as in getPlayerPositions)
  const sortPlayers = (players: Player[]) => {
    return [...players].sort((a, b) => {
      const positionOrder = { 'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3 };
      
      const aOrder = positionOrder[a.position as keyof typeof positionOrder] ?? 99;
      const bOrder = positionOrder[b.position as keyof typeof positionOrder] ?? 99;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.overall_rating || 0) - (a.overall_rating || 0);
    });
  };

  const sortedHomePlayers = sortPlayers(homePlayers);
  const sortedAwayPlayers = sortPlayers(awayPlayers);

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-green-400 to-green-500 rounded-lg overflow-hidden">
      {/* Field markings */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Field outline */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Center line */}
        <line x1="50" y1="2" x2="50" y2="98" stroke="white" strokeWidth="0.3" />

        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Penalty areas */}
        <rect
          x="2"
          y="25"
          width="15"
          height="50"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <rect
          x="83"
          y="25"
          width="15"
          height="50"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Goal areas */}
        <rect
          x="2"
          y="40"
          width="6"
          height="20"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <rect
          x="92"
          y="40"
          width="6"
          height="20"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Goals */}
        <rect x="0" y="45" width="2" height="10" fill="white" />
        <rect x="98" y="45" width="2" height="10" fill="white" />
      </svg>

      {/* Home team players */}
      {assignedHomePlayers.map((player) => {
        const position = homePositions[player.id];
        if (!position) return null;

        return (
          <div
            key={`home-${player.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: homeTeam.primary_color }}
            >
              {player.shirt_number || "?"}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {player.name} ({player.position})
            </div>
          </div>
        );
      })}

      {/* Away team players */}
      {assignedAwayPlayers.map((player) => {
        const position = awayPositions[player.id];
        if (!position) return null;

        return (
          <div
            key={`away-${player.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: awayTeam.primary_color }}
            >
              {player.shirt_number || "?"}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {player.name} ({player.position})
            </div>
          </div>
        );
      })}

      {/* Team names and formations */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-semibold">
        {homeTeam.name}
        {homeFormation && (
          <div className="text-xs text-green-300 mt-1">
            {homeFormation.formation_code} - {homeFormation.tactical_style}
          </div>
        )}
      </div>
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm font-semibold text-right">
        {awayTeam.name}
        {awayFormation && (
          <div className="text-xs text-blue-300 mt-1">
            {awayFormation.formation_code} - {awayFormation.tactical_style}
          </div>
        )}
      </div>
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  teamColor: string;
}

function PlayerCard({ player, teamColor }: PlayerCardProps) {
  const formatValue = (value?: number) => {
    if (!value) return "N/A";
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-gray-300"
            style={{ backgroundColor: teamColor }}
          >
            {player.shirt_number || "?"}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{player.name}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Badge variant="outline" className="text-xs">
                {player.position}
              </Badge>
              <span>Age {player.age}</span>
              {player.nationality && (
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  {player.nationality}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Rating:</span>
            <span className="font-semibold">
              {player.overall_rating || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">ELO:</span>
            <span className="font-semibold">
              {Math.round(player.current_elo)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Value:</span>
            <span className="font-semibold">
              {formatValue(player.market_value)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Form:</span>
            <span className="font-semibold">{player.form_rating || "N/A"}</span>
          </div>
        </div>

        {player.injury_status && player.injury_status !== "fit" && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <span className="text-red-600 font-semibold">
              Injured: {player.injury_status}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MatchPreviewProps {
  fixture: any;
  onBack: () => void;
}

export default function MatchPreview({ fixture, onBack }: MatchPreviewProps) {
  const [matchData, setMatchData] = useState<MatchPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMatchData();
  }, [fixture.id]);

  const loadMatchData = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Get detailed team information
      const [homeTeamData, awayTeamData] = await Promise.all([
        supabase
          .from("teams")
          .select("*")
          .eq("id", fixture.home_team.id)
          .single(),
        supabase
          .from("teams")
          .select("*")
          .eq("id", fixture.away_team.id)
          .single(),
      ]);

      // Get team formations (primary formation for each team)
      const [homeFormationData, awayFormationData] = await Promise.all([
        supabase
          .from("team_formations")
          .select(
            `
            formations (
              id, name, display_name, formation_code, positions, 
              tactical_style, strengths, weaknesses
            )
          `,
          )
          .eq("team_id", fixture.home_team.id)
          .eq("preference_level", "primary")
          .single(),
        supabase
          .from("team_formations")
          .select(
            `
            formations (
              id, name, display_name, formation_code, positions, 
              tactical_style, strengths, weaknesses
            )
          `,
          )
          .eq("team_id", fixture.away_team.id)
          .eq("preference_level", "primary")
          .single(),
      ]);

      // Get players for both teams
      const [homePlayersData, awayPlayersData] = await Promise.all([
        supabase
          .from("players")
          .select("*")
          .eq("team_id", fixture.home_team.id)
          .order("position")
          .order("overall_rating", { ascending: false }),
        supabase
          .from("players")
          .select("*")
          .eq("team_id", fixture.away_team.id)
          .order("position")
          .order("overall_rating", { ascending: false }),
      ]);

      // Get recent form (last 5 matches for each team)
      const [homeFormData, awayFormData] = await Promise.all([
        supabase
          .from("finished_matches")
          .select("home_score, away_score, home_team_id, away_team_id")
          .or(
            `home_team_id.eq.${fixture.home_team.id},away_team_id.eq.${fixture.home_team.id}`,
          )
          .order("match_date", { ascending: false })
          .limit(5),
        supabase
          .from("finished_matches")
          .select("home_score, away_score, home_team_id, away_team_id")
          .or(
            `home_team_id.eq.${fixture.away_team.id},away_team_id.eq.${fixture.away_team.id}`,
          )
          .order("match_date", { ascending: false })
          .limit(5),
      ]);

      // Process form data
      const processForm = (formData: any, teamId: string) => {
        return (formData.data || []).map((match: any) => {
          const isHome = match.home_team_id === teamId;
          const teamScore = isHome ? match.home_score : match.away_score;
          const opponentScore = isHome ? match.away_score : match.home_score;

          if (teamScore > opponentScore) return "W";
          if (teamScore < opponentScore) return "L";
          return "D";
        });
      };

      const homeForm = processForm(homeFormData, fixture.home_team.id);
      const awayForm = processForm(awayFormData, fixture.away_team.id);

      setMatchData({
        fixture: {
          id: fixture.id,
          scheduled_at: fixture.scheduled_at,
          round: fixture.round,
          odds: fixture.odds,
        },
        home_team: homeTeamData.data || fixture.home_team,
        away_team: awayTeamData.data || fixture.away_team,
        home_players: homePlayersData.data || [],
        away_players: awayPlayersData.data || [],
        home_form: homeForm,
        away_form: awayForm,
        home_formation:
          (homeFormationData.data?.formations as unknown as Formation) || null,
        away_formation:
          (awayFormationData.data?.formations as unknown as Formation) || null,
        head_to_head: [], // Could add head-to-head data later
      });
    } catch (err) {
      console.error("Error loading match data:", err);
      setError("Failed to load match details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-green-500";
      case "L":
        return "bg-red-500";
      case "D":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading match details...</div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-400 mb-4">
            {error || "Failed to load match data"}
          </div>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
        </div>
      </div>
    );
  }

  const { date, time } = formatDateTime(matchData.fixture.scheduled_at);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Match Preview
            </h1>
            <div className="flex items-center justify-center space-x-4 text-slate-300">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{time}</span>
              </div>
              <Badge className="bg-blue-600">
                Tier {matchData.home_team.tier} • Round{" "}
                {matchData.fixture.round}
              </Badge>
            </div>
          </div>
        </div>

        {/* Match Header */}
        <Card className="mb-6 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex items-center space-x-4">
                <img
                  src={
                    matchData.home_team.tier === 1
                      ? matchData.home_team.logo_url
                      : matchData.home_team.crest_url ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${matchData.home_team.name}`
                  }
                  alt={matchData.home_team.name}
                  className="w-16 h-16 rounded"
                />
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {matchData.home_team.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span>
                      ELO: {Math.round(matchData.home_team.elo_rating || 1000)}
                    </span>
                    <div className="flex space-x-1">
                      {matchData.home_form.map((result, index) => (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* VS and Odds */}
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-400 mb-2">VS</div>
                {matchData.fixture.odds && (
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">
                      Betting Odds
                    </div>
                    <div className="flex space-x-2 text-sm">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">
                          {matchData.fixture.odds.home}
                        </div>
                        <div className="text-xs text-slate-400">Home</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">
                          {matchData.fixture.odds.draw}
                        </div>
                        <div className="text-xs text-slate-400">Draw</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">
                          {matchData.fixture.odds.away}
                        </div>
                        <div className="text-xs text-slate-400">Away</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-white">
                    {matchData.away_team.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-slate-400 justify-end">
                    <div className="flex space-x-1">
                      {matchData.away_form.map((result, index) => (
                        <div
                          key={index}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(result)}`}
                        >
                          {result}
                        </div>
                      ))}
                    </div>
                    <span>
                      ELO: {Math.round(matchData.away_team.elo_rating || 1000)}
                    </span>
                  </div>
                </div>
                <img
                  src={
                    matchData.away_team.tier === 1
                      ? matchData.away_team.logo_url
                      : matchData.away_team.crest_url ||
                        `https://api.dicebear.com/7.x/shapes/svg?seed=${matchData.away_team.name}`
                  }
                  alt={matchData.away_team.name}
                  className="w-16 h-16 rounded"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="field" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger
              value="field"
              className="data-[state=active]:bg-slate-700"
            >
              <Target className="w-4 h-4 mr-2" />
              Field View
            </TabsTrigger>
            <TabsTrigger
              value="tactics"
              className="data-[state=active]:bg-slate-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Tactics
            </TabsTrigger>
            <TabsTrigger
              value="squads"
              className="data-[state=active]:bg-slate-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Team Squads
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="data-[state=active]:bg-slate-700"
            >
              <Activity className="w-4 h-4 mr-2" />
              Team Stats
            </TabsTrigger>
          </TabsList>

          {/* Field View */}
          <TabsContent value="field">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Expected Lineups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SoccerField
                  homeTeam={matchData.home_team}
                  awayTeam={matchData.away_team}
                  homePlayers={matchData.home_players}
                  awayPlayers={matchData.away_players}
                  homeFormation={matchData.home_formation}
                  awayFormation={matchData.away_formation}
                />
                <div className="mt-4 text-center text-sm text-slate-400">
                  Hover over players to see their details • Formations:{" "}
                  {matchData.home_formation?.formation_code || "4-4-2"} vs{" "}
                  {matchData.away_formation?.formation_code || "4-4-2"}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tactical Analysis */}
          <TabsContent value="tactics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Home Team Tactics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {matchData.home_team.name} Tactics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matchData.home_formation ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {matchData.home_formation.display_name}
                        </h4>
                        <div className="flex items-center space-x-4 mb-3">
                          <Badge className="bg-green-600">
                            {matchData.home_formation.formation_code}
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            {matchData.home_formation.tactical_style.replace(
                              "_",
                              " ",
                            )}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">
                          Tactical formation setup for {matchData.home_formation.tactical_style.replace('_', ' ')} play
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-white font-semibold mb-2 flex items-center">
                            <Star className="w-4 h-4 mr-1 text-green-400" />
                            Strengths
                          </h5>
                          <div className="space-y-1">
                            {matchData.home_formation.strengths?.map(
                              (strength, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-green-300 bg-green-900/20 px-2 py-1 rounded"
                                >
                                  {strength.replace("_", " ")}
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-white font-semibold mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-1 text-red-400" />
                            Weaknesses
                          </h5>
                          <div className="space-y-1">
                            {matchData.home_formation.weaknesses?.map(
                              (weakness, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-red-300 bg-red-900/20 px-2 py-1 rounded"
                                >
                                  {weakness.replace("_", " ")}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      Formation data not available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Away Team Tactics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {matchData.away_team.name} Tactics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {matchData.away_formation ? (
                    <div className="space-y-4">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {matchData.away_formation.display_name}
                        </h4>
                        <div className="flex items-center space-x-4 mb-3">
                          <Badge className="bg-blue-600">
                            {matchData.away_formation.formation_code}
                          </Badge>
                          <Badge variant="outline" className="text-slate-300">
                            {matchData.away_formation.tactical_style.replace(
                              "_",
                              " ",
                            )}
                          </Badge>
                        </div>
                        <p className="text-slate-300 text-sm mb-3">
                          {matchData.away_formation.description ||
                            `Tactical formation setup for ${matchData.away_formation.tactical_style.replace('_', ' ')} play`}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-white font-semibold mb-2 flex items-center">
                            <Star className="w-4 h-4 mr-1 text-green-400" />
                            Strengths
                          </h5>
                          <div className="space-y-1">
                            {matchData.away_formation.strengths?.map(
                              (strength, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-green-300 bg-green-900/20 px-2 py-1 rounded"
                                >
                                  {strength.replace("_", " ")}
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        <div>
                          <h5 className="text-white font-semibold mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-1 text-red-400" />
                            Weaknesses
                          </h5>
                          <div className="space-y-1">
                            {matchData.away_formation.weaknesses?.map(
                              (weakness, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-red-300 bg-red-900/20 px-2 py-1 rounded"
                                >
                                  {weakness.replace("_", " ")}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      Formation data not available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tactical Matchup Analysis */}
            {matchData.home_formation && matchData.away_formation && (
              <Card className="bg-slate-800 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Tactical Matchup Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">
                        Formation Battle
                      </h4>
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {matchData.home_formation.formation_code}
                      </div>
                      <div className="text-slate-400 text-sm mb-2">vs</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {matchData.away_formation.formation_code}
                      </div>
                    </div>

                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">
                        Tactical Styles
                      </h4>
                      <div className="space-y-2">
                        <div className="bg-green-900/20 text-green-300 px-3 py-1 rounded text-sm">
                          {matchData.home_formation.tactical_style.replace(
                            "_",
                            " ",
                          )}
                        </div>
                        <div className="text-slate-400 text-xs">vs</div>
                        <div className="bg-blue-900/20 text-blue-300 px-3 py-1 rounded text-sm">
                          {matchData.away_formation.tactical_style.replace(
                            "_",
                            " ",
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <h4 className="text-white font-semibold mb-2">
                        Key Battle Areas
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-slate-300">Midfield Control</div>
                        <div className="text-slate-300">Wide Areas</div>
                        <div className="text-slate-300">Defensive Shape</div>
                        <div className="text-slate-300">Attacking Threat</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Team Squads */}
          <TabsContent value="squads">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Home Team Squad */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shirt className="w-5 h-5 mr-2" />
                    {matchData.home_team.name} Squad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Starting XI */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Starting XI
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {matchData.home_players.slice(0, 11).map((player) => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          teamColor={matchData.home_team.primary_color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Substitutes */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Substitutes (9)
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {matchData.home_players.slice(11, 20).map((player) => (
                        <div key={player.id} className="relative">
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
                            SUB
                          </div>
                          <PlayerCard
                            player={player}
                            teamColor={matchData.home_team.primary_color}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Away Team Squad */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shirt className="w-5 h-5 mr-2" />
                    {matchData.away_team.name} Squad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Starting XI */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Starting XI
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {matchData.away_players.slice(0, 11).map((player) => (
                        <PlayerCard
                          key={player.id}
                          player={player}
                          teamColor={matchData.away_team.primary_color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Substitutes */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Substitutes (9)
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {matchData.away_players.slice(11, 20).map((player) => (
                        <div key={player.id} className="relative">
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
                            SUB
                          </div>
                          <PlayerCard
                            player={player}
                            teamColor={matchData.away_team.primary_color}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Stats */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Home Team Stats */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    {matchData.home_team.name} Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Team ELO Rating</span>
                      <span className="text-white font-bold">
                        {Math.round(matchData.home_team.elo_rating || 1000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Squad Size</span>
                      <span className="text-white font-bold">
                        {matchData.home_players.length} (11 +{" "}
                        {Math.min(matchData.home_players.length - 11, 9)} subs)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Average Age</span>
                      <span className="text-white font-bold">
                        {Math.round(
                          matchData.home_players.reduce(
                            (sum, p) => sum + p.age,
                            0,
                          ) / matchData.home_players.length,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Recent Form</span>
                      <div className="flex space-x-1">
                        {matchData.home_form.map((result, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Away Team Stats */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    {matchData.away_team.name} Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Team ELO Rating</span>
                      <span className="text-white font-bold">
                        {Math.round(matchData.away_team.elo_rating || 1000)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Squad Size</span>
                      <span className="text-white font-bold">
                        {matchData.away_players.length} (11 +{" "}
                        {Math.min(matchData.away_players.length - 11, 9)} subs)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Average Age</span>
                      <span className="text-white font-bold">
                        {Math.round(
                          matchData.away_players.reduce(
                            (sum, p) => sum + p.age,
                            0,
                          ) / matchData.away_players.length,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Recent Form</span>
                      <div className="flex space-x-1">
                        {matchData.away_form.map((result, index) => (
                          <div
                            key={index}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${getFormColor(result)}`}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
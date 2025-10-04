'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, TrendingUp, Users, Clock, Target } from 'lucide-react';
import { matchOrchestrator } from '@/lib/match-orchestrator';

interface FinishedMatch {
  id: string;
  home_team: {
    id: string;
    name: string;
    tier: number;
    logo_url?: string;
    crest_url?: string;
  };
  away_team: {
    id: string;
    name: string;
    tier: number;
    logo_url?: string;
    crest_url?: string;
  };
  home_score: number;
  away_score: number;
  match_date: string;
  season_number: number;
  tier: number;
  home_possession: number;
  away_possession: number;
  home_shots: number;
  away_shots: number;
  simulation_duration: number;
}

interface SeasonStats {
  currentSeason: number;
  remainingFixtures: number;
  completedMatches: number;
  liveMatches: number;
}

export default function FinishedMatchesDisplay() {
  const [finishedMatches, setFinishedMatches] = useState<FinishedMatch[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedTier, selectedSeason]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load season stats
      const statsResult = await matchOrchestrator.getCurrentSeasonStats();
      if (statsResult.success) {
        setSeasonStats(statsResult as SeasonStats);
        if (!selectedSeason) {
          setSelectedSeason(statsResult.currentSeason);
        }
      }

      // Load finished matches
      const matchesResult = await matchOrchestrator.getFinishedMatches(
        selectedSeason || undefined,
        selectedTier || undefined,
        100
      );
      
      if (matchesResult.success) {
        setFinishedMatches(matchesResult.matches as FinishedMatch[]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (match: FinishedMatch, teamId: string) => {
    const isHome = match.home_team.id === teamId;
    const teamScore = isHome ? match.home_score : match.away_score;
    const opponentScore = isHome ? match.away_score : match.home_score;
    
    if (teamScore > opponentScore) {
      return <Badge className="bg-green-500">W</Badge>;
    } else if (teamScore < opponentScore) {
      return <Badge className="bg-red-500">L</Badge>;
    } else {
      return <Badge className="bg-yellow-500 text-black">D</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Results & Season Progress</h1>
          <p className="text-gray-600">Track completed matches and season statistics across all tiers</p>
        </div>

        {/* Season Stats Cards */}
        {seasonStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Season</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Season {seasonStats.currentSeason}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Matches</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{seasonStats.completedMatches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Fixtures</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{seasonStats.remainingFixtures}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{seasonStats.liveMatches}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={selectedTier === null ? "default" : "outline"}
              onClick={() => setSelectedTier(null)}
              size="sm"
            >
              All Tiers
            </Button>
            {[1, 2, 3, 4, 5].map((tier) => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                onClick={() => setSelectedTier(tier)}
                size="sm"
              >
                Tier {tier}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2">
            {seasonStats && [...Array(seasonStats.currentSeason)].map((_, i) => {
              const season = i + 1;
              return (
                <Button
                  key={season}
                  variant={selectedSeason === season ? "default" : "outline"}
                  onClick={() => setSelectedSeason(season)}
                  size="sm"
                >
                  Season {season}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Finished Matches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Finished Matches
              {selectedTier && ` - Tier ${selectedTier}`}
              {selectedSeason && ` - Season ${selectedSeason}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {finishedMatches.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No finished matches found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Matches will appear here after 3D simulations complete
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {finishedMatches.map((match) => (
                  <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 min-w-[100px]">
                          {new Date(match.match_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <img 
                              src={match.home_team.tier === 1 ? match.home_team.logo_url : match.home_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.home_team.name}`}
                              alt={match.home_team.name}
                              className="w-6 h-6 rounded"
                            />
                            <span className="font-medium">{match.home_team.name}</span>
                          </div>
                          
                          <div className="text-xl font-bold px-4">
                            {match.home_score} - {match.away_score}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{match.away_team.name}</span>
                            <img 
                              src={match.away_team.tier === 1 ? match.away_team.logo_url : match.away_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.away_team.name}`}
                              alt={match.away_team.name}
                              className="w-6 h-6 rounded"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Tier {match.tier}</Badge>
                          <Badge variant="outline">Season {match.season_number}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {match.simulation_duration ? formatDuration(match.simulation_duration) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Match Stats */}
                    <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Possession:</span> {match.home_possession}% - {match.away_possession}%
                      </div>
                      <div>
                        <span className="font-medium">Shots:</span> {match.home_shots} - {match.away_shots}
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          3D Simulated
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
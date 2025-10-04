'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Fixture {
  id: string;
  home_team: {
    id: string;
    name: string;
    tier: number;
    logo_url?: string;
    crest_url?: string;
    elo_rating?: number;
  };
  away_team: {
    id: string;
    name: string;
    tier: number;
    logo_url?: string;
    crest_url?: string;
    elo_rating?: number;
  };
  scheduled_at: string;
  status: string;
  round?: number;
  odds?: {
    home: number;
    away: number;
    draw: number;
  };
}

interface MatchCardProps {
  fixture: Fixture;
  onSelect: (fixture: Fixture) => void;
  isLive?: boolean;
}

function MatchCard({ fixture, onSelect, isLive = false }: MatchCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Safety check for null teams
  if (!fixture.home_team || !fixture.away_team) {
    return null;
  }

  return (
    <Card className={`hover:shadow-lg transition-all cursor-pointer ${
      isLive ? 'ring-2 ring-red-500 bg-red-50' : 'hover:bg-gray-50'
    }`} onClick={() => onSelect(fixture)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge className={`${
            isLive ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}>
            {isLive ? 'LIVE' : 'SCHEDULED'}
          </Badge>
          <div className="text-sm text-gray-500">
            Tier {fixture.home_team?.tier || 'N/A'}
            {fixture.round && ` • Round ${fixture.round}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={fixture.home_team.tier === 1 ? fixture.home_team.logo_url : fixture.home_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${fixture.home_team.name}`}
              alt={fixture.home_team.name}
              className="w-8 h-8 rounded"
            />
            <span className="font-semibold text-sm">{fixture.home_team.name}</span>
          </div>
          <div className="text-lg font-bold text-gray-400">VS</div>
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-sm">{fixture.away_team.name}</span>
            <img 
              src={fixture.away_team.tier === 1 ? fixture.away_team.logo_url : fixture.away_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${fixture.away_team.name}`}
              alt={fixture.away_team.name}
              className="w-8 h-8 rounded"
            />
          </div>
        </div>
        
        {/* Betting Odds Section */}
        {fixture.odds && !isLive && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700">BETTING ODDS</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded px-2 py-1 border">
                <div className="text-xs text-gray-500">Home</div>
                <div className="font-bold text-sm text-green-600">{fixture.odds.home}</div>
              </div>
              <div className="bg-white rounded px-2 py-1 border">
                <div className="text-xs text-gray-500">Draw</div>
                <div className="font-bold text-sm text-gray-600">{fixture.odds.draw}</div>
              </div>
              <div className="bg-white rounded px-2 py-1 border">
                <div className="text-xs text-gray-500">Away</div>
                <div className="font-bold text-sm text-blue-600">{fixture.odds.away}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(fixture.scheduled_at)} {formatTime(fixture.scheduled_at)}</span>
          </div>
          {/* Show ELO ratings if available */}
          {fixture.home_team.elo_rating && fixture.away_team.elo_rating && (
            <div className="text-xs text-gray-500">
              ELO: {Math.round(fixture.home_team.elo_rating)} vs {Math.round(fixture.away_team.elo_rating)}
            </div>
          )}
        </div>
        
        {isLive && (
          <Button className="w-full" variant="default">
            <Play className="w-4 h-4 mr-2" />
            Watch Live
          </Button>
        )}
        
        {!isLive && (
          <Button className="w-full" variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Calculate betting odds based on ELO ratings
function calculateOdds(homeElo: number, awayElo: number): { home: number; away: number; draw: number } {
  // ELO difference calculation
  const eloDiff = homeElo - awayElo;
  
  // Convert ELO difference to win probability using standard ELO formula
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const awayWinProb = 1 - homeWinProb;
  
  // Adjust for draw probability (typically 25-30% in football)
  const drawProb = 0.27; // 27% draw probability
  const adjustedHomeWinProb = homeWinProb * (1 - drawProb);
  const adjustedAwayWinProb = awayWinProb * (1 - drawProb);
  
  // Convert probabilities to decimal odds (with bookmaker margin)
  const margin = 0.05; // 5% bookmaker margin
  const homeOdds = (1 / adjustedHomeWinProb) * (1 + margin);
  const awayOdds = (1 / adjustedAwayWinProb) * (1 + margin);
  const drawOdds = (1 / drawProb) * (1 + margin);
  
  return {
    home: Math.round(homeOdds * 100) / 100, // Round to 2 decimal places
    away: Math.round(awayOdds * 100) / 100,
    draw: Math.round(drawOdds * 100) / 100
  };
}

interface MatchSelectionProps {
  onMatchSelect: (fixture: any) => void;
}

export default function MatchSelection({ onMatchSelect }: MatchSelectionProps) {
  const [liveMatches, setLiveMatches] = useState<Fixture[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Get all live matches with ELO ratings
      const { data: liveData } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, tier, logo_url, crest_url, elo_rating),
          away_team:teams!fixtures_away_team_id_fkey(id, name, tier, logo_url, crest_url, elo_rating)
        `)
        .eq('status', 'live')
        .order('scheduled_at', { ascending: true });

      // Get the next 20 upcoming matches with ELO ratings
      const { data: upcomingData } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, tier, logo_url, crest_url, elo_rating),
          away_team:teams!fixtures_away_team_id_fkey(id, name, tier, logo_url, crest_url, elo_rating)
        `)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(20);

      // Filter out fixtures with null teams and calculate odds
      const validLiveMatches = (liveData || []).filter(fixture => 
        fixture.home_team && fixture.away_team
      );
      
      const validUpcomingMatches = (upcomingData || [])
        .filter(fixture => fixture.home_team && fixture.away_team)
        .map(fixture => {
          // Calculate odds if both teams have ELO ratings
          if (fixture.home_team.elo_rating && fixture.away_team.elo_rating) {
            const odds = calculateOdds(fixture.home_team.elo_rating, fixture.away_team.elo_rating);
            return { ...fixture, odds };
          }
          return fixture;
        });

      setLiveMatches(validLiveMatches);
      setUpcomingMatches(validUpcomingMatches);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setIsLoading(false);
    }
  };

  const handleMatchSelect = (fixture: Fixture) => {
    onMatchSelect(fixture);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">3D Football Matches</h1>
          <p className="text-slate-300">Watch live matches and upcoming fixtures in stunning 3D</p>
        </div>

        {/* Live Matches Section */}
        {liveMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Live Matches ({liveMatches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((fixture) => (
                <MatchCard
                  key={fixture.id}
                  fixture={fixture}
                  onSelect={handleMatchSelect}
                  isLive={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* No Live Matches */}
        {liveMatches.length === 0 && (
          <div className="mb-8">
            <Card className="max-w-md mx-auto bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-slate-400 mb-4">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No Live Matches</p>
                  <p className="text-sm">Check the upcoming matches below</p>
                </div>
                <Button onClick={loadMatches} variant="outline">
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Matches Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Upcoming Matches ({upcomingMatches.length})
            <span className="text-sm font-normal text-slate-400">
              (Next 20 fixtures with live odds)
            </span>
          </h2>
          
          {upcomingMatches.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No Upcoming Matches</p>
                  <p className="text-sm">Fixtures may be loading or need to be generated</p>
                </div>
                <Button onClick={loadMatches} variant="outline" className="mt-4">
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {upcomingMatches.slice(0, 12).map((fixture, index) => (
                <div key={fixture.id} className="relative">
                  <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    #{index + 1}
                  </div>
                  <MatchCard
                    fixture={fixture}
                    onSelect={handleMatchSelect}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Match Statistics */}
        <div className="mt-8 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Match Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-400">{liveMatches.length}</div>
              <div className="text-xs text-slate-400">Live Matches</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{upcomingMatches.length}</div>
              <div className="text-xs text-slate-400">Scheduled</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">
                {upcomingMatches.filter(f => f.odds).length}
              </div>
              <div className="text-xs text-slate-400">With Odds</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-400">
                {new Set([...liveMatches, ...upcomingMatches].map(f => f.home_team?.tier)).size}
              </div>
              <div className="text-xs text-slate-400">Active Tiers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Trophy, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Fixture {
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
  scheduled_at: string;
  status: string;
  sequence_order?: number;
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
            Tier {fixture.home_team.tier}
            {fixture.sequence_order && ` • #${fixture.sequence_order}`}
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
        
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(fixture.scheduled_at)} {formatTime(fixture.scheduled_at)}</span>
          </div>
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

interface MatchSelectionProps {
  onMatchSelect: (fixture: any) => void;
}

export default function MatchSelection({ onMatchSelect }: MatchSelectionProps) {
  const [liveMatch, setLiveMatch] = useState<Fixture | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Fixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Get the current live match
      const { data: liveData } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, tier, logo_url, crest_url),
          away_team:teams!fixtures_away_team_id_fkey(id, name, tier, logo_url, crest_url)
        `)
        .eq('status', 'live')
        .order('sequence_order', { ascending: true })
        .limit(1);

      // Get the next 5 upcoming matches in sequence order
      const { data: upcomingData } = await supabase
        .from('fixtures')
        .select(`
          *,
          home_team:teams!fixtures_home_team_id_fkey(id, name, tier, logo_url, crest_url),
          away_team:teams!fixtures_away_team_id_fkey(id, name, tier, logo_url, crest_url)
        `)
        .eq('status', 'scheduled')
        .not('sequence_order', 'is', null)
        .order('sequence_order', { ascending: true })
        .limit(5);

      setLiveMatch(liveData?.[0] || null);
      setUpcomingMatches(upcomingData || []);
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

        {/* Live Match Section */}
        {liveMatch && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Live Match
            </h2>
            <div className="max-w-md mx-auto">
              <MatchCard
                fixture={liveMatch}
                onSelect={handleMatchSelect}
                isLive={true}
              />
            </div>
          </div>
        )}

        {/* No Live Match */}
        {!liveMatch && (
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
            Next 5 Matches
            <span className="text-sm font-normal text-slate-400">
              (Tier Rotation: T1 → T2 → T3 → T4 → T5)
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {upcomingMatches.map((fixture, index) => (
                <div key={fixture.id} className="relative">
                  <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    Next {index + 1}
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

        {/* Tier Rotation Info */}
        <div className="mt-8 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Match Rotation System</h3>
          <div className="grid grid-cols-5 gap-4 text-center">
            {[1, 2, 3, 4, 5].map((tier) => (
              <div key={tier} className="bg-slate-700 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">T{tier}</div>
                <div className="text-xs text-slate-400">Tier {tier}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-4 text-center">
            Matches rotate through tiers: one match from Tier 1, then Tier 2, then Tier 3, then Tier 4, then Tier 5, then back to Tier 1
          </p>
        </div>
      </div>
    </div>
  );
}
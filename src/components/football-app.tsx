'use client';

import { useState, useEffect } from 'react';
import MatchSelection from './match-selection';
import MatchViewer3D from './match-viewer-3d';
import AutomatedFootballApp from './automated-football-app';
import TeamDetails from './team-details';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from 'lucide-react';

export default function FootballApp() {
  const [currentView, setCurrentView] = useState<'overview' | 'matches' | 'viewer' | 'team'>('overview');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    setCurrentView('viewer');
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setCurrentView('team');
  };

  const handleBackToMatches = () => {
    setCurrentView('matches');
    setSelectedMatch(null);
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedMatch(null);
    setSelectedTeamId(null);
  };

  if (currentView === 'viewer' && selectedMatch) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-4">
          <Button 
            onClick={handleBackToMatches}
            variant="outline"
            className="mb-4"
          >
            ← Back to Matches
          </Button>
        </div>
        <MatchViewer3D fixtureId={selectedMatch.id} />
      </div>
    );
  }

  if (currentView === 'team' && selectedTeamId) {
    return (
      <TeamDetails 
        teamId={selectedTeamId} 
        onBack={handleBackToOverview}
      />
    );
  }

  if (currentView === 'matches') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="p-6">
          <Button 
            onClick={handleBackToOverview}
            variant="outline"
            className="mb-6"
          >
            ← Back to Overview
          </Button>
          <MatchSelection onMatchSelect={handleMatchSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              ⚽ 3D Football Universe
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Watch live 3D matches from an autonomous football ecosystem
            </p>
          </div>

          {/* Navigation Card - Only 3D Match Viewer */}
          <div className="flex justify-center mb-12">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow max-w-md bg-white/10 border-white/20" onClick={() => setCurrentView('matches')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 justify-center text-white">
                  <span className="text-2xl">🎮</span>
                  3D Match Viewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4 text-center">
                  Experience live football matches in stunning 3D with broadcast-style camera views and real-time action.
                </p>
                <Button className="w-full">
                  Watch Matches
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Embedded Overview with clickable teams */}
          <Tabs defaultValue="ecosystem" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ecosystem">Live Ecosystem</TabsTrigger>
              <TabsTrigger value="fixtures">Upcoming Fixtures</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ecosystem" className="mt-6">
              <AutomatedFootballApp onTeamSelect={handleTeamSelect} />
            </TabsContent>

            <TabsContent value="fixtures" className="mt-6">
              <UpcomingFixtures onTeamSelect={handleTeamSelect} />
            </TabsContent>
            
            <TabsContent value="features" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">⚽</span>
                      3D Match Simulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Broadcast-style 3D camera views</li>
                      <li>• Real-time player movement</li>
                      <li>• Physics-based ball mechanics</li>
                      <li>• Stadium atmosphere & crowds</li>
                      <li>• Live commentary & events</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      Complete League System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 100 teams across 5 tiers</li>
                      <li>• Automatic promotion/relegation</li>
                      <li>• Cup competitions</li>
                      <li>• ELO-based team ratings</li>
                      <li>• Season progression</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      Realistic Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Wealth-based team tiers</li>
                      <li>• Dynamic transfer market</li>
                      <li>• Player wages & contracts</li>
                      <li>• Youth academy systems</li>
                      <li>• Financial constraints</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">👥</span>
                      Living Player System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 2,300+ unique players</li>
                      <li>• Age progression & retirement</li>
                      <li>• Injury & recovery system</li>
                      <li>• Form & performance tracking</li>
                      <li>• Career development</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">🔄</span>
                      Autonomous Operation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Fully automated ecosystem</li>
                      <li>• No admin intervention needed</li>
                      <li>• Continuous match simulation</li>
                      <li>• Real-time data streaming</li>
                      <li>• 24/7 operation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      Advanced Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Live match statistics</li>
                      <li>• Transfer market analysis</li>
                      <li>• Team performance metrics</li>
                      <li>• Player development tracking</li>
                      <li>• Historical data</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// New component for upcoming fixtures
function UpcomingFixtures({ onTeamSelect }: { onTeamSelect?: (teamId: string) => void }) {
  const [upcomingFixtures, setUpcomingFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(1);

  useEffect(() => {
    const fetchUpcomingFixtures = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        
        const { data: fixturesData } = await supabase
          .from('fixtures')
          .select(`
            *,
            home_team:teams!fixtures_home_team_id_fkey(id, name, tier, primary_color, logo_url, crest_url),
            away_team:teams!fixtures_away_team_id_fkey(id, name, tier, primary_color, logo_url, crest_url)
          `)
          .in('status', ['scheduled'])
          .order('scheduled_at', { ascending: true })
          .limit(50);

        setUpcomingFixtures(fixturesData || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
        setLoading(false);
      }
    };

    fetchUpcomingFixtures();
  }, []);

  const filteredFixtures = upcomingFixtures.filter(fixture => 
    fixture.home_team?.tier === selectedTier || fixture.away_team?.tier === selectedTier
  );

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-400" />
          Upcoming Fixtures
        </h3>
        
        {/* Tier Filter */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((tier) => (
            <button
              key={tier}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedTier === tier
                  ? 'glass-primary text-white'
                  : 'glass-button text-slate-300 hover:text-white'
              }`}
              onClick={() => setSelectedTier(tier)}
            >
              Tier {tier}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredFixtures.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No upcoming fixtures for Tier {selectedTier}</p>
            <p className="text-sm text-slate-500 mt-2">Check other tiers or try again later</p>
          </div>
        ) : (
          filteredFixtures.slice(0, 10).map((fixture) => (
            <div key={fixture.id} className="glass-row p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-400 min-w-[100px]">
                    {new Date(fixture.scheduled_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => onTeamSelect?.(fixture.home_team.id)}
                    >
                      <img 
                        src={fixture.home_team.tier === 1 ? fixture.home_team.logo_url : fixture.home_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${fixture.home_team.name}`}
                        alt={fixture.home_team.name}
                        className="w-8 h-8 rounded"
                      />
                      <span className="font-medium text-white">{fixture.home_team.name}</span>
                    </div>
                    <span className="text-slate-400">vs</span>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => onTeamSelect?.(fixture.away_team.id)}
                    >
                      <img 
                        src={fixture.away_team.tier === 1 ? fixture.away_team.logo_url : fixture.away_team.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${fixture.away_team.name}`}
                        alt={fixture.away_team.name}
                        className="w-8 h-8 rounded"
                      />
                      <span className="font-medium text-white">{fixture.away_team.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    Tier {fixture.home_team.tier}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fixture.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
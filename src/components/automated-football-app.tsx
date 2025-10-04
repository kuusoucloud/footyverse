'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const supabase = createClient();

interface AutomatedFootballAppProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function AutomatedFootballApp({ onTeamSelect }: AutomatedFootballAppProps = {}) {
  const [stats, setStats] = useState<any>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState<any>({});
  const [standings, setStandings] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState(1);
  const [isConnected, setIsConnected] = useState(false);

  // Server-side heartbeat to trigger orchestration
  useEffect(() => {
    const triggerServerOrchestration = async () => {
      try {
        // Update heartbeat to trigger server-side orchestration
        await supabase
          .from('orchestration_heartbeat')
          .update({ last_beat: new Date().toISOString() })
          .eq('id', 1);
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    };

    // Trigger immediately
    triggerServerOrchestration();
    
    // Then trigger every 30 seconds to maintain server-side orchestration
    const interval = setInterval(triggerServerOrchestration, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data periodically - this is just for display
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get basic stats and standings using existing schema
        const [teamsRes, playersRes, fixturesRes, standingsRes] = await Promise.all([
          supabase.from('teams').select('id'),
          supabase.from('players').select('id'),
          supabase.from('fixtures').select('*').eq('status', 'live').limit(10),
          supabase.from('team_standings').select(`
            *,
            team:teams(name, tier, elo, primary_color, secondary_color)
          `).order('points', { ascending: false }).limit(100)
        ]);

        setStats({
          teams: teamsRes.data?.length || 0,
          players: playersRes.data?.length || 0,
          liveMatches: fixturesRes.data?.length || 0
        });

        setLiveMatches(fixturesRes.data || []);
        setStandings(standingsRes.data || []);
        setIsConnected(true);

      } catch (error) {
        console.error('Error fetching data:', error);
        setIsConnected(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds for real-time feel

    return () => clearInterval(interval);
  }, [selectedTier]);

  // Subscribe to real-time updates for immediate changes
  useEffect(() => {
    const fixturesChannel = supabase
      .channel('live-fixtures')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'fixtures' },
        () => {
          // Refresh data when fixtures change
          window.location.reload();
        }
      )
      .subscribe();

    const standingsChannel = supabase
      .channel('team-standings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_standings' },
        () => {
          // Refresh data when standings change
          setTimeout(() => window.location.reload(), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(fixturesChannel);
      supabase.removeChannel(standingsChannel);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `£${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `£${(amount / 1000).toFixed(0)}K`;
    }
    return `£${amount}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPositionIcon = (position: number) => {
    if (position <= 3) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (position <= 6) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (position >= standings.length - 2) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Target className="w-4 h-4 text-gray-400" />;
  };

  const getWealthColor = (category: string) => {
    switch (category) {
      case 'mega_rich': return 'bg-purple-100 text-purple-800';
      case 'rich': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'very_poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              ⚽ Autonomous Football Universe
            </h1>
            <p className="text-gray-600">
              Server-driven football ecosystem - same state for all clients worldwide!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${orchestrationStatus.is_running ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-medium">
                Server {orchestrationStatus.is_running ? 'Processing' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teams}</div>
              <p className="text-xs text-muted-foreground">Across 5 tiers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.players}</div>
              <p className="text-xs text-muted-foreground">Active players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.liveMatches}</div>
              <p className="text-xs text-muted-foreground">Currently playing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Runs</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{orchestrationStatus.run_count || 0}</div>
              <p className="text-xs text-muted-foreground">
                {orchestrationStatus.last_run ? formatTimeAgo(orchestrationStatus.last_run) : 'Never'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">League Standings</TabsTrigger>
            <TabsTrigger value="matches">Live Matches</TabsTrigger>
            <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standings" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Season Standings
                  </CardTitle>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <Button
                        key={tier}
                        variant={selectedTier === tier ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTier(tier)}
                      >
                        Tier {tier}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {standings.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-1">Pos</div>
                      <div className="col-span-4">Team</div>
                      <div className="col-span-1">MP</div>
                      <div className="col-span-1">W</div>
                      <div className="col-span-1">D</div>
                      <div className="col-span-1">L</div>
                      <div className="col-span-1">GD</div>
                      <div className="col-span-1">Pts</div>
                      <div className="col-span-1">ELO</div>
                    </div>
                    {standings.filter(s => s.team?.tier === selectedTier).map((standing, index) => (
                      <div 
                        key={standing.id} 
                        className={`grid grid-cols-12 gap-2 items-center py-2 rounded transition-colors ${
                          onTeamSelect ? 'hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onTeamSelect && onTeamSelect(standing.team_id)}
                      >
                        <div className="col-span-1 flex items-center gap-1">
                          <span className="font-medium">{index + 1}</span>
                          {getPositionIcon(index + 1)}
                        </div>
                        <div className="col-span-4">
                          <div className="flex items-center gap-2">
                            {standing.team?.logo_url ? (
                              <img 
                                src={standing.team.logo_url} 
                                alt={`${standing.team.name} logo`}
                                className="w-8 h-8 rounded border-2 border-white shadow-md bg-white p-1"
                                onError={(e) => {
                                  // Fallback to initials if logo fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-8 h-8 rounded border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white"
                              style={{ 
                                backgroundColor: standing.team?.primary_color,
                                display: standing.team?.logo_url ? 'none' : 'flex'
                              }}
                            >
                              {standing.team?.name.split(' ').map((word: string) => word[0]).join('').slice(0, 2)}
                            </div>
                            <span className={`font-medium ${onTeamSelect ? 'text-blue-600 hover:text-blue-800' : ''}`}>
                              {standing.team?.name}
                            </span>
                            {onTeamSelect && (
                              <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to view →
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-1 text-sm">{standing.played}</div>
                        <div className="col-span-1 text-sm text-green-600">{standing.won}</div>
                        <div className="col-span-1 text-sm text-yellow-600">{standing.drawn}</div>
                        <div className="col-span-1 text-sm text-red-600">{standing.lost}</div>
                        <div className="col-span-1 text-sm">
                          <span className={standing.gd >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {standing.gd >= 0 ? '+' : ''}{standing.gd}
                          </span>
                        </div>
                        <div className="col-span-1 text-sm font-bold">{standing.points}</div>
                        <div className="col-span-1 text-xs text-gray-600">
                          {Math.round(standing.team?.elo || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No standings data yet</p>
                    <p className="text-sm">Matches need to be completed to generate standings</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matches" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Live Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveMatches.length > 0 ? (
                  <div className="space-y-4">
                    {liveMatches.map((fixture) => (
                      <div key={fixture.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                          <div>
                            <p className="font-semibold">Match ID: {fixture.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">
                              Status: {fixture.status} • Round {fixture.round}
                            </p>
                          </div>
                        </div>
                        <Clock className="w-4 h-4 text-red-600" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No live matches at the moment</p>
                    <p className="text-sm">Server will start matches automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transfers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransfers.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransfers.slice(0, 10).map((transfer) => (
                      <div key={transfer.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{transfer.player?.name}</p>
                          <p className="text-sm text-gray-600">
                            {transfer.from_team?.name} → {transfer.to_team?.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(transfer.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(transfer.transfer_fee)}</p>
                          <p className="text-xs text-gray-500">{transfer.player?.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No recent transfers</p>
                    <p className="text-sm">Server handles transfers automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🖥️ Server-Side Autonomous System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">⚽ Match Simulation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Server-driven match simulation</li>
                  <li>• Automatic fixture generation</li>
                  <li>• Synchronized across all clients</li>
                  <li>• Consistent league progression</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">💰 Transfer System</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Server-controlled transfers</li>
                  <li>• Global market consistency</li>
                  <li>• Same prices for all clients</li>
                  <li>• Synchronized player movements</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📈 Season Progression</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Universal player aging</li>
                  <li>• Synchronized injuries</li>
                  <li>• Global contract system</li>
                  <li>• Consistent promotions</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🌍 Global Synchronization</h4>
              <p className="text-sm text-blue-700">
                The entire football ecosystem runs on the server. Every client worldwide sees the exact same matches, 
                scores, transfers, and season progression - whether they join at the start or halfway through the season!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
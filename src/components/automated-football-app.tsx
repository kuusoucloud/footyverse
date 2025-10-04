'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Calendar,
  AlertCircle,
  Crown,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AutomatedFootballAppProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function AutomatedFootballApp({ onTeamSelect }: { onTeamSelect?: (teamId: string) => void }) {
  const [stats, setStats] = useState<any>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState<any>({});
  const [standings, setStandings] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [seasonProgress, setSeasonProgress] = useState<any[]>([]);
  const [globalSeason, setGlobalSeason] = useState<any>(null);
  const [activeInjuries, setActiveInjuries] = useState<any[]>([]);

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
        // Get basic stats, standings, season progression, and global season info
        const [teamsRes, playersRes, fixturesRes, standingsRes, transfersRes, seasonRes, globalSeasonRes, injuriesRes] = await Promise.all([
          supabase.from('teams').select('id'),
          supabase.from('players').select('id, injury_status'),
          supabase.from('fixtures').select(`
            *,
            home_team:home_team_id(name, logo_url, primary_color),
            away_team:away_team_id(name, logo_url, primary_color)
          `).eq('status', 'live').limit(10),
          supabase.from('team_standings').select(`
            *,
            team:teams(name, tier, elo, primary_color, secondary_color, logo_url)
          `).order('points', { ascending: false }).limit(100),
          supabase.from('transfers').select(`
            *,
            player:players(name, position, age, overall_rating),
            from_team:from_team_id(name, logo_url, primary_color),
            to_team:to_team_id(name, logo_url, primary_color)
          `).order('created_at', { ascending: false }).limit(20),
          supabase.from('season_progression').select('*').eq('season_status', 'active').order('tier'),
          supabase.from('global_season_status').select('*').eq('season_status', 'active').single(),
          supabase.from('player_injuries').select(`
            id, 
            severity, 
            recovery_weeks_needed,
            recovery_weeks_completed,
            player:players(name, team:teams(name))
          `).eq('is_active', true).limit(50)
        ]);

        const playerStats = {
          total: playersRes.data?.length || 0,
          fit: playersRes.data?.filter(p => p.injury_status === 'fit').length || 0,
          injured: playersRes.data?.filter(p => p.injury_status === 'injured').length || 0,
          retired: playersRes.data?.filter(p => p.injury_status === 'retired').length || 0
        };

        setStats({
          totalTeams: teamsRes.data?.length || 0,
          totalTiers: 5,
          totalPlayers: playerStats.total,
          fitPlayers: playerStats.fit,
          injuredPlayers: playerStats.injured,
          retiredPlayers: playerStats.retired,
          liveMatches: fixturesRes.data?.length || 0
        });

        setLiveMatches(fixturesRes.data || []);
        setStandings(standingsRes.data || []);
        setRecentTransfers(transfersRes.data || []);
        setSeasonProgress(seasonRes.data || []);
        setGlobalSeason(globalSeasonRes.data || null);
        setActiveInjuries(injuriesRes.data || []);
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-blue-600">⚽</span>
              Autonomous Football Universe
            </h1>
            <p className="text-gray-600 mt-2">
              Server-driven football ecosystem - same state for all clients worldwide!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">Server Active</span>
            </div>
          </div>
        </div>

        {/* Stats Overview - Single instance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.totalTiers} tiers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Fit:</span>
                  <span>{stats.fitPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Injured:</span>
                  <span>{stats.injuredPlayers}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.liveMatches}</div>
              <p className="text-xs text-muted-foreground">
                Currently playing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Global Season</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalSeason?.season_number || 1}</div>
              <p className="text-xs text-muted-foreground">
                {globalSeason?.tiers_completed || 0}/{globalSeason?.total_tiers || 5} tiers complete
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Global Season Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Global Season {globalSeason?.season_number || 1} Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Season Status:</span>
                <Badge variant={globalSeason?.season_status === 'active' ? 'default' : 'secondary'}>
                  {globalSeason?.season_status?.toUpperCase() || 'ACTIVE'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Tiers Completed:</span>
                <span>{globalSeason?.tiers_completed || 0}/{globalSeason?.total_tiers || 5}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="matches">Live Matches</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="seasons">Seasons</TabsTrigger>
            <TabsTrigger value="injuries">Injuries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Autonomous Football Universe */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    Autonomous Football Universe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((tier) => (
                        <Button
                          key={tier}
                          variant={selectedTier === tier ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTier(tier)}
                          className="flex-1"
                        >
                          Tier {tier}
                        </Button>
                      ))}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Server-driven match simulation</li>
                      <li>• Automatic fixture generation</li>
                      <li>• Synchronized across all clients</li>
                      <li>• Consistent league progression</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    Transfer System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Server-controlled transfers</li>
                    <li>• Global market consistency</li>
                    <li>• Same prices for all clients</li>
                    <li>• Synchronized player movements</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6" />
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🌍 Global Synchronization</h4>
              <p className="text-sm text-blue-700">
                All match results, transfers, and league standings are synchronized server-side. 
                Every client sees the exact same football universe state in real-time.
              </p>
            </div>
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
                      <div key={fixture.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                          <div className="text-sm text-gray-600">
                            Round {fixture.round} • {fixture.minute || 0}'
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          {/* Home Team */}
                          <div className="flex items-center gap-3 flex-1">
                            {fixture.home_team?.logo_url ? (
                              <img 
                                src={fixture.home_team.logo_url} 
                                alt={`${fixture.home_team.name} logo`}
                                className="w-10 h-10 rounded border-2 border-white shadow-md bg-white p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded border-2 border-white shadow-md flex items-center justify-center text-sm font-bold text-white"
                              style={{ 
                                backgroundColor: fixture.home_team?.primary_color || '#3B82F6',
                                display: fixture.home_team?.logo_url ? 'none' : 'flex'
                              }}
                            >
                              {fixture.home_team?.name?.split(' ').map((word: string) => word[0]).join('').slice(0, 2) || 'HT'}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{fixture.home_team?.name || 'Home Team'}</p>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="mx-6 text-center">
                            <div className="text-2xl font-bold text-gray-800">
                              {fixture.home_score || 0} - {fixture.away_score || 0}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {fixture.minute ? `${fixture.minute}'` : "0'"}
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <div className="flex-1 text-right">
                              <p className="font-semibold text-gray-800">{fixture.away_team?.name || 'Away Team'}</p>
                            </div>
                            {fixture.away_team?.logo_url ? (
                              <img 
                                src={fixture.away_team.logo_url} 
                                alt={`${fixture.away_team.name} logo`}
                                className="w-10 h-10 rounded border-2 border-white shadow-md bg-white p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded border-2 border-white shadow-md flex items-center justify-center text-sm font-bold text-white"
                              style={{ 
                                backgroundColor: fixture.away_team?.primary_color || '#EF4444',
                                display: fixture.away_team?.logo_url ? 'none' : 'flex'
                              }}
                            >
                              {fixture.away_team?.name?.split(' ').map((word: string) => word[0]).join('').slice(0, 2) || 'AT'}
                            </div>
                          </div>
                        </div>

                        {/* Match Events or Additional Info */}
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-red-600" />
                              <span>Match in progress</span>
                            </div>
                            <div className="text-xs">
                              Match ID: {fixture.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
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
                      <div key={transfer.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          {/* Player Info */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-gray-600">
                                {transfer.player?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'P'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{transfer.player?.name || 'Unknown Player'}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{transfer.player?.position || 'Unknown'}</span>
                                <span>•</span>
                                <span>{transfer.player?.age || 'N/A'} years</span>
                                <span>•</span>
                                <span>Rating: {transfer.player?.overall_rating || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Transfer Direction */}
                          <div className="flex items-center gap-4 flex-1 justify-center">
                            {/* From Team */}
                            <div className="flex items-center gap-2">
                              {transfer.from_team?.logo_url ? (
                                <img 
                                  src={transfer.from_team.logo_url} 
                                  alt={`${transfer.from_team.name} logo`}
                                  className="w-8 h-8 rounded border-2 border-white shadow-md bg-white p-1"
                                  onError={(e) => {
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
                                  backgroundColor: transfer.from_team?.primary_color || '#6B7280',
                                  display: transfer.from_team?.logo_url ? 'none' : 'flex'
                                }}
                              >
                                {transfer.from_team?.name?.split(' ').map((word: string) => word[0]).join('').slice(0, 2) || 'FT'}
                              </div>
                              <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                                {transfer.from_team?.name || 'Unknown'}
                              </span>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center gap-2 text-blue-600">
                              <div className="w-8 h-0.5 bg-blue-600"></div>
                              <div className="w-0 h-0 border-l-4 border-l-blue-600 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                            </div>

                            {/* To Team */}
                            <div className="flex items-center gap-2">
                              {transfer.to_team?.logo_url ? (
                                <img 
                                  src={transfer.to_team.logo_url} 
                                  alt={`${transfer.to_team.name} logo`}
                                  className="w-8 h-8 rounded border-2 border-white shadow-md bg-white p-1"
                                  onError={(e) => {
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
                                  backgroundColor: transfer.to_team?.primary_color || '#10B981',
                                  display: transfer.to_team?.logo_url ? 'none' : 'flex'
                                }}
                              >
                                {transfer.to_team?.name?.split(' ').map((word: string) => word[0]).join('').slice(0, 2) || 'TT'}
                              </div>
                              <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                                {transfer.to_team?.name || 'Unknown'}
                              </span>
                            </div>
                          </div>

                          {/* Transfer Details */}
                          <div className="text-right flex-1">
                            <p className="font-semibold text-green-600 text-lg">
                              {formatCurrency(transfer.transfer_fee || 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(transfer.created_at)}
                            </p>
                            {transfer.contract_length && (
                              <p className="text-xs text-gray-600">
                                {transfer.contract_length} year contract
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Additional Transfer Info */}
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <span>Transfer Type: {transfer.transfer_type || 'Permanent'}</span>
                              {transfer.wage && (
                                <span>Weekly Wage: {formatCurrency(transfer.wage)}</span>
                              )}
                            </div>
                            <div className="text-xs">
                              Transfer ID: {transfer.id.slice(0, 8)}
                            </div>
                          </div>
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

          <TabsContent value="seasons" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Season Progression
                </CardTitle>
                <CardDescription>
                  Track season progress across all tiers. 1 season = 38 matches per team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {seasonProgress.length > 0 ? (
                  <div className="space-y-6">
                    {seasonProgress.map((season) => {
                      const progressPercentage = (season.matches_completed / season.total_matches_required) * 100;
                      const isNearCompletion = progressPercentage >= 90;
                      
                      return (
                        <div key={`${season.tier}-${season.season_number}`} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                Tier {season.tier} - Season {season.season_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {season.matches_completed} of {season.total_matches_required} matches completed
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {progressPercentage.toFixed(1)}%
                              </div>
                              <Badge variant={isNearCompletion ? "destructive" : "secondary"}>
                                {isNearCompletion ? "Season Ending" : "In Progress"}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full transition-all duration-300 ${
                                  isNearCompletion ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Season Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-gray-600">Matches Left</div>
                              <div className="font-bold text-lg">
                                {season.total_matches_required - season.matches_completed}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-gray-600">Season Status</div>
                              <div className="font-bold text-lg capitalize">
                                {season.season_status}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-gray-600">Started</div>
                              <div className="font-bold text-sm">
                                {new Date(season.season_start_date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border">
                              <div className="text-gray-600">Transfer Windows</div>
                              <div className="font-bold text-sm">
                                {progressPercentage < 10 ? "Summer Open" : 
                                 progressPercentage >= 15 && progressPercentage <= 25 ? "Winter Open" :
                                 "Closed"}
                              </div>
                            </div>
                          </div>
                          
                          {/* Season Milestones */}
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <div className={`flex items-center gap-1 ${progressPercentage >= 0 ? 'text-green-600 font-semibold' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${progressPercentage >= 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Season Start
                              </div>
                              <div className={`flex items-center gap-1 ${progressPercentage >= 30 ? 'text-green-600 font-semibold' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${progressPercentage >= 30 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Mid-Season
                              </div>
                              <div className={`flex items-center gap-1 ${progressPercentage >= 70 ? 'text-green-600 font-semibold' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${progressPercentage >= 70 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Final Stretch
                              </div>
                              <div className={`flex items-center gap-1 ${progressPercentage >= 100 ? 'text-green-600 font-semibold' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                Season End
                              </div>
                            </div>
                          </div>
                          
                          {/* What happens at season end */}
                          {isNearCompletion && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 text-yellow-800">
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-semibold">Season Ending Soon!</span>
                              </div>
                              <div className="text-sm text-yellow-700 mt-1">
                                When this season completes: Players age +1 year, contracts reduce by 1 year, 
                                new season begins, transfer windows reset.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active seasons found</p>
                    <p className="text-sm">Server will initialize seasons automatically</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="injuries" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Active Injuries
                </CardTitle>
                <CardDescription>
                  Current player injuries across all teams. Players recover based on matches played (1 match = 1 week recovery).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeInjuries.length > 0 ? (
                  <div className="space-y-4">
                    {/* Injury Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-sm text-green-600">Minor Injuries</div>
                        <div className="text-xl font-bold text-green-800">
                          {activeInjuries.filter(i => i.severity === 'minor').length}
                        </div>
                        <div className="text-xs text-green-600">1-3 weeks</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <div className="text-sm text-yellow-600">Moderate Injuries</div>
                        <div className="text-xl font-bold text-yellow-800">
                          {activeInjuries.filter(i => i.severity === 'moderate').length}
                        </div>
                        <div className="text-xs text-yellow-600">3-6 weeks</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                        <div className="text-sm text-orange-600">Major Injuries</div>
                        <div className="text-xl font-bold text-orange-800">
                          {activeInjuries.filter(i => i.severity === 'major').length}
                        </div>
                        <div className="text-xs text-orange-600">6-18 weeks</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <div className="text-sm text-red-600">Career Ending</div>
                        <div className="text-xl font-bold text-red-800">
                          {activeInjuries.filter(i => i.severity === 'career_ending').length}
                        </div>
                        <div className="text-xs text-red-600">Retirement</div>
                      </div>
                    </div>

                    {/* Injury List */}
                    <div className="space-y-3">
                      {activeInjuries.slice(0, 20).map((injury) => {
                        const recoveryProgress = injury.recovery_weeks_completed / Math.max(injury.recovery_weeks_needed, 1) * 100;
                        const matchesRemaining = Math.max(0, injury.recovery_weeks_needed - injury.recovery_weeks_completed);
                        
                        return (
                          <div key={injury.id} className={`rounded-lg p-4 border ${
                            injury.severity === 'minor' ? 'bg-green-50 border-green-200' :
                            injury.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                            injury.severity === 'major' ? 'bg-orange-50 border-orange-200' :
                            'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-gray-600">
                                    {injury.player?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'P'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {injury.player?.name || 'Unknown Player'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {injury.player?.team?.name || 'Unknown Team'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <Badge variant={
                                  injury.severity === 'minor' ? 'secondary' :
                                  injury.severity === 'moderate' ? 'default' :
                                  injury.severity === 'major' ? 'destructive' :
                                  'destructive'
                                }>
                                  {injury.severity.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <div className="text-xs text-gray-500 mt-1">
                                  {matchesRemaining} matches remaining
                                </div>
                              </div>
                            </div>
                            
                            {/* Recovery Progress Bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Recovery Progress</span>
                                <span>{Math.round(recoveryProgress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    injury.severity === 'minor' ? 'bg-green-500' :
                                    injury.severity === 'moderate' ? 'bg-yellow-500' :
                                    injury.severity === 'major' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, recoveryProgress)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {injury.recovery_weeks_completed}/{injury.recovery_weeks_needed} matches completed
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activeInjuries.length > 20 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>Showing 20 of {activeInjuries.length} active injuries</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active injuries</p>
                    <p className="text-sm">All players are currently fit</p>
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
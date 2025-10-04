'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  Play, 
  Calendar,
  ArrowRightLeft,
  DollarSign,
  Activity,
  Target,
  Zap,
  Heart,
  Shield,
  Star,
  Award,
  Flame
} from "lucide-react";

// Use the centralized client
const supabase = createClient();

interface AutomatedFootballAppProps {
  onTeamSelect?: (teamId: string) => void;
}

export default function AutomatedFootballApp({ onTeamSelect }: { onTeamSelect?: (teamId: string) => void }) {
  const [stats, setStats] = useState<any>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [upcomingTransfers, setRecentTransfers] = useState<any[]>([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState<any>({});
  const [standings, setStandings] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState(1);
  const [isConnected, setIsConnected] = useState(false);
  const [seasonProgress, setSeasonProgress] = useState<any[]>([]);
  const [globalSeason, setGlobalSeason] = useState<any>(null);
  const [activeInjuries, setActiveInjuries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

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
        const [teamsRes, playersRes, fixturesRes, upcomingRes, standingsRes, transfersRes, seasonRes, globalSeasonRes, injuriesRes] = await Promise.all([
          supabase.from('teams').select('id'),
          supabase.from('players').select('id, injury_status'),
          supabase.from('fixtures').select(`
            *,
            home_team:home_team_id(name, crest_url, primary_color),
            away_team:away_team_id(name, crest_url, primary_color)
          `).eq('status', 'live').limit(10),
          supabase.from('fixtures').select(`
            *,
            home_team:home_team_id(name, crest_url, primary_color, tier),
            away_team:away_team_id(name, crest_url, primary_color, tier)
          `).eq('status', 'scheduled').order('scheduled_at', { ascending: true }).limit(20),
          supabase.from('team_standings').select(`
            *,
            team:team_id(name, tier, elo, primary_color, secondary_color, crest_url, logo_url)
          `).order('points', { ascending: false }).limit(100),
          supabase.from('transfers').select(`
            *,
            player:player_id(name, position, age, overall_rating),
            from_team:from_team_id(name, crest_url, primary_color),
            to_team:to_team_id(name, crest_url, primary_color)
          `).order('created_at', { ascending: false }).limit(20),
          supabase.from('season_progression').select('*').eq('season_status', 'active').order('tier'),
          supabase.from('global_season_status').select('*').eq('season_status', 'active').single(),
          supabase.from('player_injuries').select(`
            id, 
            severity, 
            recovery_weeks_needed,
            recovery_weeks_completed,
            player:player_id(name, team_id(name))
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
          totalPlayers: playersRes.data?.length || 0,
          injuredPlayers: playersRes.data?.filter(p => p.injury_status).length || 0,
          liveMatches: fixturesRes.data?.length || 0,
          upcomingMatches: upcomingRes.data?.length || 0,
          totalTransfers: transfersRes.data?.length || 0,
          currentSeason: globalSeasonRes.data?.[0]?.season_number || 1,
          matchesPlayed: seasonRes.data?.reduce((acc, s) => acc + (s.matches_played || 0), 0) || 0,
          totalInjuries: injuriesRes.data?.length || 0
        });

        setLiveMatches(fixturesRes.data || []);
        setUpcomingMatches(upcomingRes.data || []);
        setRecentTransfers(transfersRes.data || []);
        
        // Filter out standings with null teams
        const validStandings = (standingsRes.data || []).filter(standing => 
          standing.team && standing.team.tier !== null
        );
        setStandings(validStandings);
        
        // Filter out transfers with null data
        const validTransfers = (transfersRes.data || []).filter(transfer => 
          transfer.player && (transfer.from_team || transfer.to_team)
        );
        setRecentTransfers(validTransfers);
        
        setSeasonProgress(seasonRes.data || []);
        setGlobalSeason(globalSeasonRes.data || null);
        
        // Filter out injuries with null player data - fix the type issue
        const validInjuries = (injuriesRes.data || []).filter((injury: any) => 
          injury.player && typeof injury.player === 'object' && injury.player.name
        );
        setActiveInjuries(validInjuries);
        
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
    if (position <= 3) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (position <= 6) return <Zap className="w-4 h-4 text-green-500" />;
    if (position >= standings.length - 2) return <Flame className="w-4 h-4 text-red-500" />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-blue-400">⚽</span>
              Autonomous Football Universe
            </h1>
            <p className="text-slate-300 mt-2">
              Server-driven football ecosystem - same state for all clients worldwide!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-green-400">Server Active</span>
            </div>
          </div>
        </div>

        {/* Stats Overview - Single instance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-slate-300">Teams</h3>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalTeams}</div>
              <p className="text-xs text-slate-400">
                Across {stats.totalTiers} tiers
              </p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-slate-300">Players</h3>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalPlayers}</div>
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-400">Fit:</span>
                  <span>{stats.fitPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">Injured:</span>
                  <span>{stats.injuredPlayers}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-slate-300">Live Matches</h3>
              <Trophy className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.liveMatches}</div>
              <p className="text-xs text-slate-400">
                Currently playing
              </p>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-slate-300">Global Season</h3>
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{globalSeason?.season_number || 1}</div>
              <p className="text-xs text-slate-400">
                {globalSeason?.tiers_completed || 0}/{globalSeason?.total_tiers || 5} tiers complete
              </p>
            </div>
          </div>
        </div>

        {/* Global Season Status */}
        <div className="glass-card p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Global Season {globalSeason?.season_number || 1} Status
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-300">Season Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                globalSeason?.season_status === 'active' 
                  ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                  : 'bg-slate-400/20 text-slate-400 border border-slate-400/30'
              }`}>
                {globalSeason?.season_status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-300">Tiers Completed:</span>
              <span className="text-white">{globalSeason?.tiers_completed || 0}/{globalSeason?.total_tiers || 5}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="glass-card p-1 mb-6">
          <div className="grid grid-cols-6 gap-1">
            {['overview', 'matches', 'standings', 'transfers', 'seasons', 'injuries'].map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'glass-primary text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="matches">Live Matches</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
            <TabsTrigger value="seasons">Seasons</TabsTrigger>
            <TabsTrigger value="injuries">Injuries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Autonomous Football Universe */}
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-blue-400" />
                      Autonomous Football Universe
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2 mb-4">
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
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li>• Server-driven match simulation</li>
                      <li>• Automatic fixture generation</li>
                      <li>• Synchronized across all clients</li>
                      <li>• Consistent league progression</li>
                    </ul>
                  </div>
                </div>

                {/* Transfer System */}
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-yellow-400" />
                      Transfer System
                    </h3>
                  </div>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li>• Server-controlled transfers</li>
                    <li>• Global market consistency</li>
                    <li>• Same prices for all clients</li>
                    <li>• Synchronized player movements</li>
                  </ul>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6"></div>
              
              <div className="glass-primary p-4 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">🌍 Global Synchronization</h4>
                <p className="text-sm text-blue-200">
                  All match results, transfers, and league standings are synchronized server-side. 
                  Every client sees the exact same football universe state in real-time.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="matches" className="mt-6">
            <div className="space-y-6">
              {/* Live Matches Section */}
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-400" />
                    Live Matches
                  </h3>
                </div>
                {liveMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No live matches at the moment</p>
                    <p className="text-sm text-slate-500 mt-2">Check back soon for live action!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {liveMatches.map((match) => (
                      <div 
                        key={match.id} 
                        className="glass-row p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-300"
                        onClick={() => {
                          onTeamSelect?.(match.home_team_id);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTeamSelect?.(match.home_team_id);
                              }}
                            >
                              <img 
                                src={match.home_team?.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.home_team?.name || 'team'}`}
                                alt={match.home_team?.name || 'Home Team'}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-white font-medium">{match.home_team?.name || 'Home Team'}</span>
                            </div>
                            <span className="text-slate-400">vs</span>
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTeamSelect?.(match.away_team_id);
                              }}
                            >
                              <img 
                                src={match.away_team?.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.away_team?.name || 'team'}`}
                                alt={match.away_team?.name || 'Away Team'}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-white font-medium">{match.away_team?.name || 'Away Team'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-400 font-medium">LIVE</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Matches Section */}
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    Upcoming Matches
                  </h3>
                </div>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No upcoming matches scheduled</p>
                    <p className="text-sm text-slate-500 mt-2">Fixtures will appear here when scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div 
                        key={match.id} 
                        className="glass-row p-4 rounded-lg cursor-pointer hover:bg-white/10 transition-all duration-300"
                        onClick={() => {
                          onTeamSelect?.(match.home_team_id);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTeamSelect?.(match.home_team_id);
                              }}
                            >
                              <img 
                                src={match.home_team?.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.home_team?.name || 'team'}`}
                                alt={match.home_team?.name || 'Home Team'}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-white font-medium">{match.home_team?.name || 'Home Team'}</span>
                            </div>
                            <span className="text-slate-400">vs</span>
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTeamSelect?.(match.away_team_id);
                              }}
                            >
                              <img 
                                src={match.away_team?.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${match.away_team?.name || 'team'}`}
                                alt={match.away_team?.name || 'Away Team'}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-white font-medium">{match.away_team?.name || 'Away Team'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-slate-400">
                                {match.home_team?.tier && `Tier ${match.home_team.tier}`}
                              </div>
                              <div className="text-xs text-slate-500">
                                Round {match.round}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-blue-400 font-medium">
                                {new Date(match.scheduled_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(match.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Transfers Section */}
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-purple-400" />
                    Recent Transfers
                  </h3>
                </div>
                <div className="space-y-4">
                  {recentTransfers.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">No recent transfers</p>
                      <p className="text-sm text-slate-500 mt-2">Transfer activity will appear here</p>
                    </div>
                  ) : (
                    recentTransfers.slice(0, 10).map((transfer) => (
                      <div key={transfer.id} className="glass-row p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="text-white font-medium">{transfer.player?.name}</div>
                            <ArrowRightLeft className="h-4 w-4 text-purple-400" />
                            <div className="text-slate-300">{transfer.to_team?.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-medium">
                              £{(transfer.transfer_fee / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(transfer.transfer_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="standings" className="mt-6">
            {activeTab === 'standings' && (
              <div className="mt-6">
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      Season Standings
                    </h3>
                  </div>
                  <div className="flex gap-2 mb-6">
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
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-slate-300 font-medium">Pos</th>
                          <th className="text-left p-3 text-slate-300 font-medium">Team</th>
                          <th className="text-center p-3 text-slate-300 font-medium">P</th>
                          <th className="text-center p-3 text-slate-300 font-medium">W</th>
                          <th className="text-center p-3 text-slate-300 font-medium">D</th>
                          <th className="text-center p-3 text-slate-300 font-medium">L</th>
                          <th className="text-center p-3 text-slate-300 font-medium">GF</th>
                          <th className="text-center p-3 text-slate-300 font-medium">GA</th>
                          <th className="text-center p-3 text-slate-300 font-medium">GD</th>
                          <th className="text-center p-3 text-slate-300 font-medium">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings
                          .filter(team => team.team?.tier === selectedTier)
                          .sort((a, b) => {
                            if (b.points !== a.points) return b.points - a.points;
                            const aGD = a.gf - a.ga;
                            const bGD = b.gf - b.ga;
                            if (bGD !== aGD) return bGD - aGD;
                            return b.gf - a.gf;
                          })
                          .map((team, index) => (
                            <tr 
                              key={team.id} 
                              className={`glass-row cursor-pointer transition-all duration-300 ${
                                index < 3 ? 'bg-green-400/10 border-l-2 border-green-400' : 
                                index >= standings.filter(t => t.team?.tier === selectedTier).length - 3 ? 'bg-red-400/10 border-l-2 border-red-400' : ''
                              }`}
                              onClick={() => onTeamSelect?.(team.team_id)}
                            >
                              <td className="p-3 font-medium text-white">{index + 1}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={team.team?.tier === 1 ? team.team?.logo_url : team.team?.crest_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${team.team?.name || 'team'}`}
                                    alt={team.team?.name || 'Team'}
                                    className="w-6 h-6 rounded"
                                  />
                                  <span className="font-medium text-white">{team.team?.name || 'Unknown Team'}</span>
                                </div>
                              </td>
                              <td className="text-center p-3 text-slate-300">{team.played}</td>
                              <td className="text-center p-3 text-slate-300">{team.won}</td>
                              <td className="text-center p-3 text-slate-300">{team.drawn}</td>
                              <td className="text-center p-3 text-slate-300">{team.lost}</td>
                              <td className="text-center p-3 text-slate-300">{team.gf}</td>
                              <td className="text-center p-3 text-slate-300">{team.ga}</td>
                              <td className="text-center p-3 text-slate-300">{team.gf - team.ga}</td>
                              <td className="text-center p-3 font-bold text-white">{team.points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="transfers" className="mt-6">
            {activeTab === 'transfers' && (
              <div className="mt-6">
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      Transfer Market
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {recentTransfers.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No recent transfers</p>
                        <p className="text-sm text-slate-500 mt-2">Transfer activity will appear here</p>
                      </div>
                    ) : (
                      recentTransfers.map((transfer) => (
                        <div key={transfer.id} className="glass-row p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{transfer.player?.name || 'Unknown Player'}</div>
                              <div className="text-sm text-slate-400">
                                {transfer.from_team?.name || 'Unknown Team'} → {transfer.to_team?.name || 'Unknown Team'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-400">£{transfer.fee?.toLocaleString() || '0'}</div>
                              <div className="text-xs text-slate-500">{transfer.date}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="seasons" className="mt-6">
            {activeTab === 'seasons' && (
              <div className="mt-6">
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      Season Progress
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Track season progress across all tiers. 1 season = 38 matches per team.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {seasonProgress.map((season) => (
                      <div key={`${season.tier}-${season.season_number}`} className="glass-row p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">Tier {season.tier}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              season.season_status === 'active' 
                                ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                                : season.season_status === 'completed'
                                ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30'
                                : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                            }`}>
                              {season.season_status}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            Season {season.season_number}
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(100, (season.matches_completed / season.total_matches_required) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>{season.matches_completed} matches completed</span>
                          <span>{season.total_matches_required} total matches</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="injuries" className="mt-6">
            {activeTab === 'injuries' && (
              <div className="mt-6">
                <div className="glass-card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Injury Report
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {activeInjuries.length === 0 ? (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">No current injuries</p>
                        <p className="text-sm text-slate-500 mt-2">All players are fit and ready!</p>
                      </div>
                    ) : (
                      activeInjuries.map((injury) => (
                        <div key={injury.id} className="glass-row p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">{injury.player?.name || 'Unknown Player'}</div>
                              <div className="text-sm text-slate-400">{injury.player?.team?.name || 'Unknown Team'}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${
                                injury.severity === 'minor' ? 'text-yellow-400' :
                                injury.severity === 'major' ? 'text-red-400' :
                                'text-slate-400'
                              }`}>
                                {injury.severity} injury
                              </div>
                              <div className="text-xs text-slate-500">
                                {injury.recovery_weeks_completed}/{injury.recovery_weeks_needed} weeks
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
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
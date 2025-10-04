'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

const supabase = createClient();

export default function AutomatedFootballApp() {
  const [stats, setStats] = useState<any>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [orchestrationStatus, setOrchestrationStatus] = useState<any>({});
  const [wealthStats, setWealthStats] = useState<any>({});
  const [isAutoRunning, setIsAutoRunning] = useState(true);

  // Auto-orchestration interval
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const runOrchestration = async () => {
      if (!isAutoRunning) return;
      
      try {
        await supabase.functions.invoke('supabase-functions-match-orchestrator');
      } catch (error) {
        console.error('Orchestration error:', error);
      }
    };

    if (isAutoRunning) {
      // Run immediately
      runOrchestration();
      
      // Then run every 2 minutes
      interval = setInterval(runOrchestration, 2 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRunning]);

  // Fetch data periodically
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get basic stats
        const [teamsRes, playersRes, matchesRes, transfersRes, wealthRes, orchestrationRes] = await Promise.all([
          supabase.from('teams').select('id'),
          supabase.from('players').select('id'),
          supabase.from('matches').select('*').eq('status', 'live').limit(10),
          supabase.from('transfers').select(`
            *,
            player:players(name, position),
            from_team:teams!transfers_from_team_id_fkey(name),
            to_team:teams!transfers_to_team_id_fkey(name)
          `).order('created_at', { ascending: false }).limit(10),
          supabase.from('teams').select('wealth_category, transfer_budget, tier').order('transfer_budget', { ascending: false }),
          supabase.from('orchestration_status').select('*').eq('id', 1).single()
        ]);

        setStats({
          teams: teamsRes.data?.length || 0,
          players: playersRes.data?.length || 0,
          liveMatches: matchesRes.data?.length || 0
        });

        setLiveMatches(matchesRes.data || []);
        setRecentTransfers(transfersRes.data || []);
        setOrchestrationStatus(orchestrationRes.data || {});

        // Process wealth statistics
        if (wealthRes.data) {
          const wealthBreakdown = wealthRes.data.reduce((acc: any, team: any) => {
            const category = team.wealth_category || 'unknown';
            if (!acc[category]) {
              acc[category] = { count: 0, totalBudget: 0, avgBudget: 0 };
            }
            acc[category].count++;
            acc[category].totalBudget += team.transfer_budget || 0;
            return acc;
          }, {});

          Object.keys(wealthBreakdown).forEach(category => {
            wealthBreakdown[category].avgBudget = Math.floor(wealthBreakdown[category].totalBudget / wealthBreakdown[category].count);
          });

          setWealthStats(wealthBreakdown);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const matchesChannel = supabase
      .channel('live-matches')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          // Refresh data when matches change
          setTimeout(() => window.location.reload(), 1000);
        }
      )
      .subscribe();

    const orchestrationChannel = supabase
      .channel('orchestration-status')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orchestration_status' },
        (payload) => {
          setOrchestrationStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(orchestrationChannel);
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
              Watch the complete football ecosystem unfold automatically - no admin needed!
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${orchestrationStatus.is_running ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-sm font-medium">
                {orchestrationStatus.is_running ? 'Processing...' : 'Active'}
              </span>
            </div>
            
            <Button
              variant={isAutoRunning ? "destructive" : "default"}
              size="sm"
              onClick={() => setIsAutoRunning(!isAutoRunning)}
              className="flex items-center gap-2"
            >
              {isAutoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isAutoRunning ? 'Pause' : 'Resume'} Auto
            </Button>
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
              <CardTitle className="text-sm font-medium">Orchestration</CardTitle>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Matches */}
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
                  {liveMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                        <div>
                          <p className="font-semibold">{match.home_team_name} vs {match.away_team_name}</p>
                          <p className="text-sm text-gray-600">
                            {match.home_score} - {match.away_score} • {match.minute}'
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
                  <p className="text-sm">New matches start automatically</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transfers */}
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
                  {recentTransfers.slice(0, 5).map((transfer) => (
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
                  <p className="text-sm">Transfer activity happens automatically</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wealth Distribution */}
        {Object.keys(wealthStats).length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Wealth Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(wealthStats).map(([category, data]: [string, any]) => (
                  <div key={category} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-700 capitalize text-sm">
                        {category.replace('_', ' ')}
                        <span className="ml-2">
                          {category === 'mega_rich' ? '🏆' : 
                           category === 'rich' ? '💎' : 
                           category === 'moderate' ? '⚽' : 
                           category === 'limited' ? '📊' : 
                           category === 'poor' ? '💸' : 
                           category === 'very_poor' ? '🏚️' : '❓'}
                        </span>
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {data.count}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        Avg: <span className="font-semibold text-green-600">
                          {formatCurrency(data.avgBudget)}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🤖 Autonomous Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">⚽ Match Simulation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Continuous match simulation</li>
                  <li>• Automatic fixture generation</li>
                  <li>• Real-time score updates</li>
                  <li>• League table progression</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">💰 Transfer System</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Wealth-based transfer activity</li>
                  <li>• Automatic bid processing</li>
                  <li>• Market value fluctuations</li>
                  <li>• Youth academy graduates</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📈 Season Progression</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Player aging & development</li>
                  <li>• Injury system</li>
                  <li>• Contract renewals</li>
                  <li>• Promotion/relegation</li>
                </ul>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">🎮 Fully Autonomous</h4>
              <p className="text-sm text-green-700">
                The entire football ecosystem runs automatically every 2 minutes. No admin intervention needed - 
                just watch as teams compete, players transfer, matches play out, and seasons progress naturally!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
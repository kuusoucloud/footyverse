"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Play, Users, Settings, Calendar, DollarSign, Trophy, Heart, TrendingUp, Database, Clock } from "lucide-react";

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [systemStatus, setSystemStatus] = useState({
    teams: 0,
    players: 0,
    fixtures: 0,
    liveMatches: 0,
  });
  const [orchestratorStatus, setOrchestratorStatus] = useState({
    running: false,
    activeMatches: 0,
    lastCheck: "",
  });
  const [autoSeeding, setAutoSeeding] = useState(false);
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    fixtures: 0,
    liveMatches: 0,
  });
  const [message, setMessage] = useState("");
  const [transferActivity, setTransferActivity] = useState<any[]>([]);
  const [wealthStats, setWealthStats] = useState<any>({});
  const [actionLog, setActionLog] = useState<any[]>([]);
  const supabase = createClient();

  const fetchStats = async () => {
    try {
      const [teamsRes, playersRes, fixturesRes, matchesRes, wealthRes] = await Promise.all([
        supabase.from('teams').select('id'),
        supabase.from('players').select('id'),
        supabase.from('fixtures').select('id'),
        supabase.from('matches').select('id').eq('status', 'live'),
        supabase.from('teams').select('wealth_category, transfer_budget, tier').order('transfer_budget', { ascending: false })
      ]);

      setStats({
        teams: teamsRes.data?.length || 0,
        players: playersRes.data?.length || 0,
        fixtures: fixturesRes.data?.length || 0,
        liveMatches: matchesRes.data?.length || 0
      });

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

        // Calculate averages
        Object.keys(wealthBreakdown).forEach(category => {
          wealthBreakdown[category].avgBudget = Math.floor(wealthBreakdown[category].totalBudget / wealthBreakdown[category].count);
        });

        setWealthStats(wealthBreakdown);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    checkOrchestratorStatus();
    // Auto-seed if system is empty
    autoSeedIfNeeded();

    // Check orchestrator status every 10 seconds
    const interval = setInterval(checkOrchestratorStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const [teamsRes, playersRes, fixturesRes, matchesRes, wealthRes] = await Promise.all([
        supabase.from('teams').select('id'),
        supabase.from('players').select('id'),
        supabase.from('fixtures').select('id'),
        supabase.from('matches').select('id').eq('status', 'live'),
        supabase.from('teams').select('wealth_category, transfer_budget, tier').order('transfer_budget', { ascending: false })
      ]);

      setStats({
        teams: teamsRes.data?.length || 0,
        players: playersRes.data?.length || 0,
        fixtures: fixturesRes.data?.length || 0,
        liveMatches: matchesRes.data?.length || 0
      });

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

        // Calculate averages
        Object.keys(wealthBreakdown).forEach(category => {
          wealthBreakdown[category].avgBudget = Math.floor(wealthBreakdown[category].totalBudget / wealthBreakdown[category].count);
        });

        setWealthStats(wealthBreakdown);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkOrchestratorStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-match-orchestrator",
        {
          body: {},
          method: "GET",
        },
      );

      if (!error && data) {
        setOrchestratorStatus({
          running: data.status === "running",
          activeMatches: data.active_matches || 0,
          lastCheck: new Date().toLocaleTimeString(),
        });
      }
    } catch (error) {
      console.error("Failed to check orchestrator status:", error);
    }
  };

  const startOrchestrator = async () => {
    setLoading(true);
    setStatus("🚀 Starting 24/7 Match Orchestrator...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-match-orchestrator",
        {
          body: {},
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (error) throw error;
      setStatus(`✅ ${data.message}`);
      checkOrchestratorStatus();
      checkSystemStatus();
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const stopOrchestrator = async () => {
    setLoading(true);
    setStatus("⏹️ Stopping Match Orchestrator...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-match-orchestrator",
        {
          body: { action: "stop" },
          method: "POST",
        },
      );

      if (error) throw error;
      setStatus(`✅ ${data.message}`);
      checkOrchestratorStatus();
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const forceNextMatch = async () => {
    setLoading(true);
    setStatus("⚡ Forcing next match to start...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-match-orchestrator",
        {
          body: { action: "force_next" },
          method: "POST",
        },
      );

      if (error) throw error;
      setStatus(`✅ ${data.message}`);
      checkOrchestratorStatus();
      checkSystemStatus();
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const autoSeedIfNeeded = async () => {
    try {
      const { data: teams } = await supabase
        .from("teams")
        .select("id")
        .limit(1);

      if (!teams || teams.length === 0) {
        setAutoSeeding(true);
        setStatus("🤖 Auto-seeding system...");

        // Auto-seed teams and players
        await seedData();

        // Wait a moment then generate fixtures
        setTimeout(async () => {
          await generateFixtures();

          // Wait another moment then start orchestrator
          setTimeout(async () => {
            await startOrchestrator();
            setAutoSeeding(false);
            setStatus("✅ System auto-seeded and 24/7 matches started!");
            checkSystemStatus();
          }, 2000);
        }, 2000);
      }
    } catch (error) {
      setAutoSeeding(false);
      setStatus(
        `❌ Auto-seed failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const seedData = async () => {
    setLoading(true);
    if (!autoSeeding) setStatus("Seeding teams and players...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-seed-data",
        {
          body: { action: "seed" },
        },
      );

      if (error) throw error;
      if (!autoSeeding)
        setStatus(
          `✅ ${data.message} - ${data.teams} teams, ${data.players} players`,
        );
      checkSystemStatus();
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      if (!autoSeeding) setLoading(false);
    }
  };

  const generateFixtures = async () => {
    setLoading(true);
    if (!autoSeeding) setStatus("Generating fixtures...");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-seed-data",
        {
          body: { action: "generate_fixtures" },
        },
      );

      if (error) throw error;
      if (!autoSeeding)
        setStatus(`✅ ${data.message} - ${data.fixtures} fixtures created`);
      checkSystemStatus();
    } catch (error) {
      setStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      if (!autoSeeding) setLoading(false);
    }
  };

  const resetSystem = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the entire system? This will delete all data and stop the orchestrator.",
      )
    ) {
      return;
    }

    setLoading(true);
    setStatus("Resetting system...");

    try {
      // Stop orchestrator first
      await stopOrchestrator();

      // Delete all data in order
      await supabase
        .from("fixtures")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("players")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase
        .from("teams")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      setStatus("✅ System reset complete");
      checkSystemStatus();
      checkOrchestratorStatus();
    } catch (error) {
      setStatus(
        `❌ Reset failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const setupCompleteEcosystem = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-football-ecosystem', {
        body: { action: 'full_setup' }
      });

      if (error) throw error;
      
      setMessage(`✅ Complete football ecosystem created! ${data.teams} teams, ${data.players} players, ${data.fixtures} league fixtures, ${data.cup_fixtures} cup fixtures`);
      await fetchStats();
    } catch (error) {
      console.error('Setup error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateMatches = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-football-ecosystem', {
        body: { action: 'simulate_season' }
      });

      if (error) throw error;
      
      setMessage(`✅ ${data.message} - ${data.matches_simulated} matches completed`);
      await fetchStats();
    } catch (error) {
      console.error('Simulation error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const progressSeason = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-football-ecosystem', {
        body: { action: 'age_players' }
      });

      if (error) throw error;
      
      setMessage(`✅ Season progressed! ${data.players_aged} players aged, ${data.retirements} retirements, ${data.new_injuries} new injuries`);
      await fetchStats();
    } catch (error) {
      console.error('Season progression error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateTransfers = async (windowType: 'summer' | 'winter') => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-transfer-system', {
        body: { action: 'simulate_transfers', window_type: windowType }
      });

      if (error) throw error;
      
      setMessage(`✅ ${data.message} - ${data.totalTransfers} transfers completed`);
      setTransferActivity(data.transferActivity || []);
      await fetchStats();
    } catch (error) {
      console.error('Transfer simulation error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const openTransferWindow = async (windowType: 'summer' | 'winter') => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-transfer-system', {
        body: { action: 'open_transfer_window', window_type: windowType }
      });

      if (error) throw error;
      
      setMessage(`✅ ${data.message}`);
    } catch (error) {
      console.error('Transfer window error:', error);
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getTransferActivity = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-transfer-system', {
        body: { action: 'get_transfer_activity' }
      });

      if (error) throw error;
      
      setTransferActivity([
        ...(data.recent_transfers || []).map((t: any) => ({
          type: 'completed',
          player: t.player.name,
          from: t.from_team.name,
          to: t.to_team.name,
          fee: t.transfer_fee,
          date: t.transfer_date
        })),
        ...(data.pending_bids || []).map((b: any) => ({
          type: 'pending_bid',
          player: b.player.name,
          from: b.selling_team.name,
          to: b.bidding_team.name,
          amount: b.bid_amount
        }))
      ]);
    } catch (error) {
      console.error('Transfer activity error:', error);
    }
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    setStatus(`⚙️ Executing ${action}...`);

    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-football-ecosystem', {
        body: { action }
      });

      if (error) throw error;

      const actionDetails = {
        action,
        details: data.message || 'System action completed',
        timestamp: new Date().toISOString()
      };

      setActionLog(prev => [actionDetails, ...prev.slice(0, 9)]);
      setStatus(`✅ ${actionDetails.details}`);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-red-400" />
            Admin Control Panel
          </h1>
          <p className="text-slate-300 mt-2">
            Manage the autonomous football ecosystem
          </p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">System Status</h3>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">Online</div>
            <p className="text-xs text-slate-400">All systems operational</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Active Matches</h3>
              <Play className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.liveMatches}</div>
            <p className="text-xs text-slate-400">Currently simulating</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-300">Total Teams</h3>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalTeams}</div>
            <p className="text-xs text-slate-400">Across all tiers</p>
          </div>
        </div>

        {/* Control Actions */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            System Controls
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => handleAction('force_match_generation')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-medium text-white">Generate Matches</div>
                  <div className="text-xs text-slate-400">Force fixture creation</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('simulate_transfers')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="font-medium text-white">Simulate Transfers</div>
                  <div className="text-xs text-slate-400">Run transfer market</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('progress_season')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="font-medium text-white">Progress Season</div>
                  <div className="text-xs text-slate-400">Advance to next season</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('reset_injuries')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-red-400" />
                <div>
                  <div className="font-medium text-white">Reset Injuries</div>
                  <div className="text-xs text-slate-400">Heal all players</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('update_ratings')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-medium text-white">Update Ratings</div>
                  <div className="text-xs text-slate-400">Recalculate ELO</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleAction('backup_data')}
              disabled={loading}
              className="glass-button p-4 rounded-lg text-left hover:glass-primary transition-all duration-300 disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-indigo-400" />
                <div>
                  <div className="font-medium text-white">Backup Data</div>
                  <div className="text-xs text-slate-400">Create system backup</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Actions Log */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-400" />
            Recent Actions
          </h2>
          <div className="space-y-3">
            {actionLog.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">No recent actions</p>
              </div>
            ) : (
              actionLog.map((action, index) => (
                <div key={index} className="glass-row p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{action.action}</div>
                      <div className="text-sm text-slate-400">{action.details}</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(action.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-white font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
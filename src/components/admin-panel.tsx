"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";

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
  const supabase = createClient();

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
      const [teamsRes, playersRes, fixturesRes, liveRes] = await Promise.all([
        supabase.from("teams").select("id", { count: "exact" }),
        supabase.from("players").select("id", { count: "exact" }),
        supabase.from("fixtures").select("id", { count: "exact" }),
        supabase
          .from("fixtures")
          .select("id", { count: "exact" })
          .eq("status", "live"),
      ]);

      setSystemStatus({
        teams: teamsRes.count || 0,
        players: playersRes.count || 0,
        fixtures: fixturesRes.count || 0,
        liveMatches: liveRes.count || 0,
      });
    } catch (error) {
      console.error("Failed to check system status:", error);
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

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-football-ecosystem",
        {
          body: { action: "get_stats" },
        },
      );

      if (error) throw error;
      
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
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
      setMessage(`❌ Error: ${error.message}`);
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
      setMessage(`❌ Error: ${error.message}`);
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
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FootyVerse Admin Panel</h1>
          <p className="text-gray-600">Complete Football Ecosystem Management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Teams</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.teams}</p>
            <p className="text-sm text-gray-500">Across 5 tiers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Players</h3>
            <p className="text-2xl font-bold text-green-600">{stats.players}</p>
            <p className="text-sm text-gray-500">Active players</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Fixtures</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.fixtures}</p>
            <p className="text-sm text-gray-500">League & cup matches</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Live Matches</h3>
            <p className="text-2xl font-bold text-red-600">{stats.liveMatches}</p>
            <p className="text-sm text-gray-500">Currently playing</p>
          </div>
        </div>

        {/* Main Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Football Ecosystem Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button 
              onClick={setupCompleteEcosystem}
              disabled={loading}
              className="h-20 text-lg"
              variant="default"
            >
              🏗️ Setup Complete Ecosystem
              <div className="text-sm font-normal mt-1">
                100 teams, 2300 players, fixtures & cup
              </div>
            </Button>
            
            <Button 
              onClick={simulateMatches}
              disabled={loading}
              className="h-20 text-lg"
              variant="secondary"
            >
              ⚽ Simulate Matches
              <div className="text-sm font-normal mt-1">
                Process scheduled fixtures
              </div>
            </Button>
            
            <Button 
              onClick={progressSeason}
              disabled={loading}
              className="h-20 text-lg"
              variant="outline"
            >
              📅 Progress Season
              <div className="text-sm font-normal mt-1">
                Age players, injuries, retirements
              </div>
            </Button>
          </div>

          {/* 24/7 Match Orchestrator Status */}
          <Card className="mb-8 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🚀 24/7 Match Orchestrator</span>
                <Badge
                  variant={
                    orchestratorStatus.running ? "destructive" : "secondary"
                  }
                >
                  {orchestratorStatus.running ? "RUNNING" : "STOPPED"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {orchestratorStatus.running ? "🔴 LIVE" : "⚫ OFF"}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {orchestratorStatus.activeMatches}
                  </div>
                  <div className="text-sm text-gray-600">Active Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-mono text-gray-600">
                    {orchestratorStatus.lastCheck}
                  </div>
                  <div className="text-sm text-gray-600">Last Check</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={startOrchestrator}
                  disabled={loading || autoSeeding || orchestratorStatus.running}
                  variant="destructive"
                  size="sm"
                >
                  🚀 Start 24/7 Matches
                </Button>
                <Button
                  onClick={stopOrchestrator}
                  disabled={loading || autoSeeding || !orchestratorStatus.running}
                  variant="outline"
                  size="sm"
                >
                  ⏹️ Stop Orchestrator
                </Button>
                <Button
                  onClick={forceNextMatch}
                  disabled={loading || autoSeeding || !orchestratorStatus.running}
                  variant="secondary"
                  size="sm"
                >
                  ⚡ Force Next Match
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>📊 System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {systemStatus.teams}
                  </div>
                  <div className="text-sm text-gray-600">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {systemStatus.players}
                  </div>
                  <div className="text-sm text-gray-600">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemStatus.fixtures}
                  </div>
                  <div className="text-sm text-gray-600">Fixtures</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {systemStatus.liveMatches}
                  </div>
                  <div className="text-sm text-gray-600">Live Matches</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Seed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Generate 100 teams with players
                </p>
                <Button
                  onClick={seedData}
                  disabled={loading || autoSeeding}
                  className="w-full"
                  size="sm"
                >
                  Seed Teams & Players
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Generate Fixtures</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Create league fixtures with odds
                </p>
                <Button
                  onClick={generateFixtures}
                  disabled={loading || autoSeeding}
                  className="w-full"
                  size="sm"
                >
                  Generate Fixtures
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Force Next Match</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Manually trigger next match
                </p>
                <Button
                  onClick={forceNextMatch}
                  disabled={loading || autoSeeding}
                  className="w-full"
                  variant="destructive"
                  size="sm"
                >
                  ⚡ Force Match
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reset System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Delete all data & stop matches
                </p>
                <Button
                  onClick={resetSystem}
                  disabled={loading || autoSeeding}
                  className="w-full"
                  variant="outline"
                  size="sm"
                >
                  Reset All
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Features */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ecosystem Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">🏆 League System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 5-tier league system (100 teams total)</li>
                <li>• 38 matches per team per season</li>
                <li>• Automatic promotion/relegation</li>
                <li>• ELO-based team ratings</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">🏆 Cup Competition</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• FA Cup style knockout tournament</li>
                <li>• All teams participate</li>
                <li>• Single elimination format</li>
                <li>• Runs parallel to league</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">👥 Player System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 23 players per team (2300 total)</li>
                <li>• Age progression each season</li>
                <li>• Injuries and recovery system</li>
                <li>• Retirement at 35+ years</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">📊 Advanced Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Market values and contracts</li>
                <li>• Transfer system</li>
                <li>• Injury tracking</li>
                <li>• Season progression automation</li>
              </ul>
            </div>
          </div>
        </div>

        {message && (
          <Card>
            <CardContent className="p-6">
              <div className="font-mono text-sm whitespace-pre-wrap">
                {message}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>🚀 24/7 Football Universe Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>⚽ Continuous Matches:</strong> Always one match running
                24/7
              </p>
              <p>
                <strong>🎲 Dynamic Odds:</strong> ELO-based betting odds for
                every match
              </p>
              <p>
                <strong>🏆 Auto-Fixtures:</strong> Generates new rounds
                automatically
              </p>
              <p>
                <strong>📊 Live Statistics:</strong> Real-time match data and
                standings
              </p>
              <p>
                <strong>🤖 Smart Orchestration:</strong> Seamless match
                transitions
              </p>
              <p>
                <strong>🔄 Auto-Recovery:</strong> Restarts matches if system
                fails
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
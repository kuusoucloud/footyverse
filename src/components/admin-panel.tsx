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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            ⚽ Football Universe Control Center
          </h1>
          <div className="flex space-x-2">
            <Badge
              variant={orchestratorStatus.running ? "destructive" : "secondary"}
            >
              {orchestratorStatus.running
                ? "🔴 ORCHESTRATOR LIVE"
                : "⚫ ORCHESTRATOR OFF"}
            </Badge>
            <Badge
              variant={
                systemStatus.liveMatches > 0 ? "destructive" : "secondary"
              }
            >
              {systemStatus.liveMatches > 0
                ? `⚽ ${systemStatus.liveMatches} LIVE`
                : "NO LIVE MATCHES"}
            </Badge>
          </div>
        </div>

        {autoSeeding && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">
                  Auto-seeding system and starting 24/7 matches...
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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

        {status && (
          <Card>
            <CardContent className="p-6">
              <div className="font-mono text-sm whitespace-pre-wrap">
                {status}
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

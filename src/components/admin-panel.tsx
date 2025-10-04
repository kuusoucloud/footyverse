'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { Badge } from '@/components/ui/badge';

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState({
    teams: 0,
    players: 0,
    fixtures: 0,
    liveMatches: 0
  });
  const [autoSeeding, setAutoSeeding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkSystemStatus();
    // Auto-seed if system is empty
    autoSeedIfNeeded();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const [teamsRes, playersRes, fixturesRes, liveRes] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact' }),
        supabase.from('players').select('id', { count: 'exact' }),
        supabase.from('fixtures').select('id', { count: 'exact' }),
        supabase.from('fixtures').select('id', { count: 'exact' }).eq('status', 'live')
      ]);

      setSystemStatus({
        teams: teamsRes.count || 0,
        players: playersRes.count || 0,
        fixtures: fixturesRes.count || 0,
        liveMatches: liveRes.count || 0
      });
    } catch (error) {
      console.error('Failed to check system status:', error);
    }
  };

  const autoSeedIfNeeded = async () => {
    try {
      const { data: teams } = await supabase.from('teams').select('id').limit(1);
      
      if (!teams || teams.length === 0) {
        setAutoSeeding(true);
        setStatus('🤖 Auto-seeding system...');
        
        // Auto-seed teams and players
        await seedData();
        
        // Wait a moment then generate fixtures
        setTimeout(async () => {
          await generateFixtures();
          
          // Wait another moment then start first live match
          setTimeout(async () => {
            await startLiveMatch();
            setAutoSeeding(false);
            setStatus('✅ System auto-seeded and first match started!');
            checkSystemStatus();
          }, 2000);
        }, 2000);
      }
    } catch (error) {
      setAutoSeeding(false);
      setStatus(`❌ Auto-seed failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const seedData = async () => {
    setLoading(true);
    if (!autoSeeding) setStatus('Seeding teams and players...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'seed' }
      });
      
      if (error) throw error;
      if (!autoSeeding) setStatus(`✅ ${data.message} - ${data.teams} teams, ${data.players} players`);
      checkSystemStatus();
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (!autoSeeding) setLoading(false);
    }
  };

  const generateFixtures = async () => {
    setLoading(true);
    if (!autoSeeding) setStatus('Generating fixtures...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'generate_fixtures' }
      });
      
      if (error) throw error;
      if (!autoSeeding) setStatus(`✅ ${data.message} - ${data.fixtures} fixtures created`);
      checkSystemStatus();
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (!autoSeeding) setLoading(false);
    }
  };

  const startLiveMatch = async () => {
    setLoading(true);
    if (!autoSeeding) setStatus('Starting live match...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'start_live_match' }
      });
      
      if (error) throw error;
      if (!autoSeeding) setStatus(`✅ ${data.message}`);
      checkSystemStatus();
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (!autoSeeding) setLoading(false);
    }
  };

  const resetSystem = async () => {
    if (!confirm('Are you sure you want to reset the entire system? This will delete all data.')) {
      return;
    }

    setLoading(true);
    setStatus('Resetting system...');
    
    try {
      // Delete all data in order
      await supabase.from('fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('teams').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      setStatus('✅ System reset complete');
      checkSystemStatus();
    } catch (error) {
      setStatus(`❌ Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">🔒 Football Admin Panel</h1>
          <Badge variant={systemStatus.liveMatches > 0 ? "destructive" : "secondary"}>
            {systemStatus.liveMatches > 0 ? "LIVE MATCH ACTIVE" : "NO LIVE MATCHES"}
          </Badge>
        </div>

        {autoSeeding && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Auto-seeding system in progress...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.teams}</div>
                <div className="text-sm text-gray-600">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemStatus.players}</div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.fixtures}</div>
                <div className="text-sm text-gray-600">Fixtures</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{systemStatus.liveMatches}</div>
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
                Create league fixtures
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
              <CardTitle className="text-sm">Start Live Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-4">
                Start match simulation
              </p>
              <Button 
                onClick={startLiveMatch} 
                disabled={loading || autoSeeding}
                className="w-full"
                variant="destructive"
                size="sm"
              >
                Start Live Match
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reset System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-600 mb-4">
                Delete all data
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
            <CardTitle>🔒 Secure Admin Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>🤖 Auto-Seeding:</strong> System automatically seeds data on first visit</p>
              <p><strong>🔐 Authentication:</strong> Requires login to access admin panel</p>
              <p><strong>📊 Real-time Status:</strong> Live system monitoring and statistics</p>
              <p><strong>🎮 One-Click Setup:</strong> Complete system initialization in seconds</p>
              <p><strong>🔄 Reset Capability:</strong> Clean slate for testing and development</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
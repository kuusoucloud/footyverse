'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const seedData = async () => {
    setLoading(true);
    setStatus('Seeding teams and players...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'seed' }
      });
      
      if (error) throw error;
      setStatus(`✅ ${data.message} - ${data.teams} teams, ${data.players} players`);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateFixtures = async () => {
    setLoading(true);
    setStatus('Generating fixtures...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'generate_fixtures' }
      });
      
      if (error) throw error;
      setStatus(`✅ ${data.message} - ${data.fixtures} fixtures created`);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startLiveMatch = async () => {
    setLoading(true);
    setStatus('Starting live match...');
    
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-data', {
        body: { action: 'start_live_match' }
      });
      
      if (error) throw error;
      setStatus(`✅ ${data.message}`);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Football Admin Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Seed Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Generate 100 teams across 5 tiers with 23 players each
              </p>
              <Button 
                onClick={seedData} 
                disabled={loading}
                className="w-full"
              >
                Seed Teams & Players
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Generate Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Create round-robin fixtures for all leagues
              </p>
              <Button 
                onClick={generateFixtures} 
                disabled={loading}
                className="w-full"
              >
                Generate Fixtures
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Start Live Match</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Start a live match simulation (only 1 at a time)
              </p>
              <Button 
                onClick={startLiveMatch} 
                disabled={loading}
                className="w-full"
                variant="destructive"
              >
                Start Live Match
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
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Teams:</strong> 100 teams across 5 tiers (20 teams per tier)</p>
              <p><strong>Players:</strong> 23 players per team (2,300 total)</p>
              <p><strong>Leagues:</strong> 5 leagues (Premier Division, Championship, League One, League Two, National League)</p>
              <p><strong>ELO System:</strong> Teams and players have ELO ratings that update after matches</p>
              <p><strong>Live Matches:</strong> Only 1 live match at a time with real-time 3D simulation</p>
              <p><strong>Physics:</strong> Ball physics, player movement, stamina system</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
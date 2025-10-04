'use client';

import { useEffect, useState } from 'react';
import { useFootballStore, Fixture } from '@/lib/football-store';
import { FootballAPI } from '@/lib/football-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Trophy } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  onSelect: (fixture: Fixture) => void;
}

function MatchCard({ fixture, onSelect }: MatchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'scheduled': return 'bg-blue-500';
      case 'finished': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(fixture)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge className={`${getStatusColor(fixture.status)} text-white`}>
            {fixture.status.toUpperCase()}
          </Badge>
          <div className="text-sm text-gray-500">
            {fixture.league.name} - Round {fixture.round}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">
                {fixture.home_team.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="font-semibold">{fixture.home_team.name}</span>
          </div>
          <div className="text-2xl font-bold">VS</div>
          <div className="flex items-center space-x-3">
            <span className="font-semibold">{fixture.away_team.name}</span>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">
                {fixture.away_team.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(fixture.scheduled_at)}</span>
          </div>
          {fixture.odds && (
            <div className="flex space-x-2">
              <span>H: {fixture.odds.home}</span>
              <span>D: {fixture.odds.draw}</span>
              <span>A: {fixture.odds.away}</span>
            </div>
          )}
        </div>
        
        {fixture.status === 'live' && (
          <Button className="w-full mt-3" variant="default">
            <Play className="w-4 h-4 mr-2" />
            Watch Live
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface MatchSelectionProps {
  onMatchSelect: (fixture: Fixture) => void;
}

export default function MatchSelection({ onMatchSelect }: MatchSelectionProps) {
  const { fixtures, setFixtures, setSelectedFixture, isLoading, setLoading } = useFootballStore();
  const [activeTab, setActiveTab] = useState<'live' | 'scheduled' | 'all'>('live');

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    try {
      setLoading(true);
      const data = await FootballAPI.getFixtures();
      setFixtures(data);
    } catch (error) {
      console.error('Failed to load fixtures:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchSelect = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    onMatchSelect(fixture);
  };

  const filteredFixtures = fixtures.filter(fixture => {
    if (activeTab === 'all') return true;
    return fixture.status === activeTab;
  });

  const liveMatches = fixtures.filter(f => f.status === 'live');
  const scheduledMatches = fixtures.filter(f => f.status === 'scheduled');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Football Matches</h1>
          <p className="text-gray-600">Select a match to watch in 3D</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-2xl font-bold">{liveMatches.length}</span>
                <span className="text-gray-600">Live Matches</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold">{scheduledMatches.length}</span>
                <span className="text-gray-600">Scheduled</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{fixtures.length}</span>
                <span className="text-gray-600">Total Fixtures</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'live' 
                ? 'bg-white shadow-sm text-red-600 font-medium' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live ({liveMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'scheduled' 
                ? 'bg-white shadow-sm text-blue-600 font-medium' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled ({scheduledMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'all' 
                ? 'bg-white shadow-sm text-gray-900 font-medium' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({fixtures.length})
          </button>
        </div>

        {/* Matches Grid */}
        {filteredFixtures.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 mb-4">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-xl">No {activeTab} matches found</p>
                <p className="text-sm">Check back later for more fixtures</p>
              </div>
              <Button onClick={loadFixtures} variant="outline">
                Refresh
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFixtures.map((fixture) => (
              <MatchCard
                key={fixture.id}
                fixture={fixture}
                onSelect={handleMatchSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import MatchSelection from './match-selection';
import MatchViewer3D from './match-viewer-3d';
import AutomatedFootballApp from './automated-football-app';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function FootballApp() {
  const [currentView, setCurrentView] = useState<'overview' | 'matches' | 'viewer'>('overview');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    setCurrentView('viewer');
  };

  const handleBackToMatches = () => {
    setCurrentView('matches');
    setSelectedMatch(null);
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedMatch(null);
  };

  if (currentView === 'viewer' && selectedMatch) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="p-4">
          <Button 
            onClick={handleBackToMatches}
            variant="outline"
            className="mb-4"
          >
            ← Back to Matches
          </Button>
        </div>
        <MatchViewer3D match={selectedMatch} />
      </div>
    );
  }

  if (currentView === 'matches') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="p-6">
          <Button 
            onClick={handleBackToOverview}
            variant="outline"
            className="mb-6"
          >
            ← Back to Overview
          </Button>
          <MatchSelection onMatchSelect={handleMatchSelect} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              ⚽ 3D Football Universe
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Watch live 3D matches from an autonomous football ecosystem
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('overview')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  Ecosystem Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Watch the complete autonomous football universe unfold with live stats, transfers, and match progression.
                </p>
                <Button className="w-full">
                  View Ecosystem
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setCurrentView('matches')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">🎮</span>
                  3D Match Viewer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Experience live football matches in stunning 3D with broadcast-style camera views and real-time action.
                </p>
                <Button className="w-full">
                  Watch Matches
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Embedded Overview */}
          <Tabs defaultValue="ecosystem" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ecosystem">Live Ecosystem</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ecosystem" className="mt-6">
              <AutomatedFootballApp />
            </TabsContent>
            
            <TabsContent value="features" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">⚽</span>
                      3D Match Simulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Broadcast-style 3D camera views</li>
                      <li>• Real-time player movement</li>
                      <li>• Physics-based ball mechanics</li>
                      <li>• Stadium atmosphere & crowds</li>
                      <li>• Live commentary & events</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      Complete League System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 100 teams across 5 tiers</li>
                      <li>• Automatic promotion/relegation</li>
                      <li>• Cup competitions</li>
                      <li>• ELO-based team ratings</li>
                      <li>• Season progression</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      Realistic Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Wealth-based team tiers</li>
                      <li>• Dynamic transfer market</li>
                      <li>• Player wages & contracts</li>
                      <li>• Youth academy systems</li>
                      <li>• Financial constraints</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">👥</span>
                      Living Player System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• 2,300+ unique players</li>
                      <li>• Age progression & retirement</li>
                      <li>• Injury & recovery system</li>
                      <li>• Form & performance tracking</li>
                      <li>• Career development</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">🔄</span>
                      Autonomous Operation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Fully automated ecosystem</li>
                      <li>• No admin intervention needed</li>
                      <li>• Continuous match simulation</li>
                      <li>• Real-time data streaming</li>
                      <li>• 24/7 operation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      Advanced Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li>• Live match statistics</li>
                      <li>• Transfer market analysis</li>
                      <li>• Team performance metrics</li>
                      <li>• Player development tracking</li>
                      <li>• Historical data</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
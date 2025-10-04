'use client';

import { useState } from 'react';
import { Fixture } from '@/lib/football-store';
import MatchSelection from '@/components/match-selection';
import MatchViewer3D from '@/components/match-viewer-3d';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FootballApp() {
  const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);

  const handleMatchSelect = (fixture: Fixture) => {
    setSelectedMatch(fixture);
  };

  const handleBackToSelection = () => {
    setSelectedMatch(null);
  };

  if (selectedMatch) {
    return (
      <div className="relative">
        <Button
          onClick={handleBackToSelection}
          className="absolute top-4 left-4 z-10 bg-black/80 hover:bg-black/90 text-white"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>
        <MatchViewer3D fixtureId={selectedMatch.id} />
      </div>
    );
  }

  return <MatchSelection onMatchSelect={handleMatchSelect} />;
}
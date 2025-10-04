'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { useFootballStore, MatchState, PlayerState } from '@/lib/football-store';
import { FootballAPI } from '@/lib/football-api';
import * as THREE from 'three';
import { matchOrchestrator, MatchResult } from '@/lib/match-orchestrator';

interface Player3DProps {
  player: PlayerState;
  color: string;
}

function Player3D({ player, color }: Player3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(player.pos[0], player.pos[2], player.pos[1]);
      groupRef.current.rotation.y = player.facing;
    }
  }, [player.pos, player.facing]);

  return (
    <group ref={groupRef}>
      <Box args={[1, 2, 0.5]} position={[0, 1, 0]}>
        <meshStandardMaterial color={color} />
      </Box>
      {player.has_ball && (
        <Sphere args={[0.3]} position={[0, 0.3, 0.8]}>
          <meshStandardMaterial color="white" />
        </Sphere>
      )}
    </group>
  );
}

function FootballPitch() {
  return (
    <group>
      {/* Main pitch */}
      <Box args={[105, 0.1, 68]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2d5a27" />
      </Box>
      
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[9.15, 9.25, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Center line */}
      <Box args={[0.1, 0.1, 68]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="white" />
      </Box>
      
      {/* Goals */}
      <Box args={[7.32, 2.44, 0.1]} position={[-52.5, 1.22, 0]}>
        <meshStandardMaterial color="white" />
      </Box>
      <Box args={[7.32, 2.44, 0.1]} position={[52.5, 1.22, 0]}>
        <meshStandardMaterial color="white" />
      </Box>
      
      {/* Goal areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-46.5, 0.05, 0]}>
        <ringGeometry args={[0, 5.5, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="white" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[46.5, 0.05, 0]}>
        <ringGeometry args={[0, 5.5, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="white" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Ball3D({ position }: { position: [number, number, number] }) {
  return (
    <Sphere args={[0.11]} position={[position[0], position[2], position[1]]}>
      <meshStandardMaterial color="white" />
    </Sphere>
  );
}

function MatchHUD({ matchState }: { matchState: MatchState }) {
  const minutes = Math.floor(matchState.clock / 60);
  const seconds = Math.floor(matchState.clock % 60);

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg">
      <div className="flex items-center space-x-6">
        <div className="text-2xl font-bold">
          {matchState.score[0]} - {matchState.score[1]}
        </div>
        <div className="text-lg">
          {minutes}:{seconds.toString().padStart(2, '0')}'
        </div>
      </div>
    </div>
  );
}

interface MatchViewer3DProps {
  fixtureId: string;
}

export default function MatchViewer3D({ fixtureId }: MatchViewer3DProps) {
  const { currentMatch, selectedFixture, setCurrentMatch } = useFootballStore();
  const [isConnected, setIsConnected] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [isProcessingCompletion, setIsProcessingCompletion] = useState(false);

  useEffect(() => {
    if (!fixtureId) return;

    // Subscribe to match updates
    const unsubscribe = FootballAPI.subscribeToMatch(fixtureId, {
      onMatchTick: (state: MatchState) => {
        setCurrentMatch(state);
      },
      onMatchEvent: (event) => {
        console.log('Match event:', event);
      },
      onMatchFinal: async (result) => {
        console.log('Match finished:', result);
        setMatchCompleted(true);
        
        // Process match completion
        await handleMatchCompletion(result);
      }
    });

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [fixtureId, setCurrentMatch]);

  const handleMatchCompletion = async (result: any) => {
    if (isProcessingCompletion) return;
    
    setIsProcessingCompletion(true);
    
    try {
      // Create match result object
      const matchResult: MatchResult = {
        homeScore: result.score[0],
        awayScore: result.score[1],
        matchEvents: result.events || [],
        matchStats: {
          homePossession: result.stats?.homePossession || 50,
          awayPossession: result.stats?.awayPossession || 50,
          homeShots: result.stats?.homeShots || 0,
          awayShots: result.stats?.awayShots || 0,
          homeShotsOnTarget: result.stats?.homeShotsOnTarget || 0,
          awayShotsOnTarget: result.stats?.awayShotsOnTarget || 0,
          homeCorners: result.stats?.homeCorners || 0,
          awayCorners: result.stats?.awayCorners || 0,
          homeFouls: result.stats?.homeFouls || 0,
          awayFouls: result.stats?.awayFouls || 0,
          homeYellowCards: result.stats?.homeYellowCards || 0,
          awayYellowCards: result.stats?.awayYellowCards || 0,
          homeRedCards: result.stats?.homeRedCards || 0,
          awayRedCards: result.stats?.awayRedCards || 0,
        },
        playerPerformances: result.playerPerformances || [],
        simulationDuration: result.duration || 0
      };

      // Complete the match and handle season progression
      const completionResult = await matchOrchestrator.completeMatch(fixtureId, matchResult);
      
      if (completionResult.success) {
        console.log('Match completed successfully');
        
        if (completionResult.seasonProgressed) {
          console.log('🎉 New season started! Promotions and relegations processed.');
        }
        
        // Wait a moment to show final score, then redirect
        setTimeout(() => {
          window.location.href = '/dashboard'; // or wherever you want to redirect
        }, 5000);
      } else {
        console.error('Failed to complete match:', completionResult.error);
      }
    } catch (error) {
      console.error('Error processing match completion:', error);
    } finally {
      setIsProcessingCompletion(false);
    }
  };

  if (!currentMatch) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {isConnected ? 'Loading match...' : 'Connecting to match...'}
        </div>
      </div>
    );
  }

  const homePlayers = currentMatch.players.filter(p => 
    selectedFixture?.home_team_id && p.team_id === selectedFixture.home_team_id
  );
  const awayPlayers = currentMatch.players.filter(p => 
    selectedFixture?.away_team_id && p.team_id === selectedFixture.away_team_id
  );

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <MatchHUD matchState={currentMatch} />
      
      {/* Match Completion Overlay */}
      {matchCompleted && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Match Completed!</h2>
            <div className="text-4xl font-bold mb-4">
              {currentMatch.score[0]} - {currentMatch.score[1]}
            </div>
            <div className="text-gray-600 mb-4">
              {selectedFixture?.home_team.name} vs {selectedFixture?.away_team.name}
            </div>
            
            {isProcessingCompletion ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Processing results...</span>
              </div>
            ) : (
              <div className="text-green-600 font-semibold">
                ✅ Results saved! Advancing to next match...
              </div>
            )}
          </div>
        </div>
      )}
      
      <Canvas
        camera={{ 
          position: [0, 50, 80], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[50, 50, 50]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        <FootballPitch />
        <Ball3D position={currentMatch.ball.pos} />
        
        {homePlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            color={selectedFixture?.home_team.primary_color || "#ff0000"} 
          />
        ))}
        
        {awayPlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            color={selectedFixture?.away_team.primary_color || "#0000ff"} 
          />
        ))}
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={20}
          maxDistance={200}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Match Info</h3>
        <p>Phase: {currentMatch.phase}</p>
        <p>Active Players: {currentMatch.players.length}</p>
        {currentMatch.active_event && (
          <p>Event: {currentMatch.active_event}</p>
        )}
        {matchCompleted && (
          <div className="mt-2 text-green-400">
            <p>✅ Match Completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { useFootballStore, MatchState, PlayerState } from '@/lib/football-store';
import { FootballAPI } from '@/lib/football-api';
import * as THREE from 'three';

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
      onMatchFinal: (result) => {
        console.log('Match finished:', result);
      }
    });

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [fixtureId, setCurrentMatch]);

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
      </div>
    </div>
  );
}
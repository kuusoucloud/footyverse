'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Plane } from '@react-three/drei';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useFootballStore, MatchState, PlayerState } from '@/lib/football-store';
import { FootballAPI } from '@/lib/football-api';
import * as THREE from 'three';
import { matchOrchestrator, MatchResult } from '@/lib/match-orchestrator';

// Enhanced 3D Match Engine Types
interface Player3DState {
  id: string;
  name: string;
  position: string;
  team_id: string;
  overall_rating: number;
  form: number;
  currentPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  velocity: THREE.Vector3;
  hasBall: boolean;
  isSelected: boolean;
  stamina: number;
  matchRating: number;
  stats: {
    goals: number;
    assists: number;
    shots: number;
    passes: number;
    tackles: number;
    fouls: number;
    cards: number;
  };
}

interface Ball3DState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isInPlay: boolean;
  lastTouchedBy: string | null;
}

interface Match3DState {
  minute: number;
  second: number;
  half: 1 | 2;
  phase: 'kickoff' | 'play' | 'freekick' | 'corner' | 'penalty' | 'throw_in' | 'goal_kick' | 'halftime' | 'fulltime';
  homeScore: number;
  awayScore: number;
  homePlayers: Player3DState[];
  awayPlayers: Player3DState[];
  ball: Ball3DState;
  events: MatchEvent[];
  possession: { home: number; away: number };
  lastEvent: MatchEvent | null;
  referee: {
    position: THREE.Vector3;
    decision: string | null;
  };
}

interface MatchEvent {
  minute: number;
  second: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'foul' | 'corner' | 'freekick' | 'penalty' | 'substitution' | 'offside';
  player_id?: string;
  team_id: string;
  description: string;
  position?: THREE.Vector3;
}

// Football Manager-style Camera Controller
function MatchCamera({ matchState, cameraMode }: { matchState: Match3DState; cameraMode: string }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const ball = matchState.ball.position;
    
    switch (cameraMode) {
      case 'broadcast':
        // Follow ball with smooth broadcast-style movement
        const targetX = ball.x * 0.8;
        const targetZ = ball.z * 0.6 + 60;
        const targetY = 25 + Math.abs(ball.x) * 0.1;
        
        camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.02);
        camera.lookAt(ball.x, 0, ball.z);
        break;
        
      case 'tactical':
        // High tactical view
        camera.position.lerp(new THREE.Vector3(0, 80, 0), 0.05);
        camera.lookAt(0, 0, 0);
        break;
        
      case 'behind_goal':
        // Behind goal view
        const goalSide = ball.x > 0 ? 1 : -1;
        camera.position.lerp(new THREE.Vector3(goalSide * 60, 15, ball.z * 0.3), 0.03);
        camera.lookAt(ball.x, 0, ball.z);
        break;
        
      case 'sideline':
        // Sideline view following play
        camera.position.lerp(new THREE.Vector3(ball.x, 12, 40), 0.03);
        camera.lookAt(ball.x, 0, ball.z);
        break;
        
      case 'manual':
        // Don't override camera when in manual mode
        break;
    }
  });

  return null;
}

// Enhanced 3D Player with realistic movement
function Player3D({ player, teamColor, isHome }: { 
  player: Player3DState; 
  teamColor: string; 
  isHome: boolean;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smooth movement towards target position
    const distance = player.currentPos.distanceTo(player.targetPos);
    if (distance > 0.1) {
      const direction = player.targetPos.clone().sub(player.currentPos).normalize();
      const speed = Math.min(distance * 2, player.stamina * 0.01 + 0.1);
      
      player.currentPos.add(direction.multiplyScalar(speed * delta * 60));
      setIsRunning(speed > 0.05);
      
      // Face movement direction
      if (speed > 0.02) {
        const angle = Math.atan2(direction.x, direction.z);
        meshRef.current.rotation.y = angle;
      }
    } else {
      setIsRunning(false);
    }
    
    meshRef.current.position.copy(player.currentPos);
    
    // Bobbing animation when running
    if (isRunning) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.1;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Player body */}
      <Box args={[0.8, 1.8, 0.4]} position={[0, 0.9, 0]}>
        <meshStandardMaterial color={teamColor} />
      </Box>
      
      {/* Player head */}
      <Sphere args={[0.3]} position={[0, 1.9, 0]}>
        <meshStandardMaterial color="#ffdbac" />
      </Sphere>
      
      {/* Player number */}
      <Text
        position={[0, 1.0, 0.25]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {player.name.split(' ').pop()?.slice(0, 3).toUpperCase()}
      </Text>
      
      {/* Ball at feet if player has possession */}
      {player.hasBall && (
        <Sphere args={[0.11]} position={[0, 0.2, 0.6]}>
          <meshStandardMaterial color="white" />
        </Sphere>
      )}
      
      {/* Selection indicator */}
      {player.isSelected && (
        <Cylinder args={[1, 1, 0.1]} position={[0, 0.05, 0]}>
          <meshStandardMaterial color="yellow" transparent opacity={0.3} />
        </Cylinder>
      )}
      
      {/* Performance indicator */}
      <Box args={[1.2, 0.1, 0.1]} position={[0, 2.5, 0]}>
        <meshStandardMaterial 
          color={player.matchRating > 7 ? 'green' : player.matchRating > 5 ? 'yellow' : 'red'} 
        />
      </Box>
    </group>
  );
}

// Enhanced Football Pitch with realistic details
function FootballPitch() {
  return (
    <group>
      {/* Main pitch */}
      <Plane args={[105, 68]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#2d5a27" />
      </Plane>
      
      {/* Pitch markings */}
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[9.15, 9.25, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Center line */}
      <Box args={[0.12, 0.02, 68]} position={[0, 0.01, 0]}>
        <meshStandardMaterial color="white" />
      </Box>
      
      {/* Penalty areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40.32, 0.01, 0]}>
        <ringGeometry args={[0, 16.5, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[40.32, 0.01, 0]}>
        <ringGeometry args={[0, 16.5, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
      
      {/* Goals */}
      <group position={[-52.5, 0, 0]}>
        <Box args={[0.2, 2.44, 7.32]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 2.44, 0.2]} position={[0, 0, 3.66]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 2.44, 0.2]} position={[0, 0, -3.66]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 0.2, 7.32]} position={[0, 2.44, 0]}>
          <meshStandardMaterial color="white" />
        </Box>
      </group>
      
      <group position={[52.5, 0, 0]}>
        <Box args={[0.2, 2.44, 7.32]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 2.44, 0.2]} position={[0, 0, 3.66]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 2.44, 0.2]} position={[0, 0, -3.66]}>
          <meshStandardMaterial color="white" />
        </Box>
        <Box args={[0.2, 0.2, 7.32]} position={[0, 2.44, 0]}>
          <meshStandardMaterial color="white" />
        </Box>
      </group>
      
      {/* Corner flags */}
      {[[-52.5, 34], [-52.5, -34], [52.5, 34], [52.5, -34]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cylinder args={[0.05, 0.05, 1.5]} position={[0, 0.75, 0]}>
            <meshStandardMaterial color="white" />
          </Cylinder>
          <Box args={[0.3, 0.2, 0.02]} position={[0, 1.4, 0]}>
            <meshStandardMaterial color="red" />
          </Box>
        </group>
      ))}
      
      {/* Stadium atmosphere */}
      <Box args={[120, 20, 80]} position={[0, 10, 0]}>
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.1} />
      </Box>
    </group>
  );
}

// Enhanced Ball with physics
function Ball3D({ ballState }: { ballState: Ball3DState }) {
  const ballRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!ballRef.current) return;
    
    ballRef.current.position.copy(ballState.position);
    
    // Ball rotation based on movement
    if (ballState.velocity.length() > 0.1) {
      ballRef.current.rotation.x += ballState.velocity.z * delta * 2;
      ballRef.current.rotation.z -= ballState.velocity.x * delta * 2;
    }
  });

  return (
    <Sphere ref={ballRef} args={[0.11]}>
      <meshStandardMaterial 
        color="white" 
        roughness={0.3}
        metalness={0.1}
      />
    </Sphere>
  );
}

// Referee 3D model
function Referee3D({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={[position.x, 0, position.z]}>
      <Box args={[0.6, 1.6, 0.3]} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#000000" />
      </Box>
      <Sphere args={[0.25]} position={[0, 1.7, 0]}>
        <meshStandardMaterial color="#ffdbac" />
      </Sphere>
    </group>
  );
}

// Enhanced Match HUD
function MatchHUD({ matchState, onCameraChange }: { 
  matchState: Match3DState; 
  onCameraChange: (mode: string) => void;
}) {
  const formatTime = (minute: number, second: number) => {
    return `${minute}:${second.toString().padStart(2, '0')}'`;
  };

  return (
    <>
      {/* Main scoreboard */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-8 py-4 rounded-lg border border-white/20">
        <div className="flex items-center space-x-8">
          <div className="text-3xl font-bold">
            {matchState.homeScore} - {matchState.awayScore}
          </div>
          <div className="text-xl">
            {formatTime(matchState.minute, matchState.second)}
          </div>
          <div className="text-sm bg-red-600 px-2 py-1 rounded">
            {matchState.half === 1 ? '1ST HALF' : '2ND HALF'}
          </div>
        </div>
      </div>

      {/* Match phase indicator */}
      {matchState.phase !== 'play' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold">
          {matchState.phase.toUpperCase().replace('_', ' ')}
        </div>
      )}

      {/* Camera controls */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Camera</h3>
        <div className="space-y-2">
          {['broadcast', 'tactical', 'behind_goal', 'sideline', 'manual'].map(mode => (
            <button
              key={mode}
              onClick={() => onCameraChange(mode)}
              className="block w-full text-left px-2 py-1 hover:bg-white/20 rounded text-sm"
            >
              {mode.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Possession stats */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg">
        <h3 className="font-bold mb-2">Possession</h3>
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold text-blue-400">{matchState.possession.home}%</div>
          <div className="w-32 h-2 bg-gray-600 rounded">
            <div 
              className="h-full bg-blue-400 rounded"
              style={{ width: `${matchState.possession.home}%` }}
            />
          </div>
          <div className="text-2xl font-bold text-red-400">{matchState.possession.away}%</div>
        </div>
      </div>

      {/* Recent events */}
      <div className="absolute bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-md">
        <h3 className="font-bold mb-2">Recent Events</h3>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {matchState.events.slice(-5).reverse().map((event, i) => (
            <div key={i} className="text-sm flex items-center space-x-2">
              <span className="text-gray-400">{formatTime(event.minute, event.second)}</span>
              <span className={
                event.type === 'goal' ? 'text-green-400' :
                event.type === 'yellow_card' ? 'text-yellow-400' :
                event.type === 'red_card' ? 'text-red-400' :
                'text-white'
              }>
                {event.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last event popup */}
      {matchState.lastEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black p-6 rounded-lg shadow-2xl border-4 border-yellow-400">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">
              {matchState.lastEvent.type === 'goal' ? '⚽ GOAL!' :
               matchState.lastEvent.type === 'yellow_card' ? '🟨 YELLOW CARD' :
               matchState.lastEvent.type === 'red_card' ? '🟥 RED CARD' :
               matchState.lastEvent.type.toUpperCase()}
            </div>
            <div className="text-lg">{matchState.lastEvent.description}</div>
            <div className="text-sm text-gray-600 mt-2">
              {formatTime(matchState.lastEvent.minute, matchState.lastEvent.second)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface MatchViewer3DProps {
  fixtureId: string;
}

export default function MatchViewer3D({ fixtureId }: MatchViewer3DProps) {
  const [matchState, setMatchState] = useState<Match3DState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [cameraMode, setCameraMode] = useState('broadcast');
  const simulationRef = useRef<NodeJS.Timeout | null>(null);

  // Convert API data to 3D objects
  const convertToMatch3DState = (apiData: any): Match3DState => {
    return {
      ...apiData,
      homePlayers: apiData.homePlayers.map((player: any) => ({
        ...player,
        currentPos: new THREE.Vector3(player.currentPos.x, player.currentPos.y, player.currentPos.z),
        targetPos: new THREE.Vector3(player.targetPos.x, player.targetPos.y, player.targetPos.z),
        velocity: new THREE.Vector3(player.velocity.x, player.velocity.y, player.velocity.z)
      })),
      awayPlayers: apiData.awayPlayers.map((player: any) => ({
        ...player,
        currentPos: new THREE.Vector3(player.currentPos.x, player.currentPos.y, player.currentPos.z),
        targetPos: new THREE.Vector3(player.targetPos.x, player.targetPos.y, player.targetPos.z),
        velocity: new THREE.Vector3(player.velocity.x, player.velocity.y, player.velocity.z)
      })),
      ball: {
        ...apiData.ball,
        position: new THREE.Vector3(apiData.ball.position.x, apiData.ball.position.y, apiData.ball.position.z),
        velocity: new THREE.Vector3(apiData.ball.velocity.x, apiData.ball.velocity.y, apiData.ball.velocity.z)
      },
      referee: {
        ...apiData.referee,
        position: new THREE.Vector3(apiData.referee.position.x, apiData.referee.position.y, apiData.referee.position.z)
      }
    };
  };

  // Initialize match simulation
  useEffect(() => {
    if (!fixtureId) return;

    const initializeMatch = async () => {
      try {
        // Start the 3D match simulation
        const response = await fetch('/api/match/start-3d-simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fixtureId })
        });

        if (!response.ok) throw new Error('Failed to start simulation');
        
        const initialState = await response.json();
        setMatchState(convertToMatch3DState(initialState));
        setIsConnected(true);

        // Start real-time simulation loop
        startSimulationLoop();
      } catch (error) {
        console.error('Failed to initialize match:', error);
      }
    };

    initializeMatch();

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [fixtureId]);

  const startSimulationLoop = () => {
    simulationRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/match/simulation-tick/${fixtureId}`);
        if (!response.ok) return;
        
        const updatedState = await response.json();
        
        if (updatedState.phase === 'fulltime') {
          setMatchCompleted(true);
          if (simulationRef.current) {
            clearInterval(simulationRef.current);
          }
          await handleMatchCompletion(convertToMatch3DState(updatedState));
        } else {
          setMatchState(convertToMatch3DState(updatedState));
        }
      } catch (error) {
        console.error('Simulation tick error:', error);
      }
    }, 100); // 10 FPS simulation
  };

  const handleMatchCompletion = async (finalState: Match3DState) => {
    try {
      const response = await fetch('/api/match/complete-3d-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fixtureId, 
          finalState,
          playerPerformances: [
            ...finalState.homePlayers.map(p => ({
              player_id: p.id,
              team_id: p.team_id,
              minutes_played: finalState.minute,
              goals: p.stats.goals,
              assists: p.stats.assists,
              shots: p.stats.shots,
              passes_completed: Math.floor(p.stats.passes * 0.8),
              passes_attempted: p.stats.passes,
              tackles: p.stats.tackles,
              fouls_committed: p.stats.fouls,
              yellow_cards: p.stats.cards,
              match_rating: p.matchRating
            })),
            ...finalState.awayPlayers.map(p => ({
              player_id: p.id,
              team_id: p.team_id,
              minutes_played: finalState.minute,
              goals: p.stats.goals,
              assists: p.stats.assists,
              shots: p.stats.shots,
              passes_completed: Math.floor(p.stats.passes * 0.8),
              passes_attempted: p.stats.passes,
              tackles: p.stats.tackles,
              fouls_committed: p.stats.fouls,
              yellow_cards: p.stats.cards,
              match_rating: p.matchRating
            }))
          ]
        })
      });

      if (response.ok) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to complete match:', error);
    }
  };

  if (!matchState) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          {isConnected ? 'Loading match...' : 'Connecting to match...'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      <MatchHUD matchState={matchState} onCameraChange={setCameraMode} />
      
      {matchCompleted && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">Full Time!</h2>
            <div className="text-4xl font-bold mb-4">
              {matchState.homeScore} - {matchState.awayScore}
            </div>
            <div className="text-gray-600 mb-4">Match completed successfully</div>
            <div className="text-green-600 font-semibold">
              ✅ Results saved! Returning to dashboard...
            </div>
          </div>
        </div>
      )}
      
      <Canvas
        camera={{ 
          position: [0, 25, 60], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.2}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={200}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={10}
          maxDistance={200}
        />
        
        <MatchCamera matchState={matchState} cameraMode={cameraMode} />
        <FootballPitch />
        <Ball3D ballState={matchState.ball} />
        <Referee3D position={matchState.referee.position} />
        
        {matchState.homePlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            teamColor="#ff0000"
            isHome={true}
          />
        ))}
        
        {matchState.awayPlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            teamColor="#0000ff"
            isHome={false}
          />
        ))}
      </Canvas>
    </div>
  );
}
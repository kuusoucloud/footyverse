'use client';

import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cylinder, Plane, Environment, Sky, ContactShadows, useGLTF, Html } from '@react-three/drei';
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

// Cinematic Camera Controller with smooth transitions
function MatchCamera({ matchState, cameraMode }: { matchState: Match3DState; cameraMode: string }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  
  useFrame((state, delta) => {
    const ball = matchState.ball.position;
    
    switch (cameraMode) {
      case 'broadcast':
        // Dynamic broadcast camera that follows action
        const ballSpeed = matchState.ball.velocity.length();
        const cameraHeight = 20 + ballSpeed * 5;
        const cameraDistance = 45 + ballSpeed * 10;
        
        targetPosition.current.set(
          ball.x * 0.3,
          cameraHeight,
          ball.z * 0.4 + cameraDistance
        );
        targetLookAt.current.set(ball.x, 0, ball.z);
        break;
        
      case 'tactical':
        // High tactical overview
        targetPosition.current.set(0, 60, 20);
        targetLookAt.current.set(0, 0, 0);
        break;
        
      case 'behind_goal':
        // Behind goal with dynamic positioning
        const goalSide = ball.x > 0 ? 1 : -1;
        targetPosition.current.set(goalSide * 65, 12, ball.z * 0.2);
        targetLookAt.current.set(ball.x, 2, ball.z);
        break;
        
      case 'sideline':
        // Sideline tracking camera
        targetPosition.current.set(ball.x * 0.8, 8, 45);
        targetLookAt.current.set(ball.x, 0, ball.z);
        break;
        
      case 'player_cam':
        // Follow closest player to ball
        const allPlayers = [...matchState.homePlayers, ...matchState.awayPlayers];
        const closestPlayer = allPlayers.reduce((closest, player) => {
          const distToBall = player.currentPos.distanceTo(ball);
          const closestDist = closest.currentPos.distanceTo(ball);
          return distToBall < closestDist ? player : closest;
        });
        
        const behindPlayer = closestPlayer.currentPos.clone().add(
          new THREE.Vector3(0, 3, -8)
        );
        targetPosition.current.copy(behindPlayer);
        targetLookAt.current.copy(ball);
        break;
        
      case 'manual':
        // Don't override manual camera control
        return;
    }
    
    // Smooth camera transitions
    camera.position.lerp(targetPosition.current, delta * 2);
    
    // Smooth look-at with some prediction
    const lookAtTarget = targetLookAt.current.clone();
    if (matchState.ball.velocity.length() > 0.1) {
      lookAtTarget.add(matchState.ball.velocity.clone().multiplyScalar(2));
    }
    
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(-1).add(camera.position);
    
    currentLookAt.lerp(lookAtTarget, delta * 3);
    camera.lookAt(currentLookAt);
  });

  return null;
}

// Ultra-realistic Player with detailed animations
function Player3D({ player, teamColor, isHome }: { 
  player: Player3DState; 
  teamColor: string; 
  isHome: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runCycle, setRunCycle] = useState(0);
  const previousPosition = useRef(new THREE.Vector3());
  
  useFrame((state, delta) => {
    if (!groupRef.current || !bodyRef.current) return;
    
    // Calculate movement speed and direction
    const currentPos = new THREE.Vector3(player.currentPos.x, 0, player.currentPos.z);
    const targetPos = new THREE.Vector3(player.targetPos.x, 0, player.targetPos.z);
    const distance = currentPos.distanceTo(targetPos);
    
    if (distance > 0.2) {
      // Calculate movement speed based on player attributes
      const baseSpeed = (player.overall_rating / 100) * 8 + 2; // 2-10 units/sec
      const staminaMultiplier = player.stamina / 100;
      const speed = baseSpeed * staminaMultiplier * delta;
      
      // Move towards target
      const direction = targetPos.clone().sub(currentPos).normalize();
      const movement = direction.multiplyScalar(Math.min(speed, distance));
      
      player.currentPos.add(movement);
      setIsRunning(true);
      
      // Face movement direction with smooth rotation
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, 
        angle, 
        delta * 8
      );
      
      // Running animation cycle
      setRunCycle(prev => prev + delta * 10);
    } else {
      setIsRunning(false);
      setRunCycle(0);
    }
    
    // Update position
    groupRef.current.position.copy(player.currentPos);
    
    // Advanced running animation
    if (isRunning) {
      const bobAmount = 0.15;
      const bobSpeed = 12;
      groupRef.current.position.y = Math.sin(runCycle * bobSpeed) * bobAmount;
      
      // Body lean when running
      bodyRef.current.rotation.x = Math.sin(runCycle * bobSpeed) * 0.1;
      bodyRef.current.rotation.z = Math.sin(runCycle * bobSpeed * 0.5) * 0.05;
    } else {
      // Idle breathing animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      bodyRef.current.rotation.x = 0;
      bodyRef.current.rotation.z = 0;
    }
    
    // Performance-based glow effect
    if (player.matchRating > 8) {
      bodyRef.current.material.emissive.setHex(0x004400);
      bodyRef.current.material.emissiveIntensity = 0.2;
    } else if (player.matchRating < 4) {
      bodyRef.current.material.emissive.setHex(0x440000);
      bodyRef.current.material.emissiveIntensity = 0.1;
    } else {
      bodyRef.current.material.emissive.setHex(0x000000);
      bodyRef.current.material.emissiveIntensity = 0;
    }
    
    previousPosition.current.copy(player.currentPos);
  });

  // Player jersey number
  const jerseyNumber = Math.floor(Math.random() * 99) + 1;

  return (
    <group ref={groupRef}>
      {/* Player shadow */}
      <ContactShadows 
        position={[0, -0.01, 0]} 
        scale={2} 
        blur={2} 
        far={2} 
        opacity={0.4} 
      />
      
      {/* Player body with realistic proportions */}
      <mesh ref={bodyRef} position={[0, 1, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 1.2, 8, 16]} />
        <meshStandardMaterial 
          color={teamColor}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Player head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#ffdbac" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial 
          color={Math.random() > 0.5 ? "#2d1810" : "#8b4513"} 
          roughness={1.0}
        />
      </mesh>
      
      {/* Jersey number */}
      <Text
        position={[0, 1.2, 0.32]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/roboto-bold.woff"
      >
        {jerseyNumber}
      </Text>
      
      {/* Player name above head */}
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-black/70 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {player.name.split(' ').pop()}
        </div>
      </Html>
      
      {/* Ball at feet if player has possession */}
      {player.hasBall && (
        <group position={[0, 0.15, 0.8]}>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial 
              color="white" 
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
          {/* Ball glow effect */}
          <pointLight intensity={0.5} color="#ffff00" distance={2} />
        </group>
      )}
      
      {/* Selection indicator */}
      {player.isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Performance indicator ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.9, 32]} />
        <meshBasicMaterial 
          color={
            player.matchRating > 8 ? '#00ff00' :
            player.matchRating > 7 ? '#88ff00' :
            player.matchRating > 6 ? '#ffff00' :
            player.matchRating > 5 ? '#ff8800' :
            '#ff0000'
          }
          transparent 
          opacity={0.6} 
        />
      </mesh>
      
      {/* Stamina indicator */}
      <Html position={[0, 2.8, 0]} center>
        <div className="w-8 h-1 bg-gray-600 rounded">
          <div 
            className="h-full bg-green-400 rounded transition-all duration-300"
            style={{ width: `${player.stamina}%` }}
          />
        </div>
      </Html>
    </group>
  );
}

// Stadium-quality Football Pitch
function FootballPitch() {
  const grassTexture = useLoader(THREE.TextureLoader, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJncmFzcyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIj4KICAgICAgPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMmQ1YTI3Ii8+CiAgICAgIDxyZWN0IHdpZHRoPSI1IiBoZWlnaHQ9IjEwIiBmaWxsPSIjMzQ2ODJkIi8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYXNzKSIvPgo8L3N2Zz4K');
  
  return (
    <group>
      {/* Main pitch with grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[105, 68]} />
        <meshStandardMaterial 
          color="#2d5a27"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Pitch border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[110, 73]} />
        <meshStandardMaterial color="#1a3d1a" />
      </mesh>
      
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[9.15, 9.25, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Center line */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.12, 0.02, 68]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Penalty areas and arcs */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * 40.32, 0, 0]}>
          {/* Penalty area */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0, 16.5, 32, 1, side > 0 ? Math.PI : 0, Math.PI]} />
            <meshStandardMaterial color="white" transparent opacity={0.8} />
          </mesh>
          
          {/* Goal area */}
          <mesh position={[side * 5.5, 0.01, 0]}>
            <boxGeometry args={[11, 0.02, 18.32]} />
            <meshStandardMaterial color="white" transparent opacity={0.3} />
          </mesh>
          
          {/* Penalty spot */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 11, 0.01, 0]}>
            <circleGeometry args={[0.15, 16]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}
      
      {/* Goals with nets */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * 52.5, 0, 0]}>
          {/* Goal posts */}
          <mesh position={[0, 1.22, 3.66]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.44]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 1.22, -3.66]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 2.44]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 2.44, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 7.32]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="white" />
          </mesh>
          
          {/* Goal net */}
          <mesh position={[side * -1, 1.22, 0]}>
            <boxGeometry args={[2, 2.44, 7.32]} />
            <meshStandardMaterial 
              color="white" 
              transparent 
              opacity={0.1}
              wireframe
            />
          </mesh>
        </group>
      ))}
      
      {/* Corner flags */}
      {[[-52.5, 34], [-52.5, -34], [52.5, 34], [52.5, -34]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 1.5]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[0.4, 0.25, 0.02]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        </group>
      ))}
      
      {/* Stadium stands */}
      <group>
        {/* North stand */}
        <mesh position={[0, 15, -50]} castShadow>
          <boxGeometry args={[120, 30, 20]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        
        {/* South stand */}
        <mesh position={[0, 15, 50]} castShadow>
          <boxGeometry args={[120, 30, 20]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        
        {/* East stand */}
        <mesh position={[70, 15, 0]} castShadow>
          <boxGeometry args={[20, 30, 80]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        
        {/* West stand */}
        <mesh position={[-70, 15, 0]} castShadow>
          <boxGeometry args={[20, 30, 80]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>
      
      {/* Stadium lights */}
      {[[-60, 40, -40], [60, 40, -40], [-60, 40, 40], [60, 40, 40]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.5, 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
          <pointLight 
            intensity={2} 
            color="#ffffff" 
            distance={100}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
        </group>
      ))}
    </group>
  );
}

// Professional Ball with physics and effects
function Ball3D({ ballState }: { ballState: Ball3DState }) {
  const ballRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Points>(null);
  const [trailPositions, setTrailPositions] = useState<THREE.Vector3[]>([]);
  
  useFrame((state, delta) => {
    if (!ballRef.current) return;
    
    ballRef.current.position.copy(ballState.position);
    
    // Realistic ball rotation based on movement
    if (ballState.velocity.length() > 0.1) {
      const rotationSpeed = ballState.velocity.length() * 2;
      ballRef.current.rotation.x += ballState.velocity.z * delta * rotationSpeed;
      ballRef.current.rotation.z -= ballState.velocity.x * delta * rotationSpeed;
    }
    
    // Ball trail effect
    setTrailPositions(prev => {
      const newTrail = [ballState.position.clone(), ...prev.slice(0, 10)];
      return newTrail;
    });
    
    // Ball bounce physics
    if (ballState.position.y > 0.11) {
      ballRef.current.position.y = Math.max(0.11, ballState.position.y - delta * 9.8);
    }
  });

  return (
    <group>
      {/* Ball shadow */}
      <ContactShadows 
        position={[ballState.position.x, 0, ballState.position.z]} 
        scale={0.5} 
        blur={1} 
        far={1} 
        opacity={0.6} 
      />
      
      {/* Main ball */}
      <mesh ref={ballRef} castShadow>
        <sphereGeometry args={[0.11, 32, 32]} />
        <meshStandardMaterial 
          color="white" 
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ball glow when moving fast */}
      {ballState.velocity.length() > 5 && (
        <mesh position={ballState.position}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial 
            color="#ffff00" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Speed trail */}
      {trailPositions.length > 1 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={trailPositions.length}
              array={new Float32Array(trailPositions.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </line>
      )}
    </group>
  );
}

// Enhanced Referee with realistic movement
function Referee3D({ position }: { position: THREE.Vector3 }) {
  const refRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!refRef.current) return;
    
    // Referee breathing animation
    refRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
  });

  return (
    <group ref={refRef} position={[position.x, 0, position.z]}>
      {/* Referee body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.25, 1.0, 8, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Referee head */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>
      
      {/* Whistle */}
      <mesh position={[0.1, 1.5, 0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.1]} />
        <meshStandardMaterial color="#silver" />
      </mesh>
      
      {/* Cards */}
      <mesh position={[-0.2, 1.0, 0.2]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.01]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>
      <mesh position={[-0.15, 1.0, 0.2]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.01]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
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

      {/* Enhanced Camera controls */}
      <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm border border-white/20">
        <h3 className="font-bold mb-3 text-lg">📹 Camera</h3>
        <div className="space-y-2">
          {[
            { mode: 'broadcast', label: '📺 BROADCAST', desc: 'TV-style following' },
            { mode: 'tactical', label: '🗺️ TACTICAL', desc: 'Top-down view' },
            { mode: 'behind_goal', label: '🥅 BEHIND GOAL', desc: 'Goal-line view' },
            { mode: 'sideline', label: '📐 SIDELINE', desc: 'Side tracking' },
            { mode: 'player_cam', label: '🏃 PLAYER CAM', desc: 'Follow closest player' },
            { mode: 'manual', label: '🎮 MANUAL', desc: 'Free control' }
          ].map(({ mode, label, desc }) => (
            <button
              key={mode}
              onClick={() => onCameraChange(mode)}
              className={`block w-full text-left px-3 py-2 rounded text-sm transition-all ${
                cameraMode === mode 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-white/20'
              }`}
            >
              <div className="font-semibold">{label}</div>
              <div className="text-xs text-gray-300">{desc}</div>
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
        shadows="soft"
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          shadowMap: true
        }}
      >
        {/* Advanced lighting setup */}
        <ambientLight intensity={0.3} color="#87CEEB" />
        
        {/* Main sun light */}
        <directionalLight 
          position={[100, 100, 50]} 
          intensity={1.5}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={300}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-bias={-0.0001}
        />
        
        {/* Stadium flood lights */}
        <pointLight position={[-60, 40, -40]} intensity={1.2} color="#ffffff" castShadow />
        <pointLight position={[60, 40, -40]} intensity={1.2} color="#ffffff" castShadow />
        <pointLight position={[-60, 40, 40]} intensity={1.2} color="#ffffff" castShadow />
        <pointLight position={[60, 40, 40]} intensity={1.2} color="#ffffff" castShadow />
        
        {/* Atmospheric effects */}
        <fog attach="fog" args={['#87CEEB', 100, 300]} />
        <Sky 
          distance={450000}
          sunPosition={[100, 100, 50]}
          inclination={0.49}
          azimuth={0.25}
        />
        
        {/* Camera controls with constraints */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          minDistance={5}
          maxDistance={150}
          enableDamping={true}
          dampingFactor={0.05}
        />
        
        <MatchCamera matchState={matchState} cameraMode={cameraMode} />
        <FootballPitch />
        <Ball3D ballState={matchState.ball} />
        <Referee3D position={matchState.referee.position} />
        
        {matchState.homePlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            teamColor="#DC143C"
            isHome={true}
          />
        ))}
        
        {matchState.awayPlayers.map(player => (
          <Player3D 
            key={player.id} 
            player={player} 
            teamColor="#1E90FF"
            isHome={false}
          />
        ))}
        
        {/* Environmental effects */}
        <Environment preset="sunset" background={false} />
      </Canvas>
    </div>
  );
}
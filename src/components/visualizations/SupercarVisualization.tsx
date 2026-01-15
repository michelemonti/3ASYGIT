import { useRef, useMemo, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

// ============================================================================
// CONFIGURATION
// ============================================================================
const TRACK_RADIUS = 15;
const TRACK_WIDTH = 4;
const CAR_LENGTH = 1.2;
const CAR_WIDTH = 0.5;
const CAR_HEIGHT = 0.3;

// Speed calculation: 1000 commits = 100 km/h, 3000 commits = 300 km/h
// Formula: speed = commits / 10 (with min 30 and max 350)
function getSpeedFromCommits(commits: number): number {
  const speed = commits / 10;
  return Math.max(30, Math.min(350, speed));
}

// ============================================================================
// RACE TRACK
// ============================================================================
function RaceTrack() {
  const trackRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={trackRef} rotation={[0, 0, 0]}>
      {/* Outer track boundary */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[TRACK_RADIUS - TRACK_WIDTH / 2, TRACK_RADIUS + TRACK_WIDTH / 2, 64]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>
      
      {/* Track lines - outer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[TRACK_RADIUS + TRACK_WIDTH / 2 - 0.1, TRACK_RADIUS + TRACK_WIDTH / 2, 64]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Track lines - inner */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[TRACK_RADIUS - TRACK_WIDTH / 2, TRACK_RADIUS - TRACK_WIDTH / 2 + 0.1, 64]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Center dashed line - alternating segments */}
      {Array.from({ length: 48 }).map((_, i) => {
        // Only render every other segment for dashed effect
        if (i % 2 === 1) return null;
        const startAngle = (i / 48) * Math.PI * 2;
        const endAngle = ((i + 1) / 48) * Math.PI * 2;
        const midAngle = (startAngle + endAngle) / 2;
        return (
          <mesh 
            key={i} 
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.025, 0]}
          >
            <ringGeometry args={[TRACK_RADIUS - 0.08, TRACK_RADIUS + 0.08, 3, 1, startAngle, (endAngle - startAngle) * 0.7]} />
            <meshBasicMaterial color="#ffff00" side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      
      {/* Start/Finish line */}
      <mesh position={[TRACK_RADIUS, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TRACK_WIDTH, 0.5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Checkered pattern on start line */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh 
          key={`check-${i}`} 
          position={[TRACK_RADIUS + (i % 2 === 0 ? -0.8 : 0.8), 0.035, (i - 3.5) * 0.12]} 
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.3, 0.12]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#000000" : "#ffffff"} />
        </mesh>
      ))}
      
      {/* Ground inside track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[TRACK_RADIUS - TRACK_WIDTH / 2 - 0.2, 64]} />
        <meshStandardMaterial color="#0d4d0d" metalness={0.1} roughness={0.9} />
      </mesh>
      
      {/* Ground outside track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[TRACK_RADIUS + TRACK_WIDTH / 2 + 0.2, 50, 64]} />
        <meshStandardMaterial color="#1a3d1a" metalness={0.1} roughness={0.9} />
      </mesh>
    </group>
  );
}

// ============================================================================
// SUPERCAR
// ============================================================================
interface SupercarProps {
  speed: number; // km/h
  color: string;
}

function Supercar({ speed, color }: SupercarProps) {
  const carRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const angleRef = useRef(0);
  
  // Convert km/h to angular velocity (radians per frame)
  // At 100 km/h, complete one lap in ~3 seconds
  const angularSpeed = (speed / 100) * 0.02;
  
  useFrame(() => {
    if (carRef.current) {
      angleRef.current += angularSpeed;
      const x = Math.cos(angleRef.current) * TRACK_RADIUS;
      const z = Math.sin(angleRef.current) * TRACK_RADIUS;
      
      carRef.current.position.x = x;
      carRef.current.position.z = z;
      carRef.current.rotation.y = -angleRef.current + Math.PI / 2;
      
      // Rotate wheels
      wheelRefs.current.forEach(wheel => {
        if (wheel) wheel.rotation.x += angularSpeed * 5;
      });
    }
  });
  
  return (
    <group ref={carRef} position={[TRACK_RADIUS, 0.15, 0]}>
      {/* Main body - sleek low profile */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[1.8, 0.18, 0.7]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Nose cone - pointed front */}
      <mesh position={[0.95, 0.06, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Cockpit - driver area */}
      <mesh position={[0.1, 0.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.45]} />
        <meshStandardMaterial color="#111111" metalness={0.3} roughness={0.5} />
      </mesh>
      
      {/* Cockpit windshield */}
      <mesh position={[0.4, 0.22, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.25, 0.12, 0.42]} />
        <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.2} transparent opacity={0.8} />
      </mesh>
      
      {/* Side pods - air intakes */}
      <mesh position={[-0.1, 0.12, 0.42]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-0.1, 0.12, -0.42]} castShadow>
        <boxGeometry args={[0.8, 0.15, 0.12]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Front wing */}
      <mesh position={[1.1, 0.02, 0]}>
        <boxGeometry args={[0.3, 0.03, 0.9]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Front wing end plates */}
      <mesh position={[1.1, 0.05, 0.48]}>
        <boxGeometry args={[0.25, 0.1, 0.03]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.1, 0.05, -0.48]}>
        <boxGeometry args={[0.25, 0.1, 0.03]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Rear wing - large */}
      <mesh position={[-0.85, 0.35, 0]}>
        <boxGeometry args={[0.25, 0.04, 0.85]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Rear wing supports */}
      <mesh position={[-0.85, 0.22, 0.35]}>
        <boxGeometry args={[0.05, 0.25, 0.04]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.85, 0.22, -0.35]}>
        <boxGeometry args={[0.05, 0.25, 0.04]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Rear wing end plates */}
      <mesh position={[-0.85, 0.32, 0.45]}>
        <boxGeometry args={[0.2, 0.12, 0.03]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-0.85, 0.32, -0.45]}>
        <boxGeometry args={[0.2, 0.12, 0.03]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Wheels - larger, more visible */}
      {[
        { pos: [0.6, 0, 0.45] as [number, number, number], isFront: true },
        { pos: [0.6, 0, -0.45] as [number, number, number], isFront: true },
        { pos: [-0.55, 0, 0.45] as [number, number, number], isFront: false },
        { pos: [-0.55, 0, -0.45] as [number, number, number], isFront: false },
      ].map((wheel, i) => (
        <group key={i} position={wheel.pos}>
          {/* Tire */}
          <mesh ref={el => { if (el) wheelRefs.current[i] = el; }} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[wheel.isFront ? 0.12 : 0.14, wheel.isFront ? 0.12 : 0.14, 0.12, 16]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.2} roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.13, 8]} />
            <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
      
      {/* Headlights glow */}
      <pointLight position={[1.1, 0.1, 0.2]} color="#ffffff" intensity={1} distance={5} />
      <pointLight position={[1.1, 0.1, -0.2]} color="#ffffff" intensity={1} distance={5} />
      
      {/* Tail lights */}
      <mesh position={[-0.9, 0.1, 0.25]}>
        <boxGeometry args={[0.02, 0.04, 0.08]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <mesh position={[-0.9, 0.1, -0.25]}>
        <boxGeometry args={[0.02, 0.04, 0.08]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Neon underglow */}
      <pointLight position={[0, -0.05, 0]} color={color} intensity={2} distance={1.5} />
    </group>
  );
}

// ============================================================================
// DECORATIONS
// ============================================================================
function TrackDecorations() {
  const trees = useMemo(() => {
    const result: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = TRACK_RADIUS + TRACK_WIDTH / 2 + 3 + Math.random() * 5;
      result.push({
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
        scale: 0.5 + Math.random() * 0.5,
      });
    }
    return result;
  }, []);
  
  return (
    <group>
      {trees.map((tree, i) => (
        <group key={i} position={tree.position}>
          {/* Tree trunk */}
          <mesh position={[0, 0.5 * tree.scale, 0]}>
            <cylinderGeometry args={[0.1 * tree.scale, 0.15 * tree.scale, 1 * tree.scale, 8]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
          {/* Tree foliage */}
          <mesh position={[0, 1.2 * tree.scale, 0]}>
            <coneGeometry args={[0.5 * tree.scale, 1.5 * tree.scale, 8]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        </group>
      ))}
      
      {/* Stadium lights */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => {
        const radius = TRACK_RADIUS + TRACK_WIDTH / 2 + 8;
        return (
          <group key={`light-${i}`} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 10, 8]} />
              <meshStandardMaterial color="#333333" metalness={0.8} />
            </mesh>
            <pointLight position={[0, 10, 0]} color="#ffffff" intensity={50} distance={30} />
          </group>
        );
      })}
    </group>
  );
}

// ============================================================================
// SCENE
// ============================================================================
interface SceneProps {
  speed: number;
}

function Scene({ speed }: SceneProps) {
  // Car color based on speed
  const carColor = useMemo(() => {
    if (speed >= 250) return '#ff0040'; // Ultra fast - hot red
    if (speed >= 150) return '#ff6600'; // Fast - orange
    if (speed >= 100) return '#00ff88'; // Medium - neon green
    return '#00aaff'; // Slow - blue
  }, [speed]);
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      
      <RaceTrack />
      <Supercar speed={speed} color={carColor} />
      <TrackDecorations />
      
      <OrbitControls
        enablePan={false}
        minDistance={10}
        maxDistance={50}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export interface VisualizationHandle {
  captureScreenshot: () => Promise<Blob | null>;
}

interface SupercarVisualizationProps {
  data: ContributionData;
}

export const SupercarVisualization = forwardRef<VisualizationHandle, SupercarVisualizationProps>(
  ({ data }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);
    
    const speed = getSpeedFromCommits(data.totalContributions);
    
    useEffect(() => {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }, []);
    
    useImperativeHandle(ref, () => ({
      captureScreenshot: async () => {
        return new Promise((resolve) => {
          if (!canvasRef.current) {
            resolve(null);
            return;
          }
          canvasRef.current.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        });
      },
    }));
    
    return (
      <div className="w-full h-full relative">
        <Canvas
          ref={canvasRef}
          camera={{ position: [25, 15, 25], fov: 50 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          shadows
        >
          <color attach="background" args={['#0a0a0f']} />
          <fog attach="fog" args={['#0a0a0f', 30, 80]} />
          <Scene speed={speed} />
        </Canvas>
        
        {/* Speed overlay */}
        <motion.div
          className="absolute top-24 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="glass rounded-2xl px-8 py-4 border border-white/10">
            <div className="text-5xl md:text-7xl font-bold text-neon-green mb-1">
              {Math.round(speed)}
              <span className="text-2xl md:text-3xl text-white/60 ml-2">km/h</span>
            </div>
            <div className="text-white/50 text-sm">
              {data.totalContributions.toLocaleString()} commits = {Math.round(speed)} km/h
            </div>
          </div>
        </motion.div>
        
        {/* Speed tier badge */}
        <motion.div
          className="absolute top-4 right-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isReady ? 1 : 0, scale: isReady ? 1 : 0.8 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${
            speed >= 250 ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
            speed >= 150 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
            speed >= 100 ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/50'
          }`}>
            {speed >= 250 ? '🔥 HYPERSPEED' :
             speed >= 150 ? '⚡ TURBO' :
             speed >= 100 ? '🚀 CRUISING' :
             '🐌 WARMING UP'}
          </div>
        </motion.div>
        
        {/* Formula display */}
        <motion.div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isReady ? 1 : 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="text-white/30 text-xs font-mono">
            formula: commits ÷ 10 = km/h (max 350)
          </div>
        </motion.div>
      </div>
    );
  }
);

SupercarVisualization.displayName = 'SupercarVisualization';

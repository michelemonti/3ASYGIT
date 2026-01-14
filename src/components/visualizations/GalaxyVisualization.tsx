import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

// ============================================================================
// CONFIGURATION - Simplified for performance
// ============================================================================
const SUN_RADIUS = 2.5;
const EARTH_ORBIT_RADIUS = 10;
const MARS_ORBIT_RADIUS = 18;
const EARTH_RADIUS = 0.6;
const MARS_RADIUS = 0.4;
const MAX_COMMITS_FOR_MARS = 5000;

// ============================================================================
// SUN - Simple and light
// ============================================================================
function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (sunRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 0.5) * 0.03;
      sunRef.current.scale.setScalar(pulse);
    }
  });
  
  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.3, 16, 16]} />
        <meshBasicMaterial color="#FFA500" transparent opacity={0.2} />
      </mesh>
      <pointLight color="#FDB813" intensity={2} distance={50} />
    </group>
  );
}

// ============================================================================
// EARTH - Home base
// ============================================================================
interface EarthProps {
  progress: number; // 0-1 progress towards Mars
}

function Earth({ progress }: EarthProps) {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.08;
      groupRef.current.position.x = Math.cos(t) * EARTH_ORBIT_RADIUS;
      groupRef.current.position.z = Math.sin(t) * EARTH_ORBIT_RADIUS;
    }
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.003;
    }
  });
  
  return (
    <group ref={groupRef}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
        <meshBasicMaterial color="#4169E1" />
      </mesh>
      {/* Atmosphere glow - brighter when more commits */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.2, 16, 16]} />
        <meshBasicMaterial 
          color="#00FF00" 
          transparent 
          opacity={0.1 + progress * 0.2} 
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// MARS - The goal!
// ============================================================================
interface MarsProps {
  reached: boolean;
}

function Mars({ reached }: MarsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const marsRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.04;
      groupRef.current.position.x = Math.cos(t + Math.PI) * MARS_ORBIT_RADIUS;
      groupRef.current.position.z = Math.sin(t + Math.PI) * MARS_ORBIT_RADIUS;
    }
    if (marsRef.current) {
      marsRef.current.rotation.y += 0.002;
    }
  });
  
  return (
    <group ref={groupRef}>
      <mesh ref={marsRef}>
        <sphereGeometry args={[MARS_RADIUS, 32, 32]} />
        <meshBasicMaterial color={reached ? "#FF4500" : "#8B4513"} />
      </mesh>
      {/* Mars glow when reached */}
      {reached && (
        <mesh>
          <sphereGeometry args={[MARS_RADIUS * 1.5, 16, 16]} />
          <meshBasicMaterial color="#FF6347" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// STAR BRIDGE - Stars forming a path from Earth to Mars
// ============================================================================
interface StarBridgeProps {
  totalContributions: number;
}

function StarBridge({ totalContributions }: StarBridgeProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Progress: 0 = at Earth, 1 = reached Mars
  const progress = Math.min(totalContributions / MAX_COMMITS_FOR_MARS, 1);
  const numStars = Math.min(Math.floor(totalContributions / 100), 50); // Max 50 stars
  
  const stars = useMemo(() => {
    const result: { position: THREE.Vector3; size: number; color: string }[] = [];
    
    for (let i = 0; i < numStars; i++) {
      const starProgress = (i / Math.max(numStars - 1, 1)) * progress;
      
      // Interpolate between Earth orbit and Mars orbit
      const radius = EARTH_ORBIT_RADIUS + (MARS_ORBIT_RADIUS - EARTH_ORBIT_RADIUS) * starProgress;
      
      // Spread stars in a spiral bridge
      const angle = starProgress * Math.PI * 2;
      const scatter = (Math.sin(i * 7.3) * 0.5);
      const heightScatter = Math.cos(i * 5.7) * 1.5;
      
      result.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius + scatter,
          heightScatter,
          Math.sin(angle) * radius + scatter
        ),
        size: 0.1 + (Math.sin(i * 3.14) * 0.05),
        color: i % 3 === 0 ? '#39FF14' : i % 3 === 1 ? '#00FFFF' : '#FF00FF',
      });
    }
    
    return result;
  }, [numStars, progress]);
  
  // Rotate the whole bridge slowly
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });
  
  return (
    <group ref={groupRef}>
      {stars.map((star, i) => (
        <mesh key={i} position={star.position}>
          <sphereGeometry args={[star.size, 8, 8]} />
          <meshBasicMaterial color={star.color} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// ORBIT RINGS
// ============================================================================
function OrbitRings() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[EARTH_ORBIT_RADIUS - 0.03, EARTH_ORBIT_RADIUS + 0.03, 64]} />
        <meshBasicMaterial color="#4169E1" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <ringGeometry args={[MARS_ORBIT_RADIUS - 0.03, MARS_ORBIT_RADIUS + 0.03, 64]} />
        <meshBasicMaterial color="#CD5C5C" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============================================================================
// PROGRESS BAR - Visual journey to Mars
// ============================================================================
interface ProgressDisplayProps {
  contributions: number;
}

function ProgressDisplay({ contributions }: ProgressDisplayProps) {
  const progress = Math.min(contributions / MAX_COMMITS_FOR_MARS, 1);
  const percentage = Math.round(progress * 100);
  const remaining = Math.max(MAX_COMMITS_FOR_MARS - contributions, 0);
  const reached = contributions >= MAX_COMMITS_FOR_MARS;
  
  return (
    <motion.div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[90%] sm:w-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="bg-black/80 rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/10">
        {/* Progress bar */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <span className="text-xl sm:text-2xl">🌍</span>
          <div className="flex-1 sm:w-48 h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                background: reached 
                  ? 'linear-gradient(90deg, #39FF14, #FF4500)' 
                  : 'linear-gradient(90deg, #39FF14, #00FFFF)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xl sm:text-2xl">{reached ? '🔴✨' : '🔴'}</span>
        </div>
        
        {/* Text */}
        <div className="text-center">
          {reached ? (
            <p className="text-orange-400 font-bold text-sm sm:text-lg">
              🚀 MARS REACHED!
            </p>
          ) : (
            <p className="text-white/70 text-xs sm:text-sm">
              <span className="text-neon-green font-bold">{remaining.toLocaleString()}</span> commits to Mars
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface GalaxyVisualizationProps {
  data: ContributionData;
}

export interface VisualizationHandle {
  captureScreenshot: () => Promise<Blob | null>;
}

export const GalaxyVisualization = forwardRef<VisualizationHandle, GalaxyVisualizationProps>(
  function GalaxyVisualization({ data }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const progress = Math.min(data.totalContributions / MAX_COMMITS_FOR_MARS, 1);
    const reached = data.totalContributions >= MAX_COMMITS_FOR_MARS;
    const numStars = Math.min(Math.floor(data.totalContributions / 100), 50);

    useImperativeHandle(ref, () => ({
      captureScreenshot: async () => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
        });
      }
    }));
  
    return (
    <motion.div 
      className="w-full h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top stats - responsive positioning */}
      <motion.div
        className="absolute top-4 left-4 z-10 max-w-[45%] sm:max-w-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-black/70 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-yellow-400/30">
          <p className="text-yellow-400 text-xs sm:text-sm font-mono truncate">
            ☀️ {data.totalContributions.toLocaleString()}
          </p>
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-4 right-4 z-10 max-w-[45%] sm:max-w-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-black/70 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-neon-green/30">
          <p className="text-neon-green text-xs sm:text-sm font-mono truncate">
            ⭐ {numStars} stars
          </p>
        </div>
      </motion.div>
      
      {/* Progress to Mars */}
      <ProgressDisplay contributions={data.totalContributions} />
      
      {/* 3D Scene */}
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 25, 45], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
        style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)' }}
      >
        <ambientLight intensity={0.3} />
        
        <Sun />
        <OrbitRings />
        <Earth progress={progress} />
        <Mars reached={reached} />
        <StarBridge totalContributions={data.totalContributions} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={20}
          maxDistance={80}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
    </motion.div>
  );
});

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Trail } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

// ============================================================================
// GALAXY CONFIGURATION
// ============================================================================
const SPIRAL_ARMS = 4;
const SPIRAL_TIGHTNESS = 0.3;
const GALAXY_RADIUS = 20;
const CORE_DENSITY = 3;

// Color palette for stars based on contribution level
const STAR_COLORS = {
  0: new THREE.Color('#1a1a2e'),  // Dim - almost invisible
  1: new THREE.Color('#00ff87'),  // Green
  2: new THREE.Color('#00ffff'),  // Cyan
  3: new THREE.Color('#bf00ff'),  // Purple
  4: new THREE.Color('#ff00ff'),  // Magenta - brightest
};

// ============================================================================
// STAR PARTICLE - Single contribution as a star
// ============================================================================
interface StarProps {
  position: [number, number, number];
  color: THREE.Color;
  size: number;
  intensity: number;
  delay: number;
  orbitSpeed: number;
  orbitOffset: number;
}

function Star({ position, color, size, intensity, delay, orbitSpeed, orbitOffset }: StarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  const initialPos = useRef(position);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * orbitSpeed + orbitOffset;
      
      // Spiral orbit motion
      const x = initialPos.current[0] + Math.cos(t) * 0.1;
      const y = initialPos.current[1] + Math.sin(t * 1.5) * 0.05;
      const z = initialPos.current[2] + Math.sin(t) * 0.1;
      
      meshRef.current.position.set(x, y, z);
      
      // Twinkle effect
      const twinkle = 0.7 + Math.sin(clock.getElapsedTime() * 3 + delay) * 0.3;
      meshRef.current.scale.setScalar(size * twinkle);
    }
  });
  
  if (!visible) return null;
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.9}
      />
      {/* Inner glow */}
      <pointLight color={color} intensity={intensity * 0.5} distance={2} />
    </mesh>
  );
}

// ============================================================================
// SHOOTING STAR - Streak day celebration
// ============================================================================
interface ShootingStarProps {
  streakDays: number;
}

function ShootingStar({ streakDays }: ShootingStarProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  
  useEffect(() => {
    // Spawn shooting stars based on streak
    const interval = setInterval(() => {
      if (streakDays > 0) {
        setActive(true);
        setTimeout(() => setActive(false), 2000);
      }
    }, Math.max(8000 - streakDays * 100, 2000));
    
    return () => clearInterval(interval);
  }, [streakDays]);
  
  useFrame(({ clock }) => {
    if (ref.current && active) {
      const t = (clock.getElapsedTime() % 2) / 2;
      ref.current.position.x = THREE.MathUtils.lerp(15, -15, t);
      ref.current.position.y = THREE.MathUtils.lerp(8, -2, t);
      ref.current.position.z = THREE.MathUtils.lerp(-5, 5, t);
    }
  });
  
  if (!active) return null;
  
  return (
    <Trail
      width={2}
      length={8}
      color="#00ffff"
      attenuation={(t) => t * t}
    >
      <mesh ref={ref}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </Trail>
  );
}

// ============================================================================
// GALAXY CORE - Glowing center
// ============================================================================
function GalaxyCore({ totalContributions }: { totalContributions: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Core size based on total contributions
  const coreSize = Math.min(1 + totalContributions / 2000, 3);
  const glowIntensity = Math.min(0.5 + totalContributions / 3000, 2);
  
  useFrame(({ clock }) => {
    if (coreRef.current) {
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      coreRef.current.scale.setScalar(coreSize * pulse);
    }
    if (glowRef.current) {
      glowRef.current.rotation.z += 0.002;
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.15;
      glowRef.current.scale.setScalar(coreSize * 3 * pulse);
    }
  });
  
  return (
    <group>
      {/* Bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[coreSize, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
        <pointLight color="#ffffff" intensity={3} distance={15} />
      </mesh>
      
      {/* Inner glow ring */}
      <mesh ref={glowRef}>
        <torusGeometry args={[coreSize * 2, 0.3, 16, 64]} />
        <meshBasicMaterial 
          color="#bf00ff" 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[coreSize * 4, 32, 32]} />
        <meshBasicMaterial 
          color="#4a0080" 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Core light */}
      <pointLight color="#bf00ff" intensity={glowIntensity} distance={30} />
      <pointLight color="#00ffff" intensity={glowIntensity * 0.5} distance={20} />
    </group>
  );
}

// ============================================================================
// DUST RING - Nebula effect around galaxy
// ============================================================================
function DustRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.02;
    }
  });
  
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
      <torusGeometry args={[GALAXY_RADIUS * 0.8, 3, 16, 100]} />
      <meshBasicMaterial 
        color="#1a0033" 
        transparent 
        opacity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// GALAXY GRID - Main spiral generation
// ============================================================================
interface GalaxyGridProps {
  data: ContributionData;
}

function GalaxyGrid({ data }: GalaxyGridProps) {
  const stars = useMemo(() => {
    const result: StarProps[] = [];
    
    const allDays = data.weeks.flatMap(w => w.days);
    const maxCount = Math.max(...allDays.map(d => d.count), 1);
    
    let starIndex = 0;
    const totalDays = allDays.length;
    
    allDays.forEach((day, dayIndex) => {
      if (day.level === 0) return; // Skip empty days
      
      // Calculate spiral position
      const progress = dayIndex / totalDays;
      const armIndex = dayIndex % SPIRAL_ARMS;
      const armAngle = (armIndex / SPIRAL_ARMS) * Math.PI * 2;
      
      // Logarithmic spiral: r = a * e^(b*θ)
      const theta = progress * Math.PI * 6; // More rotations
      const radius = GALAXY_RADIUS * progress * 0.9 + 2;
      
      // Add some randomness to make it look natural
      const scatter = (Math.random() - 0.5) * 2;
      const heightScatter = (Math.random() - 0.5) * 1.5;
      
      const angle = theta + armAngle + SPIRAL_TIGHTNESS * progress;
      const x = Math.cos(angle) * radius + scatter;
      const z = Math.sin(angle) * radius + scatter;
      const y = heightScatter * (1 - progress * 0.5); // Flatter towards edge
      
      // Star properties based on contribution level
      const normalizedCount = day.count / maxCount;
      const size = 0.08 + day.level * 0.06 + normalizedCount * 0.1;
      const intensity = day.level * 0.3;
      
      result.push({
        position: [x, y, z],
        color: STAR_COLORS[day.level as keyof typeof STAR_COLORS],
        size,
        intensity,
        delay: starIndex * 3,
        orbitSpeed: 0.2 + Math.random() * 0.3,
        orbitOffset: Math.random() * Math.PI * 2,
      });
      
      starIndex++;
    });
    
    return result;
  }, [data]);
  
  // Rotate the entire galaxy slowly
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });
  
  return (
    <group ref={groupRef}>
      <GalaxyCore totalContributions={data.totalContributions} />
      <DustRing />
      
      {stars.map((star, i) => (
        <Star key={i} {...star} />
      ))}
    </group>
  );
}

// ============================================================================
// MAIN VISUALIZATION COMPONENT
// ============================================================================
interface GalaxyVisualizationProps {
  data: ContributionData;
}

export function GalaxyVisualization({ data }: GalaxyVisualizationProps) {
  const intensity = Math.min(data.totalContributions / 2000, 1);
  
  return (
    <motion.div 
      className="w-full h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Stats overlay */}
      <motion.div
        className="absolute top-4 left-4 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-neon-pink text-sm font-mono px-3 py-1 rounded bg-black/70 border border-neon-pink/50">
          {data.totalContributions.toLocaleString()} stars in your galaxy
        </div>
      </motion.div>
      
      <motion.div
        className="absolute bottom-4 left-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-cyan-400 text-xs font-mono px-2 py-1 rounded bg-black/70">
          ☄️ {data.currentStreak} day streak
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-white/70 text-xs font-mono px-2 py-1 rounded bg-black/50">
          Spiral Galaxy • {SPIRAL_ARMS} arms
        </div>
      </motion.div>
      
      <Canvas
        camera={{ position: [0, 15, 30], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Deep space background stars */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5}
        />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.1} />
        
        {/* Galaxy */}
        <GalaxyGrid data={data} />
        
        {/* Shooting stars for streaks */}
        <ShootingStar streakDays={data.currentStreak} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.1}
          minDistance={10}
          maxDistance={60}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 6}
          target={[0, 0, 0]}
        />
        
        <EffectComposer>
          <Bloom
            intensity={1 + intensity * 0.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

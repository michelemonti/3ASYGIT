import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

interface BuildingProps {
  position: [number, number, number];
  height: number;
  intensity: number;
  index: number;
}

function Building({ position, height, intensity, index }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const windowsRef = useRef<THREE.Mesh>(null);
  
  const color = useMemo(() => {
    if (intensity === 0) return '#1a1a2e';
    const hue = 0.85 + intensity * 0.15; // Pink to magenta range
    return new THREE.Color().setHSL(hue % 1, 0.8, 0.3 + intensity * 0.3);
  }, [intensity]);
  
  useFrame(({ clock }) => {
    if (meshRef.current && intensity > 0) {
      // Subtle breathing animation for active buildings
      const breathe = Math.sin(clock.getElapsedTime() * 2 + index * 0.5) * 0.02;
      meshRef.current.scale.y = 1 + breathe;
    }
    
    if (windowsRef.current && windowsRef.current.material && !Array.isArray(windowsRef.current.material)) {
      // Flickering windows effect
      const flicker = Math.sin(clock.getElapsedTime() * 10 + index) > 0.7 ? 1.2 : 1;
      (windowsRef.current.material as THREE.MeshStandardMaterial).opacity = 0.5 * flicker * intensity;
    }
  });
  
  return (
    <group position={position}>
      {/* Main building */}
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.35, height, 0.35]} />
        <meshStandardMaterial
          color={color}
          metalness={0.5}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={intensity * 0.3}
        />
      </mesh>
      
      {/* Window lights */}
      {intensity > 0 && (
        <mesh ref={windowsRef} position={[0, height / 2, 0.18]}>
          <planeGeometry args={[0.3, height * 0.9]} />
          <meshBasicMaterial
            color="#FF10F0"
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
      
      {/* Antenna for tall buildings */}
      {height > 2 && (
        <mesh position={[0, height + 0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4]} />
          <meshBasicMaterial color="#FF10F0" />
        </mesh>
      )}
    </group>
  );
}

interface CityGridProps {
  data: ContributionData;
}

function CityGrid({ data }: CityGridProps) {
  const buildings = useMemo(() => {
    const result: { position: [number, number, number]; height: number; intensity: number; index: number }[] = [];
    
    const flatDays = data.weeks.slice(-12).flatMap(w => w.contributionDays); // Last 12 weeks
    const gridSize = 7; // 7x12 grid for days x weeks
    
    flatDays.forEach((day, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      const x = (col - gridSize / 2) * 0.5;
      const z = (row - 6) * 0.5;
      const height = 0.1 + (day.count / 25) * 3;
      
      result.push({
        position: [x, 0, z],
        height,
        intensity: day.level / 4,
        index,
      });
    });
    
    return result;
  }, [data]);
  
  return (
    <group>
      {buildings.map((building, i) => (
        <Building key={i} {...building} />
      ))}
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0a0a0f" metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function CityLights() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 200; i++) {
      positions.push(
        (Math.random() - 0.5) * 15,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 15
      );
    }
    return new Float32Array(positions);
  }, []);
  
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.PointsMaterial;
      material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#FF10F0" transparent opacity={0.4} />
    </points>
  );
}

interface CityVisualizationProps {
  data: ContributionData;
}

export function CityVisualization({ data }: CityVisualizationProps) {
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Canvas
        camera={{ position: [5, 6, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0a0a0f', 8, 25]} />
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 10, 0]} intensity={0.5} color="#FF10F0" />
        <spotLight position={[5, 10, 5]} intensity={1} color="#00ffff" angle={0.3} />
        
        <Ground />
        <CityGrid data={data} />
        <CityLights />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={6}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />
        
        <EffectComposer>
          <Bloom
            intensity={1}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

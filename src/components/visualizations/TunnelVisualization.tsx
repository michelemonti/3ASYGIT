import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

interface TunnelRingsProps {
  data: ContributionData;
}

function TunnelRings({ data }: TunnelRingsProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const rings = useMemo(() => {
    return data.weeks.map((week, weekIndex) => {
      const totalContributions = week.contributionDays.reduce((sum, d) => sum + d.count, 0);
      const intensity = Math.min(totalContributions / 50, 1);
      
      return {
        position: -weekIndex * 0.6,
        scale: 1 + intensity * 0.5,
        intensity,
        weekIndex,
      };
    });
  }, [data]);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Move tunnel towards camera
      groupRef.current.position.z = (clock.getElapsedTime() * 2) % (rings.length * 0.6);
    }
  });
  
  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <TunnelRing key={i} {...ring} />
      ))}
    </group>
  );
}

interface TunnelRingProps {
  position: number;
  scale: number;
  intensity: number;
  weekIndex: number;
}

function TunnelRing({ position, scale, intensity, weekIndex }: TunnelRingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.2 + weekIndex * 0.1;
    }
  });
  
  const color = useMemo(() => {
    const hue = (weekIndex / 52) * 0.3 + 0.5; // Purple to cyan range
    return new THREE.Color().setHSL(hue, 1, 0.5 + intensity * 0.3);
  }, [weekIndex, intensity]);
  
  return (
    <mesh ref={meshRef} position={[0, 0, position]}>
      <torusGeometry args={[3 * scale, 0.05 + intensity * 0.1, 8, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.6 + intensity * 0.4} />
    </mesh>
  );
}

function Particles({ data }: { data: ContributionData }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    
    data.weeks.forEach((week, weekIndex) => {
      week.contributionDays.forEach((day) => {
        if (day.count > 0) {
          for (let j = 0; j < day.count; j++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 1 + Math.random() * 2;
            
            positions.push(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius,
              -weekIndex * 0.6 + Math.random() * 0.3
            );
            
            const hue = (weekIndex / 52) * 0.3 + 0.5;
            const color = new THREE.Color().setHSL(hue, 1, 0.7);
            colors.push(color.r, color.g, color.b);
          }
        }
      });
    });
    
    return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
  }, [data]);
  
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.position.z = (clock.getElapsedTime() * 2) % (data.weeks.length * 0.6);
      pointsRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

interface TunnelVisualizationProps {
  data: ContributionData;
}

export function TunnelVisualization({ data }: TunnelVisualizationProps) {
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        
        <TunnelRings data={data} />
        <Particles data={data} />
        
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

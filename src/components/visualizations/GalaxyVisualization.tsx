import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

interface StarFieldProps {
  data: ContributionData;
}

function ContributionStars({ data }: StarFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Flatten contribution data into positions
  const stars = useMemo(() => {
    const result: { position: [number, number, number]; intensity: number; size: number }[] = [];
    
    data.weeks.forEach((week, weekIndex) => {
      week.contributionDays.forEach((day, dayIndex) => {
        if (day.count > 0) {
          // Spiral galaxy distribution
          const angle = (weekIndex / data.weeks.length) * Math.PI * 6;
          const radius = 3 + (weekIndex / data.weeks.length) * 12;
          const verticalOffset = (dayIndex - 3) * 0.5;
          const noise = Math.random() * 0.5;
          
          result.push({
            position: [
              Math.cos(angle) * radius + noise,
              verticalOffset + Math.sin(weekIndex * 0.2) * 0.5,
              Math.sin(angle) * radius + noise,
            ],
            intensity: day.level / 4,
            size: 0.05 + (day.count / 30) * 0.15,
          });
        }
      });
    });
    
    return result;
  }, [data]);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    
    stars.forEach((star, i) => {
      dummy.position.set(
        star.position[0],
        star.position[1] + Math.sin(time * 0.5 + i * 0.1) * 0.1,
        star.position[2]
      );
      dummy.scale.setScalar(star.size * (1 + Math.sin(time * 2 + i) * 0.2));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.rotation.y = time * 0.02;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, stars.length]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
    </instancedMesh>
  );
}

function GalaxyCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.1;
      const scale = 1 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  );
}

interface GalaxyVisualizationProps {
  data: ContributionData;
}

export function GalaxyVisualization({ data }: GalaxyVisualizationProps) {
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Canvas
        camera={{ position: [0, 8, 20], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#00ffff" />
        
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        
        <GalaxyCore />
        <ContributionStars data={data} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minDistance={10}
          maxDistance={40}
        />
        
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

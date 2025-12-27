import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

interface MountainTerrainProps {
  data: ContributionData;
}

function MountainTerrain({ data }: MountainTerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const flatDays = data.weeks.flatMap(w => w.contributionDays);
    const width = Math.ceil(Math.sqrt(flatDays.length));
    const height = Math.ceil(flatDays.length / width);
    
    const geo = new THREE.PlaneGeometry(30, 15, width - 1, height - 1);
    const positionAttribute = geo.getAttribute('position');
    const positions = positionAttribute.array as Float32Array;
    const colors = new Float32Array(positions.length);
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const dayIndex = i % flatDays.length;
      const day = flatDays[dayIndex] || { count: 0, level: 0 };
      
      // Set height based on contribution count
      const heightValue = (day.count / 25) * 4;
      positions[i * 3 + 2] = heightValue;
      
      // Color gradient from deep blue to bright green
      const intensity = day.level / 4;
      colors[i * 3] = 0.1 + intensity * 0.1; // R
      colors[i * 3 + 1] = 0.3 + intensity * 0.7; // G
      colors[i * 3 + 2] = 0.2 + intensity * 0.2; // B
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [data]);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.2;
    }
  });
  
  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2, 0]}>
      <meshStandardMaterial
        vertexColors
        wireframe={false}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

function MountainGrid() {
  return (
    <gridHelper args={[50, 50, '#39FF14', '#1a3a1a']} position={[0, -4, 0]} rotation={[0, 0, 0]}>
      <meshBasicMaterial transparent opacity={0.1} />
    </gridHelper>
  );
}

interface MountainVisualizationProps {
  data: ContributionData;
}

export function MountainVisualization({ data }: MountainVisualizationProps) {
  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Canvas
        camera={{ position: [0, 10, 25], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0a0a0f', 20, 60]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 20, 10]} intensity={1} color="#39FF14" />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00ffff" />
        
        <MountainTerrain data={data} />
        <MountainGrid />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.2}
          minDistance={15}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.2}
        />
        
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

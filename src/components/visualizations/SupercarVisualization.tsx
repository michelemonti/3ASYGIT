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
const CAR_LENGTH = 2.4;
const CAR_WIDTH = 1.0;
const CAR_HEIGHT = 0.6;
const CAR_SCALE = 1.8;

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
}

// Smoke particle component
function SmokeParticles({ carRef }: { carRef: React.RefObject<THREE.Group> }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  const { positions, velocities, lifetimes, scales } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];
    const lifetimes: number[] = [];
    const scales = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3());
      lifetimes.push(Math.random());
      scales[i] = 0;
    }
    
    return { positions, velocities, lifetimes, scales };
  }, []);
  
  useFrame(() => {
    if (!particlesRef.current || !carRef.current) return;
    
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const carPos = carRef.current.position;
    const carRotation = carRef.current.rotation.y;
    
    for (let i = 0; i < particleCount; i++) {
      lifetimes[i] -= 0.02;
      
      if (lifetimes[i] <= 0) {
        // Reset particle at car exhaust position
        const exhaustOffsetX = -1.8 * CAR_SCALE;
        const exhaustOffsetZ = (Math.random() - 0.5) * 0.4 * CAR_SCALE;
        
        posArray[i * 3] = carPos.x + Math.cos(carRotation - Math.PI/2) * exhaustOffsetX - Math.sin(carRotation - Math.PI/2) * exhaustOffsetZ;
        posArray[i * 3 + 1] = 0.2 + Math.random() * 0.1;
        posArray[i * 3 + 2] = carPos.z + Math.sin(carRotation - Math.PI/2) * exhaustOffsetX + Math.cos(carRotation - Math.PI/2) * exhaustOffsetZ;
        
        velocities[i].set(
          (Math.random() - 0.5) * 0.05,
          0.02 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.05
        );
        lifetimes[i] = 0.8 + Math.random() * 0.4;
        scales[i] = 0.3 + Math.random() * 0.3;
      } else {
        posArray[i * 3] += velocities[i].x;
        posArray[i * 3 + 1] += velocities[i].y;
        posArray[i * 3 + 2] += velocities[i].z;
        velocities[i].y *= 0.98;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.4}
        color="#888888"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Supercar({ speed }: SupercarProps) {
  const carRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const angleRef = useRef(0);
  
  // Ferrari Red color - più brillante
  const carColor = '#ff0000';
  const carColorDark = '#cc0000';
  const accentColor = '#222222';
  const goldColor = '#d4af37';
  
  // Convert km/h to angular velocity (radians per frame)
  const angularSpeed = (speed / 100) * 0.02;
  
  useFrame(() => {
    if (carRef.current) {
      angleRef.current += angularSpeed;
      const x = Math.cos(angleRef.current) * TRACK_RADIUS;
      const z = Math.sin(angleRef.current) * TRACK_RADIUS;
      
      carRef.current.position.x = x;
      carRef.current.position.z = z;
      // Rotazione corretta: muso in avanti, alettone dietro
      carRef.current.rotation.y = -angleRef.current - Math.PI / 2;
      
      // Rotate wheels based on speed
      wheelRefs.current.forEach(wheel => {
        if (wheel) wheel.rotation.x += angularSpeed * 8;
      });
    }
  });
  
  return (
    <>
      <group ref={carRef} position={[TRACK_RADIUS, 0.25, 0]} scale={[CAR_SCALE, CAR_SCALE, CAR_SCALE]}>
        {/* Main body - aggressive wedge shape */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[2.8, 0.28, 1.1]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} emissive={carColorDark} emissiveIntensity={0.1} />
        </mesh>
        
        {/* Lower body - wider base */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[2.6, 0.12, 1.2]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} emissive={carColorDark} emissiveIntensity={0.1} />
        </mesh>
        
        {/* Front nose - aggressive pointed design */}
        <mesh position={[1.5, 0.1, 0]} rotation={[0, 0, -Math.PI / 15]} castShadow>
          <boxGeometry args={[0.6, 0.18, 0.9]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} emissive={carColorDark} emissiveIntensity={0.1} />
        </mesh>
        
        {/* Front splitter */}
        <mesh position={[1.6, -0.02, 0]} castShadow>
          <boxGeometry args={[0.4, 0.04, 1.3]} />
          <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Cockpit - fighter jet style */}
        <mesh position={[0.3, 0.4, 0]} castShadow>
          <boxGeometry args={[0.7, 0.22, 0.55]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.3} />
        </mesh>
        
        {/* Cockpit surround - red */}
        <mesh position={[0.3, 0.32, 0]} castShadow>
          <boxGeometry args={[0.9, 0.08, 0.75]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Cockpit windshield - sleek angle */}
        <mesh position={[0.8, 0.35, 0]} rotation={[0, 0, Math.PI / 5]}>
          <boxGeometry args={[0.45, 0.18, 0.65]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
        </mesh>
        
        {/* Rear windshield */}
        <mesh position={[-0.2, 0.38, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.15, 0.62]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
        </mesh>
        
        {/* Side air intakes - large aggressive */}
        <mesh position={[0, 0.2, 0.62]} castShadow>
          <boxGeometry args={[1.2, 0.22, 0.15]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.2, -0.62]} castShadow>
          <boxGeometry args={[1.2, 0.22, 0.15]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Side skirts */}
        <mesh position={[0, 0.02, 0.58]} castShadow>
          <boxGeometry args={[2.2, 0.06, 0.08]} />
          <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.02, -0.58]} castShadow>
          <boxGeometry args={[2.2, 0.06, 0.08]} />
          <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Hood vents */}
        <mesh position={[0.9, 0.22, 0.2]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.4, 0.06, 0.12]} />
          <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0.9, 0.22, -0.2]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.4, 0.06, 0.12]} />
          <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Front wing - F1 style */}
        <mesh position={[1.7, 0.02, 0]}>
          <boxGeometry args={[0.35, 0.04, 1.4]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Front wing end plates */}
        <mesh position={[1.7, 0.08, 0.72]}>
          <boxGeometry args={[0.3, 0.15, 0.04]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[1.7, 0.08, -0.72]}>
          <boxGeometry args={[0.3, 0.15, 0.04]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Rear diffuser */}
        <mesh position={[-1.35, 0.05, 0]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.4, 0.1, 1.1]} />
          <meshStandardMaterial color={accentColor} metalness={0.85} roughness={0.15} />
        </mesh>
        
        {/* Rear wing - massive */}
        <mesh position={[-1.3, 0.6, 0]}>
          <boxGeometry args={[0.35, 0.06, 1.3]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} emissive={carColorDark} emissiveIntensity={0.05} />
        </mesh>
        {/* Rear wing second element */}
        <mesh position={[-1.35, 0.52, 0]}>
          <boxGeometry args={[0.25, 0.04, 1.2]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Rear wing supports - swan neck */}
        <mesh position={[-1.1, 0.45, 0.4]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.5, 0.04, 0.06]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[-1.1, 0.45, -0.4]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.5, 0.04, 0.06]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        {/* Rear wing end plates */}
        <mesh position={[-1.3, 0.52, 0.68]}>
          <boxGeometry args={[0.3, 0.2, 0.04]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        <mesh position={[-1.3, 0.52, -0.68]}>
          <boxGeometry args={[0.3, 0.2, 0.04]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Engine cover vents */}
        <mesh position={[-0.6, 0.28, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.5]} />
          <meshStandardMaterial color={carColor} metalness={0.8} roughness={0.15} />
        </mesh>
        
        {/* Wheels - large sport wheels */}
        {[
          { pos: [1.0, 0, 0.58] as [number, number, number], isFront: true },
          { pos: [1.0, 0, -0.58] as [number, number, number], isFront: true },
          { pos: [-0.9, 0, 0.58] as [number, number, number], isFront: false },
          { pos: [-0.9, 0, -0.58] as [number, number, number], isFront: false },
        ].map((wheel, i) => (
          <group key={i} position={wheel.pos}>
            {/* Tire - chunky sport tire */}
            <mesh ref={el => { if (el) wheelRefs.current[i] = el; }} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[wheel.isFront ? 0.2 : 0.24, wheel.isFront ? 0.2 : 0.24, 0.18, 24]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.85} />
            </mesh>
            {/* Rim - gold sport rims */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.19, 12]} />
              <meshStandardMaterial color={goldColor} metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Rim center */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, wheel.pos[2] > 0 ? 0.1 : -0.1]}>
              <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
              <meshStandardMaterial color="#cc0000" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Brake disc glow */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
              <meshStandardMaterial color="#ff4400" metalness={0.5} roughness={0.5} emissive="#ff2200" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}
        
        {/* Exhaust pipes - quad exhaust */}
        <mesh position={[-1.42, 0.12, 0.25]}>
          <cylinderGeometry args={[0.05, 0.06, 0.15, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-1.42, 0.12, 0.12]}>
          <cylinderGeometry args={[0.05, 0.06, 0.15, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-1.42, 0.12, -0.12]}>
          <cylinderGeometry args={[0.05, 0.06, 0.15, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-1.42, 0.12, -0.25]}>
          <cylinderGeometry args={[0.05, 0.06, 0.15, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Exhaust glow */}
        <pointLight position={[-1.5, 0.12, 0]} color="#ff4400" intensity={2} distance={1} />
        
        {/* Headlights - aggressive LED style */}
        <mesh position={[1.55, 0.15, 0.3]}>
          <boxGeometry args={[0.08, 0.06, 0.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[1.55, 0.15, -0.3]}>
          <boxGeometry args={[0.08, 0.06, 0.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <pointLight position={[1.7, 0.15, 0.3]} color="#ffffff" intensity={2} distance={8} />
        <pointLight position={[1.7, 0.15, -0.3]} color="#ffffff" intensity={2} distance={8} />
        
        {/* Tail lights - LED strip */}
        <mesh position={[-1.4, 0.2, 0.35]}>
          <boxGeometry args={[0.04, 0.08, 0.25]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[-1.4, 0.2, -0.35]}>
          <boxGeometry args={[0.04, 0.08, 0.25]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <pointLight position={[-1.5, 0.2, 0]} color="#ff0000" intensity={1.5} distance={3} />
        
        {/* Neon underglow - red */}
        <pointLight position={[0, -0.1, 0]} color="#ff0000" intensity={3} distance={2} />
        <pointLight position={[0.8, -0.1, 0]} color="#ff0000" intensity={2} distance={1.5} />
        <pointLight position={[-0.8, -0.1, 0]} color="#ff0000" intensity={2} distance={1.5} />
      </group>
      
      {/* Smoke particles */}
      <SmokeParticles carRef={carRef} />
    </>
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
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-10, 15, -10]} intensity={0.5} />
      
      <RaceTrack />
      <Supercar speed={speed} />
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

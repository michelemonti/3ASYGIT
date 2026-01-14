import { useRef, useMemo, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface BuildingProps {
  position: [number, number, number];
  height: number;
  intensity: number;
  color: THREE.Color;
  delay: number;
}

function Building({ position, height, intensity, color, delay }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      setCurrentHeight(height);
    }, delay * 2.5);
    return () => clearTimeout(timer);
  }, [delay, height]);
  
  useFrame(({ clock }) => {
    if (meshRef.current && intensity > 0) {
      const breathe = Math.sin(clock.getElapsedTime() * 2 + delay * 0.01) * 0.02;
      meshRef.current.scale.y = 1 + breathe;
    }
  });
  
  if (!visible) return null;
  
  const h = currentHeight || 0.05;
  
  // Slightly darker base for depth
  const baseColor = color.clone().multiplyScalar(0.7);
  
  return (
    <group position={[position[0], h / 2, position[2]]}>
      {/* Main building mesh */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[0.4, h, 0.4]} />
        <meshStandardMaterial
          color={baseColor}
          metalness={0.5}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.2 + intensity * 0.5}
        />
      </mesh>
      
      {/* Top cap for active buildings - adds visual interest */}
      {intensity > 0.25 && (
        <mesh position={[0, h / 2 + 0.03, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 0.42]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={0.5 + intensity * 0.5}
            metalness={0.8}
            roughness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

// Floating text with HTML bubble background
interface FloatingTextProps {
  position: [number, number, number];
  text: string;
  color: string;
  delay: number;
}

function FloatingText({ position, text, color, delay }: FloatingTextProps) {
  const [visible, setVisible] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay * 2.5 + 500);
    return () => clearTimeout(timer);
  }, [delay]);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5 + delay * 0.1) * 0.15;
    }
  });
  
  if (!visible) return null;
  
  return (
    <group ref={groupRef} position={position}>
      <Html center distanceFactor={15} zIndexRange={[0, 10]}>
        <div 
          className="px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap pointer-events-none"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: color,
            border: `1px solid ${color}`,
            textShadow: `0 0 10px ${color}`,
          }}
        >
          {text}
        </div>
      </Html>
    </group>
  );
}

interface MonthMarker {
  label: string;
  weekIndex: number;
}

interface FloatingDecoration {
  position: [number, number, number];
  text: string;
  color: string;
  delay: number;
}

interface CityGridProps {
  data: ContributionData;
}

function CityGrid({ data }: CityGridProps) {
  const { buildings, monthMarkers, floatingTexts } = useMemo(() => {
    const result: BuildingProps[] = [];
    const markers: MonthMarker[] = [];
    const decorations: FloatingDecoration[] = [];
    
    const highTexts = ['🔥', '💎', '⚡', '🚀', '✨', '💫', '🌟', '⭐'];
    const medTexts = ['💪', '📈', '🎯', '💻'];
    const streakTexts = ['STREAK!', 'ON FIRE', 'CODING', 'PUSH!'];
    
    const allDays = data.weeks.flatMap(w => w.days);
    const maxCount = Math.max(...allDays.map(d => d.count), 1);
    
    const weeksWithDates = data.weeks.map((week, idx) => ({
      week,
      index: idx,
      firstDate: week.days.find(d => d.date)?.date,
    })).filter(w => w.firstDate);
    
    const numWeeks = Math.min(weeksWithDates.length, 52);
    const displayWeeks = weeksWithDates.slice(-numWeeks);
    
    let lastMonth = -1;
    let textCounter = 0;
    
    displayWeeks.forEach((weekData, weekIndex) => {
      const { week, firstDate } = weekData;
      
      if (firstDate) {
        const date = new Date(firstDate);
        const month = date.getMonth();
        if (month !== lastMonth) {
          markers.push({ label: MONTH_NAMES[month], weekIndex });
          lastMonth = month;
        }
      }
      
      week.days.forEach((day, dayIndex) => {
        const x = (dayIndex - 3) * 0.6;
        const z = (weekIndex - numWeeks / 2) * 0.6;
        
        const normalizedCount = day.count / maxCount;
        const height = 0.1 + normalizedCount * 5;
        
        // SOFTER, MORE READABLE COLORS
        const color = new THREE.Color();
        if (day.level === 0) {
          color.set('#161b22'); // GitHub dark
        } else if (day.level === 1) {
          color.set('#0e4429'); // Dark green
        } else if (day.level === 2) {
          color.set('#006d32'); // Medium green
        } else if (day.level === 3) {
          color.set('#26a641'); // Bright green
        } else {
          color.set('#39d353'); // Max green
        }
        
        result.push({
          position: [x, 0, z],
          height,
          intensity: day.level / 4,
          color,
          delay: weekIndex * 15 + dayIndex * 8,
        });
        
        // Floating decorations only on highest
        if (day.level === 4 && day.count > 0 && textCounter < 20) {
          const text = textCounter % 3 === 0 
            ? streakTexts[textCounter % streakTexts.length]
            : highTexts[textCounter % highTexts.length];
          decorations.push({
            position: [x, height + 1, z],
            text,
            color: '#39FF14',
            delay: weekIndex * 15 + dayIndex * 8,
          });
          textCounter++;
        } else if (day.level === 3 && day.count > 0 && textCounter % 6 === 0 && textCounter < 30) {
          decorations.push({
            position: [x, height + 0.8, z],
            text: medTexts[textCounter % medTexts.length],
            color: '#00FFFF',
            delay: weekIndex * 15 + dayIndex * 8,
          });
          textCounter++;
        }
      });
    });
    
    return { buildings: result, monthMarkers: markers, floatingTexts: decorations };
  }, [data]);
  
  const numWeeks = Math.min(data.weeks.length, 52);
  
  return (
    <group>
      {buildings.map((building, i) => (
        <Building key={i} {...building} />
      ))}
      
      {/* Day labels with HTML bubbles */}
      {DAYS.map((day, i) => (
        <group key={day} position={[(i - 3) * 0.6, 0.5, (numWeeks / 2) * 0.6 + 2]}>
          <Html center distanceFactor={20} zIndexRange={[0, 10]}>
            <div className="px-2 py-0.5 rounded bg-black/80 text-white text-xs font-mono border border-white/30 pointer-events-none">
              {day}
            </div>
          </Html>
        </group>
      ))}
      
      {/* Month labels with HTML bubbles */}
      {monthMarkers.map((marker, i) => (
        <group key={`${marker.label}-${i}`} position={[-4, 0.5, (marker.weekIndex - numWeeks / 2) * 0.6]}>
          <Html center distanceFactor={20} zIndexRange={[0, 10]}>
            <div className="px-2 py-0.5 rounded bg-black/80 text-neon-green text-xs font-bold border border-neon-green/50 pointer-events-none">
              {marker.label}
            </div>
          </Html>
        </group>
      ))}
      
      {floatingTexts.map((ft, i) => (
        <FloatingText key={`ft-${i}`} {...ft} />
      ))}
    </group>
  );
}

function Ground() {
  // Create a grid texture for the ground
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Dark base
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, 512, 512);
    
    // Grid lines
    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 1;
    
    const gridSize = 16;
    for (let i = 0; i <= 512; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    // Accent lines every 4 cells
    ctx.strokeStyle = '#2a3a50';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += gridSize * 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[20, 45]} />
      <meshStandardMaterial 
        map={gridTexture}
        color="#0d1117" 
        metalness={0.9} 
        roughness={0.1}
      />
    </mesh>
  );
}

interface CityVisualizationProps {
  data: ContributionData;
}

export interface VisualizationHandle {
  captureScreenshot: () => Promise<Blob | null>;
}

export const CityVisualization = forwardRef<VisualizationHandle, CityVisualizationProps>(
  function CityVisualization({ data }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intensity = Math.min(data.totalContributions / 1000, 2);

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
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Stats overlay */}
      <motion.div
        className="absolute top-4 left-4 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-neon-green text-sm font-mono px-3 py-1 rounded bg-black/70 border border-neon-green/50">
          {data.totalContributions.toLocaleString()} contributions
        </div>
      </motion.div>
      
      <motion.div
        className="absolute bottom-4 left-4 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-cyan-400 text-xs font-mono px-2 py-1 rounded bg-black/70">
          🔥 {data.currentStreak} day streak
        </div>
      </motion.div>
      
      <motion.div
        className="absolute top-4 right-4 z-10"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-white/70 text-xs font-mono px-2 py-1 rounded bg-black/50">
          52 weeks • 7 days
        </div>
      </motion.div>
      
      <Canvas
        ref={canvasRef}
        camera={{ position: [8, 18, 25], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0d1117', 35, 70]} />
        
        {/* Ambient for base visibility */}
        <ambientLight intensity={0.2} />
        
        {/* Main directional light with shadows */}
        <directionalLight
          position={[15, 30, 10]}
          intensity={1.2}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={80}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
          shadow-bias={-0.0001}
        />
        
        {/* Green accent light */}
        <spotLight 
          position={[20, 20, 20]} 
          intensity={2} 
          color="#39d353" 
          angle={0.5}
          penumbra={0.5}
          castShadow
        />
        
        {/* Blue fill light */}
        <pointLight position={[-15, 15, -15]} intensity={0.6} color="#58a6ff" />
        
        {/* Rim light for depth */}
        <pointLight position={[0, 5, -30]} intensity={0.4} color="#a855f7" />
        
        <Ground />
        <CityGrid data={data} />
        
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.15}
          minDistance={15}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          target={[0, 0, 0]}
        />
        
        <EffectComposer>
          <Bloom
            intensity={0.6 + intensity * 0.3}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
});

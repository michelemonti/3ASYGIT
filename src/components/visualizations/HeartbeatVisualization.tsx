import { useRef, useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ContributionData } from '@/types/github';

interface HeartbeatVisualizationProps {
  data: ContributionData;
}

export function HeartbeatVisualization({ data }: HeartbeatVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Generate waveform data from contributions
  const waveformData = useMemo(() => {
    const flatDays = data.weeks.flatMap(w => w.contributionDays);
    return flatDays.map(day => day.count / 25); // Normalize to 0-1
  }, [data]);
  
  // Calculate energy level based on total contributions
  const energyLevel = useMemo(() => {
    const total = data.totalContributions;
    if (total >= 2000) return 'extreme';
    if (total >= 1000) return 'high';
    if (total >= 500) return 'medium';
    return 'low';
  }, [data]);
  
  const energyConfig = useMemo(() => {
    switch (energyLevel) {
      case 'extreme':
        return { speed: 3, glow: 40, color: '#FF10F0', pulseIntensity: 1.5 };
      case 'high':
        return { speed: 2.5, glow: 30, color: '#1E90FF', pulseIntensity: 1.2 };
      case 'medium':
        return { speed: 2, glow: 20, color: '#00FFFF', pulseIntensity: 1 };
      default:
        return { speed: 1.5, glow: 15, color: '#39FF14', pulseIntensity: 0.8 };
    }
  }, [energyLevel]);
  
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = dimensions.width * 2;
    canvas.height = dimensions.height * 2;
    ctx.scale(2, 2);
    
    let time = 0;
    let offset = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      const centerY = dimensions.height / 2;
      const amplitude = dimensions.height * 0.3 * energyConfig.pulseIntensity;
      
      // Draw multiple waveform layers
      for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 0.3;
        const layerOpacity = 1 - layer * 0.3;
        
        ctx.beginPath();
        ctx.strokeStyle = energyConfig.color;
        ctx.lineWidth = 3 - layer;
        ctx.globalAlpha = layerOpacity;
        ctx.shadowBlur = energyConfig.glow;
        ctx.shadowColor = energyConfig.color;
        
        for (let x = 0; x < dimensions.width; x++) {
          const dataIndex = Math.floor((x + offset + layerOffset * 50) % waveformData.length);
          const dataValue = waveformData[dataIndex] || 0;
          
          // Create heartbeat-like pattern
          const heartbeat = Math.sin(x * 0.02 + time * energyConfig.speed) * 0.5 + 0.5;
          const spike = Math.pow(heartbeat, 8) * 2; // Sharp spikes
          const noise = Math.sin(x * 0.1 + time * 2) * 0.1;
          
          const y = centerY - (dataValue * amplitude * spike + noise * amplitude * 0.3);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
      
      // Draw pulse circles at peaks
      ctx.globalAlpha = 0.5 + Math.sin(time * 4) * 0.3;
      const pulseSize = 5 + Math.sin(time * 4) * 3;
      ctx.beginPath();
      ctx.arc(dimensions.width / 2, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = energyConfig.color;
      ctx.fill();
      
      // Draw BPM text effect
      ctx.globalAlpha = 0.8;
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = energyConfig.color;
      ctx.shadowBlur = 10;
      ctx.fillText(`${Math.floor(60 + data.totalContributions / 20)} BPM`, 20, 30);
      ctx.fillText(`${data.currentStreak} day streak`, 20, 50);
      
      // Reset
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      
      time += 0.016;
      offset += energyConfig.speed * 0.5;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, waveformData, energyConfig, data]);
  
  return (
    <motion.div
      className="w-full h-full relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(${energyConfig.color}22 1px, transparent 1px),
            linear-gradient(90deg, ${energyConfig.color}22 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />
      
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      
      {/* Energy indicator */}
      <motion.div
        className="absolute bottom-8 right-8 flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <motion.div
              key={level}
              className="w-2 h-6 rounded-sm"
              style={{
                backgroundColor: level <= (['low', 'medium', 'high', 'extreme'].indexOf(energyLevel) + 1)
                  ? energyConfig.color
                  : '#333',
                boxShadow: level <= (['low', 'medium', 'high', 'extreme'].indexOf(energyLevel) + 1)
                  ? `0 0 10px ${energyConfig.color}`
                  : 'none',
              }}
              animate={{
                scaleY: level <= (['low', 'medium', 'high', 'extreme'].indexOf(energyLevel) + 1)
                  ? [1, 1.2, 1]
                  : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: level * 0.1,
              }}
            />
          ))}
        </div>
        <span 
          className="text-sm font-mono uppercase tracking-wider"
          style={{ color: energyConfig.color }}
        >
          {energyLevel}
        </span>
      </motion.div>
      
      {/* Corner decorations */}
      <svg className="absolute top-4 left-4 w-8 h-8 opacity-30" viewBox="0 0 32 32">
        <path d="M0 8 L0 0 L8 0" stroke={energyConfig.color} strokeWidth="2" fill="none" />
      </svg>
      <svg className="absolute top-4 right-4 w-8 h-8 opacity-30" viewBox="0 0 32 32">
        <path d="M24 0 L32 0 L32 8" stroke={energyConfig.color} strokeWidth="2" fill="none" />
      </svg>
      <svg className="absolute bottom-4 left-4 w-8 h-8 opacity-30" viewBox="0 0 32 32">
        <path d="M0 24 L0 32 L8 32" stroke={energyConfig.color} strokeWidth="2" fill="none" />
      </svg>
      <svg className="absolute bottom-4 right-4 w-8 h-8 opacity-30" viewBox="0 0 32 32">
        <path d="M24 32 L32 32 L32 24" stroke={energyConfig.color} strokeWidth="2" fill="none" />
      </svg>
    </motion.div>
  );
}

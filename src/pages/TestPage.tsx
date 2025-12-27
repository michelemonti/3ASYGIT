import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Home, Music, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getAudioEngine, 
  getBPMFromContributions, 
  getEnergyLevel, 
  ENERGY_LEVEL_INFO,
  MusicGenre 
} from '@/lib/audioEngine';

// Test configurations
const CONTRIBUTION_LEVELS = [
  { contributions: 50, label: '50' },
  { contributions: 150, label: '150' },
  { contributions: 450, label: '450' },
  { contributions: 700, label: '700' },
  { contributions: 900, label: '900' },
  { contributions: 1500, label: '1.5k' },
  { contributions: 2500, label: '2.5k' },
  { contributions: 4000, label: '4k' },
];

const GENRES: { id: MusicGenre; name: string; visualization: string; emoji: string }[] = [
  { id: 'ambient', name: 'Ambient', visualization: 'Galaxy', emoji: '🌌' },
  { id: 'cinematic', name: 'Cinematic', visualization: 'Mountain', emoji: '🏔️' },
  { id: 'techno', name: 'Techno', visualization: 'Tunnel', emoji: '🌀' },
  { id: 'synthwave', name: 'Synthwave', visualization: 'City', emoji: '🏙️' },
  { id: 'dnb', name: 'Drum & Bass', visualization: 'Heartbeat', emoji: '💓' },
];

export function TestPage() {
  const [currentPlaying, setCurrentPlaying] = useState<string | null>(null);
  const [masterVolume, setMasterVolume] = useState(true);

  const handlePlay = useCallback(async (genre: MusicGenre, contributions: number) => {
    const audioEngine = getAudioEngine();
    const key = `${genre}-${contributions}`;

    // If clicking same song, stop it
    if (currentPlaying === key) {
      audioEngine.stop();
      setCurrentPlaying(null);
      return;
    }

    // Stop current if playing
    if (currentPlaying) {
      audioEngine.stop();
    }

    // Configure and play new
    audioEngine.updateConfig({
      contributions,
      genre,
      streakDays: Math.floor(contributions / 10),
    });
    audioEngine.setGenre(genre);
    await audioEngine.play();
    setCurrentPlaying(key);
  }, [currentPlaying]);

  const handleStop = useCallback(() => {
    const audioEngine = getAudioEngine();
    audioEngine.stop();
    setCurrentPlaying(null);
  }, []);

  const toggleMasterVolume = useCallback(() => {
    const audioEngine = getAudioEngine();
    if (masterVolume) {
      audioEngine.stop();
      setCurrentPlaying(null);
    }
    setMasterVolume(!masterVolume);
  }, [masterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audioEngine = getAudioEngine();
      audioEngine.stop();
    };
  }, []);

  // Get current playing info
  const currentInfo = currentPlaying ? (() => {
    const [genreId, contribStr] = currentPlaying.split('-');
    const genre = GENRES.find(g => g.id === genreId);
    const contributions = parseInt(contribStr);
    const energy = getEnergyLevel(contributions);
    const energyInfo = ENERGY_LEVEL_INFO[energy];
    const bpm = getBPMFromContributions(contributions);
    return { genre, contributions, energy, energyInfo, bpm };
  })() : null;

  return (
    <div className="h-screen bg-background text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass border-b border-white/10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Back to App</span>
              </a>
              <div className="w-px h-6 bg-white/20" />
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Music className="w-5 h-5 text-neon-green" />
                Song Matrix
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                disabled={!currentPlaying}
              >
                <Pause className="w-4 h-4 mr-1" />
                Stop
              </Button>
              <Button
                variant={masterVolume ? "neon" : "ghost"}
                size="icon"
                onClick={toggleMasterVolume}
              >
                {masterVolume ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Now Playing Bar */}
      <AnimatePresence>
        {currentInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-neon-green/20 via-neon-cyan/20 to-neon-purple/20 border-b border-white/10 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                <span className="text-white/60">Now Playing:</span>
              </div>
              <span className="text-2xl">{currentInfo.genre?.emoji}</span>
              <span className="font-bold">{currentInfo.genre?.name}</span>
              <Badge variant="outline" style={{ borderColor: currentInfo.energyInfo.color, color: currentInfo.energyInfo.color }}>
                {currentInfo.energyInfo.emoji} {currentInfo.energyInfo.label}
              </Badge>
              <span className="text-white/50 font-mono">{currentInfo.bpm} BPM</span>
              <span className="text-white/40">•</span>
              <span className="text-white/50">{currentInfo.contributions} contributions</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matrix */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="glass rounded-2xl p-6 max-w-5xl w-full">
          {/* Header row - Energy levels */}
          <div className="grid grid-cols-9 gap-2 mb-4">
            <div className="text-center text-white/40 text-sm">Genre</div>
            {CONTRIBUTION_LEVELS.map(level => {
              const energy = getEnergyLevel(level.contributions);
              const info = ENERGY_LEVEL_INFO[energy];
              return (
                <div key={level.contributions} className="text-center">
                  <div className="text-xl mb-1">{info.emoji}</div>
                  <div className="text-xs text-white/40">{level.label}</div>
                </div>
              );
            })}
          </div>

          {/* Rows - Genres */}
          {GENRES.map(genre => (
            <div key={genre.id} className="grid grid-cols-9 gap-2 mb-2">
              {/* Genre label */}
              <div className="flex items-center gap-2 pr-2">
                <span className="text-xl">{genre.emoji}</span>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{genre.name}</div>
                  <div className="text-xs text-white/40">{genre.visualization}</div>
                </div>
              </div>
              
              {/* Cells */}
              {CONTRIBUTION_LEVELS.map(level => {
                const key = `${genre.id}-${level.contributions}`;
                const isPlaying = currentPlaying === key;
                const energy = getEnergyLevel(level.contributions);
                const info = ENERGY_LEVEL_INFO[energy];
                const bpm = getBPMFromContributions(level.contributions);
                
                return (
                  <motion.button
                    key={key}
                    className={`
                      relative aspect-square rounded-lg transition-all duration-200
                      flex items-center justify-center
                      ${isPlaying 
                        ? 'ring-2 ring-neon-green shadow-lg shadow-neon-green/30' 
                        : 'hover:bg-white/10'
                      }
                    `}
                    style={{
                      backgroundColor: isPlaying ? `${info.color}30` : `${info.color}10`,
                    }}
                    onClick={() => handlePlay(genre.id, level.contributions)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={`${genre.name} • ${info.label} • ${bpm} BPM`}
                  >
                    {isPlaying ? (
                      <motion.div
                        className="w-4 h-4 rounded-full bg-neon-green"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                      />
                    ) : (
                      <Play className="w-4 h-4 text-white/40" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-4">
                <span>← Lower energy</span>
                <div className="flex gap-1">
                  {CONTRIBUTION_LEVELS.map(level => {
                    const energy = getEnergyLevel(level.contributions);
                    const info = ENERGY_LEVEL_INFO[energy];
                    return (
                      <div
                        key={level.contributions}
                        className="w-4 h-2 rounded-sm"
                        style={{ backgroundColor: info.color }}
                        title={info.label}
                      />
                    );
                  })}
                </div>
                <span>Higher energy →</span>
              </div>
              <div>
                {GENRES.length} genres × {CONTRIBUTION_LEVELS.length} levels = {GENRES.length * CONTRIBUTION_LEVELS.length} combinations
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
          <span>🔒</span>
          <span>Secret test page</span>
          <code className="bg-white/10 px-2 py-0.5 rounded text-xs">/test</code>
        </div>
      </div>
    </div>
  );
}

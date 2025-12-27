import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Github,
  Volume2,
  VolumeX,
  Share2,
  Loader2,
  Sparkles,
  Activity,
  Zap,
  Info,
  Music,
  Search,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ContributionData, VISUALIZATION_MODES } from '@/types/github';
import { generateAndrewSinkData } from '@/lib/mockData';
import { getAudioEngine, MODE_TO_GENRE, getBPMFromContributions, getEnergyLevel, ENERGY_LEVEL_INFO } from '@/lib/audioEngine';
import { fetchGitHubStats, saveUserData, loadUserData } from '@/lib/githubService';

// Lazy load visualizations for better performance
import { GalaxyVisualization } from '@/components/visualizations/GalaxyVisualization';
import { MountainVisualization } from '@/components/visualizations/MountainVisualization';
import { TunnelVisualization } from '@/components/visualizations/TunnelVisualization';
import { CityVisualization } from '@/components/visualizations/CityVisualization';
import { HeartbeatVisualization } from '@/components/visualizations/HeartbeatVisualization';

// ============================================================================
// Loading Component
// ============================================================================
function LoadingScene() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Loader2 className="w-12 h-12 text-neon-green animate-spin" />
        <span className="text-white/60 text-sm tracking-wider">LOADING UNIVERSE...</span>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Header Component
// ============================================================================
interface HeaderProps {
  isConnected: boolean;
  onConnect: () => void;
  isLoading: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  data: ContributionData | null;
  currentBPM: number;
  currentGenre: string;
  username?: string;
}

function Header({ isConnected, onConnect, isLoading, soundEnabled, onToggleSound, data, currentBPM, currentGenre, username }: HeaderProps) {
  const energyLevel = data ? getEnergyLevel(data.totalContributions) : 'chill';
  const energyInfo = ENERGY_LEVEL_INFO[energyLevel];

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            git.<span className="text-neon-green">3asy</span>.app
          </span>
        </motion.div>

        {/* User info and stats (visible when connected) */}
        <AnimatePresence>
          {isConnected && data && (
            <motion.div
              className="hidden md:flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {username && (
                <Badge variant="outline" className="gap-1 border-white/20">
                  <User className="w-3 h-3" />
                  @{username}
                </Badge>
              )}
              <Badge variant="neon" className="gap-1">
                <Zap className="w-3 h-3" />
                {data.totalContributions} contributions
              </Badge>
              <Badge variant="cyan" className="gap-1">
                <Activity className="w-3 h-3" />
                {data.currentStreak} day streak
              </Badge>
              {/* Energy Level Badge */}
              <Badge 
                variant="outline" 
                className="gap-1"
                style={{ 
                  borderColor: energyInfo.color,
                  color: energyInfo.color,
                }}
              >
                <span>{energyInfo.emoji}</span>
                {energyInfo.label}
              </Badge>
              {soundEnabled && (
                <Badge variant="purple" className="gap-1 animate-pulse">
                  <Music className="w-3 h-3" />
                  {currentBPM} BPM • {currentGenre}
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Sound toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={soundEnabled ? "neon" : "ghost"}
                  size="icon"
                  onClick={onToggleSound}
                  className={soundEnabled ? "" : "text-white/60 hover:text-white"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {soundEnabled ? `Playing: ${currentGenre} @ ${currentBPM} BPM` : 'Enable Generative Music'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Info dialog */}
          <Dialog>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                      <Info className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-neon-green">About git.3asy.app</DialogTitle>
                <DialogDescription className="space-y-3 pt-2">
                  <p>Transform your GitHub contributions into a cinematic visual experience.</p>
                  <p className="text-white/60">Use arrow keys ← → or click the navigation buttons to explore different visualizations of your coding journey.</p>
                  <div className="pt-2 space-y-2">
                    <p className="text-neon-cyan text-sm font-medium">🎵 Generative Music</p>
                    <p className="text-white/50 text-sm">Press M or click the sound icon to enable procedural music. Each visualization has a unique genre that adapts to your contribution count:</p>
                    <ul className="text-white/40 text-xs space-y-1 pl-4">
                      <li>• 0-100 contributions: 128 BPM</li>
                      <li>• 100-300: 130 BPM</li>
                      <li>• 300-600: 135 BPM</li>
                      <li>• 600-1000: 138-140 BPM</li>
                      <li>• 1000+: 145-155 BPM</li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Three.js</Badge>
                    <Badge variant="outline">Web Audio API</Badge>
                    <Badge variant="outline">Framer Motion</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {/* Connect Button */}
          {!isConnected ? (
            <Button
              variant="neon"
              onClick={onConnect}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Github className="w-4 h-4" />
              )}
              Connect GitHub
            </Button>
          ) : (
            <ShareDialog data={data} />
          )}
        </div>
      </div>
    </motion.header>
  );
}

// ============================================================================
// Share Dialog
// ============================================================================
function ShareDialog({ data }: { data: ContributionData | null }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `Check out my GitHub visualization on git.3asy.app! 🚀\n${data?.totalContributions} contributions • ${data?.currentStreak} day streak`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="neon" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-neon-green">Share Your Story</DialogTitle>
          <DialogDescription className="pt-2">
            Let the world see your coding journey.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="glass p-4 rounded-lg text-sm text-white/70">
            Check out my GitHub visualization on git.3asy.app! 🚀
            <br />
            {data?.totalContributions} contributions • {data?.currentStreak} day streak
          </div>
          <Button onClick={handleShare} className="w-full" variant="neon">
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Navigation Arrows
// ============================================================================
interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
}

function NavigationArrows({ onPrev, onNext, currentIndex, total }: NavigationArrowsProps) {
  return (
    <>
      {/* Left Arrow */}
      <motion.button
        className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all group"
        onClick={onPrev}
        whileHover={{ scale: 1.1, x: -5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Right Arrow */}
      <motion.button
        className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all group"
        onClick={onNext}
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>

      {/* Mode Indicator */}
      <motion.div
        className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? 'bg-neon-green w-6'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            style={{
              boxShadow: i === currentIndex ? '0 0 10px #39FF14' : 'none',
            }}
            whileHover={{ scale: 1.2 }}
          />
        ))}
        <span className="ml-2 text-white/40 text-sm font-mono">
          {currentIndex + 1}/{total}
        </span>
      </motion.div>
    </>
  );
}

// ============================================================================
// Footer Narrative
// ============================================================================
interface FooterNarrativeProps {
  mode: typeof VISUALIZATION_MODES[0];
  soundEnabled: boolean;
  currentBPM: number;
  currentGenre: string;
}

function FooterNarrative({ mode, soundEnabled, currentBPM, currentGenre }: FooterNarrativeProps) {
  return (
    <motion.footer
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-screen-lg mx-auto px-6 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode.id}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-center gap-3 mb-1">
              <h2 
                className="text-lg md:text-xl font-bold tracking-tight"
                style={{ color: mode.color }}
              >
                {mode.title}
              </h2>
              {soundEnabled && (
                <motion.div 
                  className="flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {/* Audio visualizer bars */}
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-neon-green rounded-full"
                      animate={{
                        height: [4, 12 + Math.random() * 8, 4],
                      }}
                      transition={{
                        duration: 0.4 + i * 0.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                      style={{
                        boxShadow: '0 0 4px #39FF14',
                      }}
                    />
                  ))}
                  <span className="text-xs text-neon-green/70 ml-2 font-mono">
                    {currentBPM} BPM
                  </span>
                </motion.div>
              )}
            </div>
            <p className="text-white/40 text-sm md:text-base max-w-xl mx-auto italic">
              "{mode.narrative}"
            </p>
            {soundEnabled && (
              <motion.p 
                className="text-white/30 text-xs mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🎵 {currentGenre}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.footer>
  );
}

// ============================================================================
// Watermark
// ============================================================================
function Watermark() {
  return (
    <motion.div
      className="fixed bottom-20 right-4 z-30 text-white/10 text-xs font-mono tracking-widest"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      3ASY
    </motion.div>
  );
}

// ============================================================================
// Test Panel - Per testare tutti i livelli di contribuzione
// ============================================================================
const CONTRIBUTION_LEVELS = [
  { label: '50', value: 50, bpm: 128 },
  { label: '200', value: 200, bpm: 130 },
  { label: '450', value: 450, bpm: 135 },
  { label: '700', value: 700, bpm: 138 },
  { label: '900', value: 900, bpm: 140 },
  { label: '1.5K', value: 1500, bpm: 145 },
  { label: '2.5K', value: 2500, bpm: 150 },
  { label: '3.5K', value: 3500, bpm: 155 },
];

interface TestPanelProps {
  currentContributions: number;
  onChangeContributions: (value: number) => void;
  isVisible: boolean;
  onToggle: () => void;
}

function TestPanel({ currentContributions, onChangeContributions, isVisible, onToggle }: TestPanelProps) {
  const currentBPM = getBPMFromContributions(currentContributions);
  
  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="fixed bottom-20 left-4 z-50 w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-neon-green transition-colors"
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Test Panel"
      >
        <span className="text-lg">🎚️</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed bottom-32 left-4 z-50 glass rounded-xl p-4 w-72"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neon-green">🧪 Test Contributions</h3>
              <Badge variant="neon" className="text-xs">
                {currentBPM} BPM
              </Badge>
            </div>
            
            <p className="text-white/40 text-xs mb-3">
              Cambia le contribuzioni per sentire come cambia la musica
            </p>

            <div className="grid grid-cols-4 gap-2 mb-3">
              {CONTRIBUTION_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  className={`px-2 py-2 rounded-lg text-xs font-mono transition-all ${
                    currentContributions === level.value
                      ? 'bg-neon-green text-black font-bold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  onClick={() => onChangeContributions(level.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div>{level.label}</div>
                  <div className="text-[10px] opacity-60">{level.bpm}</div>
                </motion.button>
              ))}
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>0</span>
                <span className="text-neon-green font-mono">{currentContributions}</span>
                <span>4000</span>
              </div>
              <input
                type="range"
                min="0"
                max="4000"
                step="50"
                value={currentContributions}
                onChange={(e) => onChangeContributions(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                style={{
                  background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${(currentContributions / 4000) * 100}%, rgba(255,255,255,0.1) ${(currentContributions / 4000) * 100}%, rgba(255,255,255,0.1) 100%)`
                }}
              />
            </div>

            {/* Quick info */}
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
              <div className="flex justify-between">
                <span>Genere attivo:</span>
                <span className="text-white/70">Cambia con ← →</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Premi M:</span>
                <span className="text-white/70">Toggle musica</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// Welcome Screen (before connection)
// ============================================================================
interface WelcomeScreenProps {
  onConnect: (username?: string) => void;
  isLoading: boolean;
  error?: string;
}

function WelcomeScreen({ onConnect, isLoading, error }: WelcomeScreenProps) {
  const [username, setUsername] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onConnect(username.trim());
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-grid opacity-30"
          animate={{ backgroundPosition: ['0px 0px', '50px 50px'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        {/* Floating orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: 200 + i * 50,
              height: 200 + i * 50,
              background: `radial-gradient(circle, ${
                ['#39FF1420', '#00FFFF20', '#BF00FF20', '#FF10F020', '#1E90FF20'][i]
              }, transparent)`,
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 20}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6"
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-purple p-[2px]"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center">
            <Github className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Your GitHub Story,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-neon-purple">
            Visualized
          </span>
        </h1>

        <p className="text-white/50 text-lg md:text-xl max-w-lg mx-auto mb-8">
          Transform your contributions into a cinematic experience with generative music.
          <br />
          This is not a heatmap.
        </p>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        <AnimatePresence mode="wait">
          {!searchMode ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Search by username */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="neon"
                  size="lg"
                  onClick={() => setSearchMode(true)}
                  className="text-lg px-8 py-6 gap-3"
                >
                  <Search className="w-5 h-5" />
                  Search GitHub User
                </Button>
              </motion.div>

              {/* Demo mode */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => onConnect()}
                  disabled={isLoading}
                  className="text-lg px-8 py-6 gap-3 border-white/20 text-white/70 hover:text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Try Demo
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.form
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-2 glass rounded-xl p-2">
                <div className="flex items-center gap-2 px-3 text-white/40">
                  <Github className="w-5 h-5" />
                  <span>github.com/</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoFocus
                  className="bg-transparent border-none outline-none text-white text-lg px-2 py-2 w-48"
                />
                <Button
                  type="submit"
                  variant="neon"
                  size="icon"
                  disabled={isLoading || !username.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSearchMode(false)}
                  className="text-white/50 hover:text-white text-sm"
                >
                  ← Back
                </button>
                
                {/* Popular examples */}
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <span>Try:</span>
                  {['torvalds', 'gaearon', 'sindresorhus'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setUsername(name);
                        onConnect(name);
                      }}
                      className="text-neon-green hover:underline"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-white/30 text-sm mt-6">
          Press <kbd className="px-2 py-1 rounded bg-white/10 mx-1">←</kbd>
          <kbd className="px-2 py-1 rounded bg-white/10 mx-1">→</kbd> to navigate •
          <kbd className="px-2 py-1 rounded bg-white/10 mx-1">M</kbd> for music
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Visualization Renderer
// ============================================================================
interface VisualizationRendererProps {
  modeId: string;
  data: ContributionData;
}

function VisualizationRenderer({ modeId, data }: VisualizationRendererProps) {
  return (
    <Suspense fallback={<LoadingScene />}>
      <AnimatePresence mode="wait">
        {modeId === 'galaxy' && <GalaxyVisualization key="galaxy" data={data} />}
        {modeId === 'mountain' && <MountainVisualization key="mountain" data={data} />}
        {modeId === 'tunnel' && <TunnelVisualization key="tunnel" data={data} />}
        {modeId === 'city' && <CityVisualization key="city" data={data} />}
        {modeId === 'heartbeat' && <HeartbeatVisualization key="heartbeat" data={data} />}
      </AnimatePresence>
    </Suspense>
  );
}

// Genre display names
const GENRE_NAMES: Record<string, string> = {
  ambient: 'Ambient',
  cinematic: 'Cinematic',
  techno: 'Techno',
  synthwave: 'Synthwave',
  dnb: 'Drum & Bass',
};

// ============================================================================
// Main App Component
// ============================================================================
export default function App() {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contributionData, setContributionData] = useState<ContributionData | null>(null);
  const [currentModeIndex, setCurrentModeIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [testPanelVisible, setTestPanelVisible] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const currentMode = VISUALIZATION_MODES[currentModeIndex];
  const currentGenre = MODE_TO_GENRE[currentMode.id] || 'ambient';
  const currentBPM = contributionData ? getBPMFromContributions(contributionData.totalContributions) : 128;

  // Handler per cambiare le contribuzioni (per testing)
  const handleChangeContributions = useCallback((value: number) => {
    if (contributionData) {
      setContributionData({
        ...contributionData,
        totalContributions: value,
      });
      
      // Aggiorna anche l'audio engine se la musica è attiva
      if (soundEnabled) {
        const audioEngine = getAudioEngine();
        audioEngine.updateConfig({
          contributions: value,
        });
      }
    }
  }, [contributionData, soundEnabled]);

  // Connect handler - fetches real GitHub data or demo data
  const handleConnect = async (username?: string) => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      if (username) {
        // Fetch real GitHub data for the specified user
        console.log(`Fetching data for GitHub user: ${username}`);
        const stats = await fetchGitHubStats(username);
        
        if (!stats) {
          throw new Error(`Could not find user "${username}" or failed to fetch data`);
        }
        
        // Convert to our ContributionData format
        const data: ContributionData = {
          username: stats.user.login,
          totalContributions: stats.contributions.totalContributions,
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          weeks: stats.contributions.weeks.map(week => ({
            contributionDays: week.days.map(day => ({
              date: day.date,
              count: day.count,
              level: day.level,
            })),
          })),
          followers: stats.user.followers,
          publicRepos: stats.user.public_repos,
          avatarUrl: stats.user.avatar_url,
          bio: stats.user.bio || undefined,
        };
        
        setContributionData(data);
        setCurrentUsername(username);
        saveUserData(stats);
      } else {
        // Demo mode - use mock data (AndrewSink)
        const data = generateAndrewSinkData();
        setContributionData(data);
        setCurrentUsername('AndrewSink');
      }
      
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle sound and manage audio engine
  const handleToggleSound = useCallback(async () => {
    const audioEngine = getAudioEngine();
    
    if (!soundEnabled) {
      // Starting audio
      if (contributionData) {
        audioEngine.updateConfig({
          contributions: contributionData.totalContributions,
          genre: currentGenre,
          streakDays: contributionData.currentStreak,
        });
      }
      audioEngine.setGenre(currentGenre);
      await audioEngine.play();
      setSoundEnabled(true);
    } else {
      // Stopping audio
      audioEngine.stop();
      setSoundEnabled(false);
    }
  }, [soundEnabled, contributionData, currentGenre]);

  const goToPrevMode = useCallback(() => {
    setCurrentModeIndex((prev) => 
      prev === 0 ? VISUALIZATION_MODES.length - 1 : prev - 1
    );
  }, []);

  const goToNextMode = useCallback(() => {
    setCurrentModeIndex((prev) => 
      prev === VISUALIZATION_MODES.length - 1 ? 0 : prev + 1
    );
  }, []);

  // Update audio engine when mode changes
  useEffect(() => {
    if (soundEnabled) {
      const audioEngine = getAudioEngine();
      const newGenre = MODE_TO_GENRE[currentMode.id] || 'ambient';
      audioEngine.setGenre(newGenre);
    }
  }, [currentModeIndex, soundEnabled, currentMode.id]);

  // Update audio engine when contribution data changes
  useEffect(() => {
    if (soundEnabled && contributionData) {
      const audioEngine = getAudioEngine();
      audioEngine.updateConfig({
        contributions: contributionData.totalContributions,
        streakDays: contributionData.currentStreak,
      });
    }
  }, [contributionData, soundEnabled]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      const audioEngine = getAudioEngine();
      audioEngine.destroy();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevMode();
      } else if (e.key === 'ArrowRight') {
        goToNextMode();
      } else if (e.key === 'm' || e.key === 'M') {
        // Toggle music with 'M' key
        handleToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevMode, goToNextMode, handleToggleSound]);

  // Check for saved user data on mount
  useEffect(() => {
    const savedData = loadUserData();
    if (savedData) {
      // Convert saved data to ContributionData format
      const data: ContributionData = {
        username: savedData.user.login,
        totalContributions: savedData.contributions.totalContributions,
        currentStreak: savedData.currentStreak,
        longestStreak: savedData.longestStreak,
        weeks: savedData.contributions.weeks.map(week => ({
          contributionDays: week.days.map(day => ({
            date: day.date,
            count: day.count,
            level: day.level,
          })),
        })),
        followers: savedData.user.followers,
        publicRepos: savedData.user.public_repos,
        avatarUrl: savedData.user.avatar_url,
        bio: savedData.user.bio || undefined,
      };
      setContributionData(data);
      setCurrentUsername(savedData.user.login);
      setIsConnected(true);
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-background overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-black/50" />
        
        {/* Header */}
        <Header
          isConnected={isConnected}
          onConnect={() => handleConnect()}
          isLoading={isLoading}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          data={contributionData}
          currentBPM={currentBPM}
          currentGenre={GENRE_NAMES[currentGenre]}
          username={currentUsername}
        />

        {/* Main visualization area */}
        <main className="absolute inset-0 pt-16 pb-24">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <WelcomeScreen
                key="welcome"
                onConnect={handleConnect}
                isLoading={isLoading}
                error={error}
              />
            ) : contributionData ? (
              <motion.div
                key="visualization"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <VisualizationRenderer
                  modeId={currentMode.id}
                  data={contributionData}
                />
              </motion.div>
            ) : (
              <LoadingScene key="loading" />
            )}
          </AnimatePresence>
        </main>

        {/* Navigation (visible when connected) */}
        <AnimatePresence>
          {isConnected && (
            <NavigationArrows
              onPrev={goToPrevMode}
              onNext={goToNextMode}
              currentIndex={currentModeIndex}
              total={VISUALIZATION_MODES.length}
            />
          )}
        </AnimatePresence>

        {/* Footer narrative */}
        {isConnected && (
          <FooterNarrative 
            mode={currentMode} 
            soundEnabled={soundEnabled}
            currentBPM={currentBPM}
            currentGenre={GENRE_NAMES[currentGenre]}
          />
        )}

        {/* Test Panel */}
        {isConnected && contributionData && (
          <TestPanel
            currentContributions={contributionData.totalContributions}
            onChangeContributions={handleChangeContributions}
            isVisible={testPanelVisible}
            onToggle={() => setTestPanelVisible(!testPanelVisible)}
          />
        )}

        {/* Watermark */}
        <Watermark />
      </div>
    </TooltipProvider>
  );
}

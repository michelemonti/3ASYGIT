import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  Activity,
  Zap,
  Info,
  Music,
  Search,
  User,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
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
import { DEMO_PROFILES } from '@/lib/mockData';
import { getAudioEngine, getBPMFromContributions, getEnergyLevel, ENERGY_LEVEL_INFO, getGenreFromBPM, GENRE_INFO } from '@/lib/audioEngine';
import { fetchGitHubStats, saveUserData, loadUserData, GitHubStats } from '@/lib/githubService';
import { CityVisualization, VisualizationHandle } from '@/components/visualizations/CityVisualization';
import { GalaxyVisualization } from '@/components/visualizations/GalaxyVisualization';
import { ContributionData } from '@/types/github';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// LinkedIn icon component
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ============================================================================
// Share Dropdown Component
// ============================================================================
interface ShareDropdownProps {
  onShare: (platform: 'twitter' | 'linkedin' | 'download') => void;
}

function ShareDropdown({ onShare }: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = (platform: 'twitter' | 'linkedin' | 'download') => {
    onShare(platform);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/60 hover:text-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
            style={{ zIndex: 9999 }}
          >
            <div className="p-1">
              <button
                onClick={() => handleShare('download')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
              >
                <Download className="w-4 h-4 text-neon-green" />
                <div>
                  <div className="text-sm text-white font-medium">Download PNG</div>
                  <div className="text-xs text-white/50">Save to your device</div>
                </div>
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
              >
                <XIcon className="w-4 h-4 text-white" />
                <div>
                  <div className="text-sm text-white font-medium">Share on X</div>
                  <div className="text-xs text-white/50">Quick & snappy post</div>
                </div>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left group"
              >
                <LinkedInIcon className="w-4 h-4 text-[#0A66C2]" />
                <div>
                  <div className="text-sm text-white font-medium">Share on LinkedIn</div>
                  <div className="text-xs text-white/50">Text copied, just paste!</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Visualization types
const VISUALIZATIONS = [
  { id: 'city', name: 'Calendar City', emoji: '🏙️', description: 'Days become skyscrapers' },
  { id: 'galaxy', name: 'Solar System', emoji: '☀️', description: 'Stars orbiting Earth around the Sun' },
] as const;
type VisualizationType = typeof VISUALIZATIONS[number]['id'];

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
        <span className="text-white/60 text-sm tracking-wider">LOADING...</span>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Header Component
// ============================================================================
interface HeaderProps {
  isConnected: boolean;
  onDisconnect: () => void;
  soundEnabled: boolean;
  audioLoading: boolean;
  onToggleSound: () => void;
  data: GitHubStats | null;
  currentBPM: number;
  username?: string;
  onSearch?: (username: string) => void;
  onShare?: (platform: 'twitter' | 'linkedin' | 'download') => void;
}

function Header({ isConnected, onDisconnect, soundEnabled, audioLoading, onToggleSound, data, currentBPM, username, onSearch, onShare }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const totalContributions = data?.contributions?.totalContributions || 0;
  const currentStreak = data?.currentStreak || 0;
  const energyLevel = getEnergyLevel(totalContributions);
  const energyInfo = ENERGY_LEVEL_INFO[energyLevel];
  const genre = getGenreFromBPM(currentBPM);
  const genreInfo = GENRE_INFO[genre];

  const handleSearch = (login: string) => {
    if (login.trim() && onSearch) {
      onSearch(login.trim());
      setSearchValue('');
      setShowSearch(false);
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchValue);
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <motion.button 
          className="flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={onDisconnect}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            git.<span className="text-neon-green">3asy</span>.app
          </span>
        </motion.button>

        <AnimatePresence>
          {isConnected && data && (
            <motion.div
              className="hidden md:flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {username && (
                <a 
                  href={`https://github.com/${username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform"
                >
                  <Badge variant="outline" className="gap-1 border-white/20 cursor-pointer hover:border-neon-green hover:text-neon-green transition-colors">
                    <User className="w-3 h-3" />
                    @{username}
                  </Badge>
                </a>
              )}
              <Badge variant="neon" className="gap-1">
                <Zap className="w-3 h-3" />
                {totalContributions} contributions
              </Badge>
              <Badge variant="cyan" className="gap-1">
                <Activity className="w-3 h-3" />
                {currentStreak} day streak
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="gap-1 cursor-help"
                      style={{ borderColor: energyInfo.color, color: energyInfo.color }}
                    >
                      <span>{energyInfo.emoji}</span>
                      {energyInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="text-center">
                    <p className="font-medium">{energyInfo.description}</p>
                    <p className="text-xs opacity-70">{energyInfo.vibe}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {soundEnabled && (
                <Badge variant="purple" className="gap-1 animate-pulse">
                  <Music className="w-3 h-3" />
                  {currentBPM} BPM
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {isConnected && (
            <div className="relative">
              <AnimatePresence>
                {showSearch ? (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 180, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSearchSubmit}
                    className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center z-50"
                  >
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Search user..."
                      autoFocus
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-black/90 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-neon-green/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => { setShowSearch(false); setSearchValue(''); setShowSuggestions(false); }}
                      className="absolute right-2 text-white/40 hover:text-white"
                    >
                      ×
                    </button>
                  </motion.form>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowSearch(true)}
                          className="text-white/60 hover:text-white"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Search user</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {showSearch && showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="p-2 text-xs text-white/40 border-b border-white/10">
                      Suggested profiles
                    </div>
                    {DEMO_PROFILES.map((profile) => (
                      <button
                        key={profile.login}
                        type="button"
                        onClick={() => handleSearch(profile.login)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <img
                          src={profile.avatarUrl}
                          alt={profile.login}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-white text-sm">{profile.login}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={soundEnabled ? "neon" : "ghost"}
                  size="icon"
                  onClick={onToggleSound}
                  disabled={audioLoading}
                  className={soundEnabled ? "" : "text-white/60 hover:text-white"}
                >
                  {audioLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {audioLoading 
                  ? 'Loading audio...' 
                  : soundEnabled 
                    ? `${genreInfo.emoji} ${genreInfo.label} @ ${currentBPM} BPM` 
                    : 'Enable Music'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                  <p>Transform your GitHub contributions into 3D  visualizations.</p>
                  <ul className="space-y-1 text-sm">
                    <li className="whitespace-nowrap">🎮 <strong>Three dimensions Canvas</strong> - Commits become 3D things</li>
                    <li className="whitespace-nowrap">🎵 <strong>Generative Music</strong> - Synthwave based on your activity</li>
                    <li className="whitespace-nowrap">⚡ <strong>Energy Levels</strong> - From lurker to legend</li>
                  </ul>
                  <p className="text-xs text-white/50 pt-2">
                    Built with React, Three.js & Web Audio API
                  </p>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {isConnected && onShare && (
            <ShareDropdown onShare={onShare} />
          )}
        </div>
      </div>
    </motion.header>
  );
}

// ============================================================================
// Welcome Screen
// ============================================================================
interface WelcomeScreenProps {
  onConnect: (username: string) => void;
  isLoading: boolean;
}

function WelcomeScreen({ onConnect, isLoading }: WelcomeScreenProps) {
  const [username, setUsername] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onConnect(username.trim());
    }
  };

  const handleSuggestionClick = (login: string) => {
    setUsername(login);
    setShowSuggestions(false);
    onConnect(login);
  };

  return (
    <motion.div
      className="h-screen flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center max-w-2xl mx-auto -mt-16"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-neon-green via-neon-cyan to-neon-pink flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Github className="w-8 h-8 text-black" />
        </motion.div>

        <h1 className="text-3xl md:text-5xl font-bold mb-2">
          git.<span className="text-neon-green">3asy</span>.app
        </h1>

        <p className="text-white/60 text-base mb-6">
          Transform your GitHub into a 3D city
        </p>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
              <p className="text-white/60">Loading contributions...</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Enter GitHub username"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-neon-green/50 focus:ring-2 focus:ring-neon-green/20 transition-all"
                  />
                </div>

                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                      style={{ zIndex: 9999 }}
                    >
                      <div className="p-2 text-xs text-white/40 border-b border-white/10">
                        Suggested profiles
                      </div>
                      {DEMO_PROFILES.map((profile) => (
                        <button
                          key={profile.login}
                          type="button"
                          onClick={() => handleSuggestionClick(profile.login)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                        >
                          <img
                            src={profile.avatarUrl}
                            alt={profile.login}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-white">{profile.login}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                type="submit"
                variant="neon"
                size="lg"
                disabled={!username.trim()}
                className="px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Build My City
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-white/30 text-sm mt-6">
JUST 4 FUN        </p>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// Footer
// ============================================================================
interface FooterProps {
  soundEnabled: boolean;
  currentBPM: number;
  currentViz: VisualizationType;
}

function Footer({ soundEnabled, currentBPM, currentViz }: FooterProps) {
  const vizInfo = VISUALIZATIONS.find(v => v.id === currentViz)!;
  
  return (
    <motion.footer
      className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-screen-lg mx-auto px-6 py-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-neon-pink">
              {vizInfo.emoji} {vizInfo.name}
            </h2>
            {soundEnabled && (
              <motion.div 
                className="flex items-center gap-1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Music className="w-4 h-4 text-neon-green" />
                <span className="text-sm text-neon-green">{currentBPM} BPM</span>
              </motion.div>
            )}
          </div>
          <p className="text-white/40 text-sm">
            {vizInfo.description}
          </p>
        </div>
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
      className="fixed bottom-4 right-4 z-30 text-white/20 text-xs font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      git.3asy.app
    </motion.div>
  );
}

// ============================================================================
// Helper: Convert GitHubStats to ContributionData for visualization
// ============================================================================
function toContributionData(stats: GitHubStats): ContributionData {
  return {
    totalContributions: stats.contributions.totalContributions,
    weeks: stats.contributions.weeks,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
  };
}

// ============================================================================
// Main App
// ============================================================================
export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [githubStats, setGitHubStats] = useState<GitHubStats | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [currentBPM, setCurrentBPM] = useState(90);
  const [currentViz, setCurrentViz] = useState<VisualizationType>('city');
  
  // Refs for visualization screenshot
  const vizRef = useRef<VisualizationHandle>(null);

  // Screenshot capture function
  const captureAndShare = useCallback(async (platform: 'twitter' | 'linkedin' | 'download') => {
    const url = `${window.location.origin}?u=${currentUsername}`;
    
    // Try to capture screenshot
    let imageBlob: Blob | null = null;
    if (vizRef.current) {
      try {
        imageBlob = await vizRef.current.captureScreenshot();
      } catch (e) {
        console.warn('Failed to capture screenshot:', e);
      }
    }

    // Direct download - skip Web Share API entirely
    if (platform === 'download') {
      if (imageBlob) {
        const downloadUrl = URL.createObjectURL(imageBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `github-${currentUsername}-viz.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }
      return;
    }

    // Direct social sharing - open platform with pre-filled text (no popup)
    if (platform === 'twitter') {
      // Twitter/X: Snappy, casual tone
      const text = `Just turned my GitHub commits into a cyberpunk city 🌆✨ Pretty cool ngl`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'linkedin') {
      // LinkedIn doesn't support pre-filled text anymore, so copy to clipboard first
      const text = `I discovered an interesting way to visualize GitHub contributions - this tool transforms your commit history into a 3D cyberpunk city with AI-generated music based on your coding patterns.\n\n${url}`;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.warn('Failed to copy to clipboard:', e);
      }
      // Open LinkedIn create post page
      const linkedInUrl = `https://www.linkedin.com/feed/?shareActive=true`;
      window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    }
  }, [currentUsername]);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const usernameParam = params.get('u');
    if (usernameParam) {
      handleConnect(usernameParam);
    } else {
      const saved = loadUserData();
      if (saved) {
        setGitHubStats(saved);
        setCurrentUsername(saved.user.login);
        setIsConnected(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update BPM when data changes
  useEffect(() => {
    if (githubStats) {
      const bpm = getBPMFromContributions(githubStats.contributions.totalContributions);
      setCurrentBPM(bpm);
    }
  }, [githubStats]);

  const handleConnect = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      const stats = await fetchGitHubStats(username);
      if (!stats) {
        throw new Error('Failed to fetch');
      }
      setGitHubStats(stats);
      setCurrentUsername(username);
      setIsConnected(true);
      saveUserData(stats);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('u', username);
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Failed to fetch:', error);
      alert('Failed to load GitHub data. Please check the username.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setGitHubStats(null);
    setCurrentUsername('');
    setSoundEnabled(false);
    
    const audioEngine = getAudioEngine();
    audioEngine.stop();
    
    // Clear URL
    window.history.pushState({}, '', window.location.pathname);
  }, []);

  const handleToggleSound = useCallback(async () => {
    const audioEngine = getAudioEngine();
    
    if (soundEnabled) {
      audioEngine.stop();
      setSoundEnabled(false);
    } else if (githubStats) {
      setAudioLoading(true);
      audioEngine.updateConfig({
        contributions: githubStats.contributions.totalContributions,
        streakDays: githubStats.currentStreak,
      });
      await audioEngine.play();
      setAudioLoading(false);
      setSoundEnabled(true);
    }
  }, [soundEnabled, githubStats]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      const audioEngine = getAudioEngine();
      audioEngine.destroy();
    };
  }, []);

  // Keyboard shortcut for music
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSound]);

  // Convert to ContributionData for visualization
  const contributionData = githubStats ? toContributionData(githubStats) : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-x-hidden">
        <Header
          isConnected={isConnected}
          onDisconnect={handleDisconnect}
          soundEnabled={soundEnabled}
          audioLoading={audioLoading}
          onToggleSound={handleToggleSound}
          data={githubStats}
          currentBPM={currentBPM}
          username={currentUsername}
          onSearch={handleConnect}
          onShare={captureAndShare}
        />

        <main className="w-full h-screen pt-16 pb-20">
          <AnimatePresence mode="wait">
            {!isConnected ? (
              <WelcomeScreen
                key="welcome"
                onConnect={handleConnect}
                isLoading={isLoading}
              />
            ) : contributionData ? (
              <motion.div
                key="visualization"
                className="w-full h-full relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Suspense fallback={<LoadingScene />}>
                  <AnimatePresence mode="wait">
                    {currentViz === 'city' ? (
                      <motion.div
                        key="city"
                        className="w-full h-full"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4 }}
                      >
                        <CityVisualization ref={vizRef} data={contributionData} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="galaxy"
                        className="w-full h-full"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.4 }}
                      >
                        <GalaxyVisualization ref={vizRef} data={contributionData} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Suspense>
                
                {/* Navigation Arrow */}
                <motion.button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full glass border border-white/10 hover:border-neon-green/50 hover:bg-neon-green/10 transition-all group"
                  onClick={() => setCurrentViz(prev => prev === 'city' ? 'galaxy' : 'city')}
                  whileHover={{ scale: 1.1, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  {currentViz === 'city' ? (
                    <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-neon-green transition-colors" />
                  ) : (
                    <ChevronLeft className="w-6 h-6 text-white/60 group-hover:text-neon-green transition-colors" />
                  )}
                </motion.button>
                
                {/* Visualization indicator dots */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {VISUALIZATIONS.map((viz) => (
                    <motion.button
                      key={viz.id}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentViz === viz.id 
                          ? 'bg-neon-green scale-125' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                      onClick={() => setCurrentViz(viz.id)}
                      whileHover={{ scale: 1.3 }}
                      title={`${viz.emoji} ${viz.name}`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <LoadingScene key="loading" />
            )}
          </AnimatePresence>
        </main>

        {isConnected && (
          <Footer soundEnabled={soundEnabled} currentBPM={currentBPM} currentViz={currentViz} />
        )}

        <Watermark />
      </div>
    </TooltipProvider>
  );
}

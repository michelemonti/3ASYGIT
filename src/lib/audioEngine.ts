/**
 * Generative Audio Engine v2 for git.3asy.app
 * 
 * Creates UNIQUE procedural music based on exact contribution count
 * Each contribution number generates a different melody using seeded randomness
 * 
 * Genre Progression (contribution-based tiers):
 * - Chillout: 85-109 BPM (0-200 contributions)
 * - Techno: 110-127 BPM (200-800 contributions)  
 * - Trance: 128-139 BPM (800-2000 contributions) ← @michelemonti ~1200 = 132 BPM
 * - Hardstyle: 140-154 BPM (2000-4000 contributions) ← @torvalds ~3100 = 148 BPM
 * - Hardcore: 155-180 BPM (4000+ contributions)
 */

export type MusicGenre = 'chillout' | 'techno' | 'trance' | 'hardstyle' | 'hardcore';
export type EnergyLevel = 'lurker' | 'casual' | 'regular' | 'active' | 'dedicated' | 'poweruser' | 'machine' | 'legend';

interface AudioEngineConfig {
  contributions: number;
  streakDays: number;
}

// ============================================================================
// SEEDED RANDOM - Same contributions = Same melody
// ============================================================================
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Mulberry32 algorithm
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // Random int in range [min, max]
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Pick random element from array
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Random boolean with probability
  chance(probability: number): boolean {
    return this.next() < probability;
  }
}

// ============================================================================
// BPM & GENRE CALCULATION
// ============================================================================

/**
 * Calculate BPM with tiered progression for proper genre distribution
 * 
 * Ranges:
 * - 0-200 contributions: Chillout (85-109 BPM)
 * - 200-800 contributions: Techno (110-127 BPM)
 * - 800-2000 contributions: Trance (128-139 BPM) - @michelemonti level
 * - 2000-4000 contributions: Hardstyle (140-154 BPM) - @torvalds level
 * - 4000+ contributions: Hardcore (155-180 BPM)
 */
export function getBPMFromContributions(contributions: number): number {
  if (contributions <= 0) return 85;
  
  if (contributions <= 200) {
    // Chillout: 85-109 BPM
    return Math.round(85 + (contributions / 200) * 24);
  } else if (contributions <= 800) {
    // Techno: 110-127 BPM
    return Math.round(110 + ((contributions - 200) / 600) * 17);
  } else if (contributions <= 2000) {
    // Trance: 128-139 BPM
    return Math.round(128 + ((contributions - 800) / 1200) * 11);
  } else if (contributions <= 4000) {
    // Hardstyle: 140-154 BPM
    return Math.round(140 + ((contributions - 2000) / 2000) * 14);
  } else {
    // Hardcore: 155-180 BPM
    const extra = Math.min((contributions - 4000) / 4000, 1);
    return Math.round(155 + extra * 25);
  }
}

// Get genre based on BPM
export function getGenreFromBPM(bpm: number): MusicGenre {
  if (bpm < 110) return 'chillout';
  if (bpm < 128) return 'techno';
  if (bpm < 140) return 'trance';
  if (bpm < 155) return 'hardstyle';
  return 'hardcore';
}

// Get energy level from contributions  
export function getEnergyLevel(contributions: number): EnergyLevel {
  if (contributions < 100) return 'lurker';
  if (contributions < 300) return 'casual';
  if (contributions < 600) return 'regular';
  if (contributions < 1000) return 'active';
  if (contributions < 1500) return 'dedicated';
  if (contributions < 2500) return 'poweruser';
  if (contributions < 4000) return 'machine';
  return 'legend';
}

// Genre display info
export const GENRE_INFO: Record<MusicGenre, { label: string; emoji: string; color: string }> = {
  chillout: { label: 'Chillout', emoji: '🌊', color: '#88C0D0' },
  techno: { label: 'Techno', emoji: '🔊', color: '#A3BE8C' },
  trance: { label: 'Trance', emoji: '🌀', color: '#EBCB8B' },
  hardstyle: { label: 'Hardstyle', emoji: '💥', color: '#D08770' },
  hardcore: { label: 'Hardcore', emoji: '🔥', color: '#BF616A' },
};

// Energy level display info
export const ENERGY_LEVEL_INFO: Record<EnergyLevel, { label: string; emoji: string; color: string; description: string; vibe: string }> = {
  lurker: { label: 'Lurker', emoji: '😴', color: '#666666', description: 'Just watching', vibe: 'Chill ambient' },
  casual: { label: 'Casual', emoji: '🌱', color: '#88C0D0', description: 'Taking it easy', vibe: 'Smooth vibes' },
  regular: { label: 'Regular', emoji: '💼', color: '#A3BE8C', description: 'Steady work', vibe: 'Deep grooves' },
  active: { label: 'Active', emoji: '⚡', color: '#EBCB8B', description: 'Shipping code', vibe: 'Tech house' },
  dedicated: { label: 'Dedicated', emoji: '🔥', color: '#D08770', description: 'On fire!', vibe: 'Peak time' },
  poweruser: { label: 'Power User', emoji: '💎', color: '#BF616A', description: 'Unstoppable', vibe: 'Uplifting' },
  machine: { label: 'Machine', emoji: '🚀', color: '#B48EAD', description: 'Code warrior', vibe: 'Hard kicks' },
  legend: { label: 'Legend', emoji: '👑', color: '#FFD700', description: 'GitHub royalty', vibe: 'Gabber mode' },
};

// ============================================================================
// MUSICAL CONSTANTS
// ============================================================================

const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonicMinor: [0, 3, 5, 7, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
};

// Root notes in Hz
const ROOT_NOTES = {
  'C': 130.81, 'C#': 138.59, 'D': 146.83, 'D#': 155.56,
  'E': 164.81, 'F': 174.61, 'F#': 185.00, 'G': 196.00,
  'G#': 207.65, 'A': 220.00, 'A#': 233.08, 'B': 246.94,
};

const ROOT_NOTE_NAMES = Object.keys(ROOT_NOTES) as (keyof typeof ROOT_NOTES)[];

// ============================================================================
// GENERATIVE AUDIO ENGINE
// ============================================================================

export class GenerativeAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isPlaying: boolean = false;
  private isLoading: boolean = false;
  private scheduledNodes: AudioScheduledSourceNode[] = [];
  private loopTimeout: number | null = null;
  private config: AudioEngineConfig;
  private rng: SeededRandom;
  private generatedMelody: number[] = [];
  private generatedBassline: number[] = [];
  private rootFreq: number = 130.81;
  private scale: number[] = SCALES.minor;

  constructor() {
    this.config = { contributions: 500, streakDays: 7 };
    this.rng = new SeededRandom(500);
  }

  // Get loading state
  getIsLoading(): boolean {
    return this.isLoading;
  }

  // Get playing state
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Initialize audio context (lazy - on first play)
  private async init(): Promise<void> {
    if (this.audioContext) return;

    this.isLoading = true;
    
    this.audioContext = new AudioContext();
    
    // Master compressor for loudness
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.audioContext.destination);

    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(this.compressor);

    this.isLoading = false;
  }

  // Update config and regenerate patterns
  updateConfig(config: Partial<AudioEngineConfig>): void {
    const oldContributions = this.config.contributions;
    this.config = { ...this.config, ...config };
    
    // Only regenerate if contributions changed
    if (config.contributions !== undefined && config.contributions !== oldContributions) {
      this.generateUniquePatterns();
    }
  }

  // Generate unique melody and bassline based on contribution count
  private generateUniquePatterns(): void {
    const contributions = this.config.contributions;
    
    // Seed with contributions number - same number = same patterns
    this.rng = new SeededRandom(contributions);
    
    // Pick root note based on contributions
    const rootIndex = contributions % ROOT_NOTE_NAMES.length;
    const rootName = ROOT_NOTE_NAMES[rootIndex];
    this.rootFreq = ROOT_NOTES[rootName];
    
    // Pick scale based on genre
    const bpm = getBPMFromContributions(contributions);
    const genre = getGenreFromBPM(bpm);
    
    const genreScales: Record<MusicGenre, (keyof typeof SCALES)[]> = {
      chillout: ['pentatonicMajor', 'major', 'dorian'],
      techno: ['minor', 'dorian', 'phrygian'],
      trance: ['minor', 'harmonicMinor', 'dorian'],
      hardstyle: ['phrygian', 'harmonicMinor', 'minor'],
      hardcore: ['phrygian', 'harmonicMinor', 'minor'],
    };
    
    this.scale = SCALES[this.rng.pick(genreScales[genre])];
    
    // Generate 16-step melody pattern (unique to this contribution count)
    this.generatedMelody = [];
    for (let i = 0; i < 16; i++) {
      if (this.rng.chance(0.7)) {
        // Note: scale degree 0-7, octave variation
        const degree = this.rng.int(0, this.scale.length - 1);
        const octave = this.rng.int(0, 1);
        this.generatedMelody.push(this.getFrequency(degree, octave + 1));
      } else {
        this.generatedMelody.push(0); // Rest
      }
    }
    
    // Generate 8-step bassline pattern
    this.generatedBassline = [];
    for (let i = 0; i < 8; i++) {
      const degree = this.rng.pick([0, 0, 2, 3, 4, 5]); // Root-heavy
      this.generatedBassline.push(this.getFrequency(degree, 0));
    }
  }

  // Get frequency from scale degree and octave
  private getFrequency(degree: number, octave: number): number {
    const semitone = this.scale[degree % this.scale.length];
    const octaveOffset = Math.floor(degree / this.scale.length) + octave;
    return this.rootFreq * Math.pow(2, (semitone + octaveOffset * 12) / 12);
  }

  // ============================================================================
  // SOUND GENERATORS
  // ============================================================================

  private createOscillator(
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    volume: number,
    attack: number = 0.01,
    release: number = 0.1
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 2000 + (this.config.contributions / 5);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attack);
    gain.gain.setValueAtTime(volume, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    this.scheduledNodes.push(osc);
  }

  private createKick(startTime: number, volume: number, hard: boolean = false): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    
    // Harder kick for hardstyle/hardcore
    const startFreq = hard ? 180 : 150;
    const endFreq = hard ? 25 : 35;
    const decayTime = hard ? 0.15 : 0.25;

    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.08);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + decayTime);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + decayTime + 0.05);
    this.scheduledNodes.push(osc);

    // Distorted layer for hardstyle
    if (hard) {
      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      const distortion = this.audioContext.createWaveShaper();
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(60, startTime);
      osc2.frequency.exponentialRampToValueAtTime(30, startTime + 0.1);
      
      // Simple distortion curve
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i - 128) / 128;
        curve[i] = Math.tanh(x * 3);
      }
      distortion.curve = curve;
      
      gain2.gain.setValueAtTime(volume * 0.4, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      
      osc2.connect(distortion);
      distortion.connect(gain2);
      gain2.connect(this.masterGain);
      
      osc2.start(startTime);
      osc2.stop(startTime + 0.15);
      this.scheduledNodes.push(osc2);
    }
  }

  private createHiHat(startTime: number, volume: number, open: boolean = false): void {
    if (!this.audioContext || !this.masterGain) return;

    const duration = open ? 0.15 : 0.05;
    const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = open ? 6000 : 8000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + duration + 0.01);
    this.scheduledNodes.push(noise);
  }

  private createSnare(startTime: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Noise
    const bufferSize = Math.floor(this.audioContext.sampleRate * 0.15);
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 4000;
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.6, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Tone
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, startTime);
    osc.frequency.exponentialRampToValueAtTime(80, startTime + 0.05);
    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(volume, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + 0.15);
    osc.start(startTime);
    osc.stop(startTime + 0.1);

    this.scheduledNodes.push(noise, osc);
  }

  private createBass(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * 0.5;

    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(startTime);
    osc1.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);

    this.scheduledNodes.push(osc1, osc2);
  }

  private createPad(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const detunes = [0, 5, -5, 12, -12];
    
    for (const detune of detunes) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;

      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      const vol = volume / detunes.length;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.4);
      gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
      this.scheduledNodes.push(osc);
    }
  }

  private createLead(freq: number, startTime: number, duration: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq;
    osc2.detune.value = 7;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.linearRampToValueAtTime(3000, startTime + duration * 0.3);
    filter.frequency.linearRampToValueAtTime(1000, startTime + duration);
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume * 0.7, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    osc2.start(startTime);
    osc2.stop(startTime + duration + 0.05);

    this.scheduledNodes.push(osc, osc2);
  }

  // ============================================================================
  // GENRE GENERATORS
  // ============================================================================

  private generateChillout(bpm: number, bars: number): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    // Slow pads
    for (let bar = 0; bar < bars; bar++) {
      const chordDegrees = [[0, 2, 4], [3, 5, 0], [4, 6, 1], [2, 4, 6]][bar % 4];
      chordDegrees.forEach(deg => {
        const freq = this.getFrequency(deg, 1);
        this.createPad(freq, now + bar * barDur, barDur * 0.95, 0.12);
      });
    }

    // Sparse melody from generated pattern
    for (let i = 0; i < this.generatedMelody.length; i++) {
      const freq = this.generatedMelody[i];
      if (freq > 0 && i % 2 === 0) {
        const time = now + i * beatDur;
        this.createOscillator(freq, 'sine', time, beatDur * 1.5, 0.08, 0.1, 0.3);
      }
    }

    // Very subtle kick on 1 and 3
    for (let bar = 0; bar < bars; bar++) {
      this.createKick(now + bar * barDur, 0.25);
      this.createKick(now + bar * barDur + beatDur * 2, 0.2);
    }
  }

  private generateTechno(bpm: number, bars: number): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    // Four-on-the-floor kick
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createKick(now + bar * barDur + beat * beatDur, 0.5);
      }
    }

    // Offbeat hi-hats
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createHiHat(now + bar * barDur + beat * beatDur + beatDur / 2, 0.12);
      }
    }

    // Clap/snare on 2 and 4
    for (let bar = 0; bar < bars; bar++) {
      this.createSnare(now + bar * barDur + beatDur, 0.3);
      this.createSnare(now + bar * barDur + beatDur * 3, 0.3);
    }

    // Bassline from generated pattern
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < 8; i++) {
        const freq = this.generatedBassline[i % this.generatedBassline.length];
        const time = now + bar * barDur + i * (beatDur / 2);
        if (this.rng.chance(0.8)) {
          this.createBass(freq, time, beatDur / 2 * 0.9, 0.25);
        }
      }
    }

    // Melody stabs
    for (let i = 0; i < this.generatedMelody.length; i++) {
      const freq = this.generatedMelody[i];
      if (freq > 0) {
        const time = now + i * (beatDur / 2);
        this.createOscillator(freq, 'sawtooth', time, beatDur / 2 * 0.6, 0.1, 0.01, 0.05);
      }
    }
  }

  private generateTrance(bpm: number, bars: number): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    // Punchy kick
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createKick(now + bar * barDur + beat * beatDur, 0.55);
      }
    }

    // Open hi-hats on offbeats
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createHiHat(now + bar * barDur + beat * beatDur + beatDur / 2, 0.1, true);
      }
    }

    // Claps
    for (let bar = 0; bar < bars; bar++) {
      this.createSnare(now + bar * barDur + beatDur, 0.35);
      this.createSnare(now + bar * barDur + beatDur * 3, 0.35);
    }

    // Rolling bassline (16th notes)
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < 16; i++) {
        const freq = this.generatedBassline[i % this.generatedBassline.length];
        const time = now + bar * barDur + i * (beatDur / 4);
        this.createBass(freq, time, beatDur / 4 * 0.85, 0.2);
      }
    }

    // Uplifting pads
    for (let bar = 0; bar < bars; bar += 2) {
      const chordDegrees = [[0, 2, 4, 7], [5, 0, 2, 4]][Math.floor(bar / 2) % 2];
      chordDegrees.forEach(deg => {
        const freq = this.getFrequency(deg, 1);
        this.createPad(freq, now + bar * barDur, barDur * 2 * 0.95, 0.1);
      });
    }

    // Lead melody
    for (let i = 0; i < this.generatedMelody.length; i++) {
      const freq = this.generatedMelody[i];
      if (freq > 0) {
        const time = now + i * (beatDur / 2);
        this.createLead(freq, time, beatDur / 2 * 0.8, 0.12);
      }
    }
  }

  private generateHardstyle(bpm: number, bars: number): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    // Hard kicks
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createKick(now + bar * barDur + beat * beatDur, 0.65, true);
      }
    }

    // Reverse bass (offbeat)
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const freq = this.generatedBassline[beat % this.generatedBassline.length];
        const time = now + bar * barDur + beat * beatDur + beatDur / 2;
        this.createBass(freq, time, beatDur * 0.4, 0.35);
      }
    }

    // Snare rolls
    for (let bar = 0; bar < bars; bar++) {
      this.createSnare(now + bar * barDur + beatDur, 0.4);
      this.createSnare(now + bar * barDur + beatDur * 3, 0.4);
      // Roll at end of phrase
      if (bar % 4 === 3) {
        for (let i = 0; i < 4; i++) {
          this.createSnare(now + bar * barDur + beatDur * 3 + i * (beatDur / 4), 0.3);
        }
      }
    }

    // Euphoric lead
    for (let bar = 0; bar < bars; bar += 2) {
      for (let i = 0; i < 8; i++) {
        const freq = this.generatedMelody[i % this.generatedMelody.length];
        if (freq > 0) {
          const time = now + bar * barDur + i * beatDur;
          this.createLead(freq, time, beatDur * 0.7, 0.15);
        }
      }
    }
  }

  private generateHardcore(bpm: number, bars: number): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    const beatDur = 60 / bpm;
    const barDur = beatDur * 4;

    // Gabber kicks
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        this.createKick(now + bar * barDur + beat * beatDur, 0.7, true);
        // Extra kick on offbeats for intensity
        if (bar % 2 === 1) {
          this.createKick(now + bar * barDur + beat * beatDur + beatDur / 2, 0.5, true);
        }
      }
    }

    // Aggressive bass stabs
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < 8; i++) {
        const freq = this.generatedBassline[i % this.generatedBassline.length];
        const time = now + bar * barDur + i * (beatDur / 2);
        this.createBass(freq, time, beatDur / 2 * 0.5, 0.4);
      }
    }

    // Intense hi-hats
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < 8; i++) {
        this.createHiHat(now + bar * barDur + i * (beatDur / 2), 0.15);
      }
    }

    // Screaming leads
    for (let i = 0; i < this.generatedMelody.length; i++) {
      const freq = this.generatedMelody[i];
      if (freq > 0) {
        const time = now + i * (beatDur / 2);
        this.createLead(freq * 2, time, beatDur / 2 * 0.6, 0.18);
      }
    }
  }

  // ============================================================================
  // MAIN PLAYBACK
  // ============================================================================

  private generateMusic(): void {
    const bpm = getBPMFromContributions(this.config.contributions);
    const genre = getGenreFromBPM(bpm);
    const bars = 4;

    switch (genre) {
      case 'chillout':
        this.generateChillout(bpm, bars);
        break;
      case 'techno':
        this.generateTechno(bpm, bars);
        break;
      case 'trance':
        this.generateTrance(bpm, bars);
        break;
      case 'hardstyle':
        this.generateHardstyle(bpm, bars);
        break;
      case 'hardcore':
        this.generateHardcore(bpm, bars);
        break;
    }
  }

  async play(): Promise<void> {
    this.isLoading = true;
    
    await this.init();
    this.generateUniquePatterns();
    
    if (this.isPlaying) {
      this.isLoading = false;
      return;
    }

    this.isPlaying = true;
    this.isLoading = false;
    this.loop();
  }

  private loop(): void {
    if (!this.isPlaying) return;

    this.generateMusic();

    const bpm = getBPMFromContributions(this.config.contributions);
    const beatDur = 60 / bpm;
    const loopDuration = beatDur * 4 * 4 * 1000; // 4 bars in ms

    this.loopTimeout = window.setTimeout(() => {
      this.loop();
    }, loopDuration - 100);
  }

  stop(): void {
    this.isPlaying = false;

    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    this.scheduledNodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    this.scheduledNodes = [];
  }

  async toggle(): Promise<boolean> {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.play();
      return true;
    }
  }

  getCurrentBPM(): number {
    return getBPMFromContributions(this.config.contributions);
  }

  getCurrentGenre(): MusicGenre {
    return getGenreFromBPM(this.getCurrentBPM());
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton
let audioEngineInstance: GenerativeAudioEngine | null = null;

export function getAudioEngine(): GenerativeAudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new GenerativeAudioEngine();
  }
  return audioEngineInstance;
}

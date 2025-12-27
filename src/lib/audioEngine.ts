/**
 * Generative Audio Engine for git.3asy.app
 * Creates procedural music based on GitHub contribution data
 * 
 * 5 Genres (per visualization):
 * 1. Galaxy - Ambient/Space Synth
 * 2. Mountain - Cinematic/Epic
 * 3. Tunnel - Techno/Trance
 * 4. City - Synthwave/Cyberpunk
 * 5. Heartbeat - Drum & Bass/Industrial
 * 
 * 8 Energy Levels (per contribution range):
 * Each level changes the musical intensity, complexity, and mood
 */

export type MusicGenre = 'ambient' | 'cinematic' | 'techno' | 'synthwave' | 'dnb';
export type EnergyLevel = 'chill' | 'relaxed' | 'moderate' | 'active' | 'energetic' | 'intense' | 'extreme' | 'legendary';

interface AudioEngineConfig {
  contributions: number;
  genre: MusicGenre;
  streakDays: number;
}

// Calculate BPM based on contributions
export function getBPMFromContributions(contributions: number): number {
  if (contributions < 100) return 128;
  if (contributions < 300) return 130;
  if (contributions < 600) return 135;
  if (contributions < 800) return 138;
  if (contributions < 1000) return 140;
  if (contributions < 2000) return 145;
  if (contributions < 3000) return 150;
  return 155;
}

// Get energy level from contributions
export function getEnergyLevel(contributions: number): EnergyLevel {
  if (contributions < 100) return 'chill';
  if (contributions < 300) return 'relaxed';
  if (contributions < 600) return 'moderate';
  if (contributions < 800) return 'active';
  if (contributions < 1000) return 'energetic';
  if (contributions < 2000) return 'intense';
  if (contributions < 3000) return 'extreme';
  return 'legendary';
}

// Energy level display info
export const ENERGY_LEVEL_INFO: Record<EnergyLevel, { label: string; emoji: string; color: string }> = {
  chill: { label: 'Chill Mode', emoji: '😌', color: '#88C0D0' },
  relaxed: { label: 'Relaxed', emoji: '🎵', color: '#81A1C1' },
  moderate: { label: 'Moderate', emoji: '🎸', color: '#A3BE8C' },
  active: { label: 'Active', emoji: '⚡', color: '#EBCB8B' },
  energetic: { label: 'Energetic', emoji: '🔥', color: '#D08770' },
  intense: { label: 'Intense', emoji: '💥', color: '#BF616A' },
  extreme: { label: 'Extreme', emoji: '🚀', color: '#B48EAD' },
  legendary: { label: 'Legendary', emoji: '👑', color: '#FFD700' },
};

// Musical scales for different moods
const SCALES = {
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural minor
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], // Dark, exotic
  lydian: [0, 2, 4, 6, 7, 9, 11], // Bright, dreamy
  mixolydian: [0, 2, 4, 5, 7, 9, 10], // Bluesy
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11], // Dramatic
};

// Musical keys for different energy levels (root notes)
const ENERGY_KEYS: Record<EnergyLevel, { root: string; scale: keyof typeof SCALES; mood: string }> = {
  chill: { root: 'C3', scale: 'pentatonic', mood: 'dreamy' },
  relaxed: { root: 'G3', scale: 'major', mood: 'peaceful' },
  moderate: { root: 'D3', scale: 'dorian', mood: 'groovy' },
  active: { root: 'A3', scale: 'mixolydian', mood: 'driving' },
  energetic: { root: 'E3', scale: 'minor', mood: 'powerful' },
  intense: { root: 'B2', scale: 'phrygian', mood: 'dark' },
  extreme: { root: 'F3', scale: 'harmonicMinor', mood: 'dramatic' },
  legendary: { root: 'D3', scale: 'lydian', mood: 'epic' },
};

// Base frequencies for notes (A = 440Hz)
const NOTE_FREQ: Record<string, number> = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
};

// Get frequency from scale degree
function getFrequencyFromScale(rootFreq: number, scale: number[], degree: number, octave: number = 0): number {
  const noteIndex = degree % scale.length;
  const octaveOffset = Math.floor(degree / scale.length) + octave;
  const semitones = scale[noteIndex] + (octaveOffset * 12);
  return rootFreq * Math.pow(2, semitones / 12);
}

export class GenerativeAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private scheduledNodes: AudioScheduledSourceNode[] = [];
  private loopTimeout: NodeJS.Timeout | null = null;
  private config: AudioEngineConfig;
  private currentGenre: MusicGenre = 'ambient';

  constructor() {
    this.config = {
      contributions: 500,
      genre: 'ambient',
      streakDays: 7,
    };
  }

  // Initialize audio context (must be called after user interaction)
  async init(): Promise<void> {
    if (this.audioContext) return;
    
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);
  }

  // Update configuration
  updateConfig(config: Partial<AudioEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Set genre based on visualization mode
  setGenre(genre: MusicGenre): void {
    this.currentGenre = genre;
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  // Get current energy configuration
  private getEnergyConfig() {
    const energyLevel = getEnergyLevel(this.config.contributions);
    const keyConfig = ENERGY_KEYS[energyLevel];
    const rootFreq = NOTE_FREQ[keyConfig.root];
    const scale = SCALES[keyConfig.scale];
    const bpm = getBPMFromContributions(this.config.contributions);
    
    // Intensity multipliers based on energy level
    const intensityMap: Record<EnergyLevel, number> = {
      chill: 0.4,
      relaxed: 0.5,
      moderate: 0.65,
      active: 0.75,
      energetic: 0.85,
      intense: 0.95,
      extreme: 1.0,
      legendary: 1.1,
    };
    
    return {
      energyLevel,
      rootFreq,
      scale,
      bpm,
      intensity: intensityMap[energyLevel],
      mood: keyConfig.mood,
    };
  }

  // Create oscillator with envelope
  private createSynth(
    freq: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    attack: number = 0.01,
    decay: number = 0.1,
    sustain: number = 0.5,
    release: number = 0.2,
    volume: number = 0.3
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = type;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = 2000 + (this.config.contributions / 10);
    filter.Q.value = 1;

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, startTime + attack + decay);
    gainNode.gain.setValueAtTime(volume * sustain, startTime + duration - release);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);

    this.scheduledNodes.push(osc);
  }

  // Create kick drum
  private createKick(startTime: number, volume: number = 0.5): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(30, startTime + 0.1);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + 0.3);

    this.scheduledNodes.push(osc);
  }

  // Create hi-hat
  private createHiHat(startTime: number, volume: number = 0.1): void {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + 0.05);

    this.scheduledNodes.push(noise);
  }

  // Create snare
  private createSnare(startTime: number, volume: number = 0.3): void {
    if (!this.audioContext || !this.masterGain) return;

    // Noise component
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 3000;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(volume * 0.5, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Tone component
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, startTime);
    osc.frequency.exponentialRampToValueAtTime(50, startTime + 0.05);

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(volume, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(startTime);
    noise.stop(startTime + 0.1);
    osc.start(startTime);
    osc.stop(startTime + 0.1);

    this.scheduledNodes.push(noise, osc);
  }

  // Create bass note
  private createBass(freq: number, startTime: number, duration: number, volume: number = 0.4): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc2.type = 'square';
    osc2.frequency.value = freq * 0.5;

    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 5;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration * 0.8);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    osc2.start(startTime);
    osc2.stop(startTime + duration);

    this.scheduledNodes.push(osc, osc2);
  }

  // Create pad/ambient sound
  private createPad(freq: number, startTime: number, duration: number, volume: number = 0.15): void {
    if (!this.audioContext || !this.masterGain) return;

    const numOscillators = 3;
    const detune = [0, 7, -7];

    for (let i = 0; i < numOscillators; i++) {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune[i];

      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume / numOscillators, startTime + duration * 0.3);
      gainNode.gain.setValueAtTime(volume / numOscillators, startTime + duration * 0.7);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      this.scheduledNodes.push(osc);
    }
  }

  // Create arpeggio
  private createArpeggio(
    rootFreq: number,
    scale: number[],
    startTime: number,
    noteDuration: number,
    noteCount: number,
    type: OscillatorType = 'sawtooth',
    volume: number = 0.15
  ): void {
    for (let i = 0; i < noteCount; i++) {
      const freq = getFrequencyFromScale(rootFreq, scale, i % 7, Math.floor(i / 7));
      this.createSynth(
        freq,
        type,
        startTime + i * noteDuration,
        noteDuration * 0.8,
        0.01,
        0.05,
        0.3,
        0.1,
        volume
      );
    }
  }

  // ============================================================================
  // GENRE-SPECIFIC GENERATORS
  // ============================================================================

  // 1. AMBIENT - Galaxy visualization (Space, ethereal)
  private generateAmbient(bpm: number, duration: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 60 / bpm;
    const energy = this.getEnergyConfig();
    const { rootFreq, scale, intensity } = energy;

    // Long evolving pads - more layers with higher energy
    const padLayers = Math.floor(2 + intensity * 3);
    for (let i = 0; i < padLayers; i++) {
      const padStart = now + i * (duration / padLayers);
      const noteIndex = [0, 2, 4, 3, 5][i % 5];
      const freq = getFrequencyFromScale(rootFreq, scale, noteIndex);
      this.createPad(freq, padStart, duration / 3, 0.1 * intensity);
      this.createPad(freq * 2, padStart + 0.5, duration / 4, 0.05 * intensity);
    }

    // Melodic elements - more frequent with higher energy
    const beatsInDuration = Math.floor(duration / beatDuration);
    const melodicChance = 0.3 + intensity * 0.4;
    for (let i = 0; i < beatsInDuration; i += Math.max(1, Math.floor(4 - intensity * 2))) {
      if (Math.random() < melodicChance) {
        const noteIndex = Math.floor(Math.random() * scale.length);
        const freq = getFrequencyFromScale(rootFreq * 2, scale, noteIndex);
        this.createSynth(
          freq,
          'sine',
          now + i * beatDuration,
          beatDuration * (2 + intensity),
          0.2 + intensity * 0.2,
          0.4,
          0.4,
          0.8,
          0.08
        );
      }
    }

    // Subtle rhythmic pulse (based on streak)
    const pulseIntensity = Math.min(this.config.streakDays / 30, 1);
    if (pulseIntensity > 0.3) {
      for (let i = 0; i < beatsInDuration; i += 2) {
        this.createSynth(
          rootFreq * 0.5,
          'sine',
          now + i * beatDuration,
          beatDuration * 1.5,
          0.1,
          0.3,
          0.2,
          0.3,
          0.05 * pulseIntensity
        );
      }
    }
  }

  // 2. CINEMATIC - Mountain visualization (Epic, orchestral feel)
  private generateCinematic(bpm: number, duration: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 60 / bpm;
    const energy = this.getEnergyConfig();
    const { rootFreq, scale, intensity } = energy;

    // Epic strings-like pads - chord complexity increases with energy
    const chordProgressions: Record<string, number[][]> = {
      simple: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]],
      rich: [[0, 2, 4, 6], [5, 0, 2, 4], [3, 5, 0, 2], [4, 6, 1, 3]],
    };
    const chordProgression = intensity > 0.7 ? chordProgressions.rich : chordProgressions.simple;
    const chordDuration = duration / 4;

    for (let c = 0; c < 4; c++) {
      const chordStart = now + c * chordDuration;
      chordProgression[c].forEach((degree, index) => {
        const freq = getFrequencyFromScale(rootFreq, scale, degree, index === 2 ? 1 : 0);
        this.createPad(freq, chordStart, chordDuration * 0.9, 0.1);
      });
    }

    // Low cinematic drums
    const beatsInDuration = Math.floor(duration / beatDuration);
    for (let i = 0; i < beatsInDuration; i += 4) {
      this.createKick(now + i * beatDuration, 0.4);
      if (i % 8 === 4) {
        this.createSnare(now + i * beatDuration, 0.2);
      }
    }

    // Rising tension element based on contributions
    const tensionLevel = Math.min(this.config.contributions / 1000, 1);
    if (tensionLevel > 0.3) {
      const riseStart = now + duration * 0.6;
      for (let i = 0; i < 8; i++) {
        const freq = getFrequencyFromScale(rootFreq * 2, scale, i, 0);
        this.createSynth(
          freq,
          'triangle',
          riseStart + i * (beatDuration * 0.5),
          beatDuration,
          0.1,
          0.2,
          0.5,
          0.2,
          0.06 * tensionLevel
        );
      }
    }
  }

  // 3. TECHNO - Tunnel visualization (Driving, hypnotic)
  private generateTechno(bpm: number, duration: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 60 / bpm;
    const beatsInDuration = Math.floor(duration / beatDuration);
    const energy = this.getEnergyConfig();
    const { rootFreq, scale, intensity } = energy;
    
    // Use lower octave for techno bass
    const bassRootFreq = rootFreq * 0.5;

    // 4-on-the-floor kick - harder at higher intensity
    for (let i = 0; i < beatsInDuration; i++) {
      this.createKick(now + i * beatDuration, 0.4 + intensity * 0.2);
    }

    // Off-beat hi-hats - more frequent at higher energy
    const hihatDivisions = Math.floor(2 + intensity * 2);
    for (let i = 0; i < beatsInDuration * hihatDivisions; i++) {
      if (i % 2 === 1) {
        this.createHiHat(now + i * (beatDuration / hihatDivisions), 0.05 + intensity * 0.05);
      }
    }

    // Snare pattern varies with energy
    for (let i = 0; i < beatsInDuration; i++) {
      if (i % 4 === 2 || (intensity > 0.7 && i % 4 === 0)) {
        this.createSnare(now + i * beatDuration, 0.2 + intensity * 0.1);
      }
    }

    // Driving bassline - pattern complexity based on energy
    const bassPatterns: Record<string, number[]> = {
      simple: [0, 0, 0, 0, 3, 0, 0, 0],
      medium: [0, 0, 3, 0, 5, 0, 3, 0],
      complex: [0, 2, 3, 0, 5, 3, 7, 5],
      intense: [0, 2, 3, 5, 7, 5, 3, 2],
    };
    const patternKey = intensity < 0.5 ? 'simple' : intensity < 0.7 ? 'medium' : intensity < 0.9 ? 'complex' : 'intense';
    const bassPattern = bassPatterns[patternKey];
    
    for (let i = 0; i < beatsInDuration; i++) {
      const noteIndex = bassPattern[i % bassPattern.length];
      const freq = getFrequencyFromScale(bassRootFreq, scale, noteIndex, 0);
      this.createBass(freq, now + i * beatDuration, beatDuration * 0.8, 0.2 + intensity * 0.15);
    }

    // Acid-style synth line - more prominent at higher energy
    if (intensity > 0.3) {
      const acidChance = 0.4 + intensity * 0.4;
      for (let i = 0; i < beatsInDuration * 2; i++) {
        if (Math.random() < acidChance) {
          const noteIndex = Math.floor(Math.random() * scale.length);
          const freq = getFrequencyFromScale(rootFreq * 2, scale, noteIndex, 0);
          this.createSynth(
            freq,
            'sawtooth',
            now + i * (beatDuration / 2),
            beatDuration / 3,
            0.01,
            0.05,
            0.3,
            0.05,
            0.08 * intensity
          );
        }
      }
    }
    
    // Hypnotic pad layer at higher energy
    if (intensity > 0.6) {
      const padFreq = getFrequencyFromScale(rootFreq, scale, 0, 1);
      this.createPad(padFreq, now, duration * 0.8, 0.06 * intensity);
    }
  }

  // 4. SYNTHWAVE - City visualization (Retro, neon)
  private generateSynthwave(bpm: number, duration: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 60 / bpm;
    const beatsInDuration = Math.floor(duration / beatDuration);
    const energy = this.getEnergyConfig();
    const { rootFreq, scale, intensity } = energy;

    // Retro drums - groove varies with energy
    for (let i = 0; i < beatsInDuration; i++) {
      this.createKick(now + i * beatDuration, 0.35 + intensity * 0.15);
      // More snare hits at higher energy
      if (i % 2 === 1 || (intensity > 0.8 && i % 4 === 3)) {
        this.createSnare(now + i * beatDuration, 0.15 + intensity * 0.1);
      }
    }

    // Hi-hats with swing - more subdivisions at higher energy
    const swingAmount = 0.02 * (1 - intensity * 0.5); // Less swing at higher intensity
    const hatSubdivisions = Math.floor(4 + intensity * 4);
    for (let i = 0; i < beatsInDuration * hatSubdivisions; i++) {
      const swing = i % 2 === 1 ? swingAmount : 0;
      this.createHiHat(now + i * (beatDuration / hatSubdivisions) + swing, 0.04 + intensity * 0.03);
    }

    // Synth bass - more melodic at higher energy
    const bassPatterns: Record<string, number[]> = {
      simple: [0, 0, 0, 0, 0, 0, 0, 0],
      groovy: [0, 0, 0, 0, 5, 5, 3, 3],
      melodic: [0, 2, 3, 5, 7, 5, 3, 2],
      epic: [0, 4, 7, 4, 5, 7, 4, 2],
    };
    const patternKey = intensity < 0.4 ? 'simple' : intensity < 0.6 ? 'groovy' : intensity < 0.85 ? 'melodic' : 'epic';
    const bassPattern = bassPatterns[patternKey];
    
    for (let i = 0; i < beatsInDuration; i++) {
      const noteIndex = bassPattern[i % bassPattern.length];
      const freq = getFrequencyFromScale(rootFreq * 0.5, scale, noteIndex, 0);
      this.createBass(freq, now + i * beatDuration, beatDuration * 0.9, 0.25 + intensity * 0.1);
    }

    // Lush pad chords - richer at higher energy
    const chordCount = Math.floor(2 + intensity * 2);
    const chordDuration = duration / chordCount;
    const chordVoicings: number[][] = [
      [0, 2, 4],           // Basic triad
      [0, 2, 4, 7],        // Added 7th
      [0, 2, 4, 7, 9],     // Extended
      [0, 4, 7, 11, 14],   // Wide voicing
    ];
    const voicing = chordVoicings[Math.min(Math.floor(intensity * 4), 3)];
    
    for (let c = 0; c < chordCount; c++) {
      const chordStart = now + c * chordDuration;
      const chordRootOffset = [0, 5, 3, 7][c % 4]; // Chord progression
      voicing.forEach((degree) => {
        const freq = getFrequencyFromScale(rootFreq, scale, degree + chordRootOffset, 0);
        this.createPad(freq, chordStart, chordDuration * 0.95, 0.06 * intensity);
      });
    }

    // Arpeggiated synth - more complex at higher energy
    if (intensity > 0.35) {
      const arpNotes = Math.floor(8 + intensity * 16);
      const arpNoteDuration = beatDuration / (2 + intensity);
      const arpType: OscillatorType = intensity > 0.7 ? 'sawtooth' : 'square';
      
      this.createArpeggio(
        rootFreq * 2,
        scale,
        now,
        arpNoteDuration,
        arpNotes,
        arpType,
        0.06 * intensity
      );
      
      // Second arp with offset at high energy
      if (intensity > 0.6) {
        this.createArpeggio(
          rootFreq * 3,
          scale,
          now + beatDuration * 4,
          arpNoteDuration,
          arpNotes,
          arpType,
          0.04 * intensity
        );
      }
    }
    
    // Lead melody at highest energy levels
    if (intensity > 0.8) {
      const leadNotes = [0, 2, 4, 7, 4, 2, 5, 4];
      for (let i = 0; i < Math.min(leadNotes.length, beatsInDuration); i++) {
        const freq = getFrequencyFromScale(rootFreq * 2, scale, leadNotes[i], 0);
        this.createSynth(
          freq,
          'sawtooth',
          now + i * beatDuration * 2,
          beatDuration * 1.5,
          0.1,
          0.2,
          0.6,
          0.3,
          0.08 * intensity
        );
      }
    }
  }

  // 5. DRUM & BASS - Heartbeat visualization (Fast, intense)
  private generateDnB(bpm: number, duration: number): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 60 / bpm;
    const beatsInDuration = Math.floor(duration / beatDuration);
    const energy = this.getEnergyConfig();
    const { rootFreq, scale, intensity } = energy;
    
    // Use lower octave for DnB bass
    const bassRootFreq = rootFreq * 0.5;

    // Breakbeat patterns - more complex at higher energy
    const kickPatterns: Record<string, number[]> = {
      simple:   [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      medium:   [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      complex:  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0],
      jungle:   [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    };
    const snarePatterns: Record<string, number[]> = {
      simple:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      medium:   [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0],
      complex:  [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0],
      jungle:   [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    };
    
    const patternKey = intensity < 0.4 ? 'simple' : intensity < 0.6 ? 'medium' : intensity < 0.85 ? 'complex' : 'jungle';
    const kickPattern = kickPatterns[patternKey];
    const snarePattern = snarePatterns[patternKey];

    for (let i = 0; i < beatsInDuration * 4; i++) {
      const time = now + i * (beatDuration / 4);
      if (kickPattern[i % 16]) {
        this.createKick(time, 0.4 + intensity * 0.2);
      }
      if (snarePattern[i % 16]) {
        this.createSnare(time, 0.25 + intensity * 0.15);
      }
    }

    // Hi-hats - more ghost notes at higher energy
    const hatSubdivisions = Math.floor(4 + intensity * 4);
    for (let i = 0; i < beatsInDuration * hatSubdivisions; i++) {
      const isGhost = i % 2 === 1;
      const volume = isGhost ? 0.03 * intensity : 0.04 + intensity * 0.03;
      this.createHiHat(now + i * (beatDuration / hatSubdivisions), volume);
    }

    // Rolling bass - pattern complexity based on energy
    const bassPatterns: Record<string, number[]> = {
      simple: [0, -1, 0, -1, 0, -1, 0, -1],
      groovy: [0, -1, 0, 2, 0, -1, 3, 0],
      rolling: [0, 0, 2, -1, 3, 0, 5, 3],
      liquid: [0, 2, 3, 5, 7, 5, 3, 2],
    };
    const bassPatternKey = intensity < 0.4 ? 'simple' : intensity < 0.6 ? 'groovy' : intensity < 0.85 ? 'rolling' : 'liquid';
    const bassPattern = bassPatterns[bassPatternKey];
    
    for (let i = 0; i < beatsInDuration * 2; i++) {
      const noteIndex = bassPattern[i % bassPattern.length];
      if (noteIndex >= 0) {
        const freq = getFrequencyFromScale(bassRootFreq, scale, noteIndex, 0);
        this.createBass(freq, now + i * (beatDuration / 2), beatDuration / 2.5, 0.3 + intensity * 0.1);
      }
    }

    // Reese bass undertone - deeper at higher energy
    this.createPad(bassRootFreq * 0.5, now, duration, 0.1 + intensity * 0.1);

    // Stabs - more frequent and varied at higher energy
    if (intensity > 0.3) {
      const stabChance = 0.3 + intensity * 0.4;
      for (let i = 0; i < beatsInDuration; i += Math.max(1, Math.floor(3 - intensity * 2))) {
        if (Math.random() < stabChance) {
          const noteIndex = Math.floor(Math.random() * Math.min(scale.length, 3 + Math.floor(intensity * 4)));
          const freq = getFrequencyFromScale(rootFreq * 2, scale, noteIndex, 0);
          this.createSynth(
            freq,
            'sawtooth',
            now + i * beatDuration + beatDuration * 0.5,
            beatDuration * 0.3,
            0.01,
            0.05,
            0.6,
            0.1,
            0.1 * intensity
          );
        }
      }
    }
    
    // Atmospheric pad at higher energy
    if (intensity > 0.5) {
      const padNotes = [0, 4, 7];
      padNotes.forEach((noteOffset, i) => {
        const freq = getFrequencyFromScale(rootFreq, scale, noteOffset, 0);
        this.createPad(freq, now + i * 0.5, duration * 0.8, 0.04 * intensity);
      });
    }
    
    // Lead synth hits at highest energy
    if (intensity > 0.75) {
      const leadPattern = [0, 4, 7, 4];
      for (let i = 0; i < leadPattern.length; i++) {
        const freq = getFrequencyFromScale(rootFreq * 2, scale, leadPattern[i], 0);
        this.createSynth(
          freq,
          'square',
          now + i * beatDuration * 4,
          beatDuration * 2,
          0.05,
          0.1,
          0.5,
          0.2,
          0.07 * intensity
        );
      }
    }
  }

  // Generate music based on genre
  private generateMusic(): void {
    const bpm = getBPMFromContributions(this.config.contributions);
    const duration = 15; // 15 seconds

    switch (this.currentGenre) {
      case 'ambient':
        this.generateAmbient(bpm, duration);
        break;
      case 'cinematic':
        this.generateCinematic(bpm, duration);
        break;
      case 'techno':
        this.generateTechno(bpm, duration);
        break;
      case 'synthwave':
        this.generateSynthwave(bpm, duration);
        break;
      case 'dnb':
        this.generateDnB(bpm, duration);
        break;
    }
  }

  // Start playback
  async play(): Promise<void> {
    await this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.loop();
  }

  // Loop playback
  private loop(): void {
    if (!this.isPlaying) return;

    this.generateMusic();

    // Schedule next loop
    this.loopTimeout = setTimeout(() => {
      this.loop();
    }, 15000); // 15 seconds
  }

  // Stop playback
  stop(): void {
    this.isPlaying = false;

    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    // Stop all scheduled nodes
    this.scheduledNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Node might already be stopped
      }
    });
    this.scheduledNodes = [];
  }

  // Toggle playback
  async toggle(): Promise<boolean> {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.play();
      return true;
    }
  }

  // Get current BPM
  getCurrentBPM(): number {
    return getBPMFromContributions(this.config.contributions);
  }

  // Cleanup
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let audioEngineInstance: GenerativeAudioEngine | null = null;

export function getAudioEngine(): GenerativeAudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new GenerativeAudioEngine();
  }
  return audioEngineInstance;
}

// Map visualization mode to music genre
export const MODE_TO_GENRE: Record<string, MusicGenre> = {
  galaxy: 'ambient',
  mountain: 'cinematic',
  tunnel: 'techno',
  city: 'synthwave',
  heartbeat: 'dnb',
};

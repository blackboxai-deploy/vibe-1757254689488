"use client";

interface SoundConfig {
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private activeMusic: AudioBufferSourceNode | null = null;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private config: AudioConfig = {
    masterVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    isMuted: false
  };

  private soundUrls: Record<string, string> = {
    // Combat sounds
    tankFire: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    tankMove: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    infantryFire: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    explosion: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    
    // UI sounds
    unitSelect: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    moveCommand: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    attackCommand: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    unitProduced: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    error: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    
    // Mission sounds
    missionStart: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    victory: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    defeat: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
  };

  private musicUrls: Record<string, string> = {
    menu: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    combat: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg',
    victory: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSsEJHfH8N2QQAkUXrPp66hVFApGn+DyvmAhBC2B0PDWfSoHKIDM8tuIPg'
  };

  async initialize(): Promise<void> {
    try {
      // Initialize AudioContext on first user interaction
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (browser policy compliance)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load sound effects using Web Audio API synthetic sounds
      this.generateSounds();

    } catch (error) {
      console.warn('Audio initialization failed:', error);
      // Fallback to HTML5 Audio API
      this.initializeFallbackAudio();
    }
  }

  private generateSounds(): void {
    if (!this.audioContext) return;

    // Generate synthetic sound effects
    this.sounds.set('tankFire', this.generateTankFireSound());
    this.sounds.set('tankMove', this.generateTankMoveSound());
    this.sounds.set('infantryFire', this.generateInfantryFireSound());
    this.sounds.set('explosion', this.generateExplosionSound());
    this.sounds.set('unitSelect', this.generateUISound(800, 0.1));
    this.sounds.set('moveCommand', this.generateUISound(600, 0.15));
    this.sounds.set('attackCommand', this.generateUISound(400, 0.2));
    this.sounds.set('unitProduced', this.generateUISound(1000, 0.3));
    this.sounds.set('error', this.generateUISound(200, 0.5));
    this.sounds.set('missionStart', this.generateFanfareSound());
    this.sounds.set('victory', this.generateVictorySound());
    this.sounds.set('defeat', this.generateDefeatSound());
  }

  private generateTankFireSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 0.8;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create explosive tank cannon sound
      const envelope = Math.exp(-t * 8);
      const noise = (Math.random() - 0.5) * 0.8;
      const boom = Math.sin(2 * Math.PI * 60 * t) * envelope;
      data[i] = (boom + noise * envelope) * 0.7;
    }

    return buffer;
  }

  private generateTankMoveSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create tank engine/track sound
      const engine = Math.sin(2 * Math.PI * 40 * t) * 0.3;
      const tracks = (Math.random() - 0.5) * 0.2;
      const rumble = Math.sin(2 * Math.PI * 20 * t) * 0.1;
      data[i] = engine + tracks + rumble;
    }

    return buffer;
  }

  private generateInfantryFireSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create rifle crack sound
      const envelope = Math.exp(-t * 15);
      const crack = Math.sin(2 * Math.PI * 1200 * t) * envelope;
      const noise = (Math.random() - 0.5) * 0.3 * envelope;
      data[i] = (crack + noise) * 0.5;
    }

    return buffer;
  }

  private generateExplosionSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 1.5;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Create explosion sound with multiple frequency components
      const envelope = Math.exp(-t * 4);
      const boom = Math.sin(2 * Math.PI * 50 * t) * envelope;
      const crack = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.5;
      const noise = (Math.random() - 0.5) * envelope * 0.7;
      data[i] = (boom + crack + noise) * 0.8;
    }

    return buffer;
  }

  private generateUISound(frequency: number, duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
    }

    return buffer;
  }

  private generateFanfareSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    const notes = [440, 554, 659, 880]; // A4, C#5, E5, A5
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t * 2) % notes.length;
      const frequency = notes[noteIndex];
      const envelope = Math.max(0, 1 - t * 0.5);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }

    return buffer;
  }

  private generateVictorySound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 3.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Victory fanfare with ascending notes
    const melody = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t) % melody.length;
      const frequency = melody[noteIndex];
      const envelope = Math.max(0, 1 - t * 0.3);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5;
    }

    return buffer;
  }

  private generateDefeatSound(): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not initialized');
    
    const duration = 2.0;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    // Descending minor scale for defeat
    const melody = [440, 392, 349, 294]; // A4, G4, F4, D4
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t * 2) % melody.length;
      const frequency = melody[noteIndex];
      const envelope = Math.max(0, 1 - t * 0.5);
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
    }

    return buffer;
  }

  private initializeFallbackAudio(): void {
    // Fallback for browsers that don't support Web Audio API
    console.log('Using HTML5 Audio fallback');
  }

  playSound(soundName: string, config?: Partial<SoundConfig>): void {
    if (this.config.isMuted || !this.audioContext) return;

    const buffer = this.sounds.get(soundName);
    if (!buffer) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Apply configuration
      const volume = (config?.volume ?? 1) * this.config.sfxVolume * this.config.masterVolume;
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

      if (config?.loop) {
        source.loop = true;
      }

      source.start();

      // Store reference for potential cleanup
      if (!config?.loop) {
        source.onended = () => {
          this.activeSources.delete(soundName);
        };
      } else {
        this.activeSources.set(soundName, source);
      }

    } catch (error) {
      console.warn(`Failed to play sound '${soundName}':`, error);
    }
  }

  playBackgroundMusic(musicName: string): void {
    if (this.config.isMuted || !this.audioContext) return;

    // Stop current music
    if (this.activeMusic) {
      this.activeMusic.stop();
      this.activeMusic = null;
    }

    // Create simple background tone for now (would load actual music files in production)
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Create ambient music based on context
    const frequencies = {
      menu: [220, 330, 440],
      combat: [110, 165, 220],
      victory: [440, 554, 659]
    };

    const freqs = frequencies[musicName as keyof typeof frequencies] || frequencies.combat;
    oscillator.frequency.setValueAtTime(freqs[0], this.audioContext.currentTime);

    // Very low volume for ambient background
    const volume = this.config.musicVolume * this.config.masterVolume * 0.1;
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    oscillator.type = 'sine';
    oscillator.start();

    this.activeMusic = oscillator as any;
  }

  stopBackgroundMusic(): void {
    if (this.activeMusic) {
      this.activeMusic.stop();
      this.activeMusic = null;
    }
  }

  pauseBackgroundMusic(): void {
    if (this.activeMusic && this.audioContext) {
      this.audioContext.suspend();
    }
  }

  resumeBackgroundMusic(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  stopSound(soundName: string): void {
    const source = this.activeSources.get(soundName);
    if (source) {
      source.stop();
      this.activeSources.delete(soundName);
    }
  }

  // Volume controls
  setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleMute(): boolean {
    this.config.isMuted = !this.config.isMuted;
    
    if (this.config.isMuted) {
      this.pauseBackgroundMusic();
    } else {
      this.resumeBackgroundMusic();
    }
    
    return this.config.isMuted;
  }

  // Spatial audio (simplified)
  playSpatialSound(soundName: string, position: { x: number; y: number }, listenerPosition: { x: number; y: number }): void {
    const distance = Math.sqrt(
      Math.pow(position.x - listenerPosition.x, 2) + 
      Math.pow(position.y - listenerPosition.y, 2)
    );

    // Volume falloff with distance
    const maxDistance = 500;
    const volume = Math.max(0, 1 - distance / maxDistance);

    if (volume > 0.01) {
      this.playSound(soundName, { volume });
    }
  }

  // Configuration getters
  getAudioConfig(): AudioConfig {
    return { ...this.config };
  }

  isAudioSupported(): boolean {
    return this.audioContext !== null;
  }

  cleanup(): void {
    // Stop all active sounds
    this.activeSources.forEach(source => {
      source.stop();
    });
    this.activeSources.clear();

    // Stop background music
    this.stopBackgroundMusic();

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
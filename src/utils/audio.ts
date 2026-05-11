import { useWorkoutStore } from '../store/useWorkoutStore';

// A simple browser-native synthesizer for workout timers
// No external assets required.

export const isMusicPlaying = (): boolean => {
    // Check if the OS/browser reports media playing
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        return navigator.mediaSession.playbackState === 'playing';
    }
    return false;
};

class AudioEngine {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private shouldPlayAudio(): boolean {
      const stats = useWorkoutStore.getState().userStats;
      // If audio is explicitly disabled
      if (stats.isAudioEnabled === false) return false;
      
      // If smartAudio is enabled (default true) and music is playing
      const smartAudio = stats.smartAudio !== false;
      if (smartAudio && isMusicPlaying()) {
          return false;
      }
      return true;
  }

  public playBeep(frequency: number = 880, duration: number = 0.1, type: OscillatorType = 'sine') {
    if (!this.shouldPlayAudio()) return;

    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  }

  public playTimerCountdown() {
    this.playBeep(600, 0.1); // High pip
  }

  public playTimerFinished() {
    // Double beep
    this.playBeep(880, 0.15, 'square');
    setTimeout(() => this.playBeep(880, 0.4, 'square'), 150);
  }

  public playPR() {
    if (!this.shouldPlayAudio()) return;
    
    // Victory sound
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    [0, 0.2, 0.4].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 + (i * 110), now + delay);
        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.linearRampToValueAtTime(0, now + delay + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
    });
  }
}

export const audio = new AudioEngine();

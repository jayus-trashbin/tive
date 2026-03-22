/**
 * Haptics & Audio Utility
 * Centralized feedback system for premium "Tech-Brutalist" UX.
 */

const HAPTIC_PATTERNS = {
    light: [5],
    medium: [15],
    heavy: [30, 50, 30],
    success: [10, 30, 10],
    error: [50, 100, 50, 100, 50]
} as const;

type HapticType = keyof typeof HAPTIC_PATTERNS;

/**
 * Trigger haptic feedback.
 * Falls back silently on unsupported devices.
 */
export function haptic(type: HapticType = 'light'): void {
    if (navigator.vibrate) {
        navigator.vibrate(HAPTIC_PATTERNS[type]);
    }
}

// --- AUDIO ---
// Using Web Audio API for ultra-low latency "tech" beeps

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

/**
 * Play a "tech" beep sound.
 * @param frequency Hz (default 880 = A5)
 * @param duration ms (default 80)
 */
export function beep(frequency = 880, duration = 80): void {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'square'; // Sharp, digital sound
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime); // Low volume
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
        // Silently fail if audio is not supported
    }
}

// --- COMBINED ACTIONS ---

export const feedback = {
    /** Light tap - for button presses */
    tap: () => haptic('light'),

    /** Set completed successfully */
    setComplete: () => {
        haptic('success');
        beep(523, 60); // C5
    },

    /** Timer finished */
    timerEnd: () => {
        haptic('heavy');
        beep(660, 100); // E5
        setTimeout(() => beep(880, 150), 120); // A5
    },

    /** Error/Warning */
    error: () => {
        haptic('error');
        beep(220, 200); // A3 (low)
    },

    /** Workout started */
    workoutStart: () => {
        haptic('medium');
        beep(440, 50); // A4
        setTimeout(() => beep(660, 50), 80); // E5
        setTimeout(() => beep(880, 100), 160); // A5
    },

    /** Workout finished */
    workoutEnd: () => {
        haptic('heavy');
        beep(523, 100); // C5
        setTimeout(() => beep(659, 100), 150); // E5
        setTimeout(() => beep(784, 100), 300); // G5
        setTimeout(() => beep(1047, 200), 450); // C6
    }
};

export default feedback;

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'pr' | 'timer';

/**
 * useHaptic
 * Provides a simple interface for haptic feedback using the Navigator.vibrate API.
 * Fails gracefully on devices that don't support it.
 */
export const useHaptic = () => {
    const trigger = useCallback((type: HapticType) => {
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;

        switch (type) {
            case 'light':
                navigator.vibrate(10); // Subtle click
                break;
            case 'medium':
                navigator.vibrate(20); // Soft tap
                break;
            case 'heavy':
                navigator.vibrate(40); // Firm press
                break;
            case 'success':
                navigator.vibrate([20, 50, 20]); // 2 pulses for set complete
                break;
            case 'warning':
                navigator.vibrate([30, 50, 10]);
                break;
            case 'error':
                navigator.vibrate([50, 100, 50]); // Buzz-buzz-buzz
                break;
            case 'pr':
                navigator.vibrate([100, 50, 150]); // Long triumphant pulse
                break;
            case 'timer':
                navigator.vibrate([10, 50, 20, 50, 40]); // 3 ascending pulses
                break;
        }
    }, []);

    return { trigger };
};

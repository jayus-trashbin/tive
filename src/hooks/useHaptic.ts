import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

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
                navigator.vibrate([10, 30, 10]); // Da-da-da
                break;
            case 'warning':
                navigator.vibrate([30, 50, 10]);
                break;
            case 'error':
                navigator.vibrate([50, 100, 50]); // Buzz-buzz-buzz
                break;
        }
    }, []);

    return { trigger };
};

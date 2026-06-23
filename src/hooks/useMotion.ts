import { useReducedMotion } from 'framer-motion';

/**
 * useMotion
 * Wrapper around Framer Motion's useReducedMotion hook.
 * Encapsulates the logic to respect OS-level accessibility settings for animations.
 * When reduced motion is preferred, this hook can be used to conditionally
 * disable or simplify animations (e.g., returning instant transitions or disabling loops).
 */
export const useMotion = () => {
    // Returns true if the user has requested to minimize the amount of non-essential motion.
    const shouldReduceMotion = useReducedMotion();

    return {
        shouldReduceMotion: !!shouldReduceMotion
    };
};

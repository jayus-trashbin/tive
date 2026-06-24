import { useEffect, useRef } from 'react';

/**
 * useBackDismiss
 * 
 * Integrates with the browser's History API to allow the Android physical/gesture
 * back button to dismiss overlays (modals, sheets, players) without navigating
 * away from the PWA.
 * 
 * @param isOpen Whether the overlay is currently open
 * @param onDismiss Callback to fire when the user presses the back button
 */
export function useBackDismiss(isOpen: boolean, onDismiss: () => void) {
    const pushedRef = useRef(false);

    useEffect(() => {
        const handlePopState = (e: PopStateEvent) => {
            if (isOpen) {
                // The user pressed the back button while the modal was open
                pushedRef.current = false;
                onDismiss();
            }
        };

        if (isOpen && !pushedRef.current) {
            // Push a phantom state to trap the next back button press
            window.history.pushState({ modalOpen: true }, '');
            pushedRef.current = true;
            window.addEventListener('popstate', handlePopState);
        } else if (!isOpen && pushedRef.current) {
            // Modal was closed programmatically (e.g. by clicking 'X' or 'Save')
            // We need to pop our phantom state to keep the history clean.
            // Note: In some complex flows, history.back() might cause flickers
            // if handled synchronously, so we pop it safely.
            pushedRef.current = false;
            window.removeEventListener('popstate', handlePopState);
            window.history.back();
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
            // Cleanup: if unmounted while open, pop the state
            if (pushedRef.current) {
                pushedRef.current = false;
                window.history.back();
            }
        };
    }, [isOpen, onDismiss]);
}

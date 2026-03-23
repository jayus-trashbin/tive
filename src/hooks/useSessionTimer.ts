import { useState, useEffect } from 'react';

export const useSessionTimer = (startTimestamp: number) => {
    const [duration, setDuration] = useState('0:00');

    useEffect(() => {
        if (!startTimestamp) return;

        const calculateDuration = () => {
            const diff = Math.floor((Date.now() - startTimestamp) / 1000);
            if (diff < 0) return '0:00';
            
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            
            if (h > 0) {
                return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        setDuration(calculateDuration());
        const interval = setInterval(() => {
            setDuration(calculateDuration());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTimestamp]);

    return duration;
};

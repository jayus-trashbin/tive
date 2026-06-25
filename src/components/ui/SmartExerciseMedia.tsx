
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Play, Wifi, WifiOff } from 'lucide-react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';

// --- Network Info API (browser) ---
type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g';
interface NetworkInfo {
    effectiveType?: EffectiveType;
    saveData?: boolean;
}

const getNetworkInfo = (): NetworkInfo => {
    const nav = navigator as Navigator & { connection?: NetworkInfo };
    return nav.connection || {};
};

const isSlowConnection = (): boolean => {
    const { effectiveType, saveData } = getNetworkInfo();
    if (saveData) return true;
    return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
};

// --- Types ---
type MediaState = 'loading' | 'gif' | 'static' | 'error';

interface Props {
    exercise: Exercise;
    isFetchingDetails?: boolean;
}

export const SmartExerciseMedia: React.FC<Props> = ({ exercise, isFetchingDetails }) => {
    const [mediaState, setMediaState] = useState<MediaState>('loading');
    const [isUserForcedGif, setIsUserForcedGif] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(true);
    const [isVideoMuted, setIsVideoMuted] = useState(true);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Check if valid custom MP4 video is available (local/custom exercises only)
    const hasCustomVideo = !!exercise.videoUrl &&
        exercise.videoUrl.length > 5 &&
        (exercise.videoUrl.startsWith('http') || exercise.videoUrl.startsWith('//'));

    const hasGif = !!exercise.gifUrl && exercise.gifUrl.length > 5;
    const hasPoster = !!exercise.staticImageUrl;
    const slowConnection = isSlowConnection();

    useEffect(() => {
        // Reset on exercise change
        setMediaState('loading');
        setIsUserForcedGif(false);
        setIsVideoLoaded(false);
        setIsVideoPlaying(true);

        // 1. If custom MP4 video exists, prefer it
        if (hasCustomVideo) {
            setMediaState('gif'); // Reuse 'gif' state for video too — video el handles itself
            return;
        }

        // 2. On slow connections, show static only
        if (slowConnection && !isUserForcedGif) {
            setMediaState('static');
            return;
        }

        // 3. Default: pre-load GIF in background
        if (hasGif) {
            const img = new Image();
            img.onload = () => setMediaState('gif');
            img.onerror = () => {
                setMediaState(hasPoster ? 'static' : 'error');
            };
            img.src = exercise.gifUrl;
        } else if (hasPoster) {
            setMediaState('static');
        } else {
            setMediaState('error');
        }
    }, [exercise.id]);

    const handleForceLoadGif = () => {
        setIsUserForcedGif(true);
        setMediaState('loading');

        const img = new Image();
        img.onload = () => setMediaState('gif');
        img.onerror = () => setMediaState('static');
        img.src = exercise.gifUrl;
    };

    const toggleVideoPlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isVideoPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    const toggleVideoMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isVideoMuted;
            setIsVideoMuted(!isVideoMuted);
        }
    };



    return (
        <div className="relative w-full aspect-[16/9] shrink-0 bg-black border-b border-zinc-800/60 overflow-hidden">

            {/* --- LOADING SKELETON --- */}
            <AnimatePresence>
                {(mediaState === 'loading' || isFetchingDetails) && (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950"
                    >
                        {/* Animated skeleton shimmer */}
                        <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent"
                                animate={{ x: ['−100%', '200%'] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </div>
                        {hasPoster && (
                            <img
                                src={exercise.staticImageUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-contain opacity-20 blur-sm aspect-[16/9]"
                            />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <motion.div
                                className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-brand-primary"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <span className="text-caption-xs text-zinc-500 uppercase tracking-widest font-bold">Loading</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- GIF / IMG DISPLAY --- */}
            {mediaState === 'gif' && !hasCustomVideo && (
                <motion.img
                    key={exercise.gifUrl}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-contain bg-zinc-950 aspect-[16/9]"
                />
            )}

            {/* --- CUSTOM VIDEO PLAYER (Local exercises only) --- */}
            {hasCustomVideo && (mediaState === 'gif' || mediaState === 'static') && (
                <>
                    <video
                        ref={videoRef}
                        src={exercise.videoUrl}
                        poster={exercise.staticImageUrl || exercise.gifUrl}
                        autoPlay
                        loop
                        muted={isVideoMuted}
                        playsInline
                        onLoadedData={() => setIsVideoLoaded(true)}
                        onError={() => {
                            setIsVideoPlaying(false);
                            setMediaState('static');
                        }}
                        className={cn(
                            'w-full h-full object-contain bg-black transition-opacity duration-500',
                            isVideoLoaded ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {/* Video controls */}
                    {isVideoLoaded && (
                        <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                            <button
                                onClick={toggleVideoMute}
                                className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors active:scale-95 text-xs font-bold"
                            >
                                {isVideoMuted ? '🔇' : '🔊'}
                            </button>
                            <button
                                onClick={toggleVideoPlay}
                                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors active:scale-95"
                            >
                                {isVideoPlaying ? '⏸' : '▶'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* --- STATIC IMAGE --- */}
            {mediaState === 'static' && (
                <motion.div
                    key="static"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-full"
                >
                    {hasPoster ? (
                        <img
                            src={exercise.staticImageUrl}
                            alt={exercise.name}
                            className="w-full h-full object-contain bg-zinc-950 aspect-[16/9]"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-zinc-950">
                            <Dumbbell size={64} className="text-zinc-700 opacity-40" />
                        </div>
                    )}

                    {/* Load animation button (when on slow connection) */}
                    {slowConnection && hasGif && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                onClick={handleForceLoadGif}
                                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-full text-sm font-bold text-white hover:bg-zinc-800 active:scale-95 transition-all shadow-xl"
                            >
                                <Play size={14} fill="currentColor" />
                                Load Animation
                                <span className="text-zinc-500 text-caption-xs font-medium">~3MB</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* --- ERROR STATE --- */}
            {mediaState === 'error' && (
                <div className="flex items-center justify-center w-full h-full bg-zinc-950">
                    <div className="flex flex-col items-center gap-2 text-zinc-700">
                        <Dumbbell size={48} className="opacity-30" />
                        <span className="text-xs font-medium">No preview</span>
                    </div>
                </div>
            )}

            {/* --- TOP GRADIENT OVERLAY --- */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

            {/* --- SOURCE INDICATOR PILL REMOVED PER USER REQUEST --- */}
        </div>
    );
};

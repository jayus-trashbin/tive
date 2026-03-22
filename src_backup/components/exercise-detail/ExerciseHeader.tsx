import React, { useState, useRef, useEffect } from 'react';
import {
    X, Dumbbell, Play, Pause, Volume2, VolumeX, Loader2
} from 'lucide-react';
import { Exercise } from '../../types';
import { cn } from '../../lib/utils';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface Props {
    exercise: Exercise;
    onClose: () => void;
    isFetchingDetails: boolean;
}

export const ExerciseHeader: React.FC<Props> = ({ exercise, onClose, isFetchingDetails }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Reset state when exercise changes
        setIsPlaying(true);
        setIsMuted(true);
        setIsVideoLoaded(false);
        setVideoError(false);
    }, [exercise.id]);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const hasValidVideoUrl = !!exercise.videoUrl &&
        exercise.videoUrl.length > 5 &&
        (exercise.videoUrl.startsWith('http') || exercise.videoUrl.startsWith('//'));

    const showVideo = hasValidVideoUrl && !videoError;

    return (
        <div className="relative w-full aspect-[16/9] shrink-0 bg-black group border-b border-zinc-800 overflow-hidden">

            {/* Loading Skeleton */}
            {(isFetchingDetails || (showVideo && !isVideoLoaded)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
                    <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                </div>
            )}

            {showVideo ? (
                <video
                    ref={videoRef}
                    src={exercise.videoUrl}
                    poster={exercise.staticImageUrl || exercise.gifUrl}
                    autoPlay
                    loop
                    muted={isMuted} // Muted required for autoPlay on most browsers
                    playsInline
                    // REMOVED crossOrigin="anonymous" to fix loading issues with some CDNs
                    onLoadedData={() => setIsVideoLoaded(true)}
                    onError={() => {
                        // FIXED: log text only to prevent circular JSON error
                        console.warn("Video load failed, falling back to image");
                        setVideoError(true);
                    }}
                    className={cn(
                        "w-full h-full object-contain bg-black transition-opacity duration-500", // Fixed: contain to prevent crop/zoom shift
                        isVideoLoaded ? "opacity-100" : "opacity-0"
                    )}
                />
            ) : (
                <ImageWithFallback
                    src={exercise.staticImageUrl || exercise.gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-contain bg-zinc-900"
                    fallbackIcon={<Dumbbell size={64} className="text-zinc-700 opacity-50" />}
                />
            )}

            {/* Top Gradient Overlay */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute right-5 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors z-20 active:scale-90"
                style={{ top: 'calc(1.25rem + env(safe-area-inset-top))' }}
            >
                <X size={20} />
            </button>

            {/* Video Controls (Only if Video is working) */}
            {showVideo && isVideoLoaded && (
                <div className="absolute bottom-4 right-4 flex gap-2 z-20">
                    <button
                        onClick={toggleMute}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors active:scale-95"
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors active:scale-95"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                </div>
            )}

            {/* Status Badge */}
            {showVideo && isVideoLoaded && (
                <div
                    className="absolute left-5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2 z-20"
                    style={{ top: 'calc(1.25rem + env(safe-area-inset-top))' }}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Video</span>
                </div>
            )}
        </div>
    );
};

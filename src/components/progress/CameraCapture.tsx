import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Check, AlertCircle, SwitchCamera, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type PhotoSource = 'front' | 'back' | 'upload';

interface CameraCaptureProps {
    onCapture: (imageData: string, source: PhotoSource) => void;
    onCancel: () => void;
}

type CameraState = 'requesting' | 'ready' | 'preview' | 'denied' | 'error';

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isMounted = useRef(true);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const isStartingRef = useRef(false);

    const [state, setState] = useState<CameraState>('requesting');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [captureSource, setCaptureSource] = useState<PhotoSource>('front');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const startCamera = useCallback(async (facing: 'user' | 'environment') => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        setState('requesting');
        setErrorMessage('');
        stopStream();

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
                isStartingRef.current = false;
                setState('error');
                setErrorMessage('Camera initialization timed out. Please use upload.');
            }
        }, 10000);

        try {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing },
                    audio: false,
                });
            } catch (err) {
                // OverconstrainedError or NotFoundError → retry without facingMode hint
                if (
                    err instanceof DOMException &&
                    (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')
                ) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                } else {
                    throw err;
                }
            }

            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            if (!isMounted.current) {
                stream.getTracks().forEach(t => t.stop());
                isStartingRef.current = false;
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            if (isMounted.current) setState('ready');
        } catch (error) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (!isMounted.current) {
                isStartingRef.current = false;
                return;
            }

            console.error('[CameraCapture] Error:', error);

            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    setState('denied');
                    setErrorMessage('Camera access denied. Please allow camera permissions in your browser settings.');
                } else if (error.name === 'NotFoundError') {
                    setState('error');
                    setErrorMessage('No camera found on this device. Use upload instead.');
                } else {
                    setState('error');
                    setErrorMessage(`Camera error: ${error.message}`);
                }
            } else {
                setState('error');
                setErrorMessage('Failed to access camera. Try uploading a photo instead.');
            }
        } finally {
            isStartingRef.current = false;
        }
    }, [stopStream]);

    // Start on mount
    useEffect(() => {
        isMounted.current = true;
        startCamera(facingMode);

        return () => {
            isMounted.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopStream();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Restart when facingMode changes (skip on first mount)
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        startCamera(facingMode);
    }, [facingMode, startCamera]);

    // Capture from live video feed
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Mirror the front camera image (un-mirror what the user sees)
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        const source: PhotoSource = facingMode === 'user' ? 'front' : 'back';

        setCapturedImage(imageData);
        setCaptureSource(source);
        setState('preview');
        stopStream();
    }, [facingMode, stopStream]);

    // File upload — always tagged as 'upload'
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Max 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setCapturedImage(reader.result);
                setCaptureSource('upload');
                setState('preview');
                stopStream();
            }
        };
        reader.onerror = () => alert('Failed to read file.');
        reader.readAsDataURL(file);

        // Reset so same file can be re-selected
        event.target.value = '';
    };

    const triggerFileUpload = () => fileInputRef.current?.click();

    const handleRetake = useCallback(() => {
        setCapturedImage(null);
        startCamera(facingMode);
    }, [startCamera, facingMode]);

    const handleConfirm = useCallback(() => {
        if (capturedImage) {
            onCapture(capturedImage, captureSource);
        }
    }, [capturedImage, captureSource, onCapture]);

    const handleSwitchCamera = useCallback(() => {
        setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-safe pb-4 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onCancel} className="p-2 text-white/80 hover:text-white transition-colors">
                    <X size={24} strokeWidth={2.5} />
                </button>

                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Progress Photo
                </span>

                <div className="flex items-center gap-2">
                    <button onClick={triggerFileUpload} className="p-2 text-white/80 hover:text-white transition-colors">
                        <Upload size={24} strokeWidth={2} />
                    </button>
                    {state === 'ready' && (
                        <button onClick={handleSwitchCamera} className="p-2 text-white/80 hover:text-white transition-colors">
                            <SwitchCamera size={24} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Camera/Preview Area */}
            <div className="flex-1 relative overflow-hidden bg-zinc-900">
                {/*
                  Always in DOM so videoRef.current exists before setState('ready').
                  Visibility controlled by CSS only.
                */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                        facingMode === 'user' && "scale-x-[-1]",
                        state === 'ready' ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                />

                <AnimatePresence mode="wait">
                    {state === 'requesting' && (
                        <motion.div
                            key="requesting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        >
                            <Camera size={48} className="text-zinc-600 animate-pulse" />
                            <p className="text-sm font-medium text-zinc-500">Initializing camera...</p>
                        </motion.div>
                    )}

                    {(state === 'denied' || state === 'error') && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8"
                        >
                            <div className="bg-red-500/10 p-4 rounded-full">
                                <AlertCircle size={48} className="text-red-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-white font-bold">Camera Unavailable</h3>
                                <p className="text-sm font-medium text-zinc-400">{errorMessage}</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button
                                    onClick={triggerFileUpload}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-black font-bold uppercase text-xs rounded-xl hover:bg-brand-primaryHover transition-colors"
                                >
                                    <ImageIcon size={16} />
                                    Upload Image
                                </button>
                                {state === 'error' && (
                                    <button
                                        onClick={() => startCamera(facingMode)}
                                        className="px-6 py-3 bg-zinc-800 text-white font-bold text-xs border border-zinc-700 hover:bg-zinc-700 transition-colors uppercase rounded-xl"
                                    >
                                        Retry
                                    </button>
                                )}
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-3 bg-zinc-800 text-white font-bold text-xs border border-zinc-700 hover:bg-zinc-700 transition-colors uppercase rounded-xl"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {state === 'preview' && capturedImage && (
                        <motion.img
                            key="preview"
                            src={capturedImage}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                            alt="Captured"
                        />
                    )}
                </AnimatePresence>

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-safe pt-6 bg-gradient-to-t from-black/90 to-transparent">
                {state === 'ready' && (
                    <div className="flex items-center justify-center">
                        <motion.button
                            onClick={handleCapture}
                            whileTap={{ scale: 0.9 }}
                            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors mb-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-white" />
                        </motion.button>
                    </div>
                )}

                {state === 'preview' && (
                    <div className="flex items-center justify-center gap-8 pb-4">
                        <motion.button
                            onClick={handleRetake}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                <RotateCcw size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Retake</span>
                        </motion.button>

                        <motion.button
                            onClick={handleConfirm}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center gap-2 text-brand-primary hover:text-brand-primaryHover transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-current bg-brand-primary/20 flex items-center justify-center backdrop-blur-sm">
                                <Check size={28} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Use Photo</span>
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CameraCapture;

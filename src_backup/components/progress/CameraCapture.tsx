import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Check, AlertCircle, SwitchCamera, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CameraCaptureProps {
    onCapture: (imageData: string) => void;
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

    const [state, setState] = useState<CameraState>('requesting');
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Initialize camera
    const startCamera = useCallback(async () => {
        setState('requesting');
        setErrorMessage('');

        timeoutRef.current = setTimeout(() => {
            if (isMounted.current && state === 'requesting') {
                setState('error');
                setErrorMessage('Camera initialization timed out. Please use upload.');
            }
        }, 10000); // 10s timeout

        try {
            // Stop existing stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            // Constraints: Start simple, browser will do its best
            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facingMode,
                },
                audio: false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            if (timeoutRef.current) clearTimeout(timeoutRef.current); // Clear timeout on success

            if (!isMounted.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setState('ready');
            }
        } catch (error) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current); // Clear timeout on error
            if (!isMounted.current) return;
            console.error('[CameraCapture] Error:', error);

            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    setState('denied');
                    setErrorMessage('Camera access denied. Please allow camera permissions.');
                } else if (error.name === 'NotFoundError') {
                    setState('error');
                    setErrorMessage('No camera found on this device.');
                } else {
                    setState('error');
                    setErrorMessage('Camera error: ' + error.message);
                }
            } else {
                setState('error');
                setErrorMessage('Failed to access camera.');
            }
        }
    }, [facingMode]);

    // Start camera on mount
    useEffect(() => {
        isMounted.current = true;
        startCamera();

        return () => {
            isMounted.current = false;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    // Capture frame
    const handleCapture = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Flip horizontally for front camera (mirror effect)
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        setState('preview');

        // Stop the stream while previewing
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }, [facingMode]);

    // File Upload Handler
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // MAX SIZE: 10MB
            if (file.size > 10 * 1024 * 1024) {
                alert("File too large. Max 10MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setCapturedImage(reader.result);
                    setState('preview');
                }
            };
            reader.onerror = () => {
                alert("Failed to read file.");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // Retake photo
    const handleRetake = useCallback(() => {
        setCapturedImage(null);
        startCamera();
    }, [startCamera]);

    // Confirm and submit
    const handleConfirm = useCallback(() => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    }, [capturedImage, onCapture]);

    // Switch camera
    const handleSwitchCamera = useCallback(() => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
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
                <button
                    onClick={onCancel}
                    className="p-2 text-white/80 hover:text-white transition-colors"
                >
                    <X size={24} strokeWidth={2.5} />
                </button>

                <span className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                    Progress Photo
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={triggerFileUpload}
                        className="p-2 text-white/80 hover:text-white transition-colors"
                    >
                        <Upload size={24} strokeWidth={2} />
                    </button>
                    {state === 'ready' && (
                        <button
                            onClick={handleSwitchCamera}
                            className="p-2 text-white/80 hover:text-white transition-colors"
                        >
                            <SwitchCamera size={24} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {/* Camera/Preview Area */}
            <div className="flex-1 relative overflow-hidden bg-zinc-900">
                <AnimatePresence mode="wait">
                    {/* Requesting Permission */}
                    {state === 'requesting' && (
                        <motion.div
                            key="requesting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                        >
                            <Camera size={48} className="text-zinc-600 animate-pulse" />
                            <p className="font-mono text-sm text-zinc-500">Initializing camera...</p>
                        </motion.div>
                    )}

                    {/* Permission Denied / Error */}
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
                                <p className="font-mono text-sm text-zinc-400">
                                    {errorMessage}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <button
                                    onClick={triggerFileUpload}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-black font-bold uppercase text-xs rounded-[2px] hover:bg-brand-accent transition-colors"
                                >
                                    <ImageIcon size={16} />
                                    Upload Image
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="px-6 py-3 bg-zinc-800 text-white font-mono text-xs border border-zinc-700 hover:bg-zinc-700 transition-colors uppercase"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Live Video Feed */}
                    {state === 'ready' && (
                        <motion.video
                            key="video"
                            ref={videoRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                                "absolute inset-0 w-full h-full object-cover",
                                facingMode === 'user' && "scale-x-[-1]" // Mirror front camera
                            )}
                        />
                    )}

                    {/* Preview */}
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

                {/* Hidden canvas for capture */}
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
                            <span className="font-mono text-xs uppercase">Retake</span>
                        </motion.button>

                        <motion.button
                            onClick={handleConfirm}
                            whileTap={{ scale: 0.95 }}
                            className="flex flex-col items-center gap-2 text-lime-400 hover:text-lime-300 transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full border-2 border-current bg-lime-400/20 flex items-center justify-center backdrop-blur-sm">
                                <Check size={28} strokeWidth={3} />
                            </div>
                            <span className="font-mono text-xs uppercase">Use Photo</span>
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default CameraCapture;

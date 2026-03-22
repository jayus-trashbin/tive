import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import CameraCapture from './CameraCapture';
import PhotoCanvas from './PhotoCanvas';
import PhotoGallery from './PhotoGallery';
import { MuscleGroup } from '../../types/domain';
import { getSessionMuscleIntensity } from '../../utils/analytics';

type ViewState = 'gallery' | 'camera' | 'processing';

interface CaptureData {
    rawImage: string;
    muscleGroups: MuscleGroup[];
    volumes?: Map<MuscleGroup, number>;
}

/**
 * Main Progress Photos container component
 * Orchestrates camera capture, file upload, overlay processing, and gallery display
 */
const ProgressPhotos: React.FC = () => {
    const {
        loadPhotos,
        addPhoto,
        userStats,
        pendingMuscleGroups,
        dismissPostWorkoutPrompt,
        // Added for intensity
        pendingSessionId,
        history,
        exercises
    } = useWorkoutStore();

    const [view, setView] = useState<ViewState>('gallery');
    const [captureData, setCaptureData] = useState<CaptureData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load photos on mount
    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    // Derived session intensity
    const sessionVolumes = useMemo(() => {
        if (!pendingSessionId) return undefined;
        const session = history.find(s => s.id === pendingSessionId);
        if (!session) return undefined;
        return getSessionMuscleIntensity(session, exercises);
    }, [pendingSessionId, history, exercises]);

    // Handle camera capture
    const handleCapture = useCallback((imageData: string) => {
        setCaptureData({
            rawImage: imageData,
            muscleGroups: pendingMuscleGroups.length > 0
                ? pendingMuscleGroups
                : [],
            volumes: sessionVolumes
        });
        setView('processing');
    }, [pendingMuscleGroups, sessionVolumes]);

    // Handle processed photo render
    const handleProcessedPhoto = useCallback(async (finalImage: string, thumbnail: string) => {
        await addPhoto({
            timestamp: Date.now(),
            muscleGroups: captureData?.muscleGroups || [],
            imageData: finalImage,
            thumbnailData: thumbnail,
            metadata: {
                bodyweight: userStats.bodyweight,
                camera: 'front',
            },
        });

        setCaptureData(null);
        dismissPostWorkoutPrompt();
        setView('gallery');
    }, [addPhoto, captureData, userStats.bodyweight, dismissPostWorkoutPrompt]);

    // Handle camera cancel
    const handleCameraCancel = useCallback(() => {
        setCaptureData(null);
        dismissPostWorkoutPrompt();
        setView('gallery');
    }, [dismissPostWorkoutPrompt]);

    // Open camera for new photo
    const handleAddPhoto = useCallback(() => {
        setView('camera');
    }, []);

    // File upload handler — adds photo directly (bypasses camera/canvas)
    const handleFileUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Read image as base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            if (!imageData) return;

            // Route to canvas for overlay processing
            setCaptureData({
                rawImage: imageData,
                muscleGroups: pendingMuscleGroups.length > 0 ? pendingMuscleGroups : [],
                volumes: sessionVolumes
            });
            setView('processing');
        };
        reader.readAsDataURL(file);

        // Reset input so the same file can be re-selected
        e.target.value = '';
    }, [pendingMuscleGroups, sessionVolumes]);

    return (
        <>
            {/* Hidden file input for uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Gallery View */}
            {view === 'gallery' && (
                <PhotoGallery onAddPhoto={handleAddPhoto} onUploadPhoto={handleFileUpload} />
            )}

            {/* Camera Capture */}
            <AnimatePresence>
                {view === 'camera' && (
                    <CameraCapture
                        onCapture={handleCapture}
                        onCancel={handleCameraCancel}
                    />
                )}
            </AnimatePresence>

            {/* Processing Canvas (hidden) */}
            {view === 'processing' && captureData && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <div className="font-mono text-lime-400 animate-pulse">
                        Processing...
                    </div>
                    <PhotoCanvas
                        imageData={captureData.rawImage}
                        muscleGroups={captureData.muscleGroups}
                        volumes={captureData.volumes}
                        onRender={handleProcessedPhoto}
                    />
                </div>
            )}
        </>
    );
};

export default ProgressPhotos;

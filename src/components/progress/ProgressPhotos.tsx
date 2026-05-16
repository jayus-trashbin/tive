import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import CameraCapture, { PhotoSource } from './CameraCapture';
import PhotoCanvas from './PhotoCanvas';
import PhotoGallery from './PhotoGallery';
import { MuscleGroup } from '../../types/domain';
import { getSessionMuscleIntensity } from '../../utils/analytics';
import { logger } from '../../utils/logger';

type ViewState = 'gallery' | 'camera' | 'processing';

interface CaptureData {
    rawImage: string;
    muscleGroups: MuscleGroup[];
    volumes?: Map<MuscleGroup, number>;
    source: PhotoSource;
}

const ProgressPhotos: React.FC = () => {
    const {
        loadPhotos,
        addPhoto,
        userStats,
        pendingMuscleGroups,
        dismissPostWorkoutPrompt,
        pendingSessionId,
        history,
        exercises,
    } = useWorkoutStore();

    const [view, setView] = useState<ViewState>('gallery');
    const [captureData, setCaptureData] = useState<CaptureData | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    const sessionVolumes = useMemo(() => {
        if (!pendingSessionId) return undefined;
        const session = history.find(s => s.id === pendingSessionId);
        if (!session) return undefined;
        return getSessionMuscleIntensity(session, exercises);
    }, [pendingSessionId, history, exercises]);

    // From camera (live capture)
    const handleCapture = useCallback((imageData: string, source: PhotoSource) => {
        setSaveError(null);
        setCaptureData({
            rawImage: imageData,
            muscleGroups: pendingMuscleGroups.length > 0 ? pendingMuscleGroups : [],
            volumes: sessionVolumes,
            source,
        });
        setView('processing');
    }, [pendingMuscleGroups, sessionVolumes]);

    // After canvas bakes in overlay
    const handleProcessedPhoto = useCallback(async (finalImage: string, thumbnail: string) => {
        setSaveError(null);
        try {
            await addPhoto({
                timestamp: Date.now(),
                muscleGroups: captureData?.muscleGroups ?? [],
                imageData: finalImage,
                thumbnailData: thumbnail,
                metadata: {
                    bodyweight: userStats.bodyweight,
                    camera: captureData?.source ?? 'upload',
                },
            });

            setCaptureData(null);
            if (pendingMuscleGroups.length > 0) dismissPostWorkoutPrompt();
            setView('gallery');
        } catch (err) {
            logger.error('ProgressPhotos', 'Failed to save photo', err);
            setSaveError('Failed to save photo. Please try again.');
        }
    }, [addPhoto, captureData, userStats.bodyweight, dismissPostWorkoutPrompt, pendingMuscleGroups]);

    // Camera cancel
    const handleCameraCancel = useCallback(() => {
        setCaptureData(null);
        if (pendingMuscleGroups.length > 0) dismissPostWorkoutPrompt();
        setView('gallery');
    }, [dismissPostWorkoutPrompt, pendingMuscleGroups]);

    // Open camera
    const handleAddPhoto = useCallback(() => {
        setSaveError(null);
        setView('camera');
    }, []);

    // Gallery file upload trigger
    const handleFileUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaveError(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target?.result as string;
            if (!imageData) return;

            setCaptureData({
                rawImage: imageData,
                muscleGroups: pendingMuscleGroups.length > 0 ? pendingMuscleGroups : [],
                volumes: sessionVolumes,
                source: 'upload',
            });
            setView('processing');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [pendingMuscleGroups, sessionVolumes]);

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
            />

            {view === 'gallery' && (
                <PhotoGallery onAddPhoto={handleAddPhoto} onUploadPhoto={handleFileUpload} />
            )}

            <AnimatePresence>
                {view === 'camera' && (
                    <CameraCapture
                        onCapture={handleCapture}
                        onCancel={handleCameraCancel}
                    />
                )}
            </AnimatePresence>

            {view === 'processing' && captureData && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4">
                    {saveError ? (
                        <>
                            <p className="text-sm font-bold text-red-400 text-center px-8">{saveError}</p>
                            <button
                                onClick={() => { setCaptureData(null); setView('gallery'); }}
                                className="px-6 py-3 bg-zinc-800 text-white font-bold text-xs border border-zinc-700 uppercase rounded-xl"
                            >
                                Back to Gallery
                            </button>
                        </>
                    ) : (
                        <div className="text-sm font-bold text-brand-primary animate-pulse uppercase tracking-widest">
                            Processing...
                        </div>
                    )}
                    {!saveError && (
                        <PhotoCanvas
                            imageData={captureData.rawImage}
                            muscleGroups={captureData.muscleGroups}
                            volumes={captureData.volumes}
                            onRender={handleProcessedPhoto}
                        />
                    )}
                </div>
            )}
        </>
    );
};

export default ProgressPhotos;

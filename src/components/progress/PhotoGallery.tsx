import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, X, ChevronLeft, ChevronRight, Grid, Layout as LayoutIcon, Columns } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { ProgressPhoto } from '../../types/photo';
import { MuscleGroup } from '../../types/domain';
import { cn } from '../../lib/utils';
import EmptyState from '../ui/EmptyState';

interface PhotoGalleryProps {
    onAddPhoto: () => void;
    onUploadPhoto?: () => void;
}

interface PhotoGroup {
    month: string;
    photos: ProgressPhoto[];
}

/**
 * Premium Photo Gallery
 * - High-performance grid/stack layout
 * - Progression-focused overlays
 */
const PhotoGallery: React.FC<PhotoGalleryProps> = ({ onAddPhoto, onUploadPhoto }) => {
    const { photos, deletePhoto, isLoading } = useWorkoutStore();
    const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'stack'>('stack');

    const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

    const [isCompareMode, setIsCompareMode] = useState(false);
    const [compareSelection, setCompareSelection] = useState<ProgressPhoto[]>([]);

    // Get all unique muscles from photos
    const availableMuscles = useMemo(() => {
        const muscles = new Set<MuscleGroup>();
        photos.forEach(p => p.muscleGroups.forEach(m => muscles.add(m)));
        return Array.from(muscles).sort();
    }, [photos]);

    // Group photos by month (filtered)
    const groupedPhotos = useMemo<PhotoGroup[]>(() => {
        if (!photos.length) return [];
        const groups: Record<string, ProgressPhoto[]> = {};

        const filtered = selectedMuscle
            ? photos.filter(p => p.muscleGroups.includes(selectedMuscle))
            : photos;

        filtered.forEach(photo => {
            const date = new Date(photo.timestamp);
            const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(photo);
        });

        return Object.entries(groups)
            .map(([month, photos]) => ({
                month,
                photos: photos.sort((a, b) => b.timestamp - a.timestamp),
            }))
            .filter(g => g.photos.length > 0);
    }, [photos, selectedMuscle]);

    const handleDelete = async (id: string) => {
        await deletePhoto(id);
        setDeleteConfirm(null);
        if (selectedPhoto?.id === id) setSelectedPhoto(null);
    };

    const navigatePhoto = (direction: 'prev' | 'next') => {
        if (!selectedPhoto) return;
        // Navigation should respect current filter
        const currentList = selectedMuscle
            ? photos.filter(p => p.muscleGroups.includes(selectedMuscle))
            : photos;

        const currentIndex = currentList.findIndex(p => p.id === selectedPhoto.id);
        if (currentIndex === -1) return;

        const newIndex = direction === 'prev'
            ? Math.max(0, currentIndex - 1)
            : Math.min(currentList.length - 1, currentIndex + 1);
        setSelectedPhoto(currentList[newIndex]);
    };

    const handlePhotoClick = (photo: ProgressPhoto) => {
        if (isCompareMode) {
            if (compareSelection.find(p => p.id === photo.id)) {
                setCompareSelection(prev => prev.filter(p => p.id !== photo.id));
            } else {
                if (compareSelection.length < 2) {
                    setCompareSelection(prev => [...prev, photo].sort((a, b) => a.timestamp - b.timestamp));
                }
            }
        } else {
            setSelectedPhoto(photo);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-black">

            {/* PREMIUM HEADER */}
            <header className="shrink-0 pt-safe px-4 pb-2 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-20 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                    {/* Title — can shrink so buttons never get clipped */}
                    <div className="min-w-0 shrink">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">Visual Progress</div>
                        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase truncate">
                            Gallery
                        </h1>
                    </div>

                    {/* Actions — never shrink, always visible */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Compare — icon only on mobile, icon+count when active */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setIsCompareMode(!isCompareMode); setCompareSelection([]); }}
                            title="Compare photos"
                            className={cn(
                                "flex items-center gap-1.5 h-10 px-3 border text-xs font-bold uppercase tracking-wider rounded-xl transition-colors",
                                isCompareMode
                                    ? "bg-brand-primary text-black border-brand-primary"
                                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"
                            )}
                        >
                            <Columns size={16} />
                            {isCompareMode && (
                                <span className="tabular-nums">{compareSelection.length}/2</span>
                            )}
                            {!isCompareMode && (
                                <span className="hidden sm:inline">Compare</span>
                            )}
                        </motion.button>

                        {/* Grid/Stack toggle */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewMode(viewMode === 'grid' ? 'stack' : 'grid')}
                            title={viewMode === 'stack' ? 'Grid view' : 'Stack view'}
                            className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white rounded-xl"
                        >
                            {viewMode === 'stack' ? <Grid size={17} /> : <LayoutIcon size={17} />}
                        </motion.button>

                        {/* Upload */}
                        {onUploadPhoto && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onUploadPhoto}
                                title="Upload photo"
                                className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
                            >
                                <Upload size={17} />
                            </motion.button>
                        )}

                        {/* Camera — always icon, green accent */}
                        <motion.button
                            onClick={onAddPhoto}
                            whileTap={{ scale: 0.95 }}
                            title="Take photo"
                            className="w-10 h-10 flex items-center justify-center bg-brand-primary text-black rounded-xl shadow-lg"
                        >
                            <Camera size={18} />
                        </motion.button>
                    </div>
                </div>

                {/* MUSCLE FILTER BAR */}
                {availableMuscles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear">
                        <button
                            onClick={() => setSelectedMuscle(null)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
                                !selectedMuscle
                                    ? "bg-brand-primary text-black border-brand-primary"
                                    : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"
                            )}
                        >
                            ALL
                        </button>
                        {availableMuscles.map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedMuscle(m === selectedMuscle ? null : m)}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap",
                                    selectedMuscle === m
                                        ? "bg-brand-primary text-black border-brand-primary"
                                        : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar scroll-smooth">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-xs font-bold text-zinc-700 animate-pulse tracking-[0.3em] uppercase">Loading Gallery...</div>
                    </div>
                ) : photos.length === 0 ? (
                    <EmptyState
                        icon={Camera}
                        title="No Photos Yet"
                        description="Track your physique progress securely. Photos are stored locally."
                        action={{
                            label: "Take First Photo",
                            onClick: onAddPhoto
                        }}
                    />
                ) : (
                    <div className="space-y-12 mt-6">
                        {groupedPhotos.map((group) => (
                            <div key={group.month}>
                                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-4 text-center">
                                    <div className="h-px flex-1 bg-zinc-900" />
                                    <span>{group.month}</span>
                                    <div className="h-px flex-1 bg-zinc-900" />
                                </h3>

                                <div className={cn(
                                    "grid gap-4",
                                    viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
                                )}>
                                    {group.photos.map((photo) => {
                                        const isSelectedForCompare = compareSelection.find(p => p.id === photo.id);
                                        return (
                                            <motion.div
                                                key={photo.id}
                                                layoutId={`photo-${photo.id}`}
                                                onClick={() => handlePhotoClick(photo)}
                                                className={cn(
                                                    "relative aspect-[3/4] bg-zinc-950 cursor-pointer overflow-hidden border transition-all rounded-lg group",
                                                    isSelectedForCompare
                                                        ? "border-brand-primary ring-1 ring-brand-primary opacity-100"
                                                        : "border-zinc-900 hover:border-zinc-700"
                                                )}
                                            >
                                                <img
                                                    src={photo.thumbnailData || photo.imageData}
                                                    alt={`Progress photo from ${new Date(photo.timestamp).toLocaleDateString()}`}
                                                    className={cn(
                                                        "w-full h-full object-cover transition-opacity",
                                                        isSelectedForCompare ? "opacity-100" : "opacity-80 group-hover:opacity-100"
                                                    )}
                                                    loading="lazy"
                                                />

                                                {/* Selection Indicator */}
                                                {isCompareMode && (
                                                    <div className={cn(
                                                        "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors z-20",
                                                        isSelectedForCompare
                                                            ? "bg-brand-primary border-brand-primary text-black"
                                                            : "bg-black/50 border-white/50 text-transparent"
                                                    )}>
                                                        {isSelectedForCompare ? <div className="text-[10px] font-bold">{compareSelection.findIndex(p => p.id === photo.id) + 1}</div> : null}
                                                    </div>
                                                )}

                                                {/* Photo Info Overlay - Tech Style */}
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                                                    <div className="font-medium text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                                        {new Date(photo.timestamp).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }).toUpperCase()}
                                                    </div>
                                                    {photo.muscleGroups.length > 0 && (
                                                        <div className="font-medium text-[8px] text-brand-primary mt-1 uppercase truncate font-bold">
                                                            [{photo.muscleGroups.join(' + ')}]
                                                        </div>
                                                    )}
                                                    {photo.metadata.bodyweight && (
                                                        <div className="font-medium text-sm font-bold text-white mt-1">
                                                            {photo.metadata.bodyweight}<span className="text-[10px] text-zinc-600 ml-1">KG</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Visual indicator when hovered */}
                                                <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors pointer-events-none" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* COMPARE MODAL */}
            <AnimatePresence>
                {isCompareMode && compareSelection.length === 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col pt-safe"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Comparison Mode</h2>
                            <button
                                onClick={() => { setIsCompareMode(false); setCompareSelection([]); }}
                                className="p-2 text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-px bg-zinc-900 overflow-hidden">
                            {compareSelection.map((photo, i) => (
                                <div key={photo.id} className="relative bg-black flex flex-col">
                                    <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                                        <div className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                                            {i === 0 ? "BEFORE" : "AFTER"}
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <img
                                            src={photo.imageData}
                                            alt={i === 0 ? "Before progress" : "After progress"}
                                            className="absolute inset-0 w-full h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-4 border-t border-zinc-900">
                                        <div className="text-[10px] font-medium text-zinc-500 uppercase">{new Date(photo.timestamp).toLocaleDateString()}</div>
                                        {photo.metadata.bodyweight && (
                                            <div className="text-xl font-bold text-white mt-1">{photo.metadata.bodyweight} KG</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Diff Footer */}
                        <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center">
                            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                                Time Diff: <span className="text-white font-bold">{Math.round((compareSelection[1].timestamp - compareSelection[0].timestamp) / (1000 * 60 * 60 * 24))} Days</span>
                            </div>
                            {compareSelection[0].metadata.bodyweight && compareSelection[1].metadata.bodyweight && (
                                <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                                    Weight: <span className={cn("font-bold",
                                        compareSelection[1].metadata.bodyweight < compareSelection[0].metadata.bodyweight ? "text-brand-primary" : "text-white"
                                    )}>
                                        {(compareSelection[1].metadata.bodyweight - compareSelection[0].metadata.bodyweight).toFixed(1)} KG
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VIEWER MODAL */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col pt-safe"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                            <button onClick={() => setSelectedPhoto(null)} className="p-2 text-zinc-500 hover:text-white cursor-pointer"><X size={24} /></button>
                            <span className="font-medium text-[10px] font-bold uppercase text-zinc-500 tracking-widest">
                                {new Date(selectedPhoto.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </span>
                            <button onClick={() => setDeleteConfirm(selectedPhoto.id)} className="p-2 text-red-900 hover:text-red-500 cursor-pointer"><Trash2 size={20} /></button>
                        </div>

                        <div className="flex-1 relative bg-black flex items-center justify-center p-4">
                            <motion.img
                                layoutId={`photo-${selectedPhoto.id}`}
                                src={selectedPhoto.imageData}
                                alt={`Full size progress photo from ${new Date(selectedPhoto.timestamp).toLocaleDateString()}`}
                                className="max-h-full max-w-full object-contain shadow-2xl border border-zinc-900"
                            />

                            <button onClick={() => navigatePhoto('prev')} className="absolute left-4 p-4 text-white disabled:opacity-0" disabled={photos.indexOf(selectedPhoto) === 0}><ChevronLeft size={32} /></button>
                            <button onClick={() => navigatePhoto('next')} className="absolute right-4 p-4 text-white disabled:opacity-0" disabled={photos.indexOf(selectedPhoto) === photos.length - 1}><ChevronRight size={32} /></button>
                        </div>

                        {/* Details Panel */}
                        <div className="p-6 bg-zinc-950 border-t border-zinc-900">
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase mb-2">Analysis</div>
                                    <div className="flex gap-2">
                                        {selectedPhoto.muscleGroups.map(m => (
                                            <span key={m} className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[8px] font-bold uppercase border border-brand-primary/20">{m}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Bodyweight</div>
                                    <div className="text-3xl font-bold text-white">{selectedPhoto.metadata.bodyweight}<span className="text-sm text-zinc-600 ml-1">KG</span></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-8 max-w-xs w-full text-center rounded-lg">
                            <Trash2 size={40} className="mx-auto text-red-500 mb-4" />
                            <h3 className="font-medium text-sm font-bold text-white uppercase mb-2">Delete Record?</h3>
                            <p className="font-medium text-[10px] text-zinc-600 uppercase tracking-tighter mb-8">This asset will be permanently erased from local and cloud storage.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setDeleteConfirm(null)} className="py-3 bg-zinc-800 text-zinc-400 font-medium text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors cursor-pointer">Abort</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="py-3 bg-red-600 text-white font-medium text-[10px] font-bold uppercase tracking-widest shadow-[0_4px_0_0_#991b1b] cursor-pointer">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};



export default PhotoGallery;

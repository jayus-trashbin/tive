import React, { useRef, useEffect, useCallback } from 'react';
import { MuscleGroup } from '../../types/domain';
import { renderMuscleOverlayToCanvas } from './MuscleOverlay';

interface PhotoCanvasProps {
    imageData: string;
    muscleGroups: MuscleGroup[];
    volumes?: Map<MuscleGroup, number>;
    onRender: (finalImageData: string, thumbnailData: string) => void;
}

/**
 * Renders the captured photo with muscle overlay baked in
 * Outputs both full-size and thumbnail versions
 */
const PhotoCanvas: React.FC<PhotoCanvasProps> = ({ imageData, muscleGroups, volumes, onRender }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
    const hasRendered = useRef(false);

    const renderOverlay = useCallback(async () => {
        if (!canvasRef.current || !thumbnailCanvasRef.current || hasRendered.current) return;

        const img = new Image();

        img.onload = () => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set canvas dimensions
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the photo
            ctx.drawImage(img, 0, 0);

            // Add date stamp in top-left
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }).toUpperCase();

            // Date background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(15, 15, 130, 30);

            // Date text
            ctx.fillStyle = '#a3e635';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(dateStr, 25, 30);

            // Render muscle overlay in bottom-right corner
            const overlaySize = Math.min(canvas.width, canvas.height) * 0.25;
            const padding = 20;
            renderMuscleOverlayToCanvas(
                ctx,
                muscleGroups,
                canvas.width - overlaySize - padding,
                canvas.height - overlaySize - padding,
                overlaySize,
                volumes
            );

            // Add TIVE watermark
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(15, canvas.height - 35, 60, 22);
            ctx.fillStyle = '#a3e635';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('TIVE', 25, canvas.height - 22);

            // Get full-size image
            const fullImageData = canvas.toDataURL('image/jpeg', 0.9);

            // Create thumbnail
            const thumbCanvas = thumbnailCanvasRef.current!;
            const thumbCtx = thumbCanvas.getContext('2d');
            const thumbSize = 300;
            thumbCanvas.width = thumbSize;
            thumbCanvas.height = thumbSize;

            if (thumbCtx) {
                // Calculate crop to make square thumbnail
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;

                thumbCtx.drawImage(canvas, sx, sy, minDim, minDim, 0, 0, thumbSize, thumbSize);
            }

            const thumbnailImageData = thumbCanvas.toDataURL('image/jpeg', 0.8);

            hasRendered.current = true;
            onRender(fullImageData, thumbnailImageData);
        };

        img.src = imageData;
    }, [imageData, muscleGroups, volumes, onRender]);

    useEffect(() => {
        renderOverlay();
    }, [renderOverlay]);

    return (
        <div className="hidden">
            <canvas ref={canvasRef} />
            <canvas ref={thumbnailCanvasRef} />
        </div>
    );
};

export default PhotoCanvas;

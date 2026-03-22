import React, { useState } from 'react';
import { MuscleGroup } from '../../types/domain';

interface MuscleOverlayProps {
    muscleGroups: MuscleGroup[];
    /** Volume per muscle for intensity gradient (optional). Higher = brighter */
    volumes?: Map<MuscleGroup, number>;
    size?: number;
    /** If true, show front/back toggle */
    showToggle?: boolean;
}

// Detailed SVG paths for front and back muscle regions
// Each region is a filled polygon that maps to a body part
const FRONT_REGIONS: Record<string, { muscles: MuscleGroup[]; path: string }> = {
    // HEAD
    head: { muscles: [], path: 'M44,4 Q50,0 56,4 L57,12 Q50,16 43,12 Z' },
    neck: { muscles: [], path: 'M46,12 L54,12 L54,17 L46,17 Z' },

    // SHOULDERS
    leftDelt: { muscles: ['shoulders'], path: 'M27,18 Q32,14 37,17 L37,28 Q32,26 27,24 Z' },
    rightDelt: { muscles: ['shoulders'], path: 'M73,18 Q68,14 63,17 L63,28 Q68,26 73,24 Z' },

    // CHEST
    leftPec: { muscles: ['chest'], path: 'M37,18 L49,18 L49,34 Q43,36 37,32 Z' },
    rightPec: { muscles: ['chest'], path: 'M63,18 L51,18 L51,34 Q57,36 63,32 Z' },

    // ARMS
    leftBicep: { muscles: ['arms'], path: 'M25,26 L35,28 L34,44 L24,42 Z' },
    rightBicep: { muscles: ['arms'], path: 'M75,26 L65,28 L66,44 L76,42 Z' },
    leftForearm: { muscles: ['arms'], path: 'M23,44 L33,46 L30,58 L21,56 Z' },
    rightForearm: { muscles: ['arms'], path: 'M77,44 L67,46 L70,58 L79,56 Z' },

    // CORE
    upperAbs: { muscles: ['core'], path: 'M42,34 L58,34 L58,44 L42,44 Z' },
    lowerAbs: { muscles: ['core'], path: 'M42,44 L58,44 L58,56 L42,56 Z' },

    // UPPER LEGS
    leftQuad: { muscles: ['upper legs'], path: 'M38,58 L49,56 L48,78 L35,78 Z' },
    rightQuad: { muscles: ['upper legs'], path: 'M62,58 L51,56 L52,78 L65,78 Z' },

    // LOWER LEGS
    leftCalf: { muscles: ['lower legs'], path: 'M36,80 L47,80 L46,96 L38,96 Z' },
    rightCalf: { muscles: ['lower legs'], path: 'M64,80 L53,80 L54,96 L62,96 Z' },
};

const BACK_REGIONS: Record<string, { muscles: MuscleGroup[]; path: string }> = {
    head: { muscles: [], path: 'M44,4 Q50,0 56,4 L57,12 Q50,16 43,12 Z' },
    neck: { muscles: [], path: 'M46,12 L54,12 L54,17 L46,17 Z' },

    // BACK
    leftTrap: { muscles: ['back'], path: 'M38,17 L50,15 L50,24 L38,22 Z' },
    rightTrap: { muscles: ['back'], path: 'M62,17 L50,15 L50,24 L62,22 Z' },
    leftLat: { muscles: ['back'], path: 'M36,24 L48,22 L48,42 L36,38 Z' },
    rightLat: { muscles: ['back'], path: 'M64,24 L52,22 L52,42 L64,38 Z' },
    lowerBack: { muscles: ['back'], path: 'M42,38 L58,38 L58,55 L42,55 Z' },

    // SHOULDERS (rear)
    leftRearDelt: { muscles: ['shoulders'], path: 'M27,18 L37,17 L37,26 L27,24 Z' },
    rightRearDelt: { muscles: ['shoulders'], path: 'M73,18 L63,17 L63,26 L73,24 Z' },

    // ARMS (triceps)
    leftTricep: { muscles: ['arms'], path: 'M25,26 L35,28 L34,44 L24,42 Z' },
    rightTricep: { muscles: ['arms'], path: 'M75,26 L65,28 L66,44 L76,42 Z' },

    // GLUTES/UPPER LEGS
    leftGlute: { muscles: ['upper legs'], path: 'M38,55 L50,54 L50,64 L38,64 Z' },
    rightGlute: { muscles: ['upper legs'], path: 'M62,55 L50,54 L50,64 L62,64 Z' },
    leftHamstring: { muscles: ['upper legs'], path: 'M37,66 L49,64 L48,80 L35,80 Z' },
    rightHamstring: { muscles: ['upper legs'], path: 'M63,66 L51,64 L52,80 L65,80 Z' },

    // CALVES
    leftCalf: { muscles: ['lower legs'], path: 'M36,82 L47,80 L46,96 L38,96 Z' },
    rightCalf: { muscles: ['lower legs'], path: 'M64,82 L53,80 L54,96 L62,96 Z' },
};

/**
 * Helper to calculate normalized intensity
 */
const getNormalizedIntensity = (muscle: MuscleGroup, volumes?: Map<MuscleGroup, number>): number => {
    if (!volumes) return 0.7;
    let maxVol = 0;
    volumes.forEach(v => { if (v > maxVol) maxVol = v; });
    if (maxVol === 0) return 0.7;
    return Math.min(1, ((volumes.get(muscle) || 0) / maxVol) * 0.7 + 0.3);
};

/**
 * Enhanced muscle group overlay — displays a body silhouette with filled regions
 * that highlight trained muscle groups. Intensity is based on relative volume.
 */
const MuscleOverlay: React.FC<MuscleOverlayProps> = ({
    muscleGroups,
    volumes,
    size = 80,
    showToggle = false
}) => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const activeMuscles = new Set(muscleGroups);

    const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

    return (
        <div className="inline-flex flex-col items-center gap-1">
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
            >
                {/* Background panel */}
                <rect
                    x="2" y="2" width="96" height="96"
                    fill="rgba(0, 0, 0, 0.75)"
                    stroke="#27272a"
                    strokeWidth="0.5"
                />

                {/* Body outline (subtle) */}
                <g stroke="#3f3f46" strokeWidth="0.5" fill="none" opacity="0.5">
                    <ellipse cx="50" cy="8" rx="8" ry="8" />
                    <path d="M37,17 L63,17 L66,56 L34,56 Z" />
                    <path d="M27,18 L37,17 L34,46 L22,44 L20,58 Z" />
                    <path d="M73,18 L63,17 L66,46 L78,44 L80,58 Z" />
                    <path d="M34,56 L48,56 L46,96 L36,96 Z" />
                    <path d="M66,56 L52,56 L54,96 L64,96 Z" />
                </g>

                {/* Filled muscle regions */}
                {Object.entries(regions).map(([key, region]) => {
                    if (region.muscles.length === 0) return null;
                    const isActive = region.muscles.some(m => activeMuscles.has(m));
                    if (!isActive) return null;

                    const primaryMuscle = region.muscles[0];
                    const intensity = getNormalizedIntensity(primaryMuscle, volumes);

                    return (
                        <path
                            key={key}
                            d={region.path}
                            fill={`rgba(163, 230, 53, ${intensity})`}
                            stroke={`rgba(163, 230, 53, ${intensity * 0.6})`}
                            strokeWidth="0.8"
                        />
                    );
                })}

                {/* View label */}
                <text
                    x="50" y="99"
                    textAnchor="middle"
                    fill="#a3e635"
                    fontSize="6"
                    fontFamily="monospace"
                    fontWeight="bold"
                    opacity="0.7"
                >
                    {view.toUpperCase()}
                </text>
            </svg>

            {/* Front/Back Toggle */}
            {showToggle && (
                <div className="flex gap-1">
                    <button
                        onClick={() => setView('front')}
                        className={`px-2 py-0.5 font-mono text-[8px] font-black uppercase transition-all ${view === 'front'
                            ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/40'
                            : 'text-zinc-600 border border-zinc-800 hover:text-zinc-400'
                            }`}
                    >
                        Front
                    </button>
                    <button
                        onClick={() => setView('back')}
                        className={`px-2 py-0.5 font-mono text-[8px] font-black uppercase transition-all ${view === 'back'
                            ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/40'
                            : 'text-zinc-600 border border-zinc-800 hover:text-zinc-400'
                            }`}
                    >
                        Back
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Renders muscle overlay onto a canvas at specified position
 * Used for baking overlay into photo before saving
 */
export function renderMuscleOverlayToCanvas(
    ctx: CanvasRenderingContext2D,
    muscleGroups: MuscleGroup[],
    x: number,
    y: number,
    size: number = 100,
    volumes?: Map<MuscleGroup, number>
): void {
    const activeMuscles = new Set(muscleGroups);
    if (activeMuscles.size === 0) return;

    const scale = size / 100;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Background panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.fillRect(2, 2, 96, 96);
    ctx.strokeRect(2, 2, 96, 96);

    // Body outline
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(50, 8, 8, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(37, 17); ctx.lineTo(63, 17); ctx.lineTo(66, 56); ctx.lineTo(34, 56); ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Active muscle regions (front view for canvas)
    Object.entries(FRONT_REGIONS).forEach(([, region]) => {
        if (region.muscles.length === 0) return;
        const isActive = region.muscles.some(m => activeMuscles.has(m));
        if (!isActive) return;

        const primaryMuscle = region.muscles[0];
        const intensity = getNormalizedIntensity(primaryMuscle, volumes);

        // Parse SVG path and draw manually
        drawSvgPath(ctx, region.path, `rgba(163, 230, 53, ${intensity})`, `rgba(163, 230, 53, ${intensity * 0.6})`);
    });

    // Label
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${activeMuscles.size} MUSCLES`, 50, 97);

    ctx.restore();
}

/** Simple SVG path parser for canvas rendering (supports M, L, Q, Z commands) */
function drawSvgPath(
    ctx: CanvasRenderingContext2D,
    pathStr: string,
    fillColor: string,
    strokeColor: string
): void {
    ctx.beginPath();

    const commands = pathStr.match(/[MLQZ][^MLQZ]*/gi) || [];

    for (const cmd of commands) {
        const type = cmd[0].toUpperCase();
        const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        switch (type) {
            case 'M':
                ctx.moveTo(nums[0], nums[1]);
                break;
            case 'L':
                ctx.lineTo(nums[0], nums[1]);
                break;
            case 'Q':
                ctx.quadraticCurveTo(nums[0], nums[1], nums[2], nums[3]);
                break;
            case 'Z':
                ctx.closePath();
                break;
        }
    }

    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
}

export default MuscleOverlay;

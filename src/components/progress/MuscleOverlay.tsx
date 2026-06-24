import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MuscleGroup } from '../../types/domain';

interface MuscleOverlayProps {
    muscleGroups: MuscleGroup[];
    /** Volume per muscle for intensity gradient (optional). Higher = brighter */
    volumes?: Map<MuscleGroup, number>;
    size?: number;
    /** If true, show front/back toggle */
    showToggle?: boolean;
    /** If provided, use readiness color palette instead of volume intensity */
    readinessScores?: Map<string, number>;
}

// Curvilinear detailed SVG paths for front and back muscle regions
const FRONT_REGIONS: Record<string, { muscles: MuscleGroup[]; path: string }> = {
    head: { muscles: [], path: 'M45,3 Q50,-1 55,3 C58,7 57,12 55,14 L45,14 C43,12 42,7 45,3 Z' },
    neck: { muscles: [], path: 'M46,14 L54,14 C54,17 52,19 50,19 C48,19 46,17 46,14 Z' },

    // SHOULDERS
    leftDelt: { muscles: ['shoulders'], path: 'M27,18 C30,14 34,15 36,17 C37,22 36,26 35,28 C32,27 28,25 27,24 C25,22 25,20 27,18 Z' },
    rightDelt: { muscles: ['shoulders'], path: 'M73,18 C70,14 66,15 64,17 C63,22 64,26 65,28 C68,27 72,25 73,24 C75,22 75,20 73,18 Z' },

    // CHEST
    leftPec: { muscles: ['chest'], path: 'M36,18 L49,18 L49,33 C45,35 39,33 36,29 Z' },
    rightPec: { muscles: ['chest'], path: 'M64,18 L51,18 L51,33 C55,35 61,33 64,29 Z' },

    // ARMS
    leftBicep: { muscles: ['arms'], path: 'M25,25 C30,26 34,26 35,29 C34,36 33,40 33,43 C30,44 26,43 24,41 C23,36 23,30 25,25 Z' },
    rightBicep: { muscles: ['arms'], path: 'M75,25 C70,26 66,26 65,29 C66,36 67,40 67,43 C70,44 74,43 76,41 C77,36 77,30 75,25 Z' },
    leftForearm: { muscles: ['arms'], path: 'M23,42 C28,44 32,44 32,46 C30,52 28,55 26,57 C24,56 22,55 20,53 C21,50 22,46 23,42 Z' },
    rightForearm: { muscles: ['arms'], path: 'M77,42 C72,44 68,44 68,46 C70,52 72,55 74,57 C76,56 78,55 80,53 C79,50 78,46 77,42 Z' },

    // CORE
    upperAbs: { muscles: ['core'], path: 'M41,34 C47,34 53,34 59,34 L58,43 C52,44 48,44 42,43 Z' },
    lowerAbs: { muscles: ['core'], path: 'M42,44 C48,45 52,45 58,44 L57,54 C54,56 46,56 43,54 Z' },

    // UPPER LEGS (Quads)
    leftQuad: { muscles: ['upper legs'], path: 'M38,55 C43,54 47,54 49,56 C49,63 48,72 47,78 C43,79 38,78 35,77 C34,70 36,62 38,55 Z' },
    rightQuad: { muscles: ['upper legs'], path: 'M62,55 C57,54 53,54 51,56 C51,63 52,72 53,78 C57,79 62,78 65,77 C66,70 64,62 62,55 Z' },

    // LOWER LEGS (Calves)
    leftCalf: { muscles: ['lower legs'], path: 'M35,79 C40,79 45,79 47,80 C46,86 45,92 44,96 L37,96 C36,92 35,86 35,79 Z' },
    rightCalf: { muscles: ['lower legs'], path: 'M65,79 C60,79 55,79 53,80 C54,86 55,92 56,96 L63,96 C64,92 65,86 65,79 Z' },
};

const BACK_REGIONS: Record<string, { muscles: MuscleGroup[]; path: string }> = {
    head: { muscles: [], path: 'M45,3 Q50,-1 55,3 C58,7 57,12 55,14 L45,14 C43,12 42,7 45,3 Z' },
    neck: { muscles: [], path: 'M46,14 L54,14 C54,17 52,19 50,19 C48,19 46,17 46,14 Z' },

    // BACK
    leftTrap: { muscles: ['back'], path: 'M37,17 C41,15 45,14 50,14 L50,24 L37,22 Z' },
    rightTrap: { muscles: ['back'], path: 'M63,17 C59,15 55,14 50,14 L50,24 L63,22 Z' },
    leftLat: { muscles: ['back'], path: 'M36,24 L48,22 L48,42 C44,40 38,34 36,24 Z' },
    rightLat: { muscles: ['back'], path: 'M64,24 L52,22 L52,42 C56,40 62,34 64,24 Z' },
    lowerBack: { muscles: ['back'], path: 'M42,38 C46,38 54,38 58,38 L57,52 C54,55 46,55 43,52 Z' },

    // SHOULDERS (rear)
    leftRearDelt: { muscles: ['shoulders'], path: 'M27,18 L37,17 L36,26 C33,26 29,25 27,24 C25,22 25,20 27,18 Z' },
    rightRearDelt: { muscles: ['shoulders'], path: 'M73,18 L63,17 L64,26 C67,26 71,25 73,24 C75,22 75,20 73,18 Z' },

    // ARMS (triceps)
    leftTricep: { muscles: ['arms'], path: 'M25,25 C30,26 34,26 35,29 C34,36 33,40 33,43 C30,44 26,43 24,41 C23,36 23,30 25,25 Z' },
    rightTricep: { muscles: ['arms'], path: 'M75,25 C70,26 66,26 65,29 C66,36 67,40 67,43 C70,44 74,43 76,41 C77,36 77,30 75,25 Z' },

    // GLUTES/UPPER LEGS
    leftGlute: { muscles: ['upper legs'], path: 'M38,53 C43,52 47,52 50,54 L50,65 C45,64 40,63 37,63 Z' },
    rightGlute: { muscles: ['upper legs'], path: 'M62,53 C57,52 53,52 50,54 L50,65 C55,64 60,63 63,63 Z' },
    leftHamstring: { muscles: ['upper legs'], path: 'M36,65 L48,64 C48,70 47,75 46,80 L35,80 C35,75 35,70 36,65 Z' },
    rightHamstring: { muscles: ['upper legs'], path: 'M64,65 L52,64 C52,70 53,75 54,80 L65,80 C65,75 65,70 64,65 Z' },

    // CALVES
    leftCalf: { muscles: ['lower legs'], path: 'M35,81 C40,81 45,81 47,80 C46,86 45,92 44,96 L37,96 C36,92 35,86 35,81 Z' },
    rightCalf: { muscles: ['lower legs'], path: 'M65,81 C60,81 55,81 53,80 C54,86 55,92 56,96 L63,96 C64,92 65,86 65,81 Z' },
};

/** Calculate normalized intensity based on volume (0.3 to 1.0) */
const getNormalizedIntensity = (muscle: MuscleGroup, volumes?: Map<MuscleGroup, number>): number => {
    if (!volumes) return 0.7;
    let maxVol = 0;
    volumes.forEach(v => { if (v > maxVol) maxVol = v; });
    if (maxVol === 0) return 0.7;
    return Math.min(1, ((volumes.get(muscle) || 0) / maxVol) * 0.7 + 0.3);
};

const getReadinessColor = (score: number) => {
    if (score > 0.8) return 'rgba(163, 230, 53, 1)'; // brand-primary
    if (score > 0.5) return 'rgba(250, 204, 21, 1)'; // brand-warning (yellow)
    return 'rgba(248, 113, 113, 1)'; // brand-danger (red)
};

/**
 * Enhanced muscle group overlay — displays a body silhouette with filled regions
 * that highlight trained muscle groups. Intensity is based on relative volume or readiness.
 */
const MuscleOverlay: React.FC<MuscleOverlayProps> = ({
    muscleGroups,
    volumes,
    size = 80,
    showToggle = false,
    readinessScores
}) => {
    const [view, setView] = useState<'front' | 'back'>('front');
    const [hoveredMuscle, setHoveredMuscle] = useState<{ name: string; volume?: number; score?: number } | null>(null);
    const activeMuscles = new Set(muscleGroups);

    const regions = view === 'front' ? FRONT_REGIONS : BACK_REGIONS;

    return (
        <div className="inline-flex flex-col items-center gap-2 relative">
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-lg transition-transform duration-500 ease-out"
                >
                    {/* Background panel */}
                    <rect
                        x="2" y="2" width="96" height="96"
                        fill="rgba(0, 0, 0, 0.75)"
                        stroke="#27272a"
                        strokeWidth="0.5"
                        rx="4"
                    />

                    {/* Body outline (subtle) */}
                    <g stroke="#3f3f46" strokeWidth="0.5" fill="none" opacity="0.5">
                        <ellipse cx="50" cy="8" rx="7" ry="8" />
                        <path d="M37,17 L63,17 L66,56 L34,56 Z" />
                        <path d="M27,18 C27,18 37,17 37,17 L34,46 L22,44 L20,58 Z" />
                        <path d="M73,18 C73,18 63,17 63,17 L66,46 L78,44 L80,58 Z" />
                        <path d="M34,56 L48,56 L46,96 L36,96 Z" />
                        <path d="M66,56 L52,56 L54,96 L64,96 Z" />
                    </g>

                    {/* Filled muscle regions */}
                    <AnimatePresence>
                        {Object.entries(regions).map(([key, region]) => {
                            if (region.muscles.length === 0) return null;
                            const primaryMuscle = region.muscles[0];
                            const isActive = activeMuscles.has(primaryMuscle);
                            
                            let fillColor = 'transparent';
                            let strokeColor = 'transparent';
                            let intensity = 0;

                            if (isActive) {
                                if (readinessScores) {
                                    const score = readinessScores.get(primaryMuscle) || 1;
                                    fillColor = getReadinessColor(score);
                                    strokeColor = fillColor;
                                } else {
                                    intensity = getNormalizedIntensity(primaryMuscle, volumes);
                                    fillColor = `rgba(163, 230, 53, ${intensity})`;
                                    strokeColor = `rgba(163, 230, 53, ${Math.max(0.4, intensity * 0.6)})`;
                                }
                            }

                            return (
                                <motion.path
                                    key={key}
                                    d={region.path}
                                    fill={isActive ? fillColor : 'rgba(255,255,255,0.02)'}
                                    stroke={isActive ? strokeColor : 'rgba(255,255,255,0.05)'}
                                    strokeWidth="0.8"
                                    initial={{ opacity: 0 }}
                                    animate={isActive && !readinessScores ? {
                                        opacity: 1,
                                        filter: [
                                            'drop-shadow(0px 0px 0px rgba(163,230,53,0))',
                                            `drop-shadow(0px 0px 4px rgba(163,230,53,${intensity * 0.5}))`,
                                            'drop-shadow(0px 0px 0px rgba(163,230,53,0))'
                                        ]
                                    } : { opacity: 1 }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    onMouseEnter={() => {
                                        if (isActive) {
                                            setHoveredMuscle({
                                                name: primaryMuscle,
                                                volume: volumes?.get(primaryMuscle),
                                                score: readinessScores?.get(primaryMuscle)
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => setHoveredMuscle(null)}
                                    className={isActive ? "cursor-pointer" : ""}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {/* View label */}
                    <text
                        x="50" y="99"
                        textAnchor="middle"
                        fill="#a3e635"
                        fontSize="6"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                        opacity="0.5"
                    >
                        {view.toUpperCase()}
                    </text>
                </svg>

                {/* Tooltip Overlay */}
                <AnimatePresence>
                    {hoveredMuscle && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/95 backdrop-blur border border-zinc-800 p-2 rounded-lg pointer-events-none shadow-xl z-10 min-w-[90px] text-center"
                        >
                            <div className="text-caption-xs uppercase font-bold text-zinc-300 tracking-wider mb-1">
                                {hoveredMuscle.name}
                            </div>
                            {hoveredMuscle.volume !== undefined && (
                                <div className="text-caption font-black text-brand-primary">
                                    {Math.round(hoveredMuscle.volume)}kg
                                </div>
                            )}
                            {hoveredMuscle.score !== undefined && (
                                <div className="text-caption font-black text-white">
                                    Readiness: {Math.round(hoveredMuscle.score * 100)}%
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Front/Back Toggle */}
            {showToggle && (
                <div className="flex gap-1">
                    <button
                        onClick={() => setView('front')}
                        className={`px-4 py-1.5 text-caption-xs font-black uppercase tracking-wider transition-all rounded-l-lg ${view === 'front'
                            ? 'bg-brand-primary text-black shadow-[0_0_12px_-2px] shadow-brand-primary/40'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
                            }`}
                    >
                        Front
                    </button>
                    <button
                        onClick={() => setView('back')}
                        className={`px-4 py-1.5 text-caption-xs font-black uppercase tracking-wider transition-all rounded-r-lg ${view === 'back'
                            ? 'bg-brand-primary text-black shadow-[0_0_12px_-2px] shadow-brand-primary/40'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
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
    ctx.beginPath();
    ctx.roundRect(2, 2, 96, 96, 4);
    ctx.fill();
    ctx.stroke();

    // Body outline
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(50, 8, 7, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Simplified outline for canvas baking
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
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${activeMuscles.size} MUSCLES`, 50, 97);

    ctx.restore();
}

/** Simple SVG path parser for canvas rendering (supports M, L, Q, C, Z commands) */
function drawSvgPath(
    ctx: CanvasRenderingContext2D,
    pathStr: string,
    fillColor: string,
    strokeColor: string
): void {
    ctx.beginPath();

    const commands = pathStr.match(/[MLQCZ][^MLQCZ]*/gi) || [];

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
            case 'C':
                ctx.bezierCurveTo(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]);
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

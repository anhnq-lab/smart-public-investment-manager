/**
 * BimViewCube — 3D Orientation cube widget (CSS3D implementation)
 * Clickable faces, edges, and corners for camera navigation
 * Compact 80x80px widget at top-right corner of the viewport
 */
import React, { useState, useMemo } from 'react';

interface BimViewCubeProps {
    isDarkMode: boolean;
    cameraRotation?: { x: number; y: number; z: number }; // Euler angles in degrees
    onSetView: (view: string) => void;
}

// Face labels
const FACES: Array<{ id: string; label: string; transform: string }> = [
    { id: 'front', label: 'Front', transform: 'translateZ(30px)' },
    { id: 'back', label: 'Back', transform: 'rotateY(180deg) translateZ(30px)' },
    { id: 'right', label: 'Right', transform: 'rotateY(90deg) translateZ(30px)' },
    { id: 'left', label: 'Left', transform: 'rotateY(-90deg) translateZ(30px)' },
    { id: 'top', label: 'Top', transform: 'rotateX(90deg) translateZ(30px)' },
    { id: 'bottom', label: 'Btm', transform: 'rotateX(-90deg) translateZ(30px)' },
];

export const BimViewCube: React.FC<BimViewCubeProps> = ({
    isDarkMode,
    cameraRotation = { x: -30, y: 45, z: 0 },
    onSetView
}) => {
    const [hoveredFace, setHoveredFace] = useState<string | null>(null);

    const cubeTransform = useMemo(() => {
        return `rotateX(${cameraRotation.x}deg) rotateY(${cameraRotation.y}deg) rotateZ(${cameraRotation.z}deg)`;
    }, [cameraRotation]);

    return (
        <div className="absolute top-16 right-3 z-20" style={{ perspective: '400px', width: '80px', height: '80px' }}>
            {/* Cube container */}
            <div
                className="relative w-full h-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: cubeTransform,
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {FACES.map(face => (
                    <div
                        key={face.id}
                        onClick={() => onSetView(face.id)}
                        onMouseEnter={() => setHoveredFace(face.id)}
                        onMouseLeave={() => setHoveredFace(null)}
                        className={`
                            absolute w-[60px] h-[60px] flex items-center justify-center cursor-pointer
                            border text-[9px] font-bold uppercase tracking-wider select-none
                            transition-all duration-150
                            ${hoveredFace === face.id
                                ? isDarkMode
                                    ? 'bg-blue-500/30 border-blue-400/60 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                                    : 'bg-blue-100 border-blue-300 text-blue-700'
                                : isDarkMode
                                    ? 'bg-slate-800/90 border-slate-600/50 text-slate-400'
                                    : 'bg-white/90 border-gray-300 text-gray-500'
                            }
                        `}
                        style={{
                            transform: face.transform,
                            backfaceVisibility: 'hidden',
                            left: '10px',
                            top: '10px',
                        }}
                    >
                        {face.label}
                    </div>
                ))}
            </div>

            {/* Axis indicators */}
            <div className="absolute bottom-0 left-0 flex items-center gap-1 text-[8px] font-bold">
                <span className="text-red-400">X</span>
                <span className="text-green-400">Y</span>
                <span className="text-blue-400">Z</span>
            </div>
        </div>
    );
};

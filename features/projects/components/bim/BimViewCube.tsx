/**
 * BimViewCube — Enhanced 3D Orientation cube with compass ring
 * 
 * - Rotates in real-time with camera orbit
 * - Click faces to navigate to standard views
 * - Drag on cube to orbit the camera
 * - Compass ring shows N/E/S/W cardinal directions
 * - Glow effect and frosted glass styling
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useBimContext } from './context/BimContext';

// Face definitions
const FACES: Array<{ id: string; label: string; transform: string }> = [
    { id: 'front', label: 'FRONT', transform: 'translateZ(40px)' },
    { id: 'back', label: 'BACK', transform: 'rotateY(180deg) translateZ(40px)' },
    { id: 'right', label: 'RIGHT', transform: 'rotateY(90deg) translateZ(40px)' },
    { id: 'left', label: 'LEFT', transform: 'rotateY(-90deg) translateZ(40px)' },
    { id: 'top', label: 'TOP', transform: 'rotateX(90deg) translateZ(40px)' },
    { id: 'bottom', label: 'BTM', transform: 'rotateX(-90deg) translateZ(40px)' },
];

// CSS matrix3d from Three.js quaternion (inverse for ViewCube)
function quaternionToCSS3D(q: THREE.Quaternion): string {
    const m = new THREE.Matrix4();
    const invQ = q.clone().invert();
    m.makeRotationFromQuaternion(invQ);
    const e = m.elements;
    return `matrix3d(${e[0]},${e[1]},${e[2]},${e[3]},${e[4]},${e[5]},${e[6]},${e[7]},${e[8]},${e[9]},${e[10]},${e[11]},${e[12]},${e[13]},${e[14]},${e[15]})`;
}

// Extract Y rotation angle (yaw) from quaternion for compass
function quaternionToYaw(q: THREE.Quaternion): number {
    const euler = new THREE.Euler().setFromQuaternion(q.clone().invert(), 'YXZ');
    return -(euler.y * 180) / Math.PI;
}

export const BimViewCube: React.FC = () => {
    const { isDarkMode, engine: { cameraQuaternion, setView: onSetView, orbit: onOrbit } } = useBimContext();
    const [hoveredFace, setHoveredFace] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number } | null>(null);
    const cubeRef = useRef<HTMLDivElement>(null);

    // Compute cube CSS transform from camera quaternion
    const cubeTransform = cameraQuaternion
        ? quaternionToCSS3D(cameraQuaternion)
        : 'rotateX(-30deg) rotateY(45deg)';

    // Compute compass rotation from camera Y axis
    const compassRotation = cameraQuaternion ? quaternionToYaw(cameraQuaternion) : 45;

    // ── Drag to orbit ──
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = { startX: e.clientX, startY: e.clientY };
        setIsDragging(true);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current || !onOrbit) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            dragRef.current = { startX: e.clientX, startY: e.clientY };
            onOrbit(dx * 0.5, dy * 0.5);
        };

        const handleMouseUp = () => {
            dragRef.current = null;
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onOrbit]);

    const handleFaceClick = useCallback((faceId: string) => {
        if (!isDragging) {
            onSetView(faceId);
        }
    }, [isDragging, onSetView]);

    const faceStyle = (faceId: string): React.CSSProperties => ({
        transform: FACES.find(f => f.id === faceId)?.transform,
        backfaceVisibility: 'hidden' as const,
        left: '5px',
        top: '5px',
    });

    const baseClasses = isDarkMode
        ? 'bg-gradient-to-br from-slate-700/60 to-slate-800/70 border-slate-500/25 text-slate-400 backdrop-blur-md'
        : 'bg-gradient-to-br from-white/85 to-gray-50/80 border-gray-300/40 text-gray-500 backdrop-blur-md';

    const hoverClasses = isDarkMode
        ? 'bg-gradient-to-br from-cyan-500/35 to-blue-500/25 border-cyan-400/50 text-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.35)]'
        : 'bg-gradient-to-br from-blue-100/90 to-cyan-50/80 border-cyan-400/60 text-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.2)]';

    return (
        <div className="absolute top-14 right-3 z-20 flex flex-col items-center">
            {/* Glow backdrop */}
            <div
                className={`absolute rounded-full blur-2xl transition-opacity duration-500 ${isDarkMode ? 'bg-cyan-500 opacity-15' : 'bg-blue-400 opacity-12'}`}
                style={{ width: 110, height: 110, top: 8, left: -12 }}
            />

            {/* Compass Ring */}
            <div
                className="relative"
                style={{ width: 110, height: 110 }}
            >
                {/* Compass ticks ring */}
                <svg
                    className="absolute inset-0"
                    viewBox="0 0 110 110"
                    style={{
                        transform: `rotate(${compassRotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    }}
                >
                    {/* Outer ring */}
                    <circle cx="55" cy="55" r="52" fill="none"
                        stroke={isDarkMode ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.3)'}
                        strokeWidth="1"
                    />
                    {/* Tick marks every 30° */}
                    {Array.from({ length: 12 }).map((_, i) => {
                        const angle = i * 30;
                        const isMajor = angle % 90 === 0;
                        const r1 = isMajor ? 44 : 48;
                        const r2 = 52;
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 55 + r1 * Math.sin(rad);
                        const y1 = 55 - r1 * Math.cos(rad);
                        const x2 = 55 + r2 * Math.sin(rad);
                        const y2 = 55 - r2 * Math.cos(rad);
                        return (
                            <line
                                key={i}
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke={isDarkMode ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.4)'}
                                strokeWidth={isMajor ? 1.5 : 0.8}
                            />
                        );
                    })}
                    {/* N marker (red) with subtle glow */}
                    <circle cx="55" cy="12" r="7" fill="rgba(239,68,68,0.12)" />
                    <text x="55" y="12" textAnchor="middle" dominantBaseline="middle"
                        fill="#ef4444" fontSize="9" fontWeight="bold" fontFamily="system-ui">
                        N
                    </text>
                    {/* E marker */}
                    <text x="101" y="56" textAnchor="middle" dominantBaseline="middle"
                        fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="8" fontWeight="600" fontFamily="system-ui">
                        E
                    </text>
                    {/* S marker */}
                    <text x="55" y="101" textAnchor="middle" dominantBaseline="middle"
                        fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="8" fontWeight="600" fontFamily="system-ui">
                        S
                    </text>
                    {/* W marker */}
                    <text x="10" y="56" textAnchor="middle" dominantBaseline="middle"
                        fill={isDarkMode ? '#94a3b8' : '#64748b'} fontSize="8" fontWeight="600" fontFamily="system-ui">
                        W
                    </text>
                </svg>

                {/* 3D Cube (centered within compass) */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        perspective: '400px',
                        width: '90px',
                        height: '90px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <div
                        ref={cubeRef}
                        className="relative w-full h-full"
                        style={{
                            transformStyle: 'preserve-3d',
                            transform: cubeTransform,
                            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    >
                        {FACES.map(face => (
                            <div
                                key={face.id}
                                onClick={(e) => { e.stopPropagation(); handleFaceClick(face.id); }}
                                onMouseEnter={() => setHoveredFace(face.id)}
                                onMouseLeave={() => setHoveredFace(null)}
                                className={`
                                    absolute w-[80px] h-[80px] flex items-center justify-center
                                    border text-[9px] font-bold uppercase tracking-wider select-none
                                    transition-all duration-200 rounded-[6px]
                                    ${hoveredFace === face.id ? hoverClasses : baseClasses}
                                `}
                                style={faceStyle(face.id)}
                            >
                                {face.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Axis indicators */}
            <div className="flex items-center gap-2 mt-0.5 text-[8px] font-bold opacity-70">
                <span className="text-red-400">X</span>
                <span className="text-green-400">Y</span>
                <span className="text-blue-400">Z</span>
            </div>
        </div>
    );
};

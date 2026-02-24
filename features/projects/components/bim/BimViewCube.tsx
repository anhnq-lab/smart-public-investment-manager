/**
 * BimViewCube — 3D Orientation cube that syncs with camera
 * 
 * - Rotates in real-time with camera orbit
 * - Click faces/edges to navigate to standard views
 * - Drag on cube to orbit the camera
 * - Professional styling matching Autodesk Viewer / BIMcollab
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useBimContext } from './context/BimContext';

// Face definitions with labels (Vietnamese + English)
const FACES: Array<{ id: string; label: string; transform: string }> = [
    { id: 'front', label: 'FRONT', transform: 'translateZ(35px)' },
    { id: 'back', label: 'BACK', transform: 'rotateY(180deg) translateZ(35px)' },
    { id: 'right', label: 'RIGHT', transform: 'rotateY(90deg) translateZ(35px)' },
    { id: 'left', label: 'LEFT', transform: 'rotateY(-90deg) translateZ(35px)' },
    { id: 'top', label: 'TOP', transform: 'rotateX(90deg) translateZ(35px)' },
    { id: 'bottom', label: 'BTM', transform: 'rotateX(-90deg) translateZ(35px)' },
];

// CSS matrix3d from Three.js quaternion (inverse for ViewCube)
function quaternionToCSS3D(q: THREE.Quaternion): string {
    // The ViewCube shows the world from the camera's perspective
    // We need the inverse rotation so the cube faces match world orientation
    const m = new THREE.Matrix4();
    const invQ = q.clone().invert();
    m.makeRotationFromQuaternion(invQ);
    const e = m.elements;
    // CSS matrix3d uses column-major order, same as Three.js
    return `matrix3d(${e[0]},${e[1]},${e[2]},${e[3]},${e[4]},${e[5]},${e[6]},${e[7]},${e[8]},${e[9]},${e[10]},${e[11]},${e[12]},${e[13]},${e[14]},${e[15]})`;
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
            // Convert pixel movement to orbit angles (degrees)
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
        ? 'bg-slate-800/80 border-slate-600/40 text-slate-300'
        : 'bg-white/85 border-gray-300/60 text-gray-500';

    const hoverClasses = isDarkMode
        ? 'bg-cyan-500/40 border-cyan-400/70 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
        : 'bg-cyan-100 border-cyan-400 text-cyan-700';

    return (
        <div
            className="absolute top-16 right-3 z-20"
            style={{
                perspective: '400px',
                width: '80px',
                height: '80px',
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Cube container */}
            <div
                ref={cubeRef}
                className="relative w-full h-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: cubeTransform,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                }}
            >
                {FACES.map(face => (
                    <div
                        key={face.id}
                        onClick={(e) => { e.stopPropagation(); handleFaceClick(face.id); }}
                        onMouseEnter={() => setHoveredFace(face.id)}
                        onMouseLeave={() => setHoveredFace(null)}
                        className={`
                            absolute w-[70px] h-[70px] flex items-center justify-center
                            border text-[9px] font-bold uppercase tracking-wider select-none
                            transition-all duration-150 rounded-[3px]
                            ${hoveredFace === face.id ? hoverClasses : baseClasses}
                        `}
                        style={faceStyle(face.id)}
                    >
                        {face.label}
                    </div>
                ))}
            </div>

            {/* Axis indicators */}
            <div className="absolute -bottom-1 left-1 flex items-center gap-1.5 text-[8px] font-bold opacity-80">
                <span className="text-red-400">X</span>
                <span className="text-green-400">Y</span>
                <span className="text-blue-400">Z</span>
            </div>
        </div>
    );
};

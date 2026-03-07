/**
 * BimPerformanceStats — Toggleable overlay showing renderer performance
 * FPS, triangles, draw calls, geometries, textures, model count
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBimContext } from './context/BimContext';
import { Activity, X } from 'lucide-react';

interface Stats {
    fps: number;
    triangles: number;
    calls: number;
    geometries: number;
    textures: number;
    programs: number;
}

export const BimPerformanceStats: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
    const { engine, isDarkMode, upload } = useBimContext();
    const [stats, setStats] = useState<Stats>({ fps: 0, triangles: 0, calls: 0, geometries: 0, textures: 0, programs: 0 });
    const frameTimesRef = useRef<number[]>([]);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef(performance.now());

    const tick = useCallback(() => {
        const now = performance.now();
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;

        // Rolling FPS (last 30 frames)
        frameTimesRef.current.push(delta);
        if (frameTimesRef.current.length > 30) frameTimesRef.current.shift();
        const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const fps = Math.round(1000 / avgDelta);

        // Renderer info
        const renderer = (engine.worldRef.current?.renderer as any)?.three;
        const info = renderer?.info;
        const render = info?.render || {};
        const memory = info?.memory || {};

        setStats({
            fps,
            triangles: render.triangles || 0,
            calls: render.calls || 0,
            geometries: memory.geometries || 0,
            textures: memory.textures || 0,
            programs: info?.programs?.length || 0,
        });

        rafRef.current = requestAnimationFrame(tick);
    }, [engine.worldRef]);

    useEffect(() => {
        if (!visible) return;
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [visible, tick]);

    if (!visible) return null;

    const modelCount = upload.disciplineModels.length;

    const fmt = (n: number): string => {
        if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
        if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
        return String(n);
    };

    const fpsColor = stats.fps >= 50 ? 'text-emerald-400' : stats.fps >= 30 ? 'text-amber-400' : 'text-red-400';

    return (
        <div
            className={`absolute bottom-14 left-3 z-40 rounded-xl backdrop-blur-xl border shadow-2xl overflow-hidden select-none
                ${isDarkMode ? 'bg-slate-900/90 border-slate-700/50 text-slate-300' : 'bg-white/90 border-gray-200 text-gray-700'}
            `}
            style={{ minWidth: 180, fontSize: '11px' }}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-1.5 border-b
                ${isDarkMode ? 'border-slate-700/50 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}
            `}>
                <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="font-semibold text-[10px] uppercase tracking-wider">Performance</span>
                </div>
                <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 transition-colors">
                    <X className="w-3 h-3" />
                </button>
            </div>

            {/* Stats grid */}
            <div className="px-3 py-2 space-y-1">
                <StatRow label="FPS" value={String(stats.fps)} valueClass={fpsColor} />
                <StatRow label="Triangles" value={fmt(stats.triangles)} />
                <StatRow label="Draw Calls" value={fmt(stats.calls)} />
                <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-100'}`} />
                <StatRow label="Geometries" value={fmt(stats.geometries)} />
                <StatRow label="Textures" value={fmt(stats.textures)} />
                <StatRow label="Programs" value={fmt(stats.programs)} />
                <div className={`h-px my-1 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-100'}`} />
                <StatRow label="Models" value={String(modelCount)} />
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string; value: string; valueClass?: string }> = ({ label, value, valueClass }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="opacity-60">{label}</span>
        <span className={`font-mono font-semibold tabular-nums ${valueClass || ''}`}>{value}</span>
    </div>
);

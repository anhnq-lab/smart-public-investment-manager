/**
 * BimWalkthroughHUD — Head-up display for first-person walkthrough mode
 * Shows controls, speed indicator, and crosshair
 */
import React from 'react';
import { Footprints, X, Gauge } from 'lucide-react';

interface BimWalkthroughHUDProps {
    isActive: boolean;
    speed: number;
    onExit: () => void;
    isDark: boolean;
}

export const BimWalkthroughHUD: React.FC<BimWalkthroughHUDProps> = ({ isActive, speed, onExit, isDark }) => {
    if (!isActive) return null;

    const speedPercent = Math.round((speed / 3.0) * 100);

    return (
        <>
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="relative w-6 h-6">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 ${isDark ? 'bg-white/60' : 'bg-black/40'}`} />
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 ${isDark ? 'bg-white/60' : 'bg-black/40'}`} />
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-px w-2 ${isDark ? 'bg-white/60' : 'bg-black/40'}`} />
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-px w-2 ${isDark ? 'bg-white/60' : 'bg-black/40'}`} />
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full ${isDark ? 'bg-cyan-400/80' : 'bg-blue-500/60'}`} />
                </div>
            </div>

            {/* Top bar: mode indicator + exit button */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
                <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl border shadow-lg
                    ${isDark
                        ? 'bg-slate-900/90 border-cyan-500/30 text-cyan-400'
                        : 'bg-white/90 border-blue-400/30 text-blue-600'
                    }
                `}>
                    <Footprints className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Walkthrough</span>
                    <div className={`w-px h-4 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                    <button
                        onClick={onExit}
                        className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Bottom-left: controls guide */}
            <div className={`
                absolute bottom-14 left-3 z-40 px-3 py-2.5 rounded-xl backdrop-blur-xl border shadow-lg
                text-[10px] leading-relaxed select-none
                ${isDark
                    ? 'bg-slate-900/80 border-slate-700/50 text-slate-400'
                    : 'bg-white/80 border-gray-200 text-gray-500'
                }
            `}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span><kbd className="font-mono font-bold text-[9px]">WASD</kbd> Move</span>
                    <span><kbd className="font-mono font-bold text-[9px]">Mouse</kbd> Look</span>
                    <span><kbd className="font-mono font-bold text-[9px]">Space</kbd> Up</span>
                    <span><kbd className="font-mono font-bold text-[9px]">Shift</kbd> Down</span>
                    <span><kbd className="font-mono font-bold text-[9px]">Scroll</kbd> Speed</span>
                    <span><kbd className="font-mono font-bold text-[9px]">ESC</kbd> Exit</span>
                </div>
            </div>

            {/* Bottom-right: speed gauge */}
            <div className={`
                absolute bottom-14 right-3 z-40 px-3 py-2 rounded-xl backdrop-blur-xl border shadow-lg
                flex items-center gap-2
                ${isDark
                    ? 'bg-slate-900/80 border-slate-700/50 text-slate-400'
                    : 'bg-white/80 border-gray-200 text-gray-500'
                }
            `}>
                <Gauge className="w-3.5 h-3.5" />
                <div className="flex items-center gap-1.5">
                    <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-200 ${isDark ? 'bg-cyan-500' : 'bg-blue-500'}`}
                            style={{ width: `${speedPercent}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-mono font-semibold tabular-nums w-7 text-right">
                        {speed.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Vignette overlay for immersion */}
            <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.15) 100%)',
                }}
            />
        </>
    );
};

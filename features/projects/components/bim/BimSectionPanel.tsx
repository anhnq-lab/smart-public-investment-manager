/**
 * BimSectionPanel — Floating panel for Section Box controls
 * Shows sliders for each face of the section box, reset, and clear buttons
 */
import React, { useMemo } from 'react';
import { RotateCcw, Trash2, X, Box, ArrowLeftRight } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import * as THREE from 'three';

interface BimSectionPanelProps {
    sectionBoxBounds: { min: THREE.Vector3; max: THREE.Vector3 } | null;
    onUpdatePlane: (id: string, position: number) => void;
    onReset: () => void;
    onRemove: () => void;
    onClose: () => void;
}

interface SliderConfig {
    id: string;
    label: string;
    axis: 'x' | 'y' | 'z';
    direction: 'positive' | 'negative';
    color: string;
    bgColor: string;
}

const SLIDERS: SliderConfig[] = [
    { id: 'sbox-x+', label: 'X Min', axis: 'x', direction: 'positive', color: '#ff4444', bgColor: 'rgba(255,68,68,0.1)' },
    { id: 'sbox-x-', label: 'X Max', axis: 'x', direction: 'negative', color: '#ff6666', bgColor: 'rgba(255,102,102,0.1)' },
    { id: 'sbox-y+', label: 'Y Min', axis: 'y', direction: 'positive', color: '#44ff44', bgColor: 'rgba(68,255,68,0.1)' },
    { id: 'sbox-y-', label: 'Y Max', axis: 'y', direction: 'negative', color: '#66ff66', bgColor: 'rgba(102,255,102,0.1)' },
    { id: 'sbox-z+', label: 'Z Min', axis: 'z', direction: 'positive', color: '#4488ff', bgColor: 'rgba(68,136,255,0.1)' },
    { id: 'sbox-z-', label: 'Z Max', axis: 'z', direction: 'negative', color: '#66aaff', bgColor: 'rgba(102,170,255,0.1)' },
];

export const BimSectionPanel: React.FC<BimSectionPanelProps> = ({
    sectionBoxBounds,
    onUpdatePlane,
    onReset,
    onRemove,
    onClose,
}) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Calculate slider ranges based on bounds + extra margin
    const sliderRanges = useMemo(() => {
        if (!sectionBoxBounds) return {};
        const { min, max } = sectionBoxBounds;
        const size = new THREE.Vector3().subVectors(max, min);
        const margin = 0.5; // extra range beyond current bounds

        const ranges: Record<string, { min: number; max: number; value: number; step: number }> = {};
        for (const slider of SLIDERS) {
            const axisSize = size[slider.axis];
            const step = Math.max(0.01, axisSize * 0.005); // 0.5% of axis size

            if (slider.direction === 'positive') {
                // Min side
                ranges[slider.id] = {
                    min: sectionBoxBounds.min[slider.axis] - axisSize * margin,
                    max: sectionBoxBounds.max[slider.axis],
                    value: sectionBoxBounds.min[slider.axis],
                    step,
                };
            } else {
                // Max side
                ranges[slider.id] = {
                    min: sectionBoxBounds.min[slider.axis],
                    max: sectionBoxBounds.max[slider.axis] + axisSize * margin,
                    value: sectionBoxBounds.max[slider.axis],
                    step,
                };
            }
        }
        return ranges;
    }, [sectionBoxBounds]);

    if (!sectionBoxBounds) return null;

    return (
        <div className={`
            absolute left-2 bottom-14 z-30 w-64 rounded-xl overflow-hidden
            backdrop-blur-xl shadow-2xl border
            ${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-200'}
        `}>
            {/* Header */}
            <div className={`
                flex items-center justify-between px-3 py-2 border-b
                ${isDark ? 'border-slate-700' : 'border-gray-200'}
            `}>
                <div className="flex items-center gap-2">
                    <Box className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Section Box
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onReset}
                        title="Reset Section Box"
                        className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onRemove}
                        title="Remove Section Box"
                        className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-400'}`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-400'}`}
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Sliders */}
            <div className="px-3 py-2 space-y-2">
                {SLIDERS.map((slider) => {
                    const range = sliderRanges[slider.id];
                    if (!range) return null;

                    return (
                        <div key={slider.id}>
                            <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-2 h-2 rounded-sm"
                                        style={{ backgroundColor: slider.color }}
                                    />
                                    <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                        {slider.label}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                                    {range.value.toFixed(2)}m
                                </span>
                            </div>
                            <input
                                type="range"
                                min={range.min}
                                max={range.max}
                                step={range.step}
                                value={range.value}
                                onChange={(e) => onUpdatePlane(slider.id, parseFloat(e.target.value))}
                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, ${slider.color}40 0%, ${slider.color} ${((range.value - range.min) / (range.max - range.min)) * 100
                                        }%, ${isDark ? '#334155' : '#e5e7eb'} ${((range.value - range.min) / (range.max - range.min)) * 100
                                        }%, ${isDark ? '#334155' : '#e5e7eb'} 100%)`,
                                    accentColor: slider.color,
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Footer hint */}
            <div className={`
                px-3 py-1.5 border-t text-center
                ${isDark ? 'border-slate-700 text-slate-500' : 'border-gray-200 text-gray-400'}
            `}>
                <span className="text-[9px]">
                    <ArrowLeftRight className="w-2.5 h-2.5 inline mr-1" />
                    Kéo handle trên mô hình hoặc dùng slider
                </span>
            </div>
        </div>
    );
};

/**
 * useBimMeasure — Professional measurement using OBC LengthMeasurement
 * 
 * SAFE LAZY INIT: Only imports and initializes OBCF measurement components
 * when user first activates a measure tool. This prevents any side effects
 * on model loading/rendering.
 * 
 * Flow (per OBC docs):
 *   container.ondblclick = () => measurer.create()
 *   Highlighter disabled during measuring
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import type { ActiveTool } from './useBimTools';

export interface MeasurementRecord {
    id: string;
    type: 'length' | 'area';
    value: number;       // meters or m²
    timestamp: number;
}

export interface BimMeasureAPI {
    measurementCount: number;
    activeMeasurement: null;
    measurementHistory: MeasurementRecord[];
    totalSum: number;
    handleMeasureClick: (event: MouseEvent) => void;
    clearAllMeasurements: () => void;
    deleteLastMeasurement: () => void;
}

export function useBimMeasure(
    worldRef: React.MutableRefObject<any | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    activeTool: ActiveTool,
    componentsRef?: React.MutableRefObject<OBC.Components | null>,
): BimMeasureAPI {
    const [measurementCount, setMeasurementCount] = useState(0);
    const [measurementHistory, setMeasurementHistory] = useState<MeasurementRecord[]>([]);
    const measurerRef = useRef<any>(null);      // OBCF.LengthMeasurement
    const areaMeasurerRef = useRef<any>(null);   // OBCF.AreaMeasurement
    const highlighterRef = useRef<any>(null);    // OBCF.Highlighter
    const initDoneRef = useRef(false);
    const highlighterWasEnabledRef = useRef(true);

    // ── Lazy init: only when measure tool first activated ──
    const ensureInit = useCallback(async () => {
        if (initDoneRef.current) return true;
        const components = componentsRef?.current;
        const world = worldRef.current;
        if (!components || !world) return false;

        try {
            // Dynamic import to avoid side effects during module load
            const OBCF = await import('@thatopen/components-front');

            const measurer = components.get(OBCF.LengthMeasurement);
            measurer.world = world;
            measurer.color = new THREE.Color('#00d4ff');
            measurer.enabled = false;
            measurerRef.current = measurer;

            const areaMeasurer = components.get(OBCF.AreaMeasurement);
            areaMeasurer.world = world;
            areaMeasurer.enabled = false;
            areaMeasurerRef.current = areaMeasurer;

            try {
                const highlighter = components.get(OBCF.Highlighter);
                highlighterRef.current = highlighter;
            } catch { }

            initDoneRef.current = true;
            // Measurement tools initialized
            return true;
        } catch (err) {
            console.error('[Measure] Init failed:', err);
            return false;
        }
    }, [componentsRef, worldRef]);

    // ── Toggle measurement mode on activeTool change ──
    useEffect(() => {
        const isMeasuringLength = activeTool === 'measure-length';
        const isMeasuringArea = activeTool === 'measure-area';
        const isMeasuring = isMeasuringLength || isMeasuringArea;

        if (isMeasuring) {
            // Lazy init when first needed
            ensureInit().then((ok) => {
                if (!ok) return;
                const measurer = measurerRef.current;
                const areaMeasurer = areaMeasurerRef.current;
                const highlighter = highlighterRef.current;

                if (measurer) measurer.enabled = isMeasuringLength;
                if (areaMeasurer) areaMeasurer.enabled = isMeasuringArea;

                // Suppress highlighter during measuring
                if (highlighter) {
                    highlighterWasEnabledRef.current = highlighter.enabled;
                    highlighter.enabled = false;
                    try { highlighter.config.autoHighlightOnClick = false; } catch { }
                    try { highlighter.config.selectEnabled = false; } catch { }
                }

                // Cursor
                const container = containerRef.current;
                if (container) container.style.cursor = 'crosshair';
            });
        } else {
            // Disable measurement, restore highlighter
            if (initDoneRef.current) {
                const measurer = measurerRef.current;
                const areaMeasurer = areaMeasurerRef.current;
                const highlighter = highlighterRef.current;

                if (measurer) {
                    measurer.enabled = false;
                    try { measurer.endCreation(); } catch { }
                }
                if (areaMeasurer) {
                    areaMeasurer.enabled = false;
                    try { areaMeasurer.endCreation(); } catch { }
                }
                if (highlighter) {
                    highlighter.enabled = highlighterWasEnabledRef.current;
                    try { highlighter.config.autoHighlightOnClick = true; } catch { }
                    try { highlighter.config.selectEnabled = true; } catch { }
                }
            }

            const container = containerRef.current;
            if (container) container.style.cursor = '';
        }
    }, [activeTool, ensureInit, containerRef]);

    // ── Handle dblclick: create measurement ──
    const handleMeasureClick = useCallback(async (event: MouseEvent) => {
        if (activeTool === 'measure-length' && measurerRef.current) {
            try {
                await measurerRef.current.create();
                const count = measurerRef.current.list.size;
                setMeasurementCount(count);
                // Extract last measurement value if possible
                let lastValue = 0;
                try {
                    const list = Array.from(measurerRef.current.list.values());
                    const last = list[list.length - 1] as any;
                    if (last?.path?.distance !== undefined) lastValue = last.path.distance;
                    else if (last?.value !== undefined) lastValue = last.value;
                } catch { /* extraction optional */ }
                setMeasurementHistory(prev => [...prev, {
                    id: `len-${Date.now()}`,
                    type: 'length',
                    value: lastValue,
                    timestamp: Date.now(),
                }]);
            } catch (err) {
                console.warn('[Measure] Length create error:', err);
            }
        } else if (activeTool === 'measure-area' && areaMeasurerRef.current) {
            try {
                await areaMeasurerRef.current.create();
                const count = areaMeasurerRef.current.list?.size ?? 0;
                setMeasurementCount(count);
                let lastValue = 0;
                try {
                    const list = Array.from(areaMeasurerRef.current.list.values());
                    const last = list[list.length - 1] as any;
                    if (last?.area !== undefined) lastValue = last.area;
                    else if (last?.value !== undefined) lastValue = last.value;
                } catch { /* extraction optional */ }
                setMeasurementHistory(prev => [...prev, {
                    id: `area-${Date.now()}`,
                    type: 'area',
                    value: lastValue,
                    timestamp: Date.now(),
                }]);
            } catch (err) {
                console.warn('[Measure] Area create error:', err);
            }
        }
    }, [activeTool]);

    // ── Clear all measurements ──
    const clearAllMeasurements = useCallback(() => {
        if (measurerRef.current?.list) {
            try { measurerRef.current.list.clear(); } catch { }
        }
        if (areaMeasurerRef.current?.list) {
            try { areaMeasurerRef.current.list.clear(); } catch { }
        }
        setMeasurementCount(0);
        setMeasurementHistory([]);
    }, []);

    // ── Delete last measurement ──
    const deleteLastMeasurement = useCallback(() => {
        // Delete from OBC measurement list
        if (measurerRef.current?.list?.size > 0) {
            try {
                const list = Array.from(measurerRef.current.list.values());
                const last = list[list.length - 1] as any;
                if (last && typeof last.dispose === 'function') last.dispose();
                else measurerRef.current.list.delete(last);
            } catch { /* skip */ }
            setMeasurementCount(Math.max(0, measurerRef.current.list.size));
        } else if (areaMeasurerRef.current?.list?.size > 0) {
            try {
                const list = Array.from(areaMeasurerRef.current.list.values());
                const last = list[list.length - 1] as any;
                if (last && typeof last.dispose === 'function') last.dispose();
                else areaMeasurerRef.current.list.delete(last);
            } catch { /* skip */ }
            setMeasurementCount(Math.max(0, areaMeasurerRef.current.list?.size ?? 0));
        }
        setMeasurementHistory(prev => prev.slice(0, -1));
    }, []);

    // ── Total sum of same-type measurements ──
    const totalSum = React.useMemo(() => {
        if (measurementHistory.length === 0) return 0;
        const lastType = measurementHistory[measurementHistory.length - 1].type;
        return measurementHistory
            .filter(m => m.type === lastType)
            .reduce((sum, m) => sum + m.value, 0);
    }, [measurementHistory]);

    return {
        measurementCount,
        activeMeasurement: null,
        measurementHistory,
        totalSum,
        handleMeasureClick,
        clearAllMeasurements,
        deleteLastMeasurement,
    };
}

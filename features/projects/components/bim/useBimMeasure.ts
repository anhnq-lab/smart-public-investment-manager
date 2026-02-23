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

export interface BimMeasureAPI {
    measurementCount: number;
    activeMeasurement: null;
    handleMeasureClick: (event: MouseEvent) => void;
    clearAllMeasurements: () => void;
}

export function useBimMeasure(
    worldRef: React.MutableRefObject<any | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    activeTool: ActiveTool,
    componentsRef?: React.MutableRefObject<OBC.Components | null>,
): BimMeasureAPI {
    const [measurementCount, setMeasurementCount] = useState(0);
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
            console.log('[Measure] ✅ OBC measurement initialized (lazy)');
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
                setMeasurementCount(measurerRef.current.list.size);
                console.log('[Measure] create(), total:', measurerRef.current.list.size);
            } catch (err) {
                console.warn('[Measure] Length create error:', err);
            }
        } else if (activeTool === 'measure-area' && areaMeasurerRef.current) {
            try {
                await areaMeasurerRef.current.create();
                setMeasurementCount(areaMeasurerRef.current.list?.size ?? 0);
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
    }, []);

    return {
        measurementCount,
        activeMeasurement: null,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

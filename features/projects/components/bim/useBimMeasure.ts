/**
 * useBimMeasure — Professional measurement using OBC LengthMeasurement + AreaMeasurement
 * Features:
 * - Built-in vertex snapping (GraphicVertexPicker)
 * - Professional dimension lines with labels, endpoints, projection lines
 * - Free mode + Edge mode for length
 * - Free mode + Square mode for area
 * - Auto disable Highlighter while measuring (no highlight on click conflicts)
 * - Single-click to place points
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
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
    const lengthMeasureRef = useRef<OBCF.LengthMeasurement | null>(null);
    const areaMeasureRef = useRef<OBCF.AreaMeasurement | null>(null);
    const highlighterRef = useRef<OBCF.Highlighter | null>(null);
    const wasHighlighterEnabledRef = useRef(true);
    const initDoneRef = useRef(false);

    // ── Initialize measurement components ──
    useEffect(() => {
        const components = componentsRef?.current;
        const world = worldRef.current;
        if (!components || !world || initDoneRef.current) return;

        try {
            // LengthMeasurement
            const lengthMeasure = components.get(OBCF.LengthMeasurement);
            lengthMeasure.world = world;
            lengthMeasure.enabled = false;
            lengthMeasureRef.current = lengthMeasure;

            // AreaMeasurement
            const areaMeasure = components.get(OBCF.AreaMeasurement);
            areaMeasure.world = world;
            areaMeasure.enabled = false;
            areaMeasureRef.current = areaMeasure;

            // Highlighter
            try {
                const highlighter = components.get(OBCF.Highlighter);
                highlighterRef.current = highlighter;
            } catch {
                console.warn('[Measure] Highlighter not available');
            }

            initDoneRef.current = true;
            console.log('[Measure] ✅ OBC LengthMeasurement + AreaMeasurement initialized');
        } catch (err) {
            console.error('[Measure] Failed to initialize:', err);
        }
    }, [componentsRef?.current, worldRef.current]);

    // ── Toggle measurement mode on/off ──
    useEffect(() => {
        const lengthMeasure = lengthMeasureRef.current;
        const areaMeasure = areaMeasureRef.current;
        const highlighter = highlighterRef.current;

        const isMeasuringLength = activeTool === 'measure-length';
        const isMeasuringArea = activeTool === 'measure-area';
        const isMeasuring = isMeasuringLength || isMeasuringArea;

        // Enable/disable length measurement
        if (lengthMeasure) {
            if (isMeasuringLength) {
                lengthMeasure.enabled = true;
            } else {
                lengthMeasure.enabled = false;
                try { lengthMeasure.endCreation(); } catch { }
            }
        }

        // Enable/disable area measurement
        if (areaMeasure) {
            if (isMeasuringArea) {
                areaMeasure.enabled = true;
            } else {
                areaMeasure.enabled = false;
                try { areaMeasure.endCreation(); } catch { }
            }
        }

        // Disable/restore Highlighter
        if (highlighter) {
            if (isMeasuring) {
                wasHighlighterEnabledRef.current = highlighter.enabled;
                highlighter.enabled = false;
                if (highlighter.config) {
                    highlighter.config.autoHighlightOnClick = false;
                }
            } else {
                highlighter.enabled = wasHighlighterEnabledRef.current;
                if (highlighter.config) {
                    highlighter.config.autoHighlightOnClick = true;
                }
            }
        }

        // Cursor
        const container = containerRef.current;
        if (container) {
            container.style.cursor = isMeasuring ? 'crosshair' : '';
        }
    }, [activeTool, containerRef]);

    // ── Handle click (OBC handles events internally, this is for manual trigger) ──
    const handleMeasureClick = useCallback(async () => {
        // OBC LengthMeasurement/AreaMeasurement handle their own click events
        // This callback is kept for API compatibility but may not be needed
        const lengthMeasure = lengthMeasureRef.current;
        const areaMeasure = areaMeasureRef.current;

        const lengthCount = lengthMeasure?.list?.size ?? 0;
        const areaCount = areaMeasure?.list?.size ?? 0;
        setMeasurementCount(lengthCount + areaCount);
    }, []);

    // ── Clear all measurements ──
    const clearAllMeasurements = useCallback(() => {
        // Clear length measurements
        const lengthMeasure = lengthMeasureRef.current;
        if (lengthMeasure?.list) {
            try {
                for (const [, dim] of lengthMeasure.list) {
                    try { dim.dispose(); } catch { }
                }
                lengthMeasure.list.clear();
            } catch (err) {
                console.warn('[Measure] Length clear error:', err);
            }
        }

        // Clear area measurements
        const areaMeasure = areaMeasureRef.current;
        if (areaMeasure?.list) {
            try {
                for (const [, area] of areaMeasure.list) {
                    try { (area as any).dispose?.(); } catch { }
                }
                areaMeasure.list.clear();
            } catch (err) {
                console.warn('[Measure] Area clear error:', err);
            }
        }

        setMeasurementCount(0);
        console.log('[Measure] All measurements cleared');
    }, []);

    return {
        measurementCount,
        activeMeasurement: null,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

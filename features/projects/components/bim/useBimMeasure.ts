/**
 * useBimMeasure — Professional measurement using OBC LengthMeasurement + AreaMeasurement
 * 
 * Setup: OBC docs — https://docs.thatopen.com/Tutorials/Components/Front/LengthMeasurement
 * - container.ondblclick = () => measurer.create()       ← dblclick gọi create()
 * - measurer.snappings = [FRAGS.SnappingClass.POINT]     ← snap vertex
 * - Highlighter.enabled = false khi measuring             ← tránh xung đột
 * 
 * Features: snap-to-vertex, dimension lines, projection lines, auto labels
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as FRAGS from '@thatopen/fragments';
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
    const initDoneRef = useRef(false);
    const highlighterWasEnabledRef = useRef(true);

    // ── Initialize measurement components ──
    useEffect(() => {
        const components = componentsRef?.current;
        const world = worldRef.current;
        if (!components || !world || initDoneRef.current) return;

        try {
            // Length Measurement
            const measurer = components.get(OBCF.LengthMeasurement);
            measurer.world = world;
            measurer.color = new THREE.Color('#00d4ff');  // Cyan
            measurer.enabled = false;
            // Set snap to vertices for precision
            try {
                (measurer as any).snappings = [FRAGS.SnappingClass.POINT];
            } catch { /* snappings may not exist in this version */ }

            // Area Measurement
            const areaMeasurer = components.get(OBCF.AreaMeasurement);
            areaMeasurer.world = world;
            areaMeasurer.enabled = false;

            initDoneRef.current = true;
            console.log('[Measure] ✅ OBC LengthMeasurement + AreaMeasurement initialized');
        } catch (err) {
            console.error('[Measure] Init failed:', err);
        }
    }, [componentsRef?.current, worldRef.current]);

    // ── Toggle measurement mode: enable/disable + supppress Highlighter ──
    useEffect(() => {
        const components = componentsRef?.current;
        if (!components) return;

        const isMeasuringLength = activeTool === 'measure-length';
        const isMeasuringArea = activeTool === 'measure-area';
        const isMeasuring = isMeasuringLength || isMeasuringArea;

        try {
            // Enable/disable Length
            const measurer = components.get(OBCF.LengthMeasurement);
            if (isMeasuringLength) {
                measurer.enabled = true;
            } else {
                measurer.enabled = false;
                try { measurer.endCreation(); } catch { }
            }

            // Enable/disable Area
            const areaMeasurer = components.get(OBCF.AreaMeasurement);
            if (isMeasuringArea) {
                areaMeasurer.enabled = true;
            } else {
                areaMeasurer.enabled = false;
                try { areaMeasurer.endCreation(); } catch { }
            }
        } catch { }

        // Suppress Highlighter during measuring
        try {
            const highlighter = components.get(OBCF.Highlighter);
            if (isMeasuring) {
                highlighterWasEnabledRef.current = highlighter.enabled;
                highlighter.enabled = false;
                // Disable internal event listeners (OBC Highlighter binds mousedown/mouseup)
                try { highlighter.eventManager.setActive(false); } catch { }
                try {
                    highlighter.config.autoHighlightOnClick = false;
                    highlighter.config.selectEnabled = false;
                } catch { }
                console.log('[Measure] Highlighter DISABLED');
            } else {
                highlighter.enabled = highlighterWasEnabledRef.current;
                try { highlighter.eventManager.setActive(true); } catch { }
                try {
                    highlighter.config.autoHighlightOnClick = true;
                    highlighter.config.selectEnabled = true;
                } catch { }
            }
        } catch { }

        // Cursor
        const container = containerRef.current;
        if (container) {
            container.style.cursor = isMeasuring ? 'crosshair' : '';
        }
    }, [activeTool, componentsRef?.current, containerRef]);

    // ── handleMeasureClick — API compatibility (create() called from ProjectBimTab) ──
    const handleMeasureClick = useCallback(() => {
        // OBC create() is called from ProjectBimTab dblclick handler
        // This updates the count
        const components = componentsRef?.current;
        if (!components) return;
        try {
            const measurerCount = components.get(OBCF.LengthMeasurement).list.size;
            const areaCount = components.get(OBCF.AreaMeasurement).list.size;
            setMeasurementCount(measurerCount + areaCount);
        } catch { }
    }, [componentsRef?.current]);

    // ── Clear all measurements ──
    const clearAllMeasurements = useCallback(() => {
        const components = componentsRef?.current;
        if (!components) return;

        try {
            const measurer = components.get(OBCF.LengthMeasurement);
            measurer.list.clear();
        } catch { }

        try {
            const areaMeasurer = components.get(OBCF.AreaMeasurement);
            areaMeasurer.list.clear();
        } catch { }

        setMeasurementCount(0);
        console.log('[Measure] All measurements cleared');
    }, [componentsRef?.current]);

    return {
        measurementCount,
        activeMeasurement: null,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

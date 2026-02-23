/**
 * useBimMeasure — Professional measurement using OBC LengthMeasurement + AreaMeasurement
 * 
 * DEFERRED INIT: Only initializes OBC measurement components when user activates measure tool.
 * This prevents LengthMeasurement/AreaMeasurement from interfering with model loading.
 * 
 * Flow (per OBC docs):
 *   container.ondblclick = () => measurer.create()
 *   Highlighter disabled during measuring
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
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
    const initDoneRef = useRef(false);
    const highlighterWasEnabledRef = useRef(true);

    // ── DEFERRED init: only when measure tool first activated ──
    const ensureInit = useCallback(() => {
        if (initDoneRef.current) return true;
        const components = componentsRef?.current;
        const world = worldRef.current;
        if (!components || !world) return false;

        try {
            const measurer = components.get(OBCF.LengthMeasurement);
            measurer.world = world;
            measurer.color = new THREE.Color('#00d4ff');
            measurer.enabled = false;

            const areaMeasurer = components.get(OBCF.AreaMeasurement);
            areaMeasurer.world = world;
            areaMeasurer.enabled = false;

            initDoneRef.current = true;
            console.log('[Measure] ✅ OBC measurement components initialized (deferred)');
            return true;
        } catch (err) {
            console.error('[Measure] Init failed:', err);
            return false;
        }
    }, [componentsRef, worldRef]);

    // ── Toggle measurement mode on activeTool change ──
    useEffect(() => {
        const components = componentsRef?.current;
        if (!components) return;

        const isMeasuringLength = activeTool === 'measure-length';
        const isMeasuringArea = activeTool === 'measure-area';
        const isMeasuring = isMeasuringLength || isMeasuringArea;

        // Only init measurement components when actually needed
        if (isMeasuring) {
            if (!ensureInit()) return;
        }

        // Only toggle if init was done
        if (initDoneRef.current) {
            try {
                const measurer = components.get(OBCF.LengthMeasurement);
                if (isMeasuringLength) {
                    measurer.enabled = true;
                } else {
                    measurer.enabled = false;
                    try { measurer.endCreation(); } catch { }
                }
            } catch { }

            try {
                const areaMeasurer = components.get(OBCF.AreaMeasurement);
                if (isMeasuringArea) {
                    areaMeasurer.enabled = true;
                } else {
                    areaMeasurer.enabled = false;
                    try { areaMeasurer.endCreation(); } catch { }
                }
            } catch { }
        }

        // Suppress Highlighter during measuring
        try {
            const highlighter = components.get(OBCF.Highlighter);
            if (isMeasuring) {
                highlighterWasEnabledRef.current = highlighter.enabled;
                highlighter.enabled = false;
                try { highlighter.eventManager.setActive(false); } catch { }
                try {
                    highlighter.config.autoHighlightOnClick = false;
                    highlighter.config.selectEnabled = false;
                } catch { }
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
    }, [activeTool, componentsRef, containerRef, ensureInit]);

    // ── handleMeasureClick — update count ──
    const handleMeasureClick = useCallback(() => {
        const components = componentsRef?.current;
        if (!components || !initDoneRef.current) return;
        try {
            const lc = components.get(OBCF.LengthMeasurement).list.size;
            const ac = components.get(OBCF.AreaMeasurement).list.size;
            setMeasurementCount(lc + ac);
        } catch { }
    }, [componentsRef]);

    // ── Clear all measurements ──
    const clearAllMeasurements = useCallback(() => {
        const components = componentsRef?.current;
        if (!components || !initDoneRef.current) return;

        try { components.get(OBCF.LengthMeasurement).list.clear(); } catch { }
        try { components.get(OBCF.AreaMeasurement).list.clear(); } catch { }

        setMeasurementCount(0);
        console.log('[Measure] All measurements cleared');
    }, [componentsRef]);

    return {
        measurementCount,
        activeMeasurement: null,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

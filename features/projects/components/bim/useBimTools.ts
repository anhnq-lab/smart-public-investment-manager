/**
 * useBimTools — Central state management hook for BIM Viewer tools
 * Manages active tool, render mode, clipping, measurement, and visibility states
 */
import { useState, useCallback, useRef } from 'react';

// ── Tool Types ──────────────────────────────────────
export type ActiveTool =
    | 'select'
    | 'clip-x' | 'clip-y' | 'clip-z' | 'section-box' | 'section-plane'
    | 'measure-length' | 'measure-area'
    | 'isolate' | 'hide-selected'
    | null;

export type RenderMode = 'shading' | 'wireframe' | 'xray' | 'ghosting';

export type PanelView = 'properties' | 'tree' | 'none';

export interface ClipPlaneState {
    id: string;
    axis: 'x' | 'y' | 'z';
    position: number;
    visible: boolean;
}

export interface MeasurementState {
    id: string;
    type: 'length' | 'area';
    value: number;
    unit: string;
}

export interface BimToolState {
    activeTool: ActiveTool;
    renderMode: RenderMode;
    leftPanel: PanelView;
    rightPanel: PanelView;
    clipPlanes: ClipPlaneState[];
    measurements: MeasurementState[];
    sectionBoxActive: boolean;
    showGrid: boolean;
    showAxes: boolean;
}

export function useBimTools() {
    const [activeTool, setActiveTool] = useState<ActiveTool>('select');
    const [renderMode, setRenderMode] = useState<RenderMode>('shading');
    const [leftPanel, setLeftPanel] = useState<PanelView>('tree');
    const [rightPanel, setRightPanel] = useState<PanelView>('properties');
    const [clipPlanes, setClipPlanes] = useState<ClipPlaneState[]>([]);
    const [measurements, setMeasurements] = useState<MeasurementState[]>([]);
    const [sectionBoxActive, setSectionBoxActive] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [showAxes, setShowAxes] = useState(false);

    // Tool activation — deactivates conflicting tools
    const activateTool = useCallback((tool: ActiveTool) => {
        setActiveTool(prev => prev === tool ? 'select' : tool);
    }, []);

    // Toggle panel visibility
    const toggleLeftPanel = useCallback((view: PanelView) => {
        setLeftPanel(prev => prev === view ? 'none' : view);
    }, []);

    const toggleRightPanel = useCallback((view: PanelView) => {
        setRightPanel(prev => prev === view ? 'none' : view);
    }, []);

    // Clipping helpers
    const addClipPlane = useCallback((plane: ClipPlaneState) => {
        setClipPlanes(prev => [...prev, plane]);
    }, []);

    const removeClipPlane = useCallback((id: string) => {
        setClipPlanes(prev => prev.filter(p => p.id !== id));
    }, []);

    const clearClipPlanes = useCallback(() => {
        setClipPlanes([]);
        setSectionBoxActive(false);
    }, []);

    const toggleClipPlaneVisibility = useCallback((id: string) => {
        setClipPlanes(prev => prev.map(p =>
            p.id === id ? { ...p, visible: !p.visible } : p
        ));
    }, []);

    // Measurement helpers
    const addMeasurement = useCallback((m: MeasurementState) => {
        setMeasurements(prev => [...prev, m]);
    }, []);

    const clearMeasurements = useCallback(() => {
        setMeasurements([]);
    }, []);

    // Clear all tools / reset
    const clearAllTools = useCallback(() => {
        setActiveTool('select');
        clearClipPlanes();
        clearMeasurements();
    }, [clearClipPlanes, clearMeasurements]);

    return {
        // State
        activeTool,
        renderMode,
        leftPanel,
        rightPanel,
        clipPlanes,
        measurements,
        sectionBoxActive,
        showGrid,
        showAxes,

        // Actions
        activateTool,
        setRenderMode,
        toggleLeftPanel,
        toggleRightPanel,
        addClipPlane,
        removeClipPlane,
        clearClipPlanes,
        toggleClipPlaneVisibility,
        setSectionBoxActive,
        addMeasurement,
        clearMeasurements,
        clearAllTools,
        setShowGrid,
        setShowAxes,
    };
}

export type BimToolsAPI = ReturnType<typeof useBimTools>;

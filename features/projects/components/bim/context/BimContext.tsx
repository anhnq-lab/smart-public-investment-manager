import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

// Import all APIs
import { useBimTools, BimToolsAPI } from '../useBimTools';
import { useBimEngine, BimEngineAPI } from '../useBimEngine';
import { useBimUpload, BimUploadAPI } from '../useBimUpload';
import { useBimSelection, BimSelectionAPI } from '../useBimSelection';
import { useBimSection, BimSectionAPI } from '../useBimSection';
import { useBimMeasure, BimMeasureAPI } from '../useBimMeasure';
import { useBimOperations, BimOperationsAPI } from '../useBimOperations';
import { useBimKeyboard, BimKeyboardResult } from '../useBimKeyboard';
import { extractFacilityAssetsFromIFC } from '../utils/autoExtractor';

export interface BimContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    modelId: string | null;
    expressId: number | null;
}

export interface BimContextValue {
    projectID: string;
    isDarkMode: boolean;
    isMobile: boolean;
    containerRef: React.RefObject<HTMLDivElement | null>;

    tools: BimToolsAPI;
    engine: BimEngineAPI;
    upload: BimUploadAPI;
    selection: BimSelectionAPI;
    section: BimSectionAPI;
    measure: BimMeasureAPI;
    operations: BimOperationsAPI;
    keyboard: BimKeyboardResult;

    opRefreshTrigger: number;
    handleExtractFromBIM: () => Promise<number>;

    contextMenu: BimContextMenuState;
    setContextMenu: React.Dispatch<React.SetStateAction<BimContextMenuState>>;
}

const BimContext = createContext<BimContextValue | null>(null);

export const useBimContext = () => {
    const ctx = useContext(BimContext);
    if (!ctx) {
        throw new Error('useBimContext must be used within a BimProvider');
    }
    return ctx;
};

interface BimProviderProps {
    children: React.ReactNode;
    projectID: string;
    isDarkMode: boolean;
    isMobile: boolean;
}

export const BimProvider: React.FC<BimProviderProps> = ({
    children,
    projectID,
    isDarkMode,
    isMobile
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [opRefreshTrigger, setOpRefreshTrigger] = useState(0);
    const [contextMenu, setContextMenu] = useState<BimContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        modelId: null,
        expressId: null
    });

    const tools = useBimTools();
    const engine = useBimEngine(containerRef, isDarkMode);

    // Defer initialization to avoid circular reference on selection
    const selectionRef = useRef<BimSelectionAPI | null>(null);

    const upload = useBimUpload(
        projectID,
        engine.componentsRef,
        engine.worldRef,
        engine.ifcLoaderRef,
        (ifcData) => {
            if (selectionRef.current) {
                selectionRef.current.buildSpatialTree(ifcData);
            }
            setOpRefreshTrigger(prev => prev + 1);
        }
    );

    const selection = useBimSelection(
        engine.componentsRef,
        engine.worldRef,
        engine.ifcLoaderRef,
        upload.ifcDataMapRef,
        () => tools.toggleRightPanel('properties')
    );
    selectionRef.current = selection;

    const section = useBimSection(
        engine.worldRef,
        engine.componentsRef,
        containerRef,
        tools.activeTool
    );

    const measure = useBimMeasure(
        engine.worldRef,
        containerRef,
        tools.activeTool,
        engine.componentsRef
    );

    const operations = useBimOperations(
        projectID,
        engine.componentsRef,
        engine.worldRef
    );

    const keyboard = useBimKeyboard({
        containerRef,
        worldRef: engine.worldRef,
        setView: engine.setView,
        fitAll: engine.fitAll,
        activateTool: tools.activateTool,
        clearMeasurements: measure.measurementCount > 0 ? measure.clearAllMeasurements : undefined,
        clearSections: section.clipPlaneCount > 0 ? section.clearAllClipPlanes : undefined,
    });

    const handleExtractFromBIM = useCallback(async () => {
        let totalExtracted = 0;
        for (const [, ifcData] of upload.ifcDataMapRef.current) {
            try {
                const count = await extractFacilityAssetsFromIFC(projectID, ifcData);
                totalExtracted += count;
            } catch (err) {
                console.warn('[ExtractBIM] Error:', err);
            }
        }
        if (totalExtracted > 0) {
            setOpRefreshTrigger(prev => prev + 1);
        }
        return totalExtracted;
    }, [projectID, upload.ifcDataMapRef]);

    const value: BimContextValue = {
        projectID,
        isDarkMode,
        isMobile,
        containerRef,
        tools,
        engine,
        upload,
        selection,
        section,
        measure,
        operations,
        keyboard,
        opRefreshTrigger,
        handleExtractFromBIM,
        contextMenu,
        setContextMenu
    };

    // Close context menu on any global click or escape key
    React.useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && contextMenu.visible) {
                setContextMenu(prev => ({ ...prev, visible: false }));
            }
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [contextMenu.visible]);

    // Cleanup IFC model cache on unmount
    React.useEffect(() => {
        return () => {
            selection.cleanupModelCache();
        };
    }, []);

    return (
        <BimContext.Provider value={value}>
            {children}
        </BimContext.Provider>
    );
};

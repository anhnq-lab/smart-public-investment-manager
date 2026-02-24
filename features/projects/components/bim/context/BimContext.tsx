import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

// Import all APIs
import { useBimTools, BimToolsAPI } from '../useBimTools';
import { useBimEngine, BimEngineAPI } from '../useBimEngine';
import { useBimUpload, BimUploadAPI } from '../useBimUpload';
import { useBimSelection, BimSelectionAPI } from '../useBimSelection';
import { useBimSection, BimSectionAPI } from '../useBimSection';
import { useBimMeasure, BimMeasureAPI } from '../useBimMeasure';
import { useBimKeyboard } from '../useBimKeyboard';
import { extractFacilityAssetsFromIFC } from '../utils/autoExtractor';

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

    opRefreshTrigger: number;
    handleExtractFromBIM: () => Promise<number>;
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

    useBimKeyboard({
        containerRef,
        worldRef: engine.worldRef,
        setView: engine.setView,
        fitAll: engine.fitAll,
        activateTool: tools.activateTool,
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
        opRefreshTrigger,
        handleExtractFromBIM
    };

    return (
        <BimContext.Provider value={value}>
            {children}
        </BimContext.Provider>
    );
};

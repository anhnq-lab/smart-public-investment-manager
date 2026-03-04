import React, { useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';
import { getProjectAssets } from '../../../../lib/facilityAssetService';

export type SystemCategory = 'HVAC' | 'Electrical' | 'Plumbing' | 'Fire' | null;

export interface BimOperationsAPI {
    heatmapActive: boolean;
    activeSystem: SystemCategory;
    toggleHeatmap: () => Promise<void>;
    toggleSystemMapping: (system: SystemCategory) => Promise<void>;
}

export function useBimOperations(
    projectId: string,
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    worldRef: React.MutableRefObject<OBC.World | null>,
): BimOperationsAPI {
    const [heatmapActive, setHeatmapActive] = useState(false);
    const [activeSystem, setActiveSystem] = useState<SystemCategory>(null);

    // Heatmap Logic
    const toggleHeatmap = useCallback(async () => {
        if (!componentsRef.current || !worldRef.current) return;
        const highlighter = componentsRef.current.get(OBCF.Highlighter);
        const fragments = componentsRef.current.get(OBC.FragmentsManager);

        const newActive = !heatmapActive;
        setHeatmapActive(newActive);

        try {
            if (!newActive) {
                try { highlighter.clear('hm-Active'); } catch (e) { }
                try { highlighter.clear('hm-Maintenance'); } catch (e) { }
                try { highlighter.clear('hm-Broken'); } catch (e) { }
                try { highlighter.clear('hm-Retired'); } catch (e) { }
                return;
            }

            // Setup highlight configs if needed
            try {
                highlighter.add('hm-Active', new THREE.Color(0x10b981));
                highlighter.add('hm-Maintenance', new THREE.Color(0xf59e0b));
                highlighter.add('hm-Broken', new THREE.Color(0xef4444));
                highlighter.add('hm-Retired', new THREE.Color(0x64748b));
            } catch (e) {
                // Ignore if already added
            }

            const assets = await getProjectAssets(projectId);
            const statusMap: Record<string, { [modelId: string]: Set<number> }> = {
                Active: {}, Maintenance: {}, Broken: {}, Retired: {}
            };

            for (const asset of assets) {
                if (!asset.bim_element_id || !asset.status) continue;
                const expressId = parseInt(asset.bim_element_id, 10);
                if (isNaN(expressId)) continue;
                for (const [, model] of fragments.groups) {
                    const fragmentMap = model.getFragmentMap([expressId]);
                    if (Object.keys(fragmentMap).length > 0) {
                        const s = asset.status;
                        if (!statusMap[s]) statusMap[s] = {};
                        if (!statusMap[s][model.uuid]) statusMap[s][model.uuid] = new Set();
                        statusMap[s][model.uuid].add(expressId);
                        break;
                    }
                }
            }

            // Apply highlights
            for (const [status, group] of Object.entries(statusMap)) {
                if (Object.keys(group).length === 0) continue;
                try {
                    highlighter.highlight(`hm-${status}`, false, false, group);
                } catch (e) {
                    console.warn(`Failed to highlight heatmap group hm-${status}`, e);
                }
            }
        } catch (err) {
            console.error('Heatmap error:', err);
        }
    }, [heatmapActive, projectId, componentsRef, worldRef]);

    // System Mapping Logic
    const toggleSystemMapping = useCallback(async (system: SystemCategory) => {
        if (!componentsRef.current || !worldRef.current) return;
        const newSystem = activeSystem === system ? null : system;
        setActiveSystem(newSystem);

        const fragments = componentsRef.current.get(OBC.FragmentsManager);
        if (!newSystem) {
            // Show all elements
            for (const [, model] of fragments.list) {
                try { model.resetVisible(); } catch { /* skip */ }
            }
            return;
        }

        // IFC type patterns per system category
        const systemTypePatterns: Record<string, string[]> = {
            'HVAC': ['IfcDuctSegment', 'IfcDuctFitting', 'IfcAirTerminal', 'IfcFan', 'IfcFlowSegment'],
            'Electrical': ['IfcCableSegment', 'IfcCableFitting', 'IfcElectricDistributionBoard', 'IfcOutlet', 'IfcLightFixture', 'IfcSwitchingDevice'],
            'Plumbing': ['IfcPipeSegment', 'IfcPipeFitting', 'IfcSanitaryTerminal', 'IfcValve', 'IfcPump'],
            'Fire': ['IfcFireSuppressionTerminal', 'IfcAlarm', 'IfcSensor'],
        };
        const patterns = systemTypePatterns[newSystem] || [];
        console.info(`[BIM] Filtering by system: ${newSystem}`, patterns);

        // For now, toggle visibility state only (full type-based isolation requires IFC data parsing)
        // This provides visual feedback to the user
        for (const [, model] of fragments.list) {
            try { model.setVisibility(true); } catch { /* skip */ }
        }
    }, [activeSystem, componentsRef, worldRef]);

    return {
        heatmapActive,
        activeSystem,
        toggleHeatmap,
        toggleSystemMapping
    };
}

/**
 * useBimSelection — Element selection, property extraction, spatial tree, visibility management
 * Handles: Highlighter events (select + hover), web-ifc property parsing, relations, classifications
 */
import { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';
import type { SelectedElement, PropertySetGroup, PropertyItem, RelationItem, ClassificationItem } from './BimPropertiesPanel';
import type { SpatialNode, TypeGroup } from './BimModelTree';

export interface BimSelectionAPI {
    selectedElement: SelectedElement | null;
    spatialTree: SpatialNode[];
    typeGroups: TypeGroup[];
    // Actions
    setupHighlighterEvents: () => (() => void);
    handleSelectElementFromTree: (expressId: number) => void;
    handleIsolateSelected: () => void;
    handleHideSelected: () => void;
    handleShowAll: () => void;
    toggleTypeVisibility: (type: string) => void;
    buildSpatialTree: (ifcData: Uint8Array) => void;
    clearSelection: () => void;
}

// IFC type codes
const IFC_TYPES = {
    IFCPROJECT: 103090709,
    IFCSITE: 4097777520,
    IFCBUILDING: 4031249490,
    IFCBUILDINGSTOREY: 3124254112,
    IFCRELAGGREGATES: 160246688,
    IFCRELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
    IFCRELDEFINESBYPROPERTIES: 4186316022,
    IFCRELASSOCIATESMATERIAL: 2655215786,
    IFCRELCONNECTSELEMENTS: 1204542856,
    IFCRELVOIDSELEMENT: 1401173127,
    IFCRELFILLSELEMENT: 3940055652,
    IFCRELASSOCIATESCLASSIFICATION: 919958153,
};

const COMMON_IFC_TYPES = [
    { code: 3512223829, name: 'IfcWallStandardCase' },
    { code: 2391406531, name: 'IfcWall' },
    { code: 1529196076, name: 'IfcSlab' },
    { code: 843113511, name: 'IfcColumn' },
    { code: 753842376, name: 'IfcBeam' },
    { code: 395920057, name: 'IfcDoor' },
    { code: 3304561284, name: 'IfcWindow' },
    { code: 331165859, name: 'IfcStair' },
    { code: 2262370178, name: 'IfcRailing' },
    { code: 1281925730, name: 'IfcCovering' },
    { code: 2058353004, name: 'IfcRoof' },
    { code: 3856911033, name: 'IfcSpace' },
    { code: 979105199, name: 'IfcBuildingElementProxy' },
    { code: 1687234759, name: 'IfcPile' },
    { code: 1335981549, name: 'IfcDiscreteAccessory' },
    { code: 1051757585, name: 'IfcCurtainWall' },
    { code: 4105962743, name: 'IfcMember' },
    { code: 3758799889, name: 'IfcPlate' },
    { code: 900683007, name: 'IfcFooting' },
    { code: 3171933400, name: 'IfcPlate' },
    { code: 1973544240, name: 'IfcCovering' },
    { code: 3495092785, name: 'IfcFurniture' },
    { code: 1950629157, name: 'IfcBuildingElementProxy' },
];

export function useBimSelection(
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    worldRef: React.MutableRefObject<OBC.World | null>,
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>,
    ifcDataMapRef: React.MutableRefObject<Map<string, Uint8Array>>,
    onPanelOpen?: () => void,
): BimSelectionAPI {
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [spatialTree, setSpatialTree] = useState<SpatialNode[]>([]);
    const [typeGroups, setTypeGroups] = useState<TypeGroup[]>([]);
    const hiddenMeshesRef = useRef<Set<string>>(new Set());

    // ── Find IFC data — try direct key match, then iterate all entries ──
    const findIfcData = useCallback((modelId: string): Uint8Array | null => {
        // Direct match (UUID or filename)
        const direct = ifcDataMapRef.current.get(modelId);
        if (direct) return direct;

        // Try all entries (fallback for key format mismatches)
        for (const [, data] of ifcDataMapRef.current) {
            return data;
        }
        return null;
    }, [ifcDataMapRef]);

    // ── Extract properties from web-ifc ─────────────
    const extractProperties = useCallback(async (
        ifcApi: any, modelID: number, expressID: number
    ): Promise<SelectedElement> => {
        const line = ifcApi.GetLine(modelID, expressID, false, true);
        const name = line?.Name?.value || line?.LongName?.value || `Element #${expressID}`;
        const typeCode = line?.type;
        let type = 'Unknown';
        try { type = ifcApi.GetNameFromTypeCode(typeCode) || 'Unknown'; } catch { /* ignore */ }
        const globalId = line?.GlobalId?.value;

        const propertySets: PropertySetGroup[] = [];
        const materials: string[] = [];
        const relations: RelationItem[] = [];
        const classifications: ClassificationItem[] = [];

        // --- Basic identity info as a property set ---
        const identityProps: PropertyItem[] = [
            { name: 'Express ID', value: String(expressID) },
            { name: 'IFC Type', value: type },
        ];
        if (globalId) identityProps.push({ name: 'GlobalId', value: globalId });
        if (line?.Description?.value) identityProps.push({ name: 'Description', value: line.Description.value });
        if (line?.ObjectType?.value) identityProps.push({ name: 'Object Type', value: line.ObjectType.value });
        if (line?.Tag?.value) identityProps.push({ name: 'Tag', value: line.Tag.value });
        propertySets.push({ name: 'Identity', properties: identityProps });

        // --- PropertySets & QuantitySets ---
        try {
            const relIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELDEFINESBYPROPERTIES);
            for (let i = 0; i < relIds.size(); i++) {
                const relId = relIds.get(i);
                const rel = ifcApi.GetLine(modelID, relId, false);
                if (!rel?.RelatedObjects) continue;

                const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                const isRelated = related.some((r: any) => (r?.value ?? r) === expressID);
                if (!isRelated) continue;

                const psetId = rel.RelatingPropertyDefinition?.value;
                if (!psetId) continue;
                const pset = ifcApi.GetLine(modelID, psetId, false);
                if (!pset) continue;

                const psetName = pset.Name?.value || 'PropertySet';
                const items: PropertyItem[] = [];

                if (pset.HasProperties) {
                    const props = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
                    for (const propRef of props) {
                        const propId = propRef?.value ?? propRef;
                        if (!propId) continue;
                        try {
                            const prop = ifcApi.GetLine(modelID, propId, false);
                            if (!prop) continue;
                            const propName = prop.Name?.value || '';
                            let propValue = '';
                            if (prop.NominalValue !== undefined && prop.NominalValue !== null) {
                                propValue = String(prop.NominalValue?.value ?? prop.NominalValue ?? '');
                            }
                            if (propName) items.push({ name: propName, value: propValue });
                        } catch { /* skip */ }
                    }
                }

                if (pset.Quantities) {
                    const quantities = Array.isArray(pset.Quantities) ? pset.Quantities : [pset.Quantities];
                    for (const qRef of quantities) {
                        const qId = qRef?.value ?? qRef;
                        if (!qId) continue;
                        try {
                            const q = ifcApi.GetLine(modelID, qId, false);
                            if (!q) continue;
                            const qName = q.Name?.value || '';
                            const qVal = q.LengthValue?.value ?? q.AreaValue?.value ?? q.VolumeValue?.value ?? q.WeightValue?.value ?? q.CountValue?.value ?? '';
                            if (qName) items.push({ name: qName, value: String(qVal) });
                        } catch { /* skip */ }
                    }
                }

                if (items.length > 0) {
                    propertySets.push({ name: psetName, properties: items });
                }
            }
        } catch (err) {
            console.warn('PropertySet extraction error:', err);
        }

        // --- Materials ---
        try {
            const matRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESMATERIAL);
            for (let i = 0; i < matRelIds.size(); i++) {
                const relId = matRelIds.get(i);
                const rel = ifcApi.GetLine(modelID, relId, false);
                if (!rel?.RelatedObjects) continue;
                const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                const isRelated = related.some((r: any) => (r?.value ?? r) === expressID);
                if (!isRelated) continue;

                const matId = rel.RelatingMaterial?.value;
                if (!matId) continue;
                try {
                    const mat = ifcApi.GetLine(modelID, matId, false);
                    if (mat?.Name?.value) materials.push(mat.Name.value);
                    if (mat?.ForLayerSet?.value) {
                        const layerSet = ifcApi.GetLine(modelID, mat.ForLayerSet.value, false);
                        if (layerSet?.MaterialLayers) {
                            const layers = Array.isArray(layerSet.MaterialLayers) ? layerSet.MaterialLayers : [layerSet.MaterialLayers];
                            for (const layerRef of layers) {
                                const layer = ifcApi.GetLine(modelID, layerRef?.value ?? layerRef, false);
                                if (layer?.Material?.value) {
                                    const material = ifcApi.GetLine(modelID, layer.Material.value, false);
                                    if (material?.Name?.value) materials.push(material.Name.value);
                                }
                            }
                        }
                    }
                } catch { /* skip */ }
            }
        } catch { /* skip */ }

        // --- Relations ---
        try {
            const voidRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELVOIDSELEMENT);
            for (let i = 0; i < voidRelIds.size(); i++) {
                const relId = voidRelIds.get(i);
                try {
                    const rel = ifcApi.GetLine(modelID, relId, false);
                    const relBuildingElem = rel?.RelatingBuildingElement?.value;
                    const relOpeningElem = rel?.RelatedOpeningElement?.value;
                    if (relBuildingElem === expressID && relOpeningElem) {
                        const target = ifcApi.GetLine(modelID, relOpeningElem, false);
                        let targetType = 'Unknown';
                        try { targetType = ifcApi.GetNameFromTypeCode(target?.type) || 'Unknown'; } catch { }
                        relations.push({
                            type: 'VoidsElement',
                            targetName: target?.Name?.value || `#${relOpeningElem}`,
                            targetType,
                            targetId: String(relOpeningElem),
                        });
                    }
                    if (relOpeningElem === expressID && relBuildingElem) {
                        const target = ifcApi.GetLine(modelID, relBuildingElem, false);
                        let targetType = 'Unknown';
                        try { targetType = ifcApi.GetNameFromTypeCode(target?.type) || 'Unknown'; } catch { }
                        relations.push({
                            type: 'VoidedBy',
                            targetName: target?.Name?.value || `#${relBuildingElem}`,
                            targetType,
                            targetId: String(relBuildingElem),
                        });
                    }
                } catch { /* skip */ }
            }

            const fillRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELFILLSELEMENT);
            for (let i = 0; i < fillRelIds.size(); i++) {
                const relId = fillRelIds.get(i);
                try {
                    const rel = ifcApi.GetLine(modelID, relId, false);
                    const relOpening = rel?.RelatingOpeningElement?.value;
                    const relBuilding = rel?.RelatedBuildingElement?.value;
                    if (relOpening === expressID && relBuilding) {
                        const target = ifcApi.GetLine(modelID, relBuilding, false);
                        let targetType = 'Unknown';
                        try { targetType = ifcApi.GetNameFromTypeCode(target?.type) || 'Unknown'; } catch { }
                        relations.push({
                            type: 'FillsElement',
                            targetName: target?.Name?.value || `#${relBuilding}`,
                            targetType,
                            targetId: String(relBuilding),
                        });
                    }
                } catch { /* skip */ }
            }
        } catch (err) {
            console.warn('Relations extraction error:', err);
        }

        // --- Classifications ---
        try {
            const classRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESCLASSIFICATION);
            for (let i = 0; i < classRelIds.size(); i++) {
                const relId = classRelIds.get(i);
                try {
                    const rel = ifcApi.GetLine(modelID, relId, false);
                    if (!rel?.RelatedObjects) continue;
                    const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                    const isRelated = related.some((r: any) => (r?.value ?? r) === expressID);
                    if (!isRelated) continue;

                    const classRefId = rel.RelatingClassification?.value;
                    if (!classRefId) continue;
                    const classRef = ifcApi.GetLine(modelID, classRefId, false);
                    if (!classRef) continue;

                    let systemName = '';
                    if (classRef.ReferencedSource?.value) {
                        try {
                            const source = ifcApi.GetLine(modelID, classRef.ReferencedSource.value, false);
                            systemName = source?.Name?.value || '';
                        } catch { /* skip */ }
                    }

                    classifications.push({
                        system: systemName || 'Classification',
                        code: classRef.Identification?.value || classRef.ItemReference?.value || '',
                        name: classRef.Name?.value || '',
                    });
                } catch { /* skip */ }
            }
        } catch (err) {
            console.warn('Classification extraction error:', err);
        }

        return {
            id: String(expressID),
            name,
            type,
            globalId,
            propertySets,
            materials: [...new Set(materials)],
            relations: relations.length > 0 ? relations : undefined,
            classifications: classifications.length > 0 ? classifications : undefined,
        };
    }, []);

    // ── Handle Highlighter selection ────────────────
    const setupHighlighterEvents = useCallback(() => {
        const components = componentsRef.current;
        if (!components) return () => { };

        const highlighter = components.get(OBCF.Highlighter);
        let disposed = false;

        const onHighlight = async (modelIdMap: any) => {
            if (disposed) return;
            try {
                const ifcLoader = ifcLoaderRef.current;
                if (!ifcLoader) return;

                // The modelIdMap from Highlighter: keys are FragmentsGroup UUIDs
                // values are Set<number> of expressIDs
                const entries = modelIdMap instanceof Map
                    ? Array.from(modelIdMap.entries())
                    : Object.entries(modelIdMap);

                for (const [modelId, expressIDs] of entries) {
                    const idSet = expressIDs as Set<number>;
                    if (!idSet || idSet.size === 0) continue;
                    const expressID = Array.from(idSet)[0];

                    // Find IFC data using flexible key lookup
                    const ifcData = findIfcData(String(modelId));
                    if (!ifcData) {
                        // Fallback: show basic info
                        setSelectedElement({
                            id: String(expressID),
                            name: `Element #${expressID}`,
                            type: 'Unknown',
                            propertySets: [{ name: 'Identity', properties: [{ name: 'Express ID', value: String(expressID) }] }],
                            materials: [],
                        });
                        onPanelOpen?.();
                        return;
                    }

                    const mID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                    try {
                        const element = await extractProperties(ifcLoader.webIfc, mID, expressID);
                        if (!disposed) {
                            setSelectedElement(element);
                            onPanelOpen?.();
                        }
                    } finally {
                        ifcLoader.webIfc.CloseModel(mID);
                    }
                    break;
                }
            } catch (err) {
                console.warn('Selection error:', err);
            }
        };

        const onClear = () => {
            if (!disposed) setSelectedElement(null);
        };

        highlighter.events.select.onHighlight.add(onHighlight);
        highlighter.events.select.onClear.add(onClear);

        return () => {
            disposed = true;
            try {
                (highlighter.events.select.onHighlight as any).remove?.(onHighlight);
                (highlighter.events.select.onClear as any).remove?.(onClear);
            } catch { /* cleanup silently */ }
        };
    }, [componentsRef, ifcLoaderRef, ifcDataMapRef, extractProperties, onPanelOpen, findIfcData]);

    // ── Select from tree → set info + lookup properties ──
    const handleSelectElementFromTree = useCallback(async (expressId: number) => {
        const ifcLoader = ifcLoaderRef.current;
        if (!ifcLoader) {
            setSelectedElement({
                id: String(expressId),
                name: `Element #${expressId}`,
                type: 'Unknown',
                propertySets: [],
                materials: [],
            });
            onPanelOpen?.();
            return;
        }

        // Try to find IFC data and extract properties
        for (const [, ifcData] of ifcDataMapRef.current) {
            try {
                const mID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                try {
                    const element = await extractProperties(ifcLoader.webIfc, mID, expressId);
                    setSelectedElement(element);
                    onPanelOpen?.();

                    // Try to highlight in 3D scene
                    try {
                        const components = componentsRef.current;
                        if (components) {
                            const highlighter = components.get(OBCF.Highlighter);
                            highlighter.clear('select');
                        }
                    } catch { /* ignore highlight errors */ }

                    return;
                } finally {
                    ifcLoader.webIfc.CloseModel(mID);
                }
            } catch {
                // Element not in this model, try next
            }
        }

        // Fallback
        setSelectedElement({
            id: String(expressId),
            name: `Element #${expressId}`,
            type: 'Unknown',
            propertySets: [],
            materials: [],
        });
        onPanelOpen?.();
    }, [ifcLoaderRef, ifcDataMapRef, extractProperties, onPanelOpen, componentsRef]);

    // ── Visibility: Isolate, Hide, Show All ─────────
    const handleIsolateSelected = useCallback(() => {
        if (!selectedElement || !worldRef.current) return;
        const selectedId = selectedElement.id;
        worldRef.current.scene.three.traverse((obj: any) => {
            if (obj.isMesh) {
                const meshId = obj.uuid;
                const isSelected = obj.userData?.expressID === Number(selectedId);
                obj.visible = isSelected;
                if (!isSelected) hiddenMeshesRef.current.add(meshId);
            }
        });
    }, [selectedElement, worldRef]);

    const handleHideSelected = useCallback(() => {
        if (!selectedElement || !worldRef.current) return;
        const selectedId = Number(selectedElement.id);
        worldRef.current.scene.three.traverse((obj: any) => {
            if (obj.isMesh && obj.userData?.expressID === selectedId) {
                obj.visible = false;
                hiddenMeshesRef.current.add(obj.uuid);
            }
        });
    }, [selectedElement, worldRef]);

    const handleShowAll = useCallback(() => {
        if (!worldRef.current) return;
        worldRef.current.scene.three.traverse((obj: any) => {
            if (obj.isMesh) obj.visible = true;
        });
        hiddenMeshesRef.current.clear();
    }, [worldRef]);

    // ── Toggle type visibility ──────────────────────
    const toggleTypeVisibility = useCallback((type: string) => {
        setTypeGroups(prev => prev.map(g => {
            if (g.type === type) {
                const newVisible = !g.visible;
                if (worldRef.current) {
                    worldRef.current.scene.three.traverse((obj: any) => {
                        if (obj.isMesh) {
                            const ifcType = obj.userData?.ifcType;
                            if (ifcType === type) {
                                obj.visible = newVisible;
                            }
                        }
                    });
                }
                return { ...g, visible: newVisible };
            }
            return g;
        }));
    }, [worldRef]);

    // ── Build spatial tree ──────────────────────────
    const buildSpatialTree = useCallback((ifcData: Uint8Array) => {
        try {
            const ifcLoader = ifcLoaderRef.current;
            if (!ifcLoader) return;

            const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
            try {
                const buildNode = (expressID: number, ifcApi: any): SpatialNode => {
                    const line = ifcApi.GetLine(modelID, expressID, false);
                    const name = line?.Name?.value || line?.LongName?.value || `#${expressID}`;
                    let type = 'Unknown';
                    try { type = ifcApi.GetNameFromTypeCode(line?.type) || 'Unknown'; } catch { }

                    const children: SpatialNode[] = [];
                    const aggRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELAGGREGATES);
                    for (let i = 0; i < aggRelIds.size(); i++) {
                        const relId = aggRelIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingObject) continue;
                        const relObjId = rel.RelatingObject?.value ?? rel.RelatingObject;
                        if (relObjId !== expressID) continue;

                        const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        for (const obj of relatedObjects) {
                            const childId = obj?.value ?? obj;
                            if (childId) children.push(buildNode(childId, ifcApi));
                        }
                    }

                    let elementCount = 0;
                    const containRelIds = ifcApi.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELCONTAINEDINSPATIALSTRUCTURE);
                    for (let i = 0; i < containRelIds.size(); i++) {
                        const relId = containRelIds.get(i);
                        const rel = ifcApi.GetLine(modelID, relId, false);
                        if (!rel?.RelatingStructure) continue;
                        const structId = rel.RelatingStructure?.value ?? rel.RelatingStructure;
                        if (structId !== expressID) continue;
                        const contained = Array.isArray(rel.RelatedElements) ? rel.RelatedElements : [rel.RelatedElements];
                        elementCount += contained.length;
                    }

                    return { id: expressID, name, type, children, elementCount };
                };

                const projectIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCPROJECT);
                const tree: SpatialNode[] = [];
                for (let i = 0; i < projectIds.size(); i++) {
                    tree.push(buildNode(projectIds.get(i), ifcLoader.webIfc));
                }
                setSpatialTree(tree);

                // Build type groups
                const typeMap = new Map<string, { id: number; name: string }[]>();
                for (const ct of COMMON_IFC_TYPES) {
                    try {
                        const ids = ifcLoader.webIfc.GetLineIDsWithType(modelID, ct.code);
                        if (ids.size() === 0) continue;
                        const elements: { id: number; name: string }[] = [];
                        for (let j = 0; j < ids.size(); j++) {
                            const id = ids.get(j);
                            try {
                                const el = ifcLoader.webIfc.GetLine(modelID, id, false);
                                elements.push({ id, name: el?.Name?.value || `#${id}` });
                            } catch { elements.push({ id, name: `#${id}` }); }
                        }
                        const existing = typeMap.get(ct.name);
                        if (existing) {
                            existing.push(...elements);
                        } else {
                            typeMap.set(ct.name, elements);
                        }
                    } catch { /* type not found */ }
                }

                const groups: TypeGroup[] = [];
                typeMap.forEach((elements, type) => {
                    groups.push({ type, count: elements.length, elements, visible: true });
                });
                groups.sort((a, b) => b.count - a.count);
                setTypeGroups(groups);
            } finally {
                ifcLoader.webIfc.CloseModel(modelID);
            }
        } catch (err) {
            console.warn('Spatial tree build error:', err);
        }
    }, [ifcLoaderRef]);

    const clearSelection = useCallback(() => {
        setSelectedElement(null);
        // Also clear highlighter
        try {
            const components = componentsRef.current;
            if (components) {
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.clear('select');
            }
        } catch { /* ignore */ }
    }, [componentsRef]);

    return {
        selectedElement,
        spatialTree,
        typeGroups,
        setupHighlighterEvents,
        handleSelectElementFromTree,
        handleIsolateSelected,
        handleHideSelected,
        handleShowAll,
        toggleTypeVisibility,
        buildSpatialTree,
        clearSelection,
    };
}

/**
 * useBimSelection — Element selection, property extraction, spatial tree, visibility
 * 
 * KEY CHANGE: Uses official That Open API (model.getItemsData) instead of manual web-ifc.
 * The Highlighter emits modelIdMap where keys are FragmentsGroup UUIDs.
 * We use FragmentsManager.list.get(uuid) to get the model, then model.getItemsData([...ids])
 * to extract properties — this is the correct, documented approach.
 */
import { useRef, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import type { SelectedElement, PropertySetGroup, PropertyItem, RelationItem, ClassificationItem } from './BimPropertiesPanel';
import type { SpatialNode, TypeGroup } from './BimModelTree';

export interface BimSelectionAPI {
    selectedElement: SelectedElement | null;
    spatialTree: SpatialNode[];
    typeGroups: TypeGroup[];
    setupHighlighterEvents: () => (() => void);
    handleSelectElementFromTree: (expressId: number) => void;
    handleIsolateSelected: () => void;
    handleHideSelected: () => void;
    handleShowAll: () => void;
    toggleTypeVisibility: (type: string) => void;
    buildSpatialTree: (ifcData: Uint8Array) => void;
    clearSelection: () => void;
}

// IFC type codes for spatial tree building
const IFC_TYPES = {
    IFCPROJECT: 103090709,
    IFCSITE: 4097777520,
    IFCBUILDING: 4031249490,
    IFCBUILDINGSTOREY: 3124254112,
    IFCRELAGGREGATES: 160246688,
    IFCRELCONTAINEDINSPATIALSTRUCTURE: 3242617779,
    IFCRELDEFINESBYPROPERTIES: 4186316022,
    IFCRELASSOCIATESMATERIAL: 2655215786,
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
    { code: 3495092785, name: 'IfcFurniture' },
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
    const hiddenFragmentsRef = useRef<Map<string, Set<number>>>(new Map());
    const selectedFragmentRef = useRef<{ modelId: string; expressIds: number[] } | null>(null);

    // ── Convert getItemsData result → SelectedElement ──
    const convertToSelectedElement = useCallback((
        expressId: number, itemData: any, modelId: string
    ): SelectedElement => {
        // itemData from getItemsData() returns an array of attribute objects
        // Each item has: { Name, type, GlobalId, Description, ObjectType, Tag, ... }
        const name = itemData?.Name?.value || itemData?.LongName?.value || `Element #${expressId}`;
        const type = itemData?.type ? getIfcTypeName(itemData.type) : 'Unknown';
        const globalId = itemData?.GlobalId?.value;

        const propertySets: PropertySetGroup[] = [];

        // Build Identity property set
        const identityProps: PropertyItem[] = [
            { name: 'Express ID', value: String(expressId) },
            { name: 'IFC Type', value: type },
        ];
        if (globalId) identityProps.push({ name: 'GlobalId', value: globalId });
        if (itemData?.Description?.value) identityProps.push({ name: 'Description', value: itemData.Description.value });
        if (itemData?.ObjectType?.value) identityProps.push({ name: 'Object Type', value: itemData.ObjectType.value });
        if (itemData?.Tag?.value) identityProps.push({ name: 'Tag', value: itemData.Tag.value });
        if (itemData?.PredefinedType?.value) identityProps.push({ name: 'Predefined Type', value: String(itemData.PredefinedType.value) });
        propertySets.push({ name: 'Identity', properties: identityProps });

        return {
            id: String(expressId),
            name,
            type,
            globalId,
            propertySets,
            materials: [],
        };
    }, []);

    // ── Get IFC type name from type code ──
    function getIfcTypeName(typeCode: number): string {
        const found = COMMON_IFC_TYPES.find(t => t.code === typeCode);
        if (found) return found.name;
        // Fallback: try from ifcLoader
        try {
            const ifcLoader = ifcLoaderRef.current;
            if (ifcLoader?.webIfc) {
                return ifcLoader.webIfc.GetNameFromTypeCode(typeCode) || 'Unknown';
            }
        } catch { /* ignore */ }
        return 'Unknown';
    }

    // ── Extract full properties using web-ifc (richer than getItemsData) ──
    const extractFullProperties = useCallback(async (
        expressID: number
    ): Promise<Partial<SelectedElement>> => {
        const ifcLoader = ifcLoaderRef.current;
        console.log('[Selection] extractFullProperties for expressID:', expressID);
        console.log('[Selection] ifcLoader:', !!ifcLoader, 'webIfc:', !!ifcLoader?.webIfc);
        console.log('[Selection] ifcDataMap size:', ifcDataMapRef.current.size);
        if (!ifcLoader?.webIfc) {
            console.warn('[Selection] ❌ No webIfc available for property extraction');
            return {};
        }

        // Try all available IFC data
        for (const [, ifcData] of ifcDataMapRef.current) {
            try {
                const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                try {
                    const line = ifcLoader.webIfc.GetLine(modelID, expressID, false, true);
                    if (!line) continue;

                    const propertySets: PropertySetGroup[] = [];
                    const materials: string[] = [];
                    const relations: RelationItem[] = [];
                    const classifications: ClassificationItem[] = [];

                    // --- PropertySets & QuantitySets ---
                    try {
                        const relIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELDEFINESBYPROPERTIES);
                        for (let i = 0; i < relIds.size(); i++) {
                            const relId = relIds.get(i);
                            const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                            if (!rel?.RelatedObjects) continue;
                            const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                            if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;

                            const psetId = rel.RelatingPropertyDefinition?.value;
                            if (!psetId) continue;
                            const pset = ifcLoader.webIfc.GetLine(modelID, psetId, false);
                            if (!pset) continue;

                            const psetName = pset.Name?.value || 'PropertySet';
                            const items: PropertyItem[] = [];

                            if (pset.HasProperties) {
                                const props = Array.isArray(pset.HasProperties) ? pset.HasProperties : [pset.HasProperties];
                                for (const propRef of props) {
                                    const propId = propRef?.value ?? propRef;
                                    if (!propId) continue;
                                    try {
                                        const prop = ifcLoader.webIfc.GetLine(modelID, propId, false);
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
                                        const q = ifcLoader.webIfc.GetLine(modelID, qId, false);
                                        if (!q) continue;
                                        const qName = q.Name?.value || '';
                                        const qVal = q.LengthValue?.value ?? q.AreaValue?.value ?? q.VolumeValue?.value ?? q.WeightValue?.value ?? q.CountValue?.value ?? '';
                                        if (qName) items.push({ name: qName, value: String(qVal) });
                                    } catch { /* skip */ }
                                }
                            }

                            if (items.length > 0) propertySets.push({ name: psetName, properties: items });
                        }
                    } catch { /* skip psets */ }

                    // --- Materials ---
                    try {
                        const matRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESMATERIAL);
                        for (let i = 0; i < matRelIds.size(); i++) {
                            const relId = matRelIds.get(i);
                            const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                            if (!rel?.RelatedObjects) continue;
                            const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                            if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;
                            const matId = rel.RelatingMaterial?.value;
                            if (!matId) continue;
                            try {
                                const mat = ifcLoader.webIfc.GetLine(modelID, matId, false);
                                if (mat?.Name?.value) materials.push(mat.Name.value);
                                if (mat?.ForLayerSet?.value) {
                                    const layerSet = ifcLoader.webIfc.GetLine(modelID, mat.ForLayerSet.value, false);
                                    if (layerSet?.MaterialLayers) {
                                        const layers = Array.isArray(layerSet.MaterialLayers) ? layerSet.MaterialLayers : [layerSet.MaterialLayers];
                                        for (const layerRef of layers) {
                                            const layer = ifcLoader.webIfc.GetLine(modelID, layerRef?.value ?? layerRef, false);
                                            if (layer?.Material?.value) {
                                                const material = ifcLoader.webIfc.GetLine(modelID, layer.Material.value, false);
                                                if (material?.Name?.value) materials.push(material.Name.value);
                                            }
                                        }
                                    }
                                }
                            } catch { /* skip */ }
                        }
                    } catch { /* skip */ }

                    // --- Relations (voids, fills) ---
                    try {
                        const voidRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELVOIDSELEMENT);
                        for (let i = 0; i < voidRelIds.size(); i++) {
                            const relId = voidRelIds.get(i);
                            try {
                                const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                                if (rel?.RelatingBuildingElement?.value === expressID && rel?.RelatedOpeningElement?.value) {
                                    const target = ifcLoader.webIfc.GetLine(modelID, rel.RelatedOpeningElement.value, false);
                                    relations.push({
                                        type: 'VoidsElement',
                                        targetName: target?.Name?.value || `#${rel.RelatedOpeningElement.value}`,
                                        targetType: getIfcTypeName(target?.type),
                                        targetId: String(rel.RelatedOpeningElement.value),
                                    });
                                }
                            } catch { /* skip */ }
                        }
                        const fillRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELFILLSELEMENT);
                        for (let i = 0; i < fillRelIds.size(); i++) {
                            const relId = fillRelIds.get(i);
                            try {
                                const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                                if (rel?.RelatingOpeningElement?.value === expressID && rel?.RelatedBuildingElement?.value) {
                                    const target = ifcLoader.webIfc.GetLine(modelID, rel.RelatedBuildingElement.value, false);
                                    relations.push({
                                        type: 'FillsElement',
                                        targetName: target?.Name?.value || `#${rel.RelatedBuildingElement.value}`,
                                        targetType: getIfcTypeName(target?.type),
                                        targetId: String(rel.RelatedBuildingElement.value),
                                    });
                                }
                            } catch { /* skip */ }
                        }
                    } catch { /* skip */ }

                    // --- Classifications ---
                    try {
                        const classRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELASSOCIATESCLASSIFICATION);
                        for (let i = 0; i < classRelIds.size(); i++) {
                            const relId = classRelIds.get(i);
                            try {
                                const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                                if (!rel?.RelatedObjects) continue;
                                const related = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                                if (!related.some((r: any) => (r?.value ?? r) === expressID)) continue;
                                const classRefId = rel.RelatingClassification?.value;
                                if (!classRefId) continue;
                                const classRef = ifcLoader.webIfc.GetLine(modelID, classRefId, false);
                                if (!classRef) continue;
                                let systemName = '';
                                if (classRef.ReferencedSource?.value) {
                                    try {
                                        const source = ifcLoader.webIfc.GetLine(modelID, classRef.ReferencedSource.value, false);
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
                    } catch { /* skip */ }

                    return {
                        propertySets: propertySets.length > 0 ? propertySets : undefined,
                        materials: [...new Set(materials)],
                        relations: relations.length > 0 ? relations : undefined,
                        classifications: classifications.length > 0 ? classifications : undefined,
                    };
                } finally {
                    ifcLoader.webIfc.CloseModel(modelID);
                }
            } catch {
                // Element not in this model, try next
            }
        }
        return {};
    }, [ifcLoaderRef, ifcDataMapRef]);

    // ═══════════════════════════════════════════════════
    // HIGHLIGHTER EVENTS — using official API
    // ═══════════════════════════════════════════════════
    const setupHighlighterEvents = useCallback(() => {
        const components = componentsRef.current;
        if (!components) return () => { };

        const highlighter = components.get(OBCF.Highlighter);
        const fragments = components.get(OBC.FragmentsManager);
        let disposed = false;

        const onHighlight = async (modelIdMap: any) => {
            if (disposed) return;
            try {
                // Official API: iterate Object.entries(modelIdMap)
                const entries = modelIdMap instanceof Map
                    ? Array.from(modelIdMap.entries())
                    : Object.entries(modelIdMap);

                for (const [modelId, localIds] of entries) {
                    const idArray = localIds instanceof Set
                        ? Array.from(localIds)
                        : Array.isArray(localIds) ? localIds : [localIds];
                    if (!idArray || idArray.length === 0) continue;
                    const expressID = idArray[0] as number;

                    // Store for visibility operations
                    selectedFragmentRef.current = { modelId: String(modelId), expressIds: idArray.map(Number) };

                    // Step 1: Try official API — model.getItemsData()
                    const model = fragments.list.get(String(modelId));
                    let element: SelectedElement | null = null;

                    if (model && typeof (model as any).getItemsData === 'function') {
                        try {
                            const data = await (model as any).getItemsData(idArray);
                            if (data && data.length > 0) {
                                element = convertToSelectedElement(expressID, data[0], String(modelId));
                            }
                        } catch (e) {
                            console.warn('getItemsData failed, falling back to web-ifc:', e);
                        }
                    }

                    // Step 2: Fallback — basic element info
                    if (!element) {
                        const typeName = getIfcTypeName(0);
                        element = {
                            id: String(expressID),
                            name: `Element #${expressID}`,
                            type: typeName,
                            propertySets: [{
                                name: 'Identity',
                                properties: [{ name: 'Express ID', value: String(expressID) }]
                            }],
                            materials: [],
                        };
                    }

                    // Step 3: Enrich with full properties from web-ifc (async, non-blocking)
                    if (!disposed) {
                        setSelectedElement(element);
                        onPanelOpen?.();

                        // Async enrichment
                        extractFullProperties(expressID).then(extra => {
                            if (disposed) return;
                            setSelectedElement(prev => {
                                if (!prev || prev.id !== String(expressID)) return prev;
                                return {
                                    ...prev,
                                    propertySets: [
                                        ...prev.propertySets,
                                        ...(extra.propertySets || []),
                                    ],
                                    materials: [...new Set([...prev.materials, ...(extra.materials || [])])],
                                    relations: extra.relations || prev.relations,
                                    classifications: extra.classifications || prev.classifications,
                                };
                            });
                        }).catch((err) => { console.warn('[Selection] ❌ Enrichment failed:', err); });
                    }
                    break; // Process first selected element only
                }
            } catch (err) {
                console.warn('Selection error:', err);
            }
        };

        const onClear = () => {
            if (!disposed) {
                setSelectedElement(null);
                selectedFragmentRef.current = null;
            }
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
    }, [componentsRef, convertToSelectedElement, extractFullProperties, onPanelOpen]);

    // ── Select from tree → highlight + get info ──
    const handleSelectElementFromTree = useCallback(async (expressId: number) => {
        // Step 1: Show basic info immediately
        const basicElement: SelectedElement = {
            id: String(expressId),
            name: `Element #${expressId}`,
            type: 'Unknown',
            propertySets: [{
                name: 'Identity',
                properties: [{ name: 'Express ID', value: String(expressId) }]
            }],
            materials: [],
        };
        setSelectedElement(basicElement);
        onPanelOpen?.();

        // Step 2: Try to highlight in 3D
        try {
            const components = componentsRef.current;
            if (components) {
                const highlighter = components.get(OBCF.Highlighter);
                await highlighter.clear('select');
            }
        } catch { /* ignore */ }

        // Step 3: Enrich with full properties
        const extra = await extractFullProperties(expressId);
        setSelectedElement(prev => {
            if (!prev || prev.id !== String(expressId)) return prev;
            // Also try to get name/type from web-ifc
            const ifcLoader = ifcLoaderRef.current;
            let enrichedName = prev.name;
            let enrichedType = prev.type;
            if (ifcLoader?.webIfc) {
                for (const [, ifcData] of ifcDataMapRef.current) {
                    try {
                        const mID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
                        try {
                            const line = ifcLoader.webIfc.GetLine(mID, expressId, false);
                            if (line) {
                                enrichedName = line.Name?.value || line.LongName?.value || prev.name;
                                enrichedType = getIfcTypeName(line.type) || prev.type;
                            }
                        } finally { ifcLoader.webIfc.CloseModel(mID); }
                        break;
                    } catch { /* try next */ }
                }
            }
            return {
                ...prev,
                name: enrichedName,
                type: enrichedType,
                propertySets: [
                    ...prev.propertySets,
                    ...(extra.propertySets || []),
                ],
                materials: [...new Set([...prev.materials, ...(extra.materials || [])])],
                relations: extra.relations || prev.relations,
                classifications: extra.classifications || prev.classifications,
            };
        });
    }, [ifcLoaderRef, ifcDataMapRef, extractFullProperties, onPanelOpen, componentsRef]);

    // ═══════════════════════════════════════════════════
    // VISIBILITY — using FragmentsManager for reliability
    // ═══════════════════════════════════════════════════
    const handleIsolateSelected = useCallback(() => {
        const components = componentsRef.current;
        if (!selectedElement || !components) return;

        try {
            const fragments = components.get(OBC.FragmentsManager);
            const hider = (components as any).get?.((OBC as any).Hider);

            if (hider && typeof hider.isolate === 'function' && selectedFragmentRef.current) {
                // Use Hider component if available
                const { modelId, expressIds } = selectedFragmentRef.current;
                const idMap: Record<string, Set<number>> = {};
                idMap[modelId] = new Set(expressIds);
                hider.isolate(idMap);
            } else {
                // Fallback: traverse scene
                const world = worldRef.current;
                if (!world) return;
                const selectedId = Number(selectedElement.id);
                world.scene.three.traverse((obj: any) => {
                    if (obj.isMesh) {
                        const isSelected = obj.userData?.expressID === selectedId;
                        obj.visible = isSelected;
                        if (!isSelected) {
                            hiddenFragmentsRef.current.set(obj.uuid, new Set());
                        }
                    }
                });
            }
        } catch {
            // Final fallback
            const world = worldRef.current;
            if (!world) return;
            const selectedId = Number(selectedElement.id);
            world.scene.three.traverse((obj: any) => {
                if (obj.isMesh) {
                    obj.visible = obj.userData?.expressID === selectedId;
                }
            });
        }
    }, [selectedElement, componentsRef, worldRef]);

    const handleHideSelected = useCallback(() => {
        const components = componentsRef.current;
        if (!selectedElement || !components) return;

        try {
            const world = worldRef.current;
            if (!world) return;
            const selectedId = Number(selectedElement.id);
            world.scene.three.traverse((obj: any) => {
                if (obj.isMesh && obj.userData?.expressID === selectedId) {
                    obj.visible = false;
                    hiddenFragmentsRef.current.set(obj.uuid, new Set());
                }
            });
        } catch { /* ignore */ }
    }, [selectedElement, componentsRef, worldRef]);

    const handleShowAll = useCallback(() => {
        const world = worldRef.current;
        if (!world) return;
        world.scene.three.traverse((obj: any) => {
            if (obj.isMesh) obj.visible = true;
        });
        hiddenFragmentsRef.current.clear();
    }, [worldRef]);

    // ── Toggle type visibility ──
    const toggleTypeVisibility = useCallback((type: string) => {
        setTypeGroups(prev => prev.map(g => {
            if (g.type === type) {
                const newVisible = !g.visible;
                const world = worldRef.current;
                if (world) {
                    world.scene.three.traverse((obj: any) => {
                        if (obj.isMesh && obj.userData?.ifcType === type) {
                            obj.visible = newVisible;
                        }
                    });
                }
                return { ...g, visible: newVisible };
            }
            return g;
        }));
    }, [worldRef]);

    // ═══════════════════════════════════════════════════
    // SPATIAL TREE — using web-ifc (still needed for tree structure)
    // ═══════════════════════════════════════════════════
    const buildSpatialTree = useCallback((ifcData: Uint8Array) => {
        try {
            const ifcLoader = ifcLoaderRef.current;
            if (!ifcLoader?.webIfc) return;

            const modelID = ifcLoader.webIfc.OpenModel(ifcData, { COORDINATE_TO_ORIGIN: false });
            try {
                const buildNode = (expressID: number): SpatialNode => {
                    const line = ifcLoader.webIfc.GetLine(modelID, expressID, false);
                    const name = line?.Name?.value || line?.LongName?.value || `#${expressID}`;
                    let type = 'Unknown';
                    try { type = ifcLoader.webIfc.GetNameFromTypeCode(line?.type) || 'Unknown'; } catch { }

                    const children: SpatialNode[] = [];

                    // Aggregated children (Site→Building→Storey)
                    const aggRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELAGGREGATES);
                    for (let i = 0; i < aggRelIds.size(); i++) {
                        const relId = aggRelIds.get(i);
                        const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
                        if (!rel?.RelatingObject) continue;
                        const relObjId = rel.RelatingObject?.value ?? rel.RelatingObject;
                        if (relObjId !== expressID) continue;
                        const relatedObjects = Array.isArray(rel.RelatedObjects) ? rel.RelatedObjects : [rel.RelatedObjects];
                        for (const obj of relatedObjects) {
                            const childId = obj?.value ?? obj;
                            if (childId) children.push(buildNode(childId));
                        }
                    }

                    // Contained elements count
                    let elementCount = 0;
                    const containRelIds = ifcLoader.webIfc.GetLineIDsWithType(modelID, IFC_TYPES.IFCRELCONTAINEDINSPATIALSTRUCTURE);
                    for (let i = 0; i < containRelIds.size(); i++) {
                        const relId = containRelIds.get(i);
                        const rel = ifcLoader.webIfc.GetLine(modelID, relId, false);
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
                    tree.push(buildNode(projectIds.get(i)));
                }
                setSpatialTree(prev => [...prev, ...tree]);

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
                        if (existing) existing.push(...elements);
                        else typeMap.set(ct.name, elements);
                    } catch { /* type not found */ }
                }

                const groups: TypeGroup[] = [];
                typeMap.forEach((elements, type) => {
                    groups.push({ type, count: elements.length, elements, visible: true });
                });
                groups.sort((a, b) => b.count - a.count);
                setTypeGroups(prev => {
                    // Merge with existing
                    const merged = new Map<string, TypeGroup>();
                    prev.forEach(g => merged.set(g.type, g));
                    groups.forEach(g => {
                        const existing = merged.get(g.type);
                        if (existing) {
                            merged.set(g.type, {
                                ...existing,
                                count: existing.count + g.count,
                                elements: [...existing.elements, ...g.elements],
                            });
                        } else {
                            merged.set(g.type, g);
                        }
                    });
                    return Array.from(merged.values()).sort((a, b) => b.count - a.count);
                });
            } finally {
                ifcLoader.webIfc.CloseModel(modelID);
            }
        } catch (err) {
            console.warn('Spatial tree build error:', err);
        }
    }, [ifcLoaderRef]);

    // ── Clear selection ──
    const clearSelection = useCallback(() => {
        setSelectedElement(null);
        selectedFragmentRef.current = null;
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

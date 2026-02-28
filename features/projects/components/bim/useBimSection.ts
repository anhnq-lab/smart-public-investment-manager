/**
 * useBimSection — Section planes & box using OBC Clipper
 * 
 * Uses the built-in OBC.Clipper component which provides:
 * - Professional clipping plane visualization
 * - Built-in TransformControls for drag-to-move
 * - Fragment-aware raycasting
 * - Proper renderer clipping plane management
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import type { ActiveTool } from './useBimTools';

// ── Types ─────────────────────────────────────────────
interface SectionBoxState {
    planeIds: string[];     // IDs of the 6 clipper planes
    min: THREE.Vector3;
    max: THREE.Vector3;
    originalMin: THREE.Vector3;
    originalMax: THREE.Vector3;
}

export interface BimSectionAPI {
    clipPlaneCount: number;
    sectionBoxActive: boolean;
    sectionBoxBounds: { min: THREE.Vector3; max: THREE.Vector3 } | null;
    isDragging: boolean;
    createClipPlane: (axis: 'x' | 'y' | 'z') => void;
    createFreeClipPlane: (point: THREE.Vector3, normal: THREE.Vector3) => void;
    clearAllClipPlanes: () => void;
    createSectionBox: () => void;
    removeSectionBox: () => void;
    updateSectionPlane: (id: string, position: number) => void;
    resetSectionBox: () => void;
    flipClipPlane: (id: string) => void;
}

// ── Helpers ──────────────────────────────────────────
function getModelBounds(scene: THREE.Scene): THREE.Box3 {
    const box = new THREE.Box3();
    scene.traverse((obj: THREE.Object3D) => {
        if (obj.userData?.isSectionBox || obj.userData?.isSectionHandle || obj.userData?.isClipHelper) return;
        if (obj.userData?.isMeasurement || obj.userData?.isGrid || obj.userData?.isViewCube) return;
        if ((obj as any).isMesh && obj.visible) {
            const mesh = obj as THREE.Mesh;
            if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
            if (mesh.geometry.boundingBox) {
                const worldBox = mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
                box.union(worldBox);
            }
        }
    });
    return box;
}

// ── Hook ──────────────────────────────────────────────
export function useBimSection(
    worldRef: React.MutableRefObject<any | null>,
    componentsRef: React.MutableRefObject<OBC.Components | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    activeTool: ActiveTool,
): BimSectionAPI {
    const [clipPlaneCount, setClipPlaneCount] = useState(0);
    const [sectionBoxActive, setSectionBoxActive] = useState(false);
    const [sectionBoxBounds, setSectionBoxBounds] = useState<{ min: THREE.Vector3; max: THREE.Vector3 } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const sectionBoxRef = useRef<SectionBoxState | null>(null);
    const freePlaneIdsRef = useRef<string[]>([]);
    const axisPlaneIdsRef = useRef<string[]>([]);

    // ── Get the OBC Clipper instance ──
    const getClipper = useCallback((): OBC.Clipper | null => {
        const components = componentsRef.current;
        if (!components) return null;
        try {
            return components.get(OBC.Clipper);
        } catch {
            return null;
        }
    }, [componentsRef]);

    // ── Sync plane count ──
    const syncPlaneCount = useCallback(() => {
        const clipper = getClipper();
        if (clipper) {
            setClipPlaneCount(clipper.list.size);
        }
    }, [getClipper]);

    // ── Initialize Clipper on first mount ──
    useEffect(() => {
        const clipper = getClipper();
        const world = worldRef.current;
        if (!clipper || !world) return;

        // Configure the clipper visual style
        clipper.enabled = true;
        clipper.config.color = new THREE.Color(0x00bcd4); // cyan
        clipper.config.opacity = 0.3;
        clipper.config.size = 5;

        // Listen for drag events
        const onDragStart = () => setIsDragging(true);
        const onDragEnd = () => setIsDragging(false);
        const onPlaneCreated = () => syncPlaneCount();
        const onPlaneDeleted = () => syncPlaneCount();

        clipper.onBeforeDrag.add(onDragStart);
        clipper.onAfterDrag.add(onDragEnd);
        clipper.onAfterCreate.add(onPlaneCreated);
        clipper.onAfterDelete.add(onPlaneDeleted);

        return () => {
            clipper.onBeforeDrag.remove(onDragStart);
            clipper.onAfterDrag.remove(onDragEnd);
            clipper.onAfterCreate.remove(onPlaneCreated);
            clipper.onAfterDelete.remove(onPlaneDeleted);
        };
    }, [getClipper, worldRef, syncPlaneCount]);

    // ── Create axis-aligned clip plane ──
    const createClipPlane = useCallback((axis: 'x' | 'y' | 'z') => {
        const world = worldRef.current;
        const scene = world?.scene?.three;
        const clipper = getClipper();
        if (!world || !scene || !clipper) return;

        const box = getModelBounds(scene);
        if (box.isEmpty()) return;

        const center = new THREE.Vector3();
        box.getCenter(center);

        const normal = new THREE.Vector3();
        normal[axis] = 1;

        const id = clipper.createFromNormalAndCoplanarPoint(world, normal, center);
        axisPlaneIdsRef.current.push(id);
        syncPlaneCount();
    }, [worldRef, getClipper, syncPlaneCount]);

    // ── Create free clip plane (click on surface) ──
    const createFreeClipPlane = useCallback((point: THREE.Vector3, normal: THREE.Vector3) => {
        const world = worldRef.current;
        const clipper = getClipper();
        if (!world || !clipper) return;

        const id = clipper.createFromNormalAndCoplanarPoint(world, normal.clone().normalize(), point);
        freePlaneIdsRef.current.push(id);
        syncPlaneCount();
    }, [worldRef, getClipper, syncPlaneCount]);

    // ── Clear all clip planes ──
    const clearAllClipPlanes = useCallback(() => {
        const clipper = getClipper();
        if (!clipper) return;

        clipper.deleteAll();
        freePlaneIdsRef.current = [];
        axisPlaneIdsRef.current = [];
        sectionBoxRef.current = null;
        setSectionBoxActive(false);
        setSectionBoxBounds(null);
        syncPlaneCount();
    }, [getClipper, syncPlaneCount]);

    // ── Create section box (6 clip planes) ──
    const createSectionBox = useCallback(() => {
        const world = worldRef.current;
        const scene = world?.scene?.three;
        const clipper = getClipper();
        if (!world || !scene || !clipper) return;

        // Clear existing section box
        if (sectionBoxRef.current) {
            for (const id of sectionBoxRef.current.planeIds) {
                clipper.delete(world, id);
            }
        }

        const box = getModelBounds(scene);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const expand = 0.05;
        const min = box.min.clone().sub(size.clone().multiplyScalar(expand));
        const max = box.max.clone().add(size.clone().multiplyScalar(expand));

        const planeIds: string[] = [];

        // Create 6 planes: +X, -X, +Y, -Y, +Z, -Z
        const axes: Array<{ normal: THREE.Vector3; point: THREE.Vector3 }> = [
            // +X → clips away from min.x (normal points inward)
            { normal: new THREE.Vector3(1, 0, 0), point: new THREE.Vector3(min.x, 0, 0) },
            // -X → clips away from max.x
            { normal: new THREE.Vector3(-1, 0, 0), point: new THREE.Vector3(max.x, 0, 0) },
            // +Y → clips away from min.y
            { normal: new THREE.Vector3(0, 1, 0), point: new THREE.Vector3(0, min.y, 0) },
            // -Y → clips away from max.y
            { normal: new THREE.Vector3(0, -1, 0), point: new THREE.Vector3(0, max.y, 0) },
            // +Z → clips away from min.z
            { normal: new THREE.Vector3(0, 0, 1), point: new THREE.Vector3(0, 0, min.z) },
            // -Z → clips away from max.z
            { normal: new THREE.Vector3(0, 0, -1), point: new THREE.Vector3(0, 0, max.z) },
        ];

        for (const { normal, point } of axes) {
            const id = clipper.createFromNormalAndCoplanarPoint(world, normal, point);
            planeIds.push(id);
        }

        const boxState: SectionBoxState = {
            planeIds,
            min: min.clone(),
            max: max.clone(),
            originalMin: min.clone(),
            originalMax: max.clone(),
        };

        sectionBoxRef.current = boxState;
        setSectionBoxActive(true);
        setSectionBoxBounds({ min: min.clone(), max: max.clone() });
        syncPlaneCount();
    }, [worldRef, getClipper, syncPlaneCount]);

    // ── Remove section box ──
    const removeSectionBox = useCallback(() => {
        const world = worldRef.current;
        const clipper = getClipper();
        if (!world || !clipper || !sectionBoxRef.current) return;

        for (const id of sectionBoxRef.current.planeIds) {
            clipper.delete(world, id);
        }

        sectionBoxRef.current = null;
        setSectionBoxActive(false);
        setSectionBoxBounds(null);
        syncPlaneCount();
    }, [worldRef, getClipper, syncPlaneCount]);

    // ── Update section plane position (for slider UI) ──
    const updateSectionPlane = useCallback((id: string, position: number) => {
        const clipper = getClipper();
        if (!clipper) return;

        const plane = clipper.list.get(id);
        if (!plane) return;

        // Move the plane to the new position along its normal
        const normal = plane.normal.clone();
        const newOrigin = normal.clone().multiplyScalar(position);
        plane.setFromNormalAndCoplanarPoint(normal, newOrigin);

        // Update section box bounds if applicable
        if (sectionBoxRef.current) {
            const boxState = sectionBoxRef.current;
            const idx = boxState.planeIds.indexOf(id);
            if (idx >= 0) {
                // Recalculate bounds from all box planes
                const newMin = boxState.min.clone();
                const newMax = boxState.max.clone();

                // Map plane index to axis/direction
                const axisMap: Array<{ axis: 'x' | 'y' | 'z'; isMin: boolean }> = [
                    { axis: 'x', isMin: true },
                    { axis: 'x', isMin: false },
                    { axis: 'y', isMin: true },
                    { axis: 'y', isMin: false },
                    { axis: 'z', isMin: true },
                    { axis: 'z', isMin: false },
                ];

                if (idx < axisMap.length) {
                    const { axis, isMin } = axisMap[idx];
                    if (isMin) {
                        newMin[axis] = position;
                    } else {
                        newMax[axis] = -position; // negative normal
                    }
                }

                boxState.min.copy(newMin);
                boxState.max.copy(newMax);
                setSectionBoxBounds({ min: newMin.clone(), max: newMax.clone() });
            }
        }
    }, [getClipper]);

    // ── Reset section box to original bounds ──
    const resetSectionBox = useCallback(() => {
        const world = worldRef.current;
        const clipper = getClipper();
        if (!world || !clipper || !sectionBoxRef.current) return;

        // Delete existing box planes and re-create
        for (const id of sectionBoxRef.current.planeIds) {
            clipper.delete(world, id);
        }
        sectionBoxRef.current = null;
        createSectionBox();
    }, [worldRef, getClipper, createSectionBox]);

    // ── Flip clip plane ──
    const flipClipPlane = useCallback((id: string) => {
        const clipper = getClipper();
        if (!clipper) return;

        const plane = clipper.list.get(id);
        if (!plane) return;

        // Flip the normal direction
        const newNormal = plane.normal.clone().negate();
        const origin = plane.origin.clone();
        plane.setFromNormalAndCoplanarPoint(newNormal, origin);
    }, [getClipper]);

    // ── Auto-create when tool activated ──
    useEffect(() => {
        if (!activeTool) return;
        if (activeTool === 'clip-x') createClipPlane('x');
        if (activeTool === 'clip-y') createClipPlane('y');
        if (activeTool === 'clip-z') createClipPlane('z');
        if (activeTool === 'section-box') createSectionBox();
        // 'section-plane' is handled by click events in ProjectBimTab
    }, [activeTool, createClipPlane, createSectionBox]);

    // ── Handle Delete key to remove plane under cursor ──
    useEffect(() => {
        const world = worldRef.current;
        const clipper = getClipper();
        if (!world || !clipper) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Delete' || e.code === 'Backspace') {
                if (clipper.enabled) {
                    clipper.delete(world);
                    syncPlaneCount();
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [worldRef, getClipper, syncPlaneCount]);

    return {
        clipPlaneCount,
        sectionBoxActive,
        sectionBoxBounds,
        isDragging,
        createClipPlane,
        createFreeClipPlane,
        clearAllClipPlanes,
        createSectionBox,
        removeSectionBox,
        updateSectionPlane,
        resetSectionBox,
        flipClipPlane,
    };
}

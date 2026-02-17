/**
 * useBimSection — Professional Section Box with interactive draggable face handles
 * 
 * Features:
 * - 6 interactive face handles (color-coded X=red, Y=green, Z=blue)
 * - Drag-to-move: mousedown on handle → drag → updates clip plane realtime
 * - Hover highlight with cursor change
 * - Wireframe box updates in realtime
 * - Single clip planes (X/Y/Z) also draggable
 * - Camera orbit disabled during drag
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import type { ActiveTool } from './useBimTools';

// ── Types ─────────────────────────────────────────────
interface ClipPlaneEntry {
    id: string;
    axis: 'x' | 'y' | 'z';
    direction: 'positive' | 'negative'; // which side the normal points
    plane: THREE.Plane;
    handle: THREE.Mesh;       // draggable face mesh
    position: number;         // current position along axis
    minBound: number;         // min allowed position
    maxBound: number;         // max allowed position
}

interface SectionBoxState {
    min: THREE.Vector3;
    max: THREE.Vector3;
    originalMin: THREE.Vector3;
    originalMax: THREE.Vector3;
    wireframe: THREE.LineSegments | null;
    entries: ClipPlaneEntry[];
}

export interface BimSectionAPI {
    clipPlaneCount: number;
    sectionBoxActive: boolean;
    sectionBoxBounds: { min: THREE.Vector3; max: THREE.Vector3 } | null;
    isDragging: boolean;
    createClipPlane: (axis: 'x' | 'y' | 'z') => void;
    clearAllClipPlanes: () => void;
    createSectionBox: () => void;
    removeSectionBox: () => void;
    updateSectionPlane: (id: string, position: number) => void;
    resetSectionBox: () => void;
    flipClipPlane: (id: string) => void;
}

// ── Colors ────────────────────────────────────────────
const FACE_COLORS = {
    x: { normal: 0xff4444, hover: 0xff6666, drag: 0xff8888 },
    y: { normal: 0x44ff44, hover: 0x66ff66, drag: 0x88ff88 },
    z: { normal: 0x4488ff, hover: 0x66aaff, drag: 0x88ccff },
};

const HANDLE_OPACITY_NORMAL = 0.12;
const HANDLE_OPACITY_HOVER = 0.3;
const HANDLE_OPACITY_DRAG = 0.45;
const WIREFRAME_COLOR = 0xffaa00;

// ── Hook ──────────────────────────────────────────────
export function useBimSection(
    worldRef: React.MutableRefObject<any | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    activeTool: ActiveTool,
): BimSectionAPI {
    // ── State ──
    const clipPlanesRef = useRef<ClipPlaneEntry[]>([]);
    const sectionBoxRef = useRef<SectionBoxState | null>(null);
    const [clipPlaneCount, setClipPlaneCount] = useState(0);
    const [sectionBoxActive, setSectionBoxActive] = useState(false);
    const [sectionBoxBounds, setSectionBoxBounds] = useState<{ min: THREE.Vector3; max: THREE.Vector3 } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Drag state refs (no re-renders during drag)
    const dragRef = useRef<{
        active: boolean;
        entry: ClipPlaneEntry | null;
        startMouse: THREE.Vector2;
        startPosition: number;
        axisVec: THREE.Vector3;
        plane: THREE.Plane; // drag plane for projection
    } | null>(null);
    const hoveredHandleRef = useRef<THREE.Mesh | null>(null);
    const raycasterRef = useRef(new THREE.Raycaster());

    // ── Apply clipping planes to renderer ──
    const applyClipPlanes = useCallback(() => {
        const renderer = (worldRef.current?.renderer as any)?.three;
        if (!renderer) return;

        const allPlanes = [
            ...clipPlanesRef.current.map(cp => cp.plane),
            ...(sectionBoxRef.current?.entries.map(e => e.plane) || []),
        ];

        renderer.clippingPlanes = allPlanes;
        renderer.localClippingEnabled = allPlanes.length > 0;
    }, [worldRef]);

    // ── Create a face handle mesh ──
    const createFaceHandle = useCallback((
        axis: 'x' | 'y' | 'z',
        direction: 'positive' | 'negative',
        position: number,
        size: THREE.Vector3,
        id: string,
    ): THREE.Mesh => {
        // Face dimensions based on axis
        let width: number, height: number;
        let rotation = new THREE.Euler();
        switch (axis) {
            case 'x': width = size.z; height = size.y; rotation.set(0, Math.PI / 2, 0); break;
            case 'y': width = size.x; height = size.z; rotation.set(-Math.PI / 2, 0, 0); break;
            case 'z': width = size.x; height = size.y; break;
        }

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            color: FACE_COLORS[axis].normal,
            transparent: true,
            opacity: HANDLE_OPACITY_NORMAL,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.copy(rotation);
        mesh.userData = {
            isSectionHandle: true,
            handleId: id,
            axis,
            direction,
        };

        // Render order to always show handles on top
        mesh.renderOrder = 999;

        return mesh;
    }, []);

    // ── Position a handle at its current clip position ──
    const positionHandle = useCallback((entry: ClipPlaneEntry, boxState: SectionBoxState) => {
        const { axis, direction, position, handle } = entry;
        const center = new THREE.Vector3()
            .addVectors(boxState.min, boxState.max)
            .multiplyScalar(0.5);

        switch (axis) {
            case 'x':
                handle.position.set(position, center.y, center.z);
                break;
            case 'y':
                handle.position.set(center.x, position, center.z);
                break;
            case 'z':
                handle.position.set(center.x, center.y, position);
                break;
        }
    }, []);

    // ── Update wireframe box to match current bounds ──
    const updateWireframe = useCallback((boxState: SectionBoxState) => {
        const scene = worldRef.current?.scene?.three;
        if (!scene || !boxState.wireframe) return;

        // Remove old wireframe
        scene.remove(boxState.wireframe);
        boxState.wireframe.geometry.dispose();

        // Create new wireframe from current bounds
        const size = new THREE.Vector3().subVectors(boxState.max, boxState.min);
        const center = new THREE.Vector3().addVectors(boxState.min, boxState.max).multiplyScalar(0.5);
        const boxGeom = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(boxGeom);
        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: WIREFRAME_COLOR, linewidth: 2, transparent: true, opacity: 0.8 })
        );
        wireframe.position.copy(center);
        wireframe.userData = { isSectionBox: true };
        wireframe.renderOrder = 998;
        scene.add(wireframe);
        boxState.wireframe = wireframe;
    }, [worldRef]);

    // ── Update bounds from entries ──
    const syncBoundsFromEntries = useCallback((boxState: SectionBoxState) => {
        for (const entry of boxState.entries) {
            const { axis, direction, position } = entry;
            if (direction === 'positive') {
                // positive normal → clips above → this is the min side
                switch (axis) {
                    case 'x': boxState.min.x = position; break;
                    case 'y': boxState.min.y = position; break;
                    case 'z': boxState.min.z = position; break;
                }
            } else {
                // negative normal → clips below → this is the max side
                switch (axis) {
                    case 'x': boxState.max.x = position; break;
                    case 'y': boxState.max.y = position; break;
                    case 'z': boxState.max.z = position; break;
                }
            }
        }
        setSectionBoxBounds({ min: boxState.min.clone(), max: boxState.max.clone() });
    }, []);

    // ── Create Section Box ──
    const createSectionBox = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // Clean up existing
        if (sectionBoxRef.current) {
            removeSectionBoxVisuals(scene, sectionBoxRef.current);
        }

        // Calculate model bounding box (skip helpers)
        const box = new THREE.Box3();
        scene.traverse((obj: THREE.Object3D) => {
            if (obj.userData?.isSectionBox || obj.userData?.isSectionHandle || obj.userData?.isClipHelper) return;
            if (obj.userData?.isMeasurement || obj.userData?.isGrid || obj.userData?.isViewCube) return;
            if ((obj as any).isMesh && obj.visible) {
                box.expandByObject(obj);
            }
        });
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const expand = 0.05;
        const min = box.min.clone().sub(size.clone().multiplyScalar(expand));
        const max = box.max.clone().add(size.clone().multiplyScalar(expand));
        const handleSize = new THREE.Vector3().subVectors(max, min);

        // Create 6 entries: positive normal (min side), negative normal (max side)
        const entries: ClipPlaneEntry[] = [
            // X axis
            {
                id: 'sbox-x+', axis: 'x', direction: 'positive',
                plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), -min.x),
                handle: createFaceHandle('x', 'positive', min.x, handleSize, 'sbox-x+'),
                position: min.x, minBound: min.x - size.x, maxBound: max.x,
            },
            {
                id: 'sbox-x-', axis: 'x', direction: 'negative',
                plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), max.x),
                handle: createFaceHandle('x', 'negative', max.x, handleSize, 'sbox-x-'),
                position: max.x, minBound: min.x, maxBound: max.x + size.x,
            },
            // Y axis
            {
                id: 'sbox-y+', axis: 'y', direction: 'positive',
                plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -min.y),
                handle: createFaceHandle('y', 'positive', min.y, handleSize, 'sbox-y+'),
                position: min.y, minBound: min.y - size.y, maxBound: max.y,
            },
            {
                id: 'sbox-y-', axis: 'y', direction: 'negative',
                plane: new THREE.Plane(new THREE.Vector3(0, -1, 0), max.y),
                handle: createFaceHandle('y', 'negative', max.y, handleSize, 'sbox-y-'),
                position: max.y, minBound: min.y, maxBound: max.y + size.y,
            },
            // Z axis
            {
                id: 'sbox-z+', axis: 'z', direction: 'positive',
                plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -min.z),
                handle: createFaceHandle('z', 'positive', min.z, handleSize, 'sbox-z+'),
                position: min.z, minBound: min.z - size.z, maxBound: max.z,
            },
            {
                id: 'sbox-z-', axis: 'z', direction: 'negative',
                plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), max.z),
                handle: createFaceHandle('z', 'negative', max.z, handleSize, 'sbox-z-'),
                position: max.z, minBound: min.z, maxBound: max.z + size.z,
            },
        ];

        // Create wireframe
        const boxGeom = new THREE.BoxGeometry(handleSize.x, handleSize.y, handleSize.z);
        const edges = new THREE.EdgesGeometry(boxGeom);
        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: WIREFRAME_COLOR, linewidth: 2, transparent: true, opacity: 0.8 })
        );
        const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
        wireframe.position.copy(center);
        wireframe.userData = { isSectionBox: true };
        wireframe.renderOrder = 998;
        scene.add(wireframe);

        // Build state
        const boxState: SectionBoxState = {
            min: min.clone(),
            max: max.clone(),
            originalMin: min.clone(),
            originalMax: max.clone(),
            wireframe,
            entries,
        };

        // Add handles to scene and position them
        for (const entry of entries) {
            positionHandle(entry, boxState);
            scene.add(entry.handle);
        }

        sectionBoxRef.current = boxState;
        setSectionBoxActive(true);
        setSectionBoxBounds({ min: min.clone(), max: max.clone() });
        setClipPlaneCount(prev => prev + 6);
        applyClipPlanes();
    }, [worldRef, createFaceHandle, positionHandle, applyClipPlanes]);

    // ── Remove section box visuals ──
    const removeSectionBoxVisuals = useCallback((scene: THREE.Scene, boxState: SectionBoxState) => {
        // Remove handles
        for (const entry of boxState.entries) {
            scene.remove(entry.handle);
            entry.handle.geometry.dispose();
            (entry.handle.material as THREE.Material).dispose();
        }
        // Remove wireframe
        if (boxState.wireframe) {
            scene.remove(boxState.wireframe);
            boxState.wireframe.geometry.dispose();
            (boxState.wireframe.material as THREE.Material).dispose();
        }
        // Remove any leftover section box objects
        const toRemove: THREE.Object3D[] = [];
        scene.traverse((obj: THREE.Object3D) => {
            if (obj.userData?.isSectionBox) toRemove.push(obj);
        });
        toRemove.forEach(obj => scene.remove(obj));
    }, []);

    // ── Remove section box ──
    const removeSectionBox = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene && sectionBoxRef.current) {
            removeSectionBoxVisuals(scene, sectionBoxRef.current);
        }
        sectionBoxRef.current = null;
        setSectionBoxActive(false);
        setSectionBoxBounds(null);
        setClipPlaneCount(clipPlanesRef.current.length);
        applyClipPlanes();
    }, [worldRef, removeSectionBoxVisuals, applyClipPlanes]);

    // ── Create single clip plane ──
    const createClipPlane = useCallback((axis: 'x' | 'y' | 'z') => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        const box = new THREE.Box3();
        scene.traverse((obj: THREE.Object3D) => {
            if (obj.userData?.isSectionBox || obj.userData?.isSectionHandle || obj.userData?.isClipHelper) return;
            if (obj.userData?.isMeasurement || obj.userData?.isGrid) return;
            if ((obj as any).isMesh && obj.visible) box.expandByObject(obj);
        });
        if (box.isEmpty()) return;

        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());

        let normal: THREE.Vector3;
        let position: number;
        switch (axis) {
            case 'x': normal = new THREE.Vector3(1, 0, 0); position = center.x; break;
            case 'y': normal = new THREE.Vector3(0, 1, 0); position = center.y; break;
            case 'z': normal = new THREE.Vector3(0, 0, 1); position = center.z; break;
        }

        const plane = new THREE.Plane(normal, -position);
        const id = `clip-${axis}-${Date.now()}`;

        // Create draggable handle
        const handleSize = size.clone();
        const handle = createFaceHandle(axis, 'positive', position, handleSize, id);
        // Position the handle
        switch (axis) {
            case 'x': handle.position.set(position, center.y, center.z); break;
            case 'y': handle.position.set(center.x, position, center.z); break;
            case 'z': handle.position.set(center.x, center.y, position); break;
        }
        handle.userData.isClipHelper = true;
        scene.add(handle);

        const entry: ClipPlaneEntry = {
            id, axis, direction: 'positive', plane, handle, position,
            minBound: box.min[axis] - size[axis],
            maxBound: box.max[axis] + size[axis],
        };

        clipPlanesRef.current.push(entry);
        setClipPlaneCount(clipPlanesRef.current.length + (sectionBoxRef.current?.entries.length || 0));
        applyClipPlanes();
    }, [worldRef, createFaceHandle, applyClipPlanes]);

    // ── Clear all ──
    const clearAllClipPlanes = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene) {
            // Remove single clip handles
            for (const cp of clipPlanesRef.current) {
                scene.remove(cp.handle);
                cp.handle.geometry.dispose();
                (cp.handle.material as THREE.Material).dispose();
            }
            // Remove section box
            if (sectionBoxRef.current) {
                removeSectionBoxVisuals(scene, sectionBoxRef.current);
            }
        }

        clipPlanesRef.current = [];
        sectionBoxRef.current = null;
        setClipPlaneCount(0);
        setSectionBoxActive(false);
        setSectionBoxBounds(null);

        const renderer = (worldRef.current?.renderer as any)?.three;
        if (renderer) {
            renderer.clippingPlanes = [];
            renderer.localClippingEnabled = false;
        }
    }, [worldRef, removeSectionBoxVisuals]);

    // ── Update a section plane position (from slider or drag) ──
    const updateSectionPlane = useCallback((id: string, newPosition: number) => {
        const boxState = sectionBoxRef.current;
        if (!boxState) return;

        const entry = boxState.entries.find(e => e.id === id);
        if (!entry) return;

        // Clamp to bounds
        const clamped = Math.max(entry.minBound, Math.min(entry.maxBound, newPosition));
        entry.position = clamped;

        // Update clip plane constant
        if (entry.direction === 'positive') {
            entry.plane.constant = -clamped;
        } else {
            entry.plane.constant = clamped;
        }

        // Update handle position
        positionHandle(entry, boxState);

        // Sync bounds and wireframe
        syncBoundsFromEntries(boxState);
        updateWireframe(boxState);
        applyClipPlanes();
    }, [positionHandle, syncBoundsFromEntries, updateWireframe, applyClipPlanes]);

    // ── Reset section box to original bounds ──
    const resetSectionBox = useCallback(() => {
        const boxState = sectionBoxRef.current;
        if (!boxState) return;

        boxState.min.copy(boxState.originalMin);
        boxState.max.copy(boxState.originalMax);

        for (const entry of boxState.entries) {
            const { axis, direction } = entry;
            if (direction === 'positive') {
                entry.position = boxState.originalMin[axis];
                entry.plane.constant = -boxState.originalMin[axis];
            } else {
                entry.position = boxState.originalMax[axis];
                entry.plane.constant = boxState.originalMax[axis];
            }
            positionHandle(entry, boxState);
        }

        syncBoundsFromEntries(boxState);
        updateWireframe(boxState);
        applyClipPlanes();
    }, [positionHandle, syncBoundsFromEntries, updateWireframe, applyClipPlanes]);

    // ── Flip a clip plane direction ──
    const flipClipPlane = useCallback((id: string) => {
        // For single clip planes
        const entry = clipPlanesRef.current.find(e => e.id === id);
        if (entry) {
            entry.plane.normal.negate();
            entry.plane.constant = -entry.plane.constant;
            applyClipPlanes();
        }
    }, [applyClipPlanes]);

    // ── Mouse interaction: hover + drag ─────────────────
    useEffect(() => {
        const container = containerRef.current;
        const world = worldRef.current;
        if (!container || !world) return;

        const camera = world.camera?.three;
        const scene = world.scene?.three;
        if (!camera || !scene) return;

        // Collect all handle meshes
        const getHandles = (): THREE.Mesh[] => {
            const handles: THREE.Mesh[] = [];
            clipPlanesRef.current.forEach(cp => handles.push(cp.handle));
            sectionBoxRef.current?.entries.forEach(e => handles.push(e.handle));
            return handles;
        };

        const findEntry = (mesh: THREE.Mesh): ClipPlaneEntry | null => {
            const id = mesh.userData.handleId;
            const single = clipPlanesRef.current.find(e => e.id === id);
            if (single) return single;
            return sectionBoxRef.current?.entries.find(e => e.id === id) || null;
        };

        const getNDC = (e: MouseEvent): THREE.Vector2 => {
            const rect = container.getBoundingClientRect();
            return new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1,
            );
        };

        const setHandleAppearance = (mesh: THREE.Mesh, state: 'normal' | 'hover' | 'drag') => {
            const mat = mesh.material as THREE.MeshBasicMaterial;
            const axis = mesh.userData.axis as 'x' | 'y' | 'z';
            const colors = FACE_COLORS[axis];
            switch (state) {
                case 'normal':
                    mat.color.setHex(colors.normal);
                    mat.opacity = HANDLE_OPACITY_NORMAL;
                    break;
                case 'hover':
                    mat.color.setHex(colors.hover);
                    mat.opacity = HANDLE_OPACITY_HOVER;
                    break;
                case 'drag':
                    mat.color.setHex(colors.drag);
                    mat.opacity = HANDLE_OPACITY_DRAG;
                    break;
            }
        };

        // ── HOVER ──
        const onMouseMove = (e: MouseEvent) => {
            // If dragging, handle drag move
            if (dragRef.current?.active) {
                onDragMove(e);
                return;
            }

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);
            const handles = getHandles();
            if (handles.length === 0) return;

            const intersects = raycasterRef.current.intersectObjects(handles, false);

            if (intersects.length > 0) {
                const hit = intersects[0].object as THREE.Mesh;
                if (hoveredHandleRef.current !== hit) {
                    // Un-hover previous
                    if (hoveredHandleRef.current) {
                        setHandleAppearance(hoveredHandleRef.current, 'normal');
                    }
                    hoveredHandleRef.current = hit;
                    setHandleAppearance(hit, 'hover');
                    container.style.cursor = 'grab';
                }
            } else {
                if (hoveredHandleRef.current) {
                    setHandleAppearance(hoveredHandleRef.current, 'normal');
                    hoveredHandleRef.current = null;
                    container.style.cursor = '';
                }
            }
        };

        // ── DRAG START ──
        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return; // left click only

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);
            const handles = getHandles();
            if (handles.length === 0) return;

            const intersects = raycasterRef.current.intersectObjects(handles, false);
            if (intersects.length === 0) return;

            const hit = intersects[0].object as THREE.Mesh;
            const entry = findEntry(hit);
            if (!entry) return;

            e.stopPropagation();
            e.preventDefault();

            // Determine drag axis vector
            let axisVec: THREE.Vector3;
            switch (entry.axis) {
                case 'x': axisVec = new THREE.Vector3(1, 0, 0); break;
                case 'y': axisVec = new THREE.Vector3(0, 1, 0); break;
                case 'z': axisVec = new THREE.Vector3(0, 0, 1); break;
            }

            // Create a drag plane perpendicular to the camera but containing the axis
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            const dragPlaneNormal = new THREE.Vector3().crossVectors(axisVec, cameraDir).cross(axisVec).normalize();
            if (dragPlaneNormal.lengthSq() < 0.001) {
                // Camera is looking along the axis — use camera up as fallback
                dragPlaneNormal.crossVectors(axisVec, camera.up).cross(axisVec).normalize();
            }

            const dragPlane = new THREE.Plane();
            dragPlane.setFromNormalAndCoplanarPoint(dragPlaneNormal, intersects[0].point);

            dragRef.current = {
                active: true,
                entry,
                startMouse: ndc.clone(),
                startPosition: entry.position,
                axisVec,
                plane: dragPlane,
            };

            setHandleAppearance(hit, 'drag');
            container.style.cursor = 'grabbing';
            setIsDragging(true);

            // Disable camera orbit
            const controls = world.camera?.controls;
            if (controls) {
                (controls as any).enabled = false;
            }
        };

        // ── DRAG MOVE ──
        const onDragMove = (e: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag?.active || !drag.entry) return;

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);

            // Intersect with the drag plane
            const intersection = new THREE.Vector3();
            const ray = raycasterRef.current.ray;
            if (!ray.intersectPlane(drag.plane, intersection)) return;

            // Project intersection onto the axis to get new position
            const originPoint = drag.entry.handle.position.clone();
            originPoint[drag.entry.axis] = drag.startPosition;
            const delta = intersection.clone().sub(originPoint);
            const newPosition = drag.startPosition + delta.dot(drag.axisVec);

            // Clamp
            const clamped = Math.max(drag.entry.minBound, Math.min(drag.entry.maxBound, newPosition));
            drag.entry.position = clamped;

            // Update clip plane
            if (drag.entry.direction === 'positive') {
                drag.entry.plane.constant = -clamped;
            } else {
                drag.entry.plane.constant = clamped;
            }

            // Update handle visual position
            const boxState = sectionBoxRef.current;
            if (boxState) {
                positionHandle(drag.entry, boxState);
                syncBoundsFromEntries(boxState);
                updateWireframe(boxState);
            } else {
                // Single clip plane
                const handle = drag.entry.handle;
                handle.position[drag.entry.axis] = clamped;
            }

            applyClipPlanes();
        };

        // ── DRAG END ──
        const onMouseUp = () => {
            const drag = dragRef.current;
            if (!drag?.active) return;

            if (drag.entry) {
                setHandleAppearance(drag.entry.handle, 'normal');
            }

            dragRef.current = null;
            setIsDragging(false);
            container.style.cursor = '';

            // Re-enable camera orbit
            const controls = world.camera?.controls;
            if (controls) {
                (controls as any).enabled = true;
            }
        };

        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mousedown', onMouseDown, true); // capture phase
        window.addEventListener('mouseup', onMouseUp);

        return () => {
            container.removeEventListener('mousemove', onMouseMove);
            container.removeEventListener('mousedown', onMouseDown, true);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [containerRef, worldRef, positionHandle, syncBoundsFromEntries, updateWireframe, applyClipPlanes]);

    // ── Auto-create when tool activated ──
    useEffect(() => {
        if (!activeTool) return;
        if (activeTool === 'clip-x') createClipPlane('x');
        if (activeTool === 'clip-y') createClipPlane('y');
        if (activeTool === 'clip-z') createClipPlane('z');
        if (activeTool === 'section-box') createSectionBox();
    }, [activeTool, createClipPlane, createSectionBox]);

    return {
        clipPlaneCount,
        sectionBoxActive,
        sectionBoxBounds,
        isDragging,
        createClipPlane,
        clearAllClipPlanes,
        createSectionBox,
        removeSectionBox,
        updateSectionPlane,
        resetSectionBox,
        flipClipPlane,
    };
}

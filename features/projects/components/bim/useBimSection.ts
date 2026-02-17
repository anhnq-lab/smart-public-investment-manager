/**
 * useBimSection — Professional Section Box with interactive draggable face handles
 * 
 * Features:
 * - 6 interactive face handles (small center-of-face indicators, color-coded)
 * - Drag-to-move: mousedown on handle → drag → updates clip plane realtime
 * - Hover highlight with cursor change
 * - Wireframe box updates in realtime
 * - Single clip planes (X/Y/Z) also draggable
 * - Free section plane: click on model surface → create clip at face normal
 * - Camera orbit disabled during drag
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import type { ActiveTool } from './useBimTools';

// ── Types ─────────────────────────────────────────────
interface ClipPlaneEntry {
    id: string;
    axis: 'x' | 'y' | 'z' | 'free';
    direction: 'positive' | 'negative';
    plane: THREE.Plane;
    handle: THREE.Mesh;
    position: number;
    minBound: number;
    maxBound: number;
    normal: THREE.Vector3; // for free planes
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
    createFreeClipPlane: (point: THREE.Vector3, normal: THREE.Vector3) => void;
    clearAllClipPlanes: () => void;
    createSectionBox: () => void;
    removeSectionBox: () => void;
    updateSectionPlane: (id: string, position: number) => void;
    resetSectionBox: () => void;
    flipClipPlane: (id: string) => void;
}

// ── Colors ────────────────────────────────────────────
const FACE_COLORS = {
    x: { normal: 0xff4444, hover: 0xff7777, drag: 0xffaaaa },
    y: { normal: 0x44cc44, hover: 0x66ee66, drag: 0x88ff88 },
    z: { normal: 0x4488ff, hover: 0x66aaff, drag: 0x88ccff },
    free: { normal: 0xffaa00, hover: 0xffcc44, drag: 0xffdd88 },
};

const HANDLE_MAX_SIZE = 1.5; // Fixed max 1.5m — never larger
const HANDLE_MIN_SIZE = 0.5; // Fixed min 0.5m
const HANDLE_OPACITY_NORMAL = 0.5;
const HANDLE_OPACITY_HOVER = 0.85;
const HANDLE_OPACITY_DRAG = 1.0;
const WIREFRAME_COLOR = 0xffaa00;

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

    // Drag state refs
    const dragRef = useRef<{
        active: boolean;
        entry: ClipPlaneEntry | null;
        startPosition: number;
        axisVec: THREE.Vector3;
        dragPlane: THREE.Plane;
        dragStartPoint: THREE.Vector3;
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

    const createHandleMesh = useCallback((
        axis: 'x' | 'y' | 'z' | 'free',
        _faceWidth: number,
        _faceHeight: number,
        id: string,
    ): THREE.Mesh => {
        // FIXED small size handle — never larger than HANDLE_MAX_SIZE
        const handleW = Math.min(Math.max(_faceWidth * 0.06, HANDLE_MIN_SIZE), HANDLE_MAX_SIZE);
        const handleH = Math.min(Math.max(_faceHeight * 0.06, HANDLE_MIN_SIZE), HANDLE_MAX_SIZE);

        const geometry = new THREE.PlaneGeometry(handleW, handleH);
        const colors = FACE_COLORS[axis] || FACE_COLORS.free;
        const material = new THREE.MeshBasicMaterial({
            color: colors.normal,
            transparent: true,
            opacity: HANDLE_OPACITY_NORMAL,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 999;
        mesh.userData = { isSectionHandle: true, handleId: id, axis };

        // Small arrow indicator (no border wireframe — avoids line noise)
        const arrowSize = Math.min(handleW, handleH) * 0.35;
        const arrowGeo = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, arrowSize * 0.7, 0,
            -arrowSize * 0.4, -arrowSize * 0.3, 0,
            arrowSize * 0.4, -arrowSize * 0.3, 0,
        ]);
        arrowGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const arrowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthTest: false,
        });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.renderOrder = 1001;
        mesh.add(arrow);

        return mesh;
    }, []);

    // ── Position a handle ──
    const positionHandle = useCallback((entry: ClipPlaneEntry, boxState: SectionBoxState) => {
        const { axis, position, handle } = entry;
        const center = new THREE.Vector3()
            .addVectors(boxState.min, boxState.max)
            .multiplyScalar(0.5);

        switch (axis) {
            case 'x':
                handle.position.set(position, center.y, center.z);
                handle.rotation.set(0, Math.PI / 2, 0);
                break;
            case 'y':
                handle.position.set(center.x, position, center.z);
                handle.rotation.set(-Math.PI / 2, 0, 0);
                break;
            case 'z':
                handle.position.set(center.x, center.y, position);
                handle.rotation.set(0, 0, 0);
                break;
        }

        // Scale is identity since we create handles at the correct size already
        // Just update the handle position
    }, []);

    // ── Update wireframe box ──
    const updateWireframe = useCallback((boxState: SectionBoxState) => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        if (boxState.wireframe) {
            scene.remove(boxState.wireframe);
            boxState.wireframe.geometry.dispose();
            (boxState.wireframe.material as THREE.Material).dispose();
        }

        const size = new THREE.Vector3().subVectors(boxState.max, boxState.min);
        const center = new THREE.Vector3().addVectors(boxState.min, boxState.max).multiplyScalar(0.5);
        const boxGeom = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(boxGeom);
        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: WIREFRAME_COLOR,
                transparent: true,
                opacity: 0.7,
                depthTest: false,
            })
        );
        wireframe.position.copy(center);
        wireframe.userData = { isSectionBox: true };
        wireframe.renderOrder = 998;
        scene.add(wireframe);
        boxState.wireframe = wireframe;
    }, [worldRef]);

    // ── Sync bounds from entries ──
    const syncBoundsFromEntries = useCallback((boxState: SectionBoxState) => {
        for (const entry of boxState.entries) {
            const { axis, direction, position } = entry;
            if (axis === 'free') continue;
            if (direction === 'positive') {
                boxState.min[axis] = position;
            } else {
                boxState.max[axis] = position;
            }
        }
        setSectionBoxBounds({ min: boxState.min.clone(), max: boxState.max.clone() });
    }, []);

    // ── Remove section box visuals ──
    const removeSectionBoxVisuals = useCallback((scene: THREE.Scene, boxState: SectionBoxState) => {
        for (const entry of boxState.entries) {
            scene.remove(entry.handle);
            entry.handle.geometry.dispose();
            (entry.handle.material as THREE.Material).dispose();
        }
        if (boxState.wireframe) {
            scene.remove(boxState.wireframe);
            boxState.wireframe.geometry.dispose();
            (boxState.wireframe.material as THREE.Material).dispose();
        }
        const toRemove: THREE.Object3D[] = [];
        scene.traverse((obj: THREE.Object3D) => {
            if (obj.userData?.isSectionBox) toRemove.push(obj);
        });
        toRemove.forEach(obj => scene.remove(obj));
    }, []);

    // ── Create Section Box ──
    const createSectionBox = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // Clean existing
        if (sectionBoxRef.current) {
            removeSectionBoxVisuals(scene, sectionBoxRef.current);
        }

        const box = getModelBounds(scene);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const expand = 0.05;
        const min = box.min.clone().sub(size.clone().multiplyScalar(expand));
        const max = box.max.clone().add(size.clone().multiplyScalar(expand));
        const handleSize = new THREE.Vector3().subVectors(max, min);

        const makeFaceSize = (axis: 'x' | 'y' | 'z'): [number, number] => {
            switch (axis) {
                case 'x': return [handleSize.z, handleSize.y];
                case 'y': return [handleSize.x, handleSize.z];
                case 'z': return [handleSize.x, handleSize.y];
            }
        };

        const entries: ClipPlaneEntry[] = [];
        const axes: Array<{ axis: 'x' | 'y' | 'z'; posId: string; negId: string }> = [
            { axis: 'x', posId: 'sbox-x+', negId: 'sbox-x-' },
            { axis: 'y', posId: 'sbox-y+', negId: 'sbox-y-' },
            { axis: 'z', posId: 'sbox-z+', negId: 'sbox-z-' },
        ];

        for (const { axis, posId, negId } of axes) {
            const [fw, fh] = makeFaceSize(axis);
            const normalPos = new THREE.Vector3();
            const normalNeg = new THREE.Vector3();
            normalPos[axis] = 1;
            normalNeg[axis] = -1;

            // Positive normal (clips geometry above min → this is the min face)
            entries.push({
                id: posId, axis, direction: 'positive',
                plane: new THREE.Plane(normalPos.clone(), -min[axis]),
                handle: createHandleMesh(axis, fw, fh, posId),
                position: min[axis],
                minBound: min[axis] - size[axis],
                maxBound: max[axis],
                normal: normalPos.clone(),
            });

            // Negative normal (clips geometry below max → this is the max face)
            entries.push({
                id: negId, axis, direction: 'negative',
                plane: new THREE.Plane(normalNeg.clone(), max[axis]),
                handle: createHandleMesh(axis, fw, fh, negId),
                position: max[axis],
                minBound: min[axis],
                maxBound: max[axis] + size[axis],
                normal: normalNeg.clone(),
            });
        }

        // Create wireframe
        const boxGeom = new THREE.BoxGeometry(handleSize.x, handleSize.y, handleSize.z);
        const edges = new THREE.EdgesGeometry(boxGeom);
        const wireframe = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({
                color: WIREFRAME_COLOR,
                transparent: true,
                opacity: 0.7,
                depthTest: false,
            })
        );
        const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
        wireframe.position.copy(center);
        wireframe.userData = { isSectionBox: true };
        wireframe.renderOrder = 998;
        scene.add(wireframe);

        const boxState: SectionBoxState = {
            min: min.clone(), max: max.clone(),
            originalMin: min.clone(), originalMax: max.clone(),
            wireframe, entries,
        };

        // Add handles and position them
        for (const entry of entries) {
            positionHandle(entry, boxState);
            scene.add(entry.handle);
        }

        sectionBoxRef.current = boxState;
        setSectionBoxActive(true);
        setSectionBoxBounds({ min: min.clone(), max: max.clone() });
        setClipPlaneCount(prev => prev + 6);
        applyClipPlanes();
    }, [worldRef, createHandleMesh, positionHandle, removeSectionBoxVisuals, applyClipPlanes]);

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

    // ── Create single clip plane (axis-aligned) ──
    const createClipPlane = useCallback((axis: 'x' | 'y' | 'z') => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        const box = getModelBounds(scene);
        if (box.isEmpty()) return;

        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = box.getSize(new THREE.Vector3());

        const normal = new THREE.Vector3();
        normal[axis] = 1;
        const position = center[axis];

        const plane = new THREE.Plane(normal.clone(), -position);
        const id = `clip-${axis}-${Date.now()}`;

        // Handle dimensions based on axis
        let fw: number, fh: number;
        switch (axis) {
            case 'x': fw = size.z; fh = size.y; break;
            case 'y': fw = size.x; fh = size.z; break;
            case 'z': fw = size.x; fh = size.y; break;
        }

        const handle = createHandleMesh(axis, fw, fh, id);
        switch (axis) {
            case 'x':
                handle.position.set(position, center.y, center.z);
                handle.rotation.set(0, Math.PI / 2, 0);
                break;
            case 'y':
                handle.position.set(center.x, position, center.z);
                handle.rotation.set(-Math.PI / 2, 0, 0);
                break;
            case 'z':
                handle.position.set(center.x, center.y, position);
                break;
        }
        handle.userData.isClipHelper = true;
        scene.add(handle);

        const entry: ClipPlaneEntry = {
            id, axis, direction: 'positive', plane, handle, position,
            minBound: box.min[axis] - size[axis],
            maxBound: box.max[axis] + size[axis],
            normal: normal.clone(),
        };

        clipPlanesRef.current.push(entry);
        setClipPlaneCount(clipPlanesRef.current.length + (sectionBoxRef.current?.entries.length || 0));
        applyClipPlanes();
    }, [worldRef, createHandleMesh, applyClipPlanes]);

    // ── Create free section plane (click on surface) ──
    const createFreeClipPlane = useCallback((point: THREE.Vector3, faceNormal: THREE.Vector3) => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        const normal = faceNormal.clone().normalize();
        const constant = -point.dot(normal);
        const plane = new THREE.Plane(normal.clone(), constant);
        const id = `clip-free-${Date.now()}`;

        // Create a disc/circle handle at the point
        const box = getModelBounds(scene);
        const modelSize = box.getSize(new THREE.Vector3()).length();
        const discRadius = modelSize * 0.08; // 8% of model size

        const geometry = new THREE.CircleGeometry(discRadius, 32);
        const colors = FACE_COLORS.free;
        const material = new THREE.MeshBasicMaterial({
            color: colors.normal,
            transparent: true,
            opacity: HANDLE_OPACITY_NORMAL,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: false,
        });

        const handle = new THREE.Mesh(geometry, material);
        handle.position.copy(point);

        // Orient the disc to align with the face normal
        const up = new THREE.Vector3(0, 0, 1);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
        handle.quaternion.copy(quaternion);

        handle.renderOrder = 999;
        handle.userData = { isSectionHandle: true, handleId: id, axis: 'free' };

        // Add border ring
        const ringGeo = new THREE.RingGeometry(discRadius * 0.95, discRadius, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: colors.normal,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthTest: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.renderOrder = 1000;
        handle.add(ring);

        // Add normal direction arrow
        const arrowLen = discRadius * 0.6;
        const arrowGeo = new THREE.ConeGeometry(discRadius * 0.15, arrowLen, 8);
        const arrowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
        });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.z = arrowLen * 0.5;
        arrow.rotation.x = Math.PI / 2;
        handle.add(arrow);

        scene.add(handle);

        // Determine drag bounds along the normal
        const projMin = box.min.dot(normal);
        const projMax = box.max.dot(normal);
        const range = Math.abs(projMax - projMin);

        const entry: ClipPlaneEntry = {
            id, axis: 'free', direction: 'positive',
            plane, handle,
            position: point.dot(normal),
            minBound: Math.min(projMin, projMax) - range,
            maxBound: Math.max(projMin, projMax) + range,
            normal: normal.clone(),
        };

        clipPlanesRef.current.push(entry);
        setClipPlaneCount(clipPlanesRef.current.length + (sectionBoxRef.current?.entries.length || 0));
        applyClipPlanes();
    }, [worldRef, applyClipPlanes]);

    // ── Clear all ──
    const clearAllClipPlanes = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene) {
            for (const cp of clipPlanesRef.current) {
                scene.remove(cp.handle);
                cp.handle.geometry.dispose();
                (cp.handle.material as THREE.Material).dispose();
            }
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

        const clamped = Math.max(entry.minBound, Math.min(entry.maxBound, newPosition));
        entry.position = clamped;

        if (entry.direction === 'positive') {
            entry.plane.constant = -clamped;
        } else {
            entry.plane.constant = clamped;
        }

        positionHandle(entry, boxState);
        syncBoundsFromEntries(boxState);
        updateWireframe(boxState);
        applyClipPlanes();
    }, [positionHandle, syncBoundsFromEntries, updateWireframe, applyClipPlanes]);

    // ── Reset section box ──
    const resetSectionBox = useCallback(() => {
        const boxState = sectionBoxRef.current;
        if (!boxState) return;

        boxState.min.copy(boxState.originalMin);
        boxState.max.copy(boxState.originalMax);

        for (const entry of boxState.entries) {
            const { axis, direction } = entry;
            if (axis === 'free') continue;
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

    // ── Flip clip plane ──
    const flipClipPlane = useCallback((id: string) => {
        const entry = clipPlanesRef.current.find(e => e.id === id);
        if (entry) {
            entry.plane.normal.negate();
            entry.plane.constant = -entry.plane.constant;
            entry.normal.negate();
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

        const getHandles = (): THREE.Mesh[] => {
            const handles: THREE.Mesh[] = [];
            clipPlanesRef.current.forEach(cp => handles.push(cp.handle));
            sectionBoxRef.current?.entries.forEach(e => handles.push(e.handle));
            return handles;
        };

        const findEntry = (mesh: THREE.Mesh): ClipPlaneEntry | null => {
            const id = mesh.userData.handleId;
            return clipPlanesRef.current.find(e => e.id === id)
                || sectionBoxRef.current?.entries.find(e => e.id === id)
                || null;
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
            const axis = (mesh.userData.axis || 'free') as 'x' | 'y' | 'z' | 'free';
            const colors = FACE_COLORS[axis] || FACE_COLORS.free;
            switch (state) {
                case 'normal': mat.color.setHex(colors.normal); mat.opacity = HANDLE_OPACITY_NORMAL; break;
                case 'hover': mat.color.setHex(colors.hover); mat.opacity = HANDLE_OPACITY_HOVER; break;
                case 'drag': mat.color.setHex(colors.drag); mat.opacity = HANDLE_OPACITY_DRAG; break;
            }
        };

        // ── HOVER + DRAG MOVE ──
        const onMouseMove = (e: MouseEvent) => {
            if (dragRef.current?.active) {
                onDragMove(e);
                return;
            }

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);
            const handles = getHandles();
            if (handles.length === 0) {
                if (hoveredHandleRef.current) {
                    setHandleAppearance(hoveredHandleRef.current, 'normal');
                    hoveredHandleRef.current = null;
                    container.style.cursor = '';
                }
                return;
            }

            const intersects = raycasterRef.current.intersectObjects(handles, true);
            // Find the first parent that is a handle
            let hitHandle: THREE.Mesh | null = null;
            for (const inter of intersects) {
                let obj: THREE.Object3D | null = inter.object;
                while (obj) {
                    if (obj.userData?.isSectionHandle) {
                        hitHandle = obj as THREE.Mesh;
                        break;
                    }
                    obj = obj.parent;
                }
                if (hitHandle) break;
            }

            if (hitHandle) {
                if (hoveredHandleRef.current !== hitHandle) {
                    if (hoveredHandleRef.current) setHandleAppearance(hoveredHandleRef.current, 'normal');
                    hoveredHandleRef.current = hitHandle;
                    setHandleAppearance(hitHandle, 'hover');
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
            if (e.button !== 0) return;

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);
            const handles = getHandles();
            if (handles.length === 0) return;

            const intersects = raycasterRef.current.intersectObjects(handles, true);
            let hitHandle: THREE.Mesh | null = null;
            let hitPoint: THREE.Vector3 | null = null;
            for (const inter of intersects) {
                let obj: THREE.Object3D | null = inter.object;
                while (obj) {
                    if (obj.userData?.isSectionHandle) {
                        hitHandle = obj as THREE.Mesh;
                        hitPoint = inter.point;
                        break;
                    }
                    obj = obj.parent;
                }
                if (hitHandle) break;
            }

            if (!hitHandle || !hitPoint) return;
            const entry = findEntry(hitHandle);
            if (!entry) return;

            e.stopPropagation();
            e.preventDefault();

            // Axis direction for dragging
            const axisVec = entry.normal.clone();

            // Create drag plane perpendicular to camera that contains the axis
            const cameraDir = new THREE.Vector3();
            camera.getWorldDirection(cameraDir);
            let dragPlaneNormal = new THREE.Vector3().crossVectors(axisVec, cameraDir).cross(axisVec).normalize();
            if (dragPlaneNormal.lengthSq() < 0.001) {
                dragPlaneNormal.crossVectors(axisVec, camera.up).cross(axisVec).normalize();
            }

            const dragPlane = new THREE.Plane();
            dragPlane.setFromNormalAndCoplanarPoint(dragPlaneNormal, hitPoint);

            dragRef.current = {
                active: true,
                entry,
                startPosition: entry.position,
                axisVec,
                dragPlane,
                dragStartPoint: hitPoint.clone(),
            };

            setHandleAppearance(hitHandle, 'drag');
            container.style.cursor = 'grabbing';
            setIsDragging(true);

            // Disable orbit
            const controls = world.camera?.controls;
            if (controls) (controls as any).enabled = false;
        };

        // ── DRAG MOVE ──
        const onDragMove = (e: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag?.active || !drag.entry) return;

            const ndc = getNDC(e);
            raycasterRef.current.setFromCamera(ndc, camera);

            const intersection = new THREE.Vector3();
            if (!raycasterRef.current.ray.intersectPlane(drag.dragPlane, intersection)) return;

            // Project delta onto axis
            const delta = intersection.clone().sub(drag.dragStartPoint);
            const axisDelta = delta.dot(drag.axisVec);
            const newPosition = drag.startPosition + axisDelta;

            // Clamp
            const clamped = Math.max(drag.entry.minBound, Math.min(drag.entry.maxBound, newPosition));
            drag.entry.position = clamped;

            // Update clip plane
            if (drag.entry.axis === 'free') {
                drag.entry.plane.constant = -clamped;
                // Move handle along normal
                const offset = clamped - drag.startPosition;
                drag.entry.handle.position.copy(
                    drag.dragStartPoint.clone().add(drag.axisVec.clone().multiplyScalar(offset))
                );
            } else {
                if (drag.entry.direction === 'positive') {
                    drag.entry.plane.constant = -clamped;
                } else {
                    drag.entry.plane.constant = clamped;
                }

                const boxState = sectionBoxRef.current;
                if (boxState) {
                    positionHandle(drag.entry, boxState);
                    syncBoundsFromEntries(boxState);
                    updateWireframe(boxState);
                } else {
                    // Single clip plane handle
                    drag.entry.handle.position[drag.entry.axis as 'x' | 'y' | 'z'] = clamped;
                }
            }

            applyClipPlanes();
        };

        // ── DRAG END ──
        const onMouseUp = () => {
            const drag = dragRef.current;
            if (!drag?.active) return;

            if (drag.entry) setHandleAppearance(drag.entry.handle, 'normal');
            dragRef.current = null;
            setIsDragging(false);
            container.style.cursor = '';

            // Re-enable orbit
            const controls = world.camera?.controls;
            if (controls) (controls as any).enabled = true;
        };

        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mousedown', onMouseDown, true);
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
        // 'section-plane' is handled by click events in ProjectBimTab
    }, [activeTool, createClipPlane, createSectionBox]);

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

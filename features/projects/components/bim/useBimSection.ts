/**
 * useBimSection — Section plane management using THREE.js clipping
 * Handles: Clip X/Y/Z planes, Section Box (6-plane box), interactive position control
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import type { ActiveTool } from './useBimTools';

interface ClipPlaneEntry {
    id: string;
    axis: 'x' | 'y' | 'z';
    plane: THREE.Plane;
    helper?: THREE.PlaneHelper;
    position: number;
}

export interface BimSectionAPI {
    clipPlaneCount: number;
    sectionBoxActive: boolean;
    createClipPlane: (axis: 'x' | 'y' | 'z') => void;
    clearAllClipPlanes: () => void;
    createSectionBox: () => void;
    removeSectionBox: () => void;
}

export function useBimSection(
    worldRef: React.MutableRefObject<any | null>,
    activeTool: ActiveTool,
): BimSectionAPI {
    const clipPlanesRef = useRef<ClipPlaneEntry[]>([]);
    const sectionBoxRef = useRef<ClipPlaneEntry[]>([]);
    const [clipPlaneCount, setClipPlaneCount] = useState(0);
    const [sectionBoxActive, setSectionBoxActive] = useState(false);

    // Apply clipping planes to renderer
    const applyClipPlanes = useCallback(() => {
        const renderer = (worldRef.current?.renderer as any)?.three;
        if (!renderer) return;

        const allPlanes = [
            ...clipPlanesRef.current.map(cp => cp.plane),
            ...sectionBoxRef.current.map(cp => cp.plane),
        ];

        renderer.clippingPlanes = allPlanes;
        renderer.localClippingEnabled = allPlanes.length > 0;
    }, [worldRef]);

    // ── Create a clipping plane ─────────────────────
    const createClipPlane = useCallback((axis: 'x' | 'y' | 'z') => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // Calculate model center for plane position
        const box = new THREE.Box3().setFromObject(scene);
        const center = new THREE.Vector3();
        box.getCenter(center);

        let normal: THREE.Vector3;
        let position: number;
        switch (axis) {
            case 'x': normal = new THREE.Vector3(1, 0, 0); position = center.x; break;
            case 'y': normal = new THREE.Vector3(0, 1, 0); position = center.y; break;
            case 'z': normal = new THREE.Vector3(0, 0, 1); position = center.z; break;
        }

        const plane = new THREE.Plane(normal, -position);
        const id = `clip-${axis}-${Date.now()}`;

        // Create visual helper
        const size = box.getSize(new THREE.Vector3()).length() * 0.5;
        const helperColor = axis === 'x' ? 0xff4444 : axis === 'y' ? 0x44ff44 : 0x4444ff;
        const helper = new THREE.PlaneHelper(plane, size, helperColor);
        helper.userData = { isClipHelper: true, clipId: id };
        scene.add(helper);

        clipPlanesRef.current.push({ id, axis, plane, helper, position });
        setClipPlaneCount(clipPlanesRef.current.length);
        applyClipPlanes();
    }, [worldRef, applyClipPlanes]);

    // ── Clear all clip planes ───────────────────────
    const clearAllClipPlanes = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene) {
            // Remove helpers
            clipPlanesRef.current.forEach(cp => {
                if (cp.helper) scene.remove(cp.helper);
            });
            sectionBoxRef.current.forEach(cp => {
                if (cp.helper) scene.remove(cp.helper);
            });
        }

        clipPlanesRef.current = [];
        sectionBoxRef.current = [];
        setClipPlaneCount(0);
        setSectionBoxActive(false);

        // Clear clipping on renderer
        const renderer = (worldRef.current?.renderer as any)?.three;
        if (renderer) {
            renderer.clippingPlanes = [];
            renderer.localClippingEnabled = false;
        }
    }, [worldRef]);

    // ── Create section box (6 planes) ───────────────
    const createSectionBox = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // First remove existing section box
        sectionBoxRef.current.forEach(cp => {
            if (cp.helper) scene.remove(cp.helper);
        });
        sectionBoxRef.current = [];

        // Calculate bounding box of scene
        const box = new THREE.Box3().setFromObject(scene);
        if (box.isEmpty()) return;

        const size = box.getSize(new THREE.Vector3());
        const center = new THREE.Vector3();
        box.getCenter(center);

        // Expand box slightly
        const expand = 0.1;
        const min = box.min.clone().sub(size.clone().multiplyScalar(expand));
        const max = box.max.clone().add(size.clone().multiplyScalar(expand));

        // Create 6 clipping planes for the box
        const planes: ClipPlaneEntry[] = [
            { id: 'sbox-px', axis: 'x', plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), -min.x), position: min.x },
            { id: 'sbox-nx', axis: 'x', plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), max.x), position: max.x },
            { id: 'sbox-py', axis: 'y', plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -min.y), position: min.y },
            { id: 'sbox-ny', axis: 'y', plane: new THREE.Plane(new THREE.Vector3(0, -1, 0), max.y), position: max.y },
            { id: 'sbox-pz', axis: 'z', plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), -min.z), position: min.z },
            { id: 'sbox-nz', axis: 'z', plane: new THREE.Plane(new THREE.Vector3(0, 0, -1), max.z), position: max.z },
        ];

        // Add box wireframe helper
        const boxGeometry = new THREE.BoxGeometry(
            max.x - min.x,
            max.y - min.y,
            max.z - min.z
        );
        const boxHelper = new THREE.BoxHelper(
            new THREE.Mesh(boxGeometry, new THREE.MeshBasicMaterial()),
            0xffaa00
        );
        boxHelper.position.copy(center);
        boxHelper.userData = { isSectionBox: true };
        scene.add(boxHelper);

        sectionBoxRef.current = planes;
        setSectionBoxActive(true);
        applyClipPlanes();
    }, [worldRef, applyClipPlanes]);

    // ── Remove section box ─────────────────────────
    const removeSectionBox = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene) {
            sectionBoxRef.current.forEach(cp => {
                if (cp.helper) scene.remove(cp.helper);
            });
            // Remove box helper
            const toRemove: THREE.Object3D[] = [];
            scene.traverse((obj: THREE.Object3D) => {
                if (obj.userData?.isSectionBox) toRemove.push(obj);
            });
            toRemove.forEach(obj => scene.remove(obj));
        }
        sectionBoxRef.current = [];
        setSectionBoxActive(false);
        applyClipPlanes();
    }, [worldRef, applyClipPlanes]);

    // ── Auto-create clip plane when tool activated ──
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
        createClipPlane,
        clearAllClipPlanes,
        createSectionBox,
        removeSectionBox,
    };
}

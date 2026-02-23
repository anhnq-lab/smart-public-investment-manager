/**
 * useBimMeasure — Measurement tools using OBC Raycasters + scene overlays
 * Handles: Point-to-point length measurement, area measurement with polygon
 * Uses OBC.Raycasters.castRay() (async) with position parameter for proper fragment intersection
 * Interaction: DOUBLE-CLICK to place measurement points
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import * as OBC from '@thatopen/components';
import type { ActiveTool } from './useBimTools';

interface MeasurementEntry {
    id: string;
    type: 'length' | 'area';
    points: THREE.Vector3[];
    value: number;
    unit: string;
    objects: THREE.Object3D[];
}

export interface BimMeasureAPI {
    measurementCount: number;
    activeMeasurement: { points: THREE.Vector3[]; type: 'length' | 'area' } | null;
    handleMeasureClick: (event: MouseEvent) => void;
    clearAllMeasurements: () => void;
}

export function useBimMeasure(
    worldRef: React.MutableRefObject<any | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    activeTool: ActiveTool,
    componentsRef?: React.MutableRefObject<OBC.Components | null>,
): BimMeasureAPI {
    const formatDistance = (meters: number): string => {
        if (meters < 0.01) return `${(meters * 1000).toFixed(1)} mm`;
        if (meters < 1) return `${(meters * 100).toFixed(1)} cm`;
        return `${meters.toFixed(3)} m`;
    };
    const formatArea = (sqMeters: number): string => {
        if (sqMeters < 0.01) return `${(sqMeters * 1e6).toFixed(0)} mm²`;
        if (sqMeters < 1) return `${(sqMeters * 1e4).toFixed(1)} cm²`;
        return `${sqMeters.toFixed(3)} m²`;
    };

    const measurementsRef = useRef<MeasurementEntry[]>([]);
    const [measurementCount, setMeasurementCount] = useState(0);
    const activeMeasurementRef = useRef<{ points: THREE.Vector3[]; type: 'length' | 'area' } | null>(null);
    const [activeMeasurement, setActiveMeasurement] = useState<{ points: THREE.Vector3[]; type: 'length' | 'area' } | null>(null);

    // ── Convert mouse event to normalized screen position ──
    const getMousePosition = useCallback((event: MouseEvent): THREE.Vector2 | null => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        return new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
    }, [containerRef]);

    // ── Raycast to find point on model surface ──────
    // Uses OBC SimpleRaycaster which handles fragments properly
    const raycastPoint = useCallback(async (event: MouseEvent): Promise<THREE.Vector3 | null> => {
        const world = worldRef.current;
        if (!world) return null;

        const mousePos = getMousePosition(event);
        if (!mousePos) return null;

        // Method 1: OBC Raycasters — handles fragment geometry
        if (componentsRef?.current) {
            try {
                const raycasters = componentsRef.current.get(OBC.Raycasters);
                const raycaster = raycasters.get(world);
                if (raycaster) {
                    // castRay is ASYNC and accepts { position } to override mouse
                    const result = await raycaster.castRay({ position: mousePos });
                    if (result) {
                        console.log('[Measure] ✅ OBC hit at:', result.point.x.toFixed(2), result.point.y.toFixed(2), result.point.z.toFixed(2));
                        return result.point.clone();
                    }
                    console.log('[Measure] OBC ray cast - no hit');
                }
            } catch (err) {
                console.warn('[Measure] OBC raycaster error:', err);
            }
        }

        // Method 2: castRayToObjects with world.meshes
        if (componentsRef?.current) {
            try {
                const raycasters = componentsRef.current.get(OBC.Raycasters);
                const raycaster = raycasters.get(world);
                if (raycaster && world.meshes) {
                    const meshArray = Array.from(world.meshes);
                    if (meshArray.length > 0) {
                        const result = raycaster.castRayToObjects(meshArray, mousePos);
                        if (result) {
                            console.log('[Measure] ✅ castRayToObjects hit at:', result.point.x.toFixed(2), result.point.y.toFixed(2), result.point.z.toFixed(2));
                            return result.point.clone();
                        }
                    }
                }
            } catch (err) {
                console.warn('[Measure] castRayToObjects error:', err);
            }
        }

        // Method 3: Fallback raw THREE.Raycaster on scene children
        try {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, world.camera.three);
            const intersects = raycaster.intersectObjects(world.scene.three.children, true);
            for (const hit of intersects) {
                if (hit.object.userData?.isMeasurement ||
                    hit.object.userData?.isClipHelper ||
                    hit.object.userData?.isSectionBox ||
                    hit.object instanceof THREE.Sprite ||
                    hit.object instanceof THREE.Line) continue;
                if (!hit.object.visible) continue;
                console.log('[Measure] ✅ THREE fallback hit at:', hit.point.x.toFixed(2), hit.point.y.toFixed(2), hit.point.z.toFixed(2));
                return hit.point.clone();
            }
        } catch (err) {
            console.warn('[Measure] THREE raycaster error:', err);
        }

        console.log('[Measure] ❌ No intersection found');
        return null;
    }, [worldRef, componentsRef, getMousePosition]);

    // ── Create measurement line + label ─────────────
    const createLengthVisual = useCallback((p1: THREE.Vector3, p2: THREE.Vector3, id: string): THREE.Object3D[] => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return [];

        const objects: THREE.Object3D[] = [];
        const distance = p1.distanceTo(p2);

        // Dashed line
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineDashedMaterial({ color: 0x00ffff, dashSize: 0.2, gapSize: 0.1, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        line.userData = { isMeasurement: true, measureId: id };
        scene.add(line);
        objects.push(line);

        // Point markers
        const sphereGeom = new THREE.SphereGeometry(0.08, 12, 12);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        for (const pt of [p1, p2]) {
            const s = new THREE.Mesh(sphereGeom, sphereMat);
            s.position.copy(pt);
            s.userData = { isMeasurement: true, measureId: id };
            scene.add(s);
            objects.push(s);
        }

        // Label sprite
        const label = formatDistance(distance);
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
        ctx.beginPath(); ctx.roundRect(16, 16, 480, 96, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(16, 16, 480, 96, 16); ctx.stroke();
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        midPoint.y += 0.4;
        sprite.position.copy(midPoint);
        sprite.scale.set(2.5, 0.625, 1);
        sprite.userData = { isMeasurement: true, measureId: id };
        scene.add(sprite);
        objects.push(sprite);

        return objects;
    }, [worldRef]);

    // ── Create area measurement visual ──────────────
    const createAreaVisual = useCallback((points: THREE.Vector3[], id: string): THREE.Object3D[] => {
        const scene = worldRef.current?.scene?.three;
        if (!scene || points.length < 3) return [];

        const objects: THREE.Object3D[] = [];
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const cross = new THREE.Vector3().crossVectors(
                points[i].clone().sub(points[0]),
                points[j].clone().sub(points[0])
            );
            area += cross.length() / 2;
        }

        // Polygon edges
        const edgePoints = [...points, points[0]];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(edgePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x44ff88, linewidth: 2 });
        const line = new THREE.Line(lineGeom, lineMat);
        line.userData = { isMeasurement: true, measureId: id };
        scene.add(line);
        objects.push(line);

        // Point markers
        const sphereGeom = new THREE.SphereGeometry(0.06, 8, 8);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x44ff88 });
        for (const pt of points) {
            const s = new THREE.Mesh(sphereGeom, sphereMat);
            s.position.copy(pt);
            s.userData = { isMeasurement: true, measureId: id };
            scene.add(s);
            objects.push(s);
        }

        // Label
        const label = formatArea(area);
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 30, 20, 0.85)';
        ctx.beginPath(); ctx.roundRect(16, 16, 480, 96, 16); ctx.fill();
        ctx.strokeStyle = 'rgba(68, 255, 136, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(16, 16, 480, 96, 16); ctx.stroke();
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        const center = new THREE.Vector3();
        points.forEach(p => center.add(p));
        center.divideScalar(points.length);
        center.y += 0.4;
        sprite.position.copy(center);
        sprite.scale.set(2.5, 0.625, 1);
        sprite.userData = { isMeasurement: true, measureId: id };
        scene.add(sprite);
        objects.push(sprite);

        return objects;
    }, [worldRef]);

    // ── Handle double-click for measurement (ASYNC because castRay is async) ──
    const handleMeasureClick = useCallback((event: MouseEvent) => {
        const isMeasuring = activeTool === 'measure-length' || activeTool === 'measure-area';
        if (!isMeasuring) return;

        // raycastPoint is async, so we fire-and-forget with proper handling
        (async () => {
            const point = await raycastPoint(event);
            if (!point) {
                console.warn('[Measure] Không tìm thấy điểm giao cắt');
                return;
            }

            const type = activeTool === 'measure-length' ? 'length' : 'area';

            if (!activeMeasurementRef.current || activeMeasurementRef.current.type !== type) {
                activeMeasurementRef.current = { points: [point], type };
                setActiveMeasurement({ points: [point], type });
                console.log(`[Measure] 📍 Điểm 1 — ${type}`);
                return;
            }

            const active = activeMeasurementRef.current;
            active.points.push(point);
            setActiveMeasurement({ ...active, points: [...active.points] });

            if (type === 'length' && active.points.length === 2) {
                const id = `measure-${Date.now()}`;
                const objs = createLengthVisual(active.points[0], active.points[1], id);
                const distance = active.points[0].distanceTo(active.points[1]);
                console.log(`[Measure] ✅ Khoảng cách: ${formatDistance(distance)}`);
                measurementsRef.current.push({ id, type: 'length', points: [...active.points], value: distance, unit: 'm', objects: objs });
                setMeasurementCount(measurementsRef.current.length);
                activeMeasurementRef.current = null;
                setActiveMeasurement(null);
            } else if (type === 'area' && active.points.length >= 3) {
                const first = active.points[0];
                const last = active.points[active.points.length - 1];
                if (active.points.length > 3 && first.distanceTo(last) < 0.5) {
                    active.points.pop();
                    const id = `measure-${Date.now()}`;
                    const objs = createAreaVisual(active.points, id);
                    let area = 0;
                    for (let i = 0; i < active.points.length; i++) {
                        const j = (i + 1) % active.points.length;
                        const cross = new THREE.Vector3().crossVectors(
                            active.points[i].clone().sub(active.points[0]),
                            active.points[j].clone().sub(active.points[0])
                        );
                        area += cross.length() / 2;
                    }
                    measurementsRef.current.push({ id, type: 'area', points: [...active.points], value: area, unit: 'm²', objects: objs });
                    setMeasurementCount(measurementsRef.current.length);
                    activeMeasurementRef.current = null;
                    setActiveMeasurement(null);
                }
            }
        })();
    }, [activeTool, raycastPoint, createLengthVisual, createAreaVisual]);

    // ── Clear all measurements ──────────────────────
    const clearAllMeasurements = useCallback(() => {
        const scene = worldRef.current?.scene?.three;
        if (scene) {
            measurementsRef.current.forEach(m => {
                m.objects.forEach(obj => scene.remove(obj));
            });
        }
        measurementsRef.current = [];
        setMeasurementCount(0);
        activeMeasurementRef.current = null;
        setActiveMeasurement(null);
    }, [worldRef]);

    // ── Reset active measurement when tool changes ──
    useEffect(() => {
        if (activeTool !== 'measure-length' && activeTool !== 'measure-area') {
            activeMeasurementRef.current = null;
            setActiveMeasurement(null);
        }
    }, [activeTool]);

    return {
        measurementCount,
        activeMeasurement,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

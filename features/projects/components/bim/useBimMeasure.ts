/**
 * useBimMeasure — Measurement tools using OBC Raycasters + scene overlays
 * Handles: Point-to-point length measurement, area measurement with polygon
 * Uses OBC.Raycasters for proper fragment-based geometry intersection
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
    objects: THREE.Object3D[];  // Scene objects to remove on cleanup
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
    // Smart unit formatting
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
    // Fallback THREE.Raycaster for when OBC is not available
    const fallbackRaycasterRef = useRef(new THREE.Raycaster());

    // ── Raycast to find point on model surface ──────
    // Uses OBC.Raycasters for proper fragment intersection, with THREE.Raycaster fallback
    const raycastPoint = useCallback((event: MouseEvent): THREE.Vector3 | null => {
        const container = containerRef.current;
        const world = worldRef.current;
        if (!container || !world) return null;

        // Method 1: Use OBC.Raycasters (works with fragments)
        if (componentsRef?.current) {
            try {
                const raycasters = componentsRef.current.get(OBC.Raycasters);
                const raycaster = raycasters.get(world);
                if (raycaster) {
                    // OBC raycaster uses the mouse position from the last mousemove event
                    // We need to manually update mouse position for the click event
                    const rect = container.getBoundingClientRect();
                    const mouse = new THREE.Vector2(
                        ((event.clientX - rect.left) / rect.width) * 2 - 1,
                        -((event.clientY - rect.top) / rect.height) * 2 + 1
                    );
                    // Use castRay with updated mouse
                    (raycaster as any).mouse = mouse;
                    const result = raycaster.castRay();
                    if (result) {
                        return result.point.clone();
                    }
                }
            } catch (err) {
                console.warn('[Measure] OBC raycaster failed, falling back to THREE:', err);
            }
        }

        // Method 2: Fallback to standard THREE.Raycaster
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        fallbackRaycasterRef.current.setFromCamera(mouse, world.camera.three);
        fallbackRaycasterRef.current.params.Line = { threshold: 0.05 };
        fallbackRaycasterRef.current.params.Points = { threshold: 0.05 };
        const intersects = fallbackRaycasterRef.current.intersectObjects(world.scene.three.children, true);

        for (const hit of intersects) {
            if (hit.object.userData?.isMeasurement ||
                hit.object.userData?.isClipHelper ||
                hit.object.userData?.isSectionBox ||
                hit.object.userData?.isGrid ||
                hit.object.userData?.isViewCube ||
                hit.object instanceof THREE.Sprite ||
                hit.object instanceof THREE.Line) continue;
            if (!hit.object.visible) continue;
            if ((hit.object as any).material?.opacity < 0.1) continue;
            return hit.point.clone();
        }
        return null;
    }, [containerRef, worldRef, componentsRef]);

    // ── Create measurement line + label ─────────────
    const createLengthVisual = useCallback((p1: THREE.Vector3, p2: THREE.Vector3, id: string): THREE.Object3D[] => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return [];

        const objects: THREE.Object3D[] = [];
        const distance = p1.distanceTo(p2);

        // Dashed line between points
        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineDashedMaterial({
            color: 0x00ffff,
            dashSize: 0.2,
            gapSize: 0.1,
            linewidth: 2,
        });
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        line.userData = { isMeasurement: true, measureId: id };
        scene.add(line);
        objects.push(line);

        // Point markers (small spheres)
        const sphereGeom = new THREE.SphereGeometry(0.08, 12, 12);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const s1 = new THREE.Mesh(sphereGeom, sphereMat);
        s1.position.copy(p1);
        s1.userData = { isMeasurement: true, measureId: id };
        scene.add(s1);
        objects.push(s1);

        const s2 = new THREE.Mesh(sphereGeom, sphereMat);
        s2.position.copy(p2);
        s2.userData = { isMeasurement: true, measureId: id };
        scene.add(s2);
        objects.push(s2);

        // Label via sprite — high resolution for readability
        const label = formatDistance(distance);
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 20, 40, 0.85)';
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 96, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 96, 16);
        ctx.stroke();
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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

        // Calculate area using cross product method (assumes roughly planar)
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
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 30, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 96, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(68, 255, 136, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 96, 16);
        ctx.stroke();
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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

    // ── Handle click for measurement ────────────────
    const handleMeasureClick = useCallback((event: MouseEvent) => {
        const isMeasuring = activeTool === 'measure-length' || activeTool === 'measure-area';
        if (!isMeasuring) return;

        const point = raycastPoint(event);
        if (!point) {
            console.warn('[Measure] Không tìm thấy điểm giao cắt trên mô hình');
            return;
        }

        const type = activeTool === 'measure-length' ? 'length' : 'area';

        if (!activeMeasurementRef.current || activeMeasurementRef.current.type !== type) {
            activeMeasurementRef.current = { points: [point], type };
            setActiveMeasurement({ points: [point], type });
            console.log(`[Measure] Bắt đầu đo ${type}: điểm 1 tại`, point);
            return;
        }

        const active = activeMeasurementRef.current;
        active.points.push(point);
        setActiveMeasurement({ ...active, points: [...active.points] });

        if (type === 'length' && active.points.length === 2) {
            // Complete length measurement
            const id = `measure-${Date.now()}`;
            const objs = createLengthVisual(active.points[0], active.points[1], id);
            const distance = active.points[0].distanceTo(active.points[1]);
            console.log(`[Measure] Hoàn thành đo khoảng cách: ${formatDistance(distance)}`);
            measurementsRef.current.push({
                id, type: 'length', points: [...active.points],
                value: distance, unit: 'm', objects: objs,
            });
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
                measurementsRef.current.push({
                    id, type: 'area', points: [...active.points],
                    value: area, unit: 'm²', objects: objs,
                });
                setMeasurementCount(measurementsRef.current.length);
                activeMeasurementRef.current = null;
                setActiveMeasurement(null);
            }
        }
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

    // ── Area measurement: double-click to finish ────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleDblClick = (e: MouseEvent) => {
            const active = activeMeasurementRef.current;
            if (!active || active.type !== 'area' || active.points.length < 3) return;

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
            measurementsRef.current.push({
                id, type: 'area', points: [...active.points],
                value: area, unit: 'm²', objects: objs,
            });
            setMeasurementCount(measurementsRef.current.length);
            activeMeasurementRef.current = null;
            setActiveMeasurement(null);
        };

        container.addEventListener('dblclick', handleDblClick);
        return () => container.removeEventListener('dblclick', handleDblClick);
    }, [containerRef, createAreaVisual]);

    return {
        measurementCount,
        activeMeasurement,
        handleMeasureClick,
        clearAllMeasurements,
    };
}

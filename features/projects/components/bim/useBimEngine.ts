/**
 * useBimEngine — Init & manage That Open Engine lifecycle
 * Handles: Components init, World (Scene/Camera/Renderer), Grid, Highlighter, IfcLoader, Fragments
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';

export interface BimEngineAPI {
    componentsRef: React.MutableRefObject<OBC.Components | null>;
    worldRef: React.MutableRefObject<OBC.World | null>;
    ifcLoaderRef: React.MutableRefObject<OBC.IfcLoader | null>;
    viewerReady: boolean;
    cameraRotation: { x: number; y: number; z: number };
    initError: string | null;
    // Camera actions
    setView: (view: string) => void;
    fitAll: () => void;
    takeScreenshot: () => void;
}

export function useBimEngine(
    containerRef: React.RefObject<HTMLDivElement | null>,
    isDarkMode: boolean
): BimEngineAPI {
    const componentsRef = useRef<OBC.Components | null>(null);
    const worldRef = useRef<OBC.World | null>(null);
    const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);

    const [viewerReady, setViewerReady] = useState(false);
    const [cameraRotation, setCameraRotation] = useState({ x: -30, y: 45, z: 0 });
    const [initError, setInitError] = useState<string | null>(null);

    // ── Initialize engine ───────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;

        const init = async () => {
            try {
                const components = new OBC.Components();
                componentsRef.current = components;

                const worlds = components.get(OBC.Worlds);
                const world = worlds.create<
                    OBC.SimpleScene,
                    OBC.SimpleCamera,
                    OBCF.PostproductionRenderer
                >();
                worldRef.current = world;

                world.scene = new OBC.SimpleScene(components);
                world.scene.setup();
                (world.scene.three as THREE.Scene).background = new THREE.Color(
                    isDarkMode ? 0x0f172a : 0xf1f5f9
                );

                world.renderer = new OBCF.PostproductionRenderer(components, containerRef.current!);
                world.camera = new OBC.SimpleCamera(components);
                (world.camera as OBC.SimpleCamera).controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Enable clipping on renderer
                const renderer = (world.renderer as any).three;
                if (renderer) {
                    renderer.localClippingEnabled = true;
                }

                await components.init();

                const grids = components.get(OBC.Grids);
                grids.create(world);

                // Initialize FragmentsManager — load worker locally
                const fragments = components.get(OBC.FragmentsManager);
                let workerUrl: string;
                try {
                    // Try local worker first
                    const localWorkerResp = await fetch('/workers/fragment-worker.mjs');
                    if (localWorkerResp.ok) {
                        const workerBlob = await localWorkerResp.blob();
                        const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
                        workerUrl = URL.createObjectURL(workerFile);
                    } else {
                        throw new Error('Local worker not found');
                    }
                } catch {
                    // Fallback to GitHub CDN
                    const fetchedWorker = await fetch('https://thatopen.github.io/engine_fragment/resources/worker.mjs');
                    const workerBlob = await fetchedWorker.blob();
                    const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
                    workerUrl = URL.createObjectURL(workerFile);
                }
                fragments.init(workerUrl);

                // Camera update for fragments
                world.camera.controls.addEventListener('update', () => fragments.core.update());

                // Auto-add loaded models to scene
                fragments.list.onItemSet.add(({ value: model }: any) => {
                    model.useCamera(world.camera.three);
                    world.scene.three.add(model.object);
                    fragments.core.update(true);
                });

                // Remove z-fighting on materials
                fragments.core.models.materials.list.onItemSet.add(({ value: material }: any) => {
                    if (!('isLodMaterial' in material && material.isLodMaterial)) {
                        material.polygonOffset = true;
                        material.polygonOffsetUnits = 1;
                        material.polygonOffsetFactor = Math.random();
                    }
                });

                // Setup IFC loader
                const ifcLoader = components.get(OBC.IfcLoader);
                await ifcLoader.setup({
                    autoSetWasm: false,
                    wasm: { path: '/wasm/', absolute: true },
                });
                ifcLoaderRef.current = ifcLoader;

                // Setup Highlighter
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({ world });

                // Track camera rotation for ViewCube
                world.camera.controls.addEventListener('update', () => {
                    if (disposed) return;
                    const cam = world.camera.three;
                    const euler = new THREE.Euler().setFromQuaternion(cam.quaternion, 'YXZ');
                    setCameraRotation({
                        x: THREE.MathUtils.radToDeg(euler.x),
                        y: THREE.MathUtils.radToDeg(euler.y),
                        z: THREE.MathUtils.radToDeg(euler.z),
                    });
                });

                if (!disposed) {
                    setViewerReady(true);
                    setInitError(null);
                }
            } catch (err: any) {
                console.error('Viewer init error:', err);
                if (!disposed) {
                    setInitError(err.message);
                }
            }
        };

        init();

        return () => {
            disposed = true;
            ifcLoaderRef.current = null;
            if (componentsRef.current) {
                componentsRef.current.dispose();
                componentsRef.current = null;
            }
        };
    }, []);

    // ── Dark mode sync ──────────────────────────────
    useEffect(() => {
        if (worldRef.current?.scene) {
            (worldRef.current.scene.three as THREE.Scene).background = new THREE.Color(
                isDarkMode ? 0x0f172a : 0xf1f5f9
            );
        }
    }, [isDarkMode]);

    // ── Camera views ────────────────────────────────
    const setView = useCallback((view: string) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;
        const d = 30;
        switch (view) {
            case 'iso': camera.controls.setLookAt(d, d, d, 0, 0, 0, true); break;
            case 'top': camera.controls.setLookAt(0, d * 2, 0, 0, 0, 0, true); break;
            case 'bottom': camera.controls.setLookAt(0, -d * 2, 0, 0, 0, 0, true); break;
            case 'front': camera.controls.setLookAt(0, 0, d * 2, 0, 0, 0, true); break;
            case 'back': camera.controls.setLookAt(0, 0, -d * 2, 0, 0, 0, true); break;
            case 'right': camera.controls.setLookAt(d * 2, 0, 0, 0, 0, 0, true); break;
            case 'left': camera.controls.setLookAt(-d * 2, 0, 0, 0, 0, 0, true); break;
        }
    }, []);

    const fitAll = useCallback(() => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        const scene = worldRef.current?.scene;
        if (!camera || !scene) return;
        const box = new THREE.Box3().setFromObject(scene.three);
        if (box.isEmpty()) return;
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        camera.controls.fitToSphere(sphere, true);
    }, []);

    const takeScreenshot = useCallback(() => {
        const renderer = worldRef.current?.renderer;
        if (!renderer) return;
        try {
            const canvas = (renderer as any).three?.domElement;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `bim-screenshot-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.warn('Screenshot error:', err);
        }
    }, []);

    return {
        componentsRef,
        worldRef,
        ifcLoaderRef,
        viewerReady,
        cameraRotation,
        initError,
        setView,
        fitAll,
        takeScreenshot,
    };
}

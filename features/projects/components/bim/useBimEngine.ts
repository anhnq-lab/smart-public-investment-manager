/**
 * useBimEngine — Init & manage That Open Engine lifecycle
 * Handles: Components init, World (Scene/Camera/Renderer), Grid, Highlighter, IfcLoader, Fragments
 * Professional lighting, gradient background, smooth camera
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
    cameraQuaternion: THREE.Quaternion;
    initError: string | null;
    // Camera actions
    setView: (view: string) => void;
    fitAll: () => void;
    takeScreenshot: () => void;
    zoomToObject: (object: THREE.Object3D) => void;
    orbit: (deltaAzimuth: number, deltaPolar: number) => void;
}

export function useBimEngine(
    containerRef: React.RefObject<HTMLDivElement | null>,
    isDarkMode: boolean
): BimEngineAPI {
    const componentsRef = useRef<OBC.Components | null>(null);
    const worldRef = useRef<OBC.World | null>(null);
    const ifcLoaderRef = useRef<OBC.IfcLoader | null>(null);

    const [viewerReady, setViewerReady] = useState(false);
    const [cameraQuaternion, setCameraQuaternion] = useState(() => new THREE.Quaternion());
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

                // ── Professional lighting ──────────────────
                const scene = world.scene.three as THREE.Scene;

                // Gradient background
                const bgColor = isDarkMode ? 0x0f172a : 0xf0f4f8;
                scene.background = new THREE.Color(bgColor);

                // Hemisphere light for ambient fill
                const hemiLight = new THREE.HemisphereLight(
                    isDarkMode ? 0x607080 : 0xb0c4de,  // sky
                    isDarkMode ? 0x202830 : 0x808090,    // ground
                    isDarkMode ? 1.0 : 0.8
                );
                scene.add(hemiLight);

                // Key directional light (warm, from top-right-front)
                const keyLight = new THREE.DirectionalLight(
                    isDarkMode ? 0xd0d8e8 : 0xffffff,
                    isDarkMode ? 1.5 : 1.2
                );
                keyLight.position.set(50, 80, 40);
                keyLight.castShadow = false;
                scene.add(keyLight);

                // Fill light (cooler, from opposite side)
                const fillLight = new THREE.DirectionalLight(
                    isDarkMode ? 0x6080a0 : 0x8090a0,
                    isDarkMode ? 0.4 : 0.3
                );
                fillLight.position.set(-30, 20, -20);
                scene.add(fillLight);

                // Renderer setup
                world.renderer = new OBCF.PostproductionRenderer(components, containerRef.current!);
                const renderer = (world.renderer as any).three;
                if (renderer) {
                    renderer.localClippingEnabled = true;
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    renderer.toneMappingExposure = isDarkMode ? 1.2 : 1.0;
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                }

                // Camera with smooth controls
                world.camera = new OBC.SimpleCamera(components);
                const camera = world.camera as OBC.SimpleCamera;
                camera.controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Smooth camera controls
                camera.controls.smoothTime = 0.35;
                camera.controls.draggingSmoothTime = 0.15;

                await components.init();

                // Initialize FragmentsManager — load worker
                const fragments = components.get(OBC.FragmentsManager);
                let workerUrl: string;
                try {
                    const localWorkerResp = await fetch('/workers/fragment-worker.mjs');
                    if (localWorkerResp.ok) {
                        const workerBlob = await localWorkerResp.blob();
                        const workerFile = new File([workerBlob], 'worker.mjs', { type: 'text/javascript' });
                        workerUrl = URL.createObjectURL(workerFile);
                    } else {
                        throw new Error('Local worker not found');
                    }
                } catch {
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

                // Setup Raycasters (required before Highlighter - per official docs)
                const raycasters = components.get(OBC.Raycasters);
                raycasters.get(world);

                // Setup Highlighter for selection + hover
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({
                    world,
                    selectMaterialDefinition: {
                        color: new THREE.Color('#4fc3f7'),
                        opacity: 0.5,
                        transparent: true,
                        renderedFaces: 0,
                    },
                });

                // Track camera quaternion for ViewCube
                let lastQStr = '';
                world.camera.controls.addEventListener('update', () => {
                    if (disposed) return;
                    const q = world.camera.three.quaternion;
                    const qStr = `${q.x.toFixed(4)},${q.y.toFixed(4)},${q.z.toFixed(4)},${q.w.toFixed(4)}`;
                    if (qStr !== lastQStr) {
                        lastQStr = qStr;
                        setCameraQuaternion(q.clone());
                    }
                });

                if (!disposed) {
                    setViewerReady(true);
                    setInitError(null);

                    // Auto-resize renderer when container size changes (fullscreen, window resize)
                    const container = containerRef.current!;
                    const resizeObserver = new ResizeObserver(() => {
                        if (disposed) return;
                        const w = container.clientWidth;
                        const h = container.clientHeight;
                        if (w === 0 || h === 0) return;

                        const rendererObj = worldRef.current?.renderer as any;
                        const threeRenderer = rendererObj?.three;
                        const threeCamera = worldRef.current?.camera?.three;

                        // 1. Resize Three.js renderer
                        if (threeRenderer) {
                            threeRenderer.setSize(w, h);
                        }

                        // 2. Directly resize ALL canvas elements in container
                        const canvases = container.querySelectorAll('canvas');
                        canvases.forEach((canvas: HTMLCanvasElement) => {
                            canvas.width = w * (window.devicePixelRatio || 1);
                            canvas.height = h * (window.devicePixelRatio || 1);
                            canvas.style.width = '100%';
                            canvas.style.height = '100%';
                        });

                        // 3. Update camera aspect
                        if (threeCamera && 'aspect' in threeCamera) {
                            (threeCamera as THREE.PerspectiveCamera).aspect = w / h;
                            (threeCamera as THREE.PerspectiveCamera).updateProjectionMatrix();
                        }

                        // 4. Try OBC renderer resize method
                        if (rendererObj?.resize) {
                            rendererObj.resize();
                        }
                    });
                    resizeObserver.observe(container);
                    resizeObserverRef = resizeObserver;
                }
            } catch (err: any) {
                console.error('Viewer init error:', err);
                if (!disposed) {
                    setInitError(err.message);
                }
            }
        };

        let resizeObserverRef: ResizeObserver | null = null;
        init();

        return () => {
            disposed = true;
            if (resizeObserverRef) resizeObserverRef.disconnect();
            ifcLoaderRef.current = null;
            if (componentsRef.current) {
                componentsRef.current.dispose();
                componentsRef.current = null;
            }
        };
    }, []);

    // ── Dark mode sync ──────────────────────────────
    useEffect(() => {
        const scene = worldRef.current?.scene?.three as THREE.Scene | undefined;
        if (!scene) return;

        scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf0f4f8);

        // Update lights
        scene.traverse((obj) => {
            if (obj instanceof THREE.HemisphereLight) {
                obj.color.set(isDarkMode ? 0x607080 : 0xb0c4de);
                obj.groundColor.set(isDarkMode ? 0x202830 : 0x808090);
                obj.intensity = isDarkMode ? 1.0 : 0.8;
            }
            if (obj instanceof THREE.DirectionalLight) {
                if (obj.position.x > 0) {
                    // Key light
                    obj.color.set(isDarkMode ? 0xd0d8e8 : 0xffffff);
                    obj.intensity = isDarkMode ? 1.5 : 1.2;
                } else {
                    // Fill light
                    obj.color.set(isDarkMode ? 0x6080a0 : 0x8090a0);
                    obj.intensity = isDarkMode ? 0.4 : 0.3;
                }
            }
        });

        // Update renderer tone mapping
        const renderer = (worldRef.current?.renderer as any)?.three;
        if (renderer) {
            renderer.toneMappingExposure = isDarkMode ? 1.2 : 1.0;
        }
    }, [isDarkMode]);

    // ── Camera views ────────────────────────────────
    const setView = useCallback((view: string) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        const scene = worldRef.current?.scene;
        if (!camera || !scene) return;

        // Calculate model center for better view positioning
        const box = new THREE.Box3().setFromObject(scene.three);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        if (!box.isEmpty()) {
            box.getCenter(center);
            box.getSize(size);
        }
        const d = Math.max(size.length() * 0.8, 30);

        switch (view) {
            case 'iso': camera.controls.setLookAt(center.x + d, center.y + d, center.z + d, center.x, center.y, center.z, true); break;
            case 'top': camera.controls.setLookAt(center.x, center.y + d * 1.5, center.z, center.x, center.y, center.z, true); break;
            case 'bottom': camera.controls.setLookAt(center.x, center.y - d * 1.5, center.z, center.x, center.y, center.z, true); break;
            case 'front': camera.controls.setLookAt(center.x, center.y, center.z + d * 1.5, center.x, center.y, center.z, true); break;
            case 'back': camera.controls.setLookAt(center.x, center.y, center.z - d * 1.5, center.x, center.y, center.z, true); break;
            case 'right': camera.controls.setLookAt(center.x + d * 1.5, center.y, center.z, center.x, center.y, center.z, true); break;
            case 'left': camera.controls.setLookAt(center.x - d * 1.5, center.y, center.z, center.x, center.y, center.z, true); break;
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

    const zoomToObject = useCallback((object: THREE.Object3D) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;
        const box = new THREE.Box3().setFromObject(object);
        if (box.isEmpty()) return;
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        // Zoom in closer than fitAll
        sphere.radius *= 1.2;
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

    // ── ViewCube drag → orbit camera ─────────────
    const orbit = useCallback((deltaAzimuthDeg: number, deltaPolarDeg: number) => {
        const camera = worldRef.current?.camera as OBC.SimpleCamera | undefined;
        if (!camera) return;
        const deg2rad = Math.PI / 180;
        camera.controls.rotate(deltaAzimuthDeg * deg2rad, deltaPolarDeg * deg2rad, true);
    }, []);

    return {
        componentsRef,
        worldRef,
        ifcLoaderRef,
        viewerReady,
        cameraQuaternion,
        initError,
        setView,
        fitAll,
        takeScreenshot,
        zoomToObject,
        orbit,
    };
}

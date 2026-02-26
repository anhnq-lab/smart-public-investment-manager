/**
 * useBimEngine — Init & manage That Open Engine lifecycle
 * Handles: Components init, World (Scene/Camera/Renderer), Grid, Highlighter, IfcLoader, Fragments
 * Professional lighting, gradient background, smooth camera
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as OBC from '@thatopen/components';
import * as OBCF from '@thatopen/components-front';
import * as THREE from 'three';

// ── Sky gradient helper ─────────────────────────
function createSkyGradientTexture(isDark: boolean): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    if (isDark) {
        // Deep space blue → slate-950 horizon → warm dark ground
        gradient.addColorStop(0.0, '#0c1222');   // top: deep navy
        gradient.addColorStop(0.3, '#0f172a');   // upper: slate-950
        gradient.addColorStop(0.5, '#131c2e');   // mid: slightly lighter
        gradient.addColorStop(0.7, '#1a2236');   // lower mid: warm tint
        gradient.addColorStop(0.85, '#1e293b');  // horizon: slate-800
        gradient.addColorStop(1.0, '#0f172a');   // bottom: back to dark
    } else {
        // Soft sky blue → white → warm ground
        gradient.addColorStop(0.0, '#87CEEB');   // top: sky blue
        gradient.addColorStop(0.2, '#B0D8F0');   // upper: lighter blue
        gradient.addColorStop(0.45, '#dce8f2');  // mid: soft blue-white
        gradient.addColorStop(0.6, '#f0f4f8');   // horizon: near white
        gradient.addColorStop(0.75, '#f5f0eb');  // below: warm tone
        gradient.addColorStop(1.0, '#e8e0d8');   // bottom: warm ground
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
}

// ── Grid floor helper ───────────────────────────
function createGridFloor(isDark: boolean): THREE.Group {
    const group = new THREE.Group();
    group.name = '__bim_grid_floor__';

    // Major grid
    const majorSize = 200;
    const majorDivisions = 20;
    const majorGrid = new THREE.GridHelper(
        majorSize, majorDivisions,
        isDark ? 0x2a3a4a : 0xc0c8d0,
        isDark ? 0x1a2535 : 0xd8dce2
    );
    (majorGrid.material as THREE.Material).transparent = true;
    (majorGrid.material as THREE.Material).opacity = isDark ? 0.4 : 0.35;
    (majorGrid.material as THREE.Material).depthWrite = false;
    majorGrid.position.y = -0.01;
    group.add(majorGrid);

    // Minor grid (finer)
    const minorGrid = new THREE.GridHelper(
        majorSize, majorDivisions * 5,
        isDark ? 0x1e2d3d : 0xd0d4d8,
        isDark ? 0x162030 : 0xe0e4e8
    );
    (minorGrid.material as THREE.Material).transparent = true;
    (minorGrid.material as THREE.Material).opacity = isDark ? 0.15 : 0.15;
    (minorGrid.material as THREE.Material).depthWrite = false;
    minorGrid.position.y = -0.02;
    group.add(minorGrid);

    return group;
}

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
    zoomToExpressId: (expressId: number) => Promise<void>;
    orbit: (deltaAzimuth: number, deltaPolar: number) => void;
    // Postproduction
    edgeOutlineEnabled: boolean;
    aoEnabled: boolean;
    toggleEdgeOutline: (enabled: boolean) => void;
    toggleAO: (enabled: boolean) => void;
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
    const [edgeOutlineEnabled, setEdgeOutlineEnabled] = useState(true);
    const [aoEnabled, setAoEnabled] = useState(false);

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

                // Gradient sky background
                scene.background = createSkyGradientTexture(isDarkMode);

                // Grid floor
                scene.add(createGridFloor(isDarkMode));

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

                // Camera with smooth controls (MUST be before renderer for PostproductionRenderer)
                world.camera = new OBC.SimpleCamera(components);
                const camera = world.camera as OBC.SimpleCamera;
                camera.controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Smooth camera controls
                camera.controls.smoothTime = 0.35;
                camera.controls.draggingSmoothTime = 0.15;

                // Mouse button mapping (professional BIM style):
                // Left = orbit, Middle = pan, Right = orbit, Scroll = zoom
                try {
                    const CC = (camera.controls as any).constructor;
                    if (CC?.ACTION) {
                        camera.controls.mouseButtons.middle = CC.ACTION.TRUCK;
                    }
                } catch { /* camera controls mapping not critical */ }

                // Renderer setup (after camera)
                world.renderer = new OBCF.PostproductionRenderer(components, containerRef.current!);
                const renderer = (world.renderer as any).three;
                if (renderer) {
                    renderer.localClippingEnabled = true;
                    renderer.toneMapping = THREE.ACESFilmicToneMapping;
                    renderer.toneMappingExposure = isDarkMode ? 1.2 : 1.0;
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                }

                // Enable postproduction edge outlines
                const postproduction = (world.renderer as any).postproduction;
                if (postproduction) {
                    postproduction.enabled = true;
                    postproduction.customEffects.outlineEnabled = true;
                }

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

                // Setup Highlighter for selection
                const highlighter = components.get(OBCF.Highlighter);
                highlighter.setup({
                    world,
                    selectMaterialDefinition: {
                        color: new THREE.Color('#29b6f6'),
                        opacity: 0.85,
                        transparent: true,
                        renderedFaces: 0,
                    },
                });

                // Hoverer disabled per user request
                const hoverer = components.get(OBCF.Hoverer);
                hoverer.enabled = false;

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

        // Update gradient sky
        if (scene.background instanceof THREE.CanvasTexture) {
            scene.background.dispose();
        }
        scene.background = createSkyGradientTexture(isDarkMode);

        // Update grid floor
        const oldGrid = scene.getObjectByName('__bim_grid_floor__');
        if (oldGrid) scene.remove(oldGrid);
        scene.add(createGridFloor(isDarkMode));

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

    const zoomToExpressId = useCallback(async (expressId: number) => {
        try {
            const fragments = componentsRef.current?.get(OBC.FragmentsManager);
            if (!fragments || !worldRef.current?.camera) return;
            const box3 = new THREE.Box3();
            let found = false;

            for (const [, model] of fragments.list) {
                try {
                    if (typeof (model as any).getMergedBox === 'function') {
                        const box = await (model as any).getMergedBox([expressId]);
                        if (box && !box.isEmpty()) {
                            box3.union(box);
                            found = true;
                        }
                    } else if (typeof (model as any).getBoundingBox === 'function') {
                        const box = await (model as any).getBoundingBox([expressId]);
                        if (box && !box.isEmpty()) {
                            box3.union(box);
                            found = true;
                        }
                    }
                } catch { /* skip if error or element not in this model */ }
            }
            if (found && !box3.isEmpty()) {
                const sphere = new THREE.Sphere();
                box3.getBoundingSphere(sphere);
                sphere.radius = Math.max(sphere.radius * 1.5, 2); // padding + minimum radius to avoid being too close
                const camera = worldRef.current.camera as OBC.SimpleCamera;
                camera.controls.fitToSphere(sphere, true);
            }
        } catch (err) {
            console.warn('[BimEngine] Zoom to expressId error:', err);
        }
    }, [componentsRef, worldRef]);

    // ── Postproduction toggles ────────────────────────
    const toggleEdgeOutline = useCallback((enabled: boolean) => {
        const pp = (worldRef.current?.renderer as any)?.postproduction;
        if (pp) {
            pp.customEffects.outlineEnabled = enabled;
        }
        setEdgeOutlineEnabled(enabled);
    }, []);

    const toggleAO = useCallback((enabled: boolean) => {
        const pp = (worldRef.current?.renderer as any)?.postproduction;
        if (pp) {
            pp.customEffects.glossEnabled = enabled;
        }
        setAoEnabled(enabled);
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
        zoomToExpressId,
        orbit,
        edgeOutlineEnabled,
        aoEnabled,
        toggleEdgeOutline,
        toggleAO,
    };
}

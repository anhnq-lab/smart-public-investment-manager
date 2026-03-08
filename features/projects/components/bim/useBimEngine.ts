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
        // Rich midnight navy → indigo → steel blue horizon → deep ground
        gradient.addColorStop(0.0, '#0a0f1e');   // top: deep midnight
        gradient.addColorStop(0.15, '#0d1b3e');  // upper: dark navy
        gradient.addColorStop(0.35, '#132347');   // mid-upper: rich navy
        gradient.addColorStop(0.48, '#1a2d5a');   // approaching horizon: steel blue
        gradient.addColorStop(0.52, '#233a6b');   // horizon glow: bright steel
        gradient.addColorStop(0.56, '#1a2d5a');   // below horizon mirror
        gradient.addColorStop(0.7, '#0f1a38');    // below: dark indigo
        gradient.addColorStop(1.0, '#080e1f');    // bottom: near-black navy
    } else {
        // Atmospheric sky — powder blue → ivory → warm cream horizon
        gradient.addColorStop(0.0, '#bfdbfe');   // top: soft sky blue
        gradient.addColorStop(0.2, '#dbeafe');   // upper: lighter blue
        gradient.addColorStop(0.4, '#eff6ff');   // mid: ice blue
        gradient.addColorStop(0.48, '#fefce8');  // horizon warm: cream
        gradient.addColorStop(0.52, '#fef9c3');  // horizon glow: warm ivory
        gradient.addColorStop(0.56, '#fefce8');  // below horizon: cream
        gradient.addColorStop(0.7, '#f1f5f9');   // lower: cool gray
        gradient.addColorStop(1.0, '#e2e8f0');   // bottom: slate-200
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
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
    isolateByExpressId: (expressId: number) => Promise<void>;
    resetIsolation: () => Promise<void>;
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
    const [edgeOutlineEnabled, setEdgeOutlineEnabled] = useState(false);
    const [aoEnabled, setAoEnabled] = useState(false);

    // ── Initialize engine ───────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let disposed = false;

        // Wait for container to have non-zero dimensions (tab might not be visible yet)
        const waitForContainer = (): Promise<HTMLDivElement> => {
            return new Promise((resolve, reject) => {
                const el = containerRef.current;
                if (!el) { reject(new Error('Container ref lost')); return; }
                if (el.clientWidth > 0 && el.clientHeight > 0) { resolve(el); return; }
                // Poll until visible (max 5 seconds)
                let attempts = 0;
                const interval = setInterval(() => {
                    if (disposed) { clearInterval(interval); reject(new Error('Disposed')); return; }
                    attempts++;
                    if (el.clientWidth > 0 && el.clientHeight > 0) {
                        clearInterval(interval);
                        resolve(el);
                    } else if (attempts > 50) {
                        clearInterval(interval);
                        // Force minimum size as fallback
                        resolve(el);
                    }
                }, 100);
            });
        };

        const init = async () => {
            try {
                // ── CRITICAL: Wait for container to be sized before creating renderer ──
                const container = await waitForContainer();
                if (disposed) return;

                const components = new OBC.Components();
                componentsRef.current = components;

                const worlds = components.get(OBC.Worlds);
                const world = worlds.create<
                    OBC.SimpleScene,
                    OBC.SimpleCamera,
                    OBCF.PostproductionRenderer
                >();
                worldRef.current = world;

                // Scene setup
                world.scene = new OBC.SimpleScene(components);
                world.scene.setup();

                // ── Professional lighting ──────────────────
                const scene = world.scene.three as THREE.Scene;

                // Gradient sky background
                scene.background = createSkyGradientTexture(isDarkMode);

                // Hemisphere light for ambient fill — warmer sky, cooler ground
                const hemiLight = new THREE.HemisphereLight(
                    isDarkMode ? 0xa0b4cc : 0xfff8f0,
                    isDarkMode ? 0x152238 : 0xdce4ef,
                    isDarkMode ? 0.9 : 0.65
                );
                scene.add(hemiLight);

                // Key directional light
                const keyLight = new THREE.DirectionalLight(
                    isDarkMode ? 0xffffff : 0xffffff,
                    isDarkMode ? 1.2 : 1.0
                );
                keyLight.position.set(50, 100, 50);
                keyLight.castShadow = false;
                scene.add(keyLight);

                // Fill light
                const fillLight = new THREE.DirectionalLight(
                    isDarkMode ? 0x64748b : 0x94a3b8,
                    isDarkMode ? 0.4 : 0.3
                );
                fillLight.position.set(-50, 50, -50);
                scene.add(fillLight);

                // Renderer setup — optimized for performance
                world.renderer = new OBCF.PostproductionRenderer(components, container);
                const renderer = (world.renderer as any).three;
                const MAX_PIXEL_RATIO = 1.5;
                if (renderer) {
                    renderer.localClippingEnabled = true;
                    renderer.toneMapping = THREE.NoToneMapping;
                    renderer.outputColorSpace = THREE.SRGBColorSpace;
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
                    renderer.sortObjects = true;
                }

                // Camera with smooth controls
                world.camera = new OBC.SimpleCamera(components);

                // ── Initialize components AFTER scene+renderer+camera are all set ──
                await components.init();

                // Postproduction — disable all effects individually for performance
                // (Keep postproduction.enabled = true so the renderer pipeline works,
                //  but all actual effects are off — minimal overhead)
                const postproduction = (world.renderer as any).postproduction;
                if (postproduction) {
                    postproduction.enabled = true;
                    if (postproduction.customEffects) {
                        postproduction.customEffects.outlineEnabled = false;
                        postproduction.customEffects.glossEnabled = false;
                        postproduction.customEffects.gammaEnabled = false;
                    }
                }

                const camera = world.camera as OBC.SimpleCamera;
                camera.controls.setLookAt(15, 15, 15, 0, 0, 0);

                // Smooth camera controls (optimized for BIM navigation)
                camera.controls.smoothTime = 0.18;
                camera.controls.draggingSmoothTime = 0.08;


                // Mouse button mapping (professional BIM style)
                try {
                    const CC = (camera.controls as any).constructor;
                    if (CC?.ACTION) {
                        camera.controls.mouseButtons.middle = CC.ACTION.TRUCK;
                    }
                } catch { /* camera controls mapping not critical */ }

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

                // Track camera quaternion for ViewCube — throttled to 100ms
                let lastQStr = '';
                let lastQUpdate = 0;
                world.camera.controls.addEventListener('update', () => {
                    if (disposed) return;
                    const now = performance.now();
                    if (now - lastQUpdate < 100) return; // throttle: max 10 updates/sec
                    lastQUpdate = now;
                    const q = world.camera.three.quaternion;
                    const qStr = `${q.x.toFixed(3)},${q.y.toFixed(3)},${q.z.toFixed(3)},${q.w.toFixed(3)}`;
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
                        const limitedDpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
                        canvases.forEach((canvas: HTMLCanvasElement) => {
                            canvas.width = w * limitedDpr;
                            canvas.height = h * limitedDpr;
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

        // Update lights syncing with dark mode toggles
        scene.traverse((obj) => {
            if (obj instanceof THREE.HemisphereLight) {
                obj.color.set(isDarkMode ? 0xa0b4cc : 0xfff8f0);
                obj.groundColor.set(isDarkMode ? 0x152238 : 0xdce4ef);
                obj.intensity = isDarkMode ? 0.9 : 0.65;
            }
            if (obj instanceof THREE.DirectionalLight) {
                if (obj.position.x > 0) {
                    // Key light
                    obj.color.set(isDarkMode ? 0xffffff : 0xffffff);
                    obj.intensity = isDarkMode ? 1.2 : 1.0;
                } else if (obj.position.z < -50) {
                    // Rim light
                    obj.color.set(isDarkMode ? 0x3b82f6 : 0x93c5fd);
                    obj.intensity = isDarkMode ? 0.35 : 0.25;
                } else {
                    // Fill light
                    obj.color.set(isDarkMode ? 0x64748b : 0x94a3b8);
                    obj.intensity = isDarkMode ? 0.5 : 0.4;
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
            if (!fragments || !worldRef.current?.camera) {
                console.warn('[BimEngine] zoomToExpressId: no fragments or camera');
                return;
            }
            const box3 = new THREE.Box3();
            let found = false;

            console.log(`[BimEngine] zoomToExpressId(${expressId}): starting search across ${fragments.list.size} models`);

            // Strategy 0: Try getFragmentMap API (ThatOpen v2 primary method)
            for (const [modelId, model] of fragments.list) {
                try {
                    if (typeof (model as any).getFragmentMap === 'function') {
                        const fragMap = (model as any).getFragmentMap([expressId]);
                        if (fragMap && Object.keys(fragMap).length > 0) {
                            // Found! Now get bounding box via fragment meshes
                            for (const [fragId, ids] of Object.entries(fragMap)) {
                                const modelObj = (model as any).object || model;
                                if (modelObj && typeof modelObj.traverse === 'function') {
                                    modelObj.traverse((child: any) => {
                                        if (found) return;
                                        if (child.isMesh) {
                                            const meshBox = new THREE.Box3().setFromObject(child);
                                            if (!meshBox.isEmpty()) {
                                                // Check if this mesh contains the expressId via items
                                                const items = child.fragment?.items;
                                                if (items instanceof Map && items.has(expressId)) {
                                                    box3.union(meshBox);
                                                    found = true;
                                                }
                                            }
                                        }
                                    });
                                }
                                // If we couldn't find the specific mesh, use model bounding box
                                if (!found) {
                                    const modelObj2 = (model as any).object || model;
                                    if (modelObj2 instanceof THREE.Object3D) {
                                        const modelBox = new THREE.Box3().setFromObject(modelObj2);
                                        if (!modelBox.isEmpty()) {
                                            box3.union(modelBox);
                                            found = true;
                                        }
                                    }
                                }
                            }
                            if (found) {
                                console.log(`[BimEngine] Zoom: found via getFragmentMap in model ${modelId}`);
                                break;
                            }
                        }
                    }
                } catch (e) { console.warn('[BimEngine] getFragmentMap error:', e); }
            }

            // Strategy 1: Try getMergedBox / getBoundingBox API
            if (!found) {
                for (const [modelId, model] of fragments.list) {
                    try {
                        if (typeof (model as any).getMergedBox === 'function') {
                            const box = await (model as any).getMergedBox([expressId]);
                            if (box && !box.isEmpty()) {
                                box3.union(box);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via getMergedBox in model ${modelId}`);
                                break;
                            }
                        }
                    } catch { /* skip */ }
                    try {
                        if (!found && typeof (model as any).getBoundingBox === 'function') {
                            const box = await (model as any).getBoundingBox([expressId]);
                            if (box && !box.isEmpty()) {
                                box3.union(box);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via getBoundingBox in model ${modelId}`);
                                break;
                            }
                        }
                    } catch { /* skip */ }
                }
            }

            // Strategy 2: Scan model children for fragment.items Map (ThatOpen v2 pattern)
            if (!found) {
                for (const [modelId, model] of fragments.list) {
                    const modelObj = (model as any).object || model;
                    if (!modelObj || typeof modelObj.traverse !== 'function') continue;

                    modelObj.traverse((child: any) => {
                        if (found) return;
                        if (!child.isMesh) return;

                        // ThatOpen v2: fragment.items is a Map<number, number[]>
                        const items = child.fragment?.items;
                        if (items instanceof Map && items.has(expressId)) {
                            const meshBox = new THREE.Box3().setFromObject(child);
                            if (!meshBox.isEmpty()) {
                                box3.union(meshBox);
                                found = true;
                                console.log(`[BimEngine] Zoom: found via fragment.items Map in model ${modelId}`);
                            }
                        }

                        // Legacy: itemIDs Set
                        if (!found) {
                            const ids = child.itemIDs || child.fragment?.ids || child.userData?.itemIDs;
                            if (ids instanceof Set && ids.has(expressId)) {
                                const meshBox = new THREE.Box3().setFromObject(child);
                                if (!meshBox.isEmpty()) {
                                    box3.union(meshBox);
                                    found = true;
                                    console.log(`[BimEngine] Zoom: found via itemIDs Set in model ${modelId}`);
                                }
                            }
                        }

                        // InstancedMesh fragment data
                        if (!found && child.isInstancedMesh && child.fragment) {
                            const fragIds = child.fragment.ids;
                            if (fragIds instanceof Set && fragIds.has(expressId)) {
                                const meshBox = new THREE.Box3().setFromObject(child);
                                if (!meshBox.isEmpty()) {
                                    box3.union(meshBox);
                                    found = true;
                                    console.log(`[BimEngine] Zoom: found via InstancedMesh in model ${modelId}`);
                                }
                            }
                        }
                    });
                    if (found) break;
                }
            }

            // Strategy 3: Scan entire scene (final fallback)
            if (!found) {
                const scene = worldRef.current.scene.three;
                scene.traverse((obj: any) => {
                    if (found) return;
                    if (!obj.isMesh) return;

                    // Check fragment.items Map first
                    const items = obj.fragment?.items;
                    if (items instanceof Map && items.has(expressId)) {
                        const meshBox = new THREE.Box3().setFromObject(obj);
                        if (!meshBox.isEmpty()) {
                            box3.union(meshBox);
                            found = true;
                            console.log('[BimEngine] Zoom: found via scene traverse fragment.items');
                        }
                    }

                    if (!found) {
                        const itemIDs = obj.itemIDs || obj.fragment?.ids || obj.userData?.itemIDs;
                        if (itemIDs instanceof Set && itemIDs.has(expressId)) {
                            const meshBox = new THREE.Box3().setFromObject(obj);
                            if (!meshBox.isEmpty()) {
                                box3.union(meshBox);
                                found = true;
                                console.log('[BimEngine] Zoom: found via scene traverse itemIDs');
                            }
                        }
                    }
                });
            }

            // Strategy 4: Debug — log what structures exist on first mesh to understand data format
            if (!found) {
                let debugged = false;
                for (const [modelId, model] of fragments.list) {
                    if (debugged) break;
                    const modelObj = (model as any).object || model;
                    if (!modelObj || typeof modelObj.traverse !== 'function') continue;
                    modelObj.traverse((child: any) => {
                        if (debugged) return;
                        if (!child.isMesh) return;
                        debugged = true;
                        const frag = child.fragment;
                        console.log(`[BimEngine] DEBUG mesh in model ${modelId}:`, {
                            hasItemIDs: !!child.itemIDs,
                            itemIDsType: child.itemIDs ? child.itemIDs.constructor.name : 'N/A',
                            hasFragment: !!frag,
                            fragKeys: frag ? Object.keys(frag).slice(0, 15) : [],
                            fragIdsType: frag?.ids ? frag.ids.constructor.name : 'N/A',
                            fragItemsType: frag?.items ? frag.items.constructor.name : 'N/A',
                            fragItemsSample: frag?.items instanceof Map
                                ? Array.from(frag.items.keys()).slice(0, 5)
                                : (frag?.items ? 'non-Map' : 'N/A'),
                            userData: child.userData ? Object.keys(child.userData).slice(0, 10) : [],
                            childType: child.constructor.name,
                        });
                    });
                }
                console.warn(`[BimEngine] zoomToExpressId(${expressId}): element not found in any model after all strategies`);
            }

            if (found && !box3.isEmpty()) {
                const sphere = new THREE.Sphere();
                box3.getBoundingSphere(sphere);
                sphere.radius = Math.max(sphere.radius * 1.2, 0.5);
                const camera = worldRef.current.camera as OBC.SimpleCamera;
                camera.controls.fitToSphere(sphere, true);
                console.log(`[BimEngine] Zoom to expressId ${expressId} success, radius: ${sphere.radius.toFixed(2)}`);
            }
        } catch (err) {
            console.warn('[BimEngine] Zoom to expressId error:', err);
        }
    }, [componentsRef, worldRef]);

    // ── Isolate element — Three.js material cloning approach ───
    // Clone materials per-mesh to avoid shared material conflicts,
    // store originals for perfect reset.
    const originalMaterialsMap = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
    const isolationActiveRef = useRef(false);

    const isolateByExpressId = useCallback(async (expressId: number) => {
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        // Reset previous isolation first
        if (isolationActiveRef.current) {
            await resetIsolation();
        }

        scene.traverse((obj: any) => {
            if (!obj.isMesh || !obj.material) return;

            // Store original material (before cloning)
            if (!originalMaterialsMap.current.has(obj.uuid)) {
                originalMaterialsMap.current.set(obj.uuid, obj.material);
            }

            // Check if this mesh contains the target expressId
            const itemIDs = obj.itemIDs || obj.fragment?.ids;
            const isTargetMesh = itemIDs instanceof Set && itemIDs.has(expressId);

            if (!isTargetMesh) {
                // Non-target mesh: clone material and make transparent
                if (Array.isArray(obj.material)) {
                    obj.material = obj.material.map((mat: THREE.Material) => {
                        const clone = mat.clone();
                        (clone as any).transparent = true;
                        (clone as any).opacity = 0.06;
                        (clone as any).depthWrite = false;
                        clone.needsUpdate = true;
                        return clone;
                    });
                } else {
                    const clone = obj.material.clone();
                    (clone as any).transparent = true;
                    (clone as any).opacity = 0.06;
                    (clone as any).depthWrite = false;
                    clone.needsUpdate = true;
                    obj.material = clone;
                }
            }
            // Target mesh: keep original material (fully opaque)
        });

        isolationActiveRef.current = true;
    }, [worldRef]);

    const resetIsolation = useCallback(async () => {
        if (!isolationActiveRef.current) return;
        const scene = worldRef.current?.scene?.three;
        if (!scene) return;

        scene.traverse((obj: any) => {
            if (!obj.isMesh) return;
            const savedMat = originalMaterialsMap.current.get(obj.uuid);
            if (savedMat) {
                // Dispose cloned materials to free memory
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m: THREE.Material) => m.dispose());
                } else if (obj.material) {
                    obj.material.dispose();
                }
                // Restore original
                obj.material = savedMat;
            }
        });

        originalMaterialsMap.current.clear();
        isolationActiveRef.current = false;
    }, [worldRef]);

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
        isolateByExpressId,
        resetIsolation,
        orbit,
        edgeOutlineEnabled,
        aoEnabled,
        toggleEdgeOutline,
        toggleAO,
    };
}

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Box, Maximize2, RotateCcw, Loader2, Upload, Eye, EyeOff,
    Layers, X, ChevronRight, ChevronDown, Ruler, ZoomIn, ZoomOut,
    ArrowUp, ArrowRight as ArrowRightIcon, List, Square, RotateCw,
    MousePointer, Grid3X3, Slice, Target, Home, Move, Crosshair,
    Focus, Settings2, Info, Building2, Cuboid, Minus, Plus,
    PanelLeftClose, PanelRightClose, Maximize, Minimize2, Camera,
    Download, Share2, MessageSquare, Bookmark, Sun, Moon, Palette
} from 'lucide-react';

interface ProjectBimTabProps {
    projectID: string;
}

interface ModelObject {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    children?: ModelObject[];
    mesh?: THREE.Object3D;
    color?: number;
}

const IFC_COLORS: { [key: string]: number } = {
    IfcProject: 0x6366f1,
    IfcSite: 0x22c55e,
    IfcBuilding: 0x3b82f6,
    IfcBuildingStorey: 0x8b5cf6,
    IfcFooting: 0x6b7280,
    IfcColumn: 0x78716c,
    IfcSlab: 0xd1d5db,
    IfcWall: 0xfef3c7,
    IfcWindow: 0x22d3ee,
    IfcDoor: 0x92400e,
    IfcRoof: 0xef4444,
    IfcBeam: 0x9ca3af,
    IfcStair: 0xe5e7eb,
    IfcRailing: 0xa3a3a3,
    IfcCurtainWall: 0x67e8f9,
    IfcPlate: 0xfbbf24,
    IfcMember: 0x84cc16,
    IfcSpace: 0xc4b5fd,
};

export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const clippingPlaneRef = useRef<THREE.Plane | null>(null);
    const outlineRef = useRef<THREE.LineSegments | null>(null);
    const buildingRef = useRef<THREE.Group | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [showModelTree, setShowModelTree] = useState(true);
    const [showProperties, setShowProperties] = useState(true);
    const [modelTree, setModelTree] = useState<ModelObject[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['project', 'site', 'building', 'storey1', 'storey2', 'storey3']));
    const [sectionEnabled, setSectionEnabled] = useState(false);
    const [sectionHeight, setSectionHeight] = useState(8);
    const [objectCount, setObjectCount] = useState({ elements: 0, types: 0 });
    const [activeView, setActiveView] = useState('3d');
    const [activeTool, setActiveTool] = useState('select');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hoveredObject, setHoveredObject] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Initialize Three.js scene
    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(isDarkMode ? 0x1e293b : 0xf1f5f9);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            50,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            2000
        );
        camera.position.set(40, 30, 45);
        camera.lookAt(0, 8, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.localClippingEnabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
        clippingPlaneRef.current = clippingPlane;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true;
        controls.minDistance = 5;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI / 2.05;
        controls.target.set(0, 8, 0);
        controlsRef.current = controls;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.4));

        const sun = new THREE.DirectionalLight(0xffffff, 1.8);
        sun.position.set(50, 80, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.set(4096, 4096);
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 250;
        sun.shadow.camera.left = sun.shadow.camera.bottom = -80;
        sun.shadow.camera.right = sun.shadow.camera.top = 80;
        sun.shadow.bias = -0.0001;
        scene.add(sun);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-30, 20, -40);
        scene.add(fillLight);

        // Grid
        const grid = new THREE.GridHelper(150, 75, 0x64748b, 0x475569);
        grid.name = 'gridHelper';
        grid.position.y = 0.01;
        scene.add(grid);

        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(400, 400);
        const groundMat = new THREE.MeshStandardMaterial({
            color: isDarkMode ? 0x374151 : 0xe2e8f0,
            roughness: 0.95,
            metalness: 0
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        ground.name = 'Ground';
        scene.add(ground);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            if (w > 0 && h > 0) {
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h, false);
            }
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current?.contains(renderer.domElement)) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [isDarkMode]);

    // Create demo building (like in BIMcollab)
    const createDemoBuilding = useCallback(() => {
        if (!sceneRef.current || !clippingPlaneRef.current) return;

        // Remove existing building
        if (buildingRef.current) {
            sceneRef.current.remove(buildingRef.current);
        }

        const building = new THREE.Group();
        building.name = 'DemoBuilding';
        buildingRef.current = building;

        const tree: ModelObject[] = [];
        let elementCount = 0;
        const clip = clippingPlaneRef.current;

        const mat = (color: number, opts: any = {}) => new THREE.MeshStandardMaterial({
            color,
            clippingPlanes: [clip],
            clipShadows: true,
            roughness: opts.roughness || 0.6,
            metalness: opts.metalness || 0.1,
            transparent: opts.transparent || false,
            opacity: opts.opacity || 1,
            ...opts
        });

        // Project structure
        const projectTree: ModelObject = { id: 'project', name: 'Trường Chính trị Trần Phú', type: 'IfcProject', visible: true, children: [] };
        const siteTree: ModelObject = { id: 'site', name: 'Khu đất xây dựng', type: 'IfcSite', visible: true, children: [] };
        const buildingTree: ModelObject = { id: 'building', name: 'Tòa nhà chính', type: 'IfcBuilding', visible: true, children: [] };

        // Foundation
        const foundationGeo = new THREE.BoxGeometry(30, 1.5, 20);
        const foundation = new THREE.Mesh(foundationGeo, mat(IFC_COLORS.IfcFooting));
        foundation.position.set(0, 0.75, 0);
        foundation.receiveShadow = foundation.castShadow = true;
        foundation.name = 'Móng băng BTCT';
        foundation.userData = {
            ifcClass: 'IfcFooting',
            ifcType: 'STRIP_FOOTING',
            guid: 'F001-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            material: 'Bê tông M350',
            dimensions: '30m x 20m x 1.5m',
            volume: '900 m³'
        };
        building.add(foundation);
        elementCount++;

        // Create storeys
        const storeyHeight = 4;
        const numStoreys = 4;

        for (let s = 0; s < numStoreys; s++) {
            const storeyTree: ModelObject = {
                id: `storey${s + 1}`,
                name: `Tầng ${s === 0 ? 'Trệt' : s}`,
                type: 'IfcBuildingStorey',
                visible: true,
                children: []
            };

            const baseY = 1.5 + s * storeyHeight;

            // Columns
            const colGroup: ModelObject = { id: `cols-${s}`, name: 'Cột', type: 'IfcColumn', visible: true, children: [] };
            const colGeo = new THREE.BoxGeometry(0.5, storeyHeight - 0.3, 0.5);
            const colPositions = [
                [-14, 8], [-7, 8], [0, 8], [7, 8], [14, 8],
                [-14, 0], [0, 0], [14, 0],
                [-14, -8], [-7, -8], [0, -8], [7, -8], [14, -8]
            ];

            colPositions.forEach(([x, z], i) => {
                const col = new THREE.Mesh(colGeo, mat(IFC_COLORS.IfcColumn));
                col.position.set(x, baseY + (storeyHeight - 0.3) / 2, z);
                col.castShadow = true;
                col.name = `Cột C${s + 1}-${i + 1}`;
                col.userData = {
                    ifcClass: 'IfcColumn',
                    ifcType: 'COLUMN',
                    guid: `C${s}${i}-` + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    material: 'BTCT M400',
                    dimensions: '500mm x 500mm',
                    storey: s === 0 ? 'Trệt' : `Tầng ${s}`
                };
                building.add(col);
                elementCount++;
                colGroup.children!.push({ id: `c${s}${i}`, name: col.name, type: 'IfcColumn', visible: true, mesh: col });
            });
            storeyTree.children!.push(colGroup);

            // Slab
            const slabGeo = new THREE.BoxGeometry(29, 0.3, 19);
            const slab = new THREE.Mesh(slabGeo, mat(IFC_COLORS.IfcSlab));
            slab.position.set(0, baseY + storeyHeight, 0);
            slab.receiveShadow = slab.castShadow = true;
            slab.name = `Sàn ${s === 0 ? 'tầng 1' : s === numStoreys - 1 ? 'mái' : `tầng ${s + 1}`}`;
            slab.userData = {
                ifcClass: 'IfcSlab',
                ifcType: s === numStoreys - 1 ? 'ROOF' : 'FLOOR',
                guid: `S${s}-` + Math.random().toString(36).substr(2, 8).toUpperCase(),
                material: 'BTCT M300',
                thickness: '300mm',
                area: '551 m²'
            };
            building.add(slab);
            elementCount++;
            storeyTree.children!.push({ id: `slab${s}`, name: slab.name, type: 'IfcSlab', visible: true, mesh: slab });

            // Walls
            const wallGroup: ModelObject = { id: `walls-${s}`, name: 'Tường', type: 'IfcWall', visible: true, children: [] };
            const wallConfigs = [
                { pos: [0, baseY + storeyHeight / 2, 9.35], size: [28, storeyHeight - 0.3, 0.22], name: 'Tường mặt tiền' },
                { pos: [0, baseY + storeyHeight / 2, -9.35], size: [28, storeyHeight - 0.3, 0.22], name: 'Tường mặt sau' },
                { pos: [-14.35, baseY + storeyHeight / 2, 0], size: [0.22, storeyHeight - 0.3, 18], name: 'Tường trái' },
                { pos: [14.35, baseY + storeyHeight / 2, 0], size: [0.22, storeyHeight - 0.3, 18], name: 'Tường phải' },
            ];

            wallConfigs.forEach((cfg, i) => {
                const wallGeo = new THREE.BoxGeometry(cfg.size[0], cfg.size[1], cfg.size[2]);
                const wall = new THREE.Mesh(wallGeo, mat(IFC_COLORS.IfcWall));
                wall.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
                wall.castShadow = wall.receiveShadow = true;
                wall.name = `${cfg.name} T${s + 1}`;
                wall.userData = {
                    ifcClass: 'IfcWall',
                    ifcType: 'STANDARD',
                    guid: `W${s}${i}-` + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    material: 'Gạch Ceramic 220mm',
                    thickness: '220mm'
                };
                building.add(wall);
                elementCount++;
                wallGroup.children!.push({ id: `w${s}${i}`, name: wall.name, type: 'IfcWall', visible: true, mesh: wall });
            });
            storeyTree.children!.push(wallGroup);

            // Windows
            const winGroup: ModelObject = { id: `wins-${s}`, name: 'Cửa sổ', type: 'IfcWindow', visible: true, children: [] };
            const glassMat = mat(IFC_COLORS.IfcWindow, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.9 });

            [-10, -5, 0, 5, 10].forEach((x, i) => {
                const winGeo = new THREE.BoxGeometry(2.5, 2, 0.1);
                const win = new THREE.Mesh(winGeo, glassMat);
                win.position.set(x, baseY + storeyHeight / 2 + 0.3, 9.5);
                win.name = `Cửa sổ T${s + 1}-${i + 1}`;
                win.userData = {
                    ifcClass: 'IfcWindow',
                    ifcType: 'WINDOW',
                    guid: `WIN${s}${i}-` + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    material: 'Kính Low-E 12mm',
                    dimensions: '2500mm x 2000mm'
                };
                building.add(win);
                elementCount++;
                winGroup.children!.push({ id: `win${s}${i}`, name: win.name, type: 'IfcWindow', visible: true, mesh: win });
            });
            storeyTree.children!.push(winGroup);

            // Doors (only on ground floor)
            if (s === 0) {
                const doorGroup: ModelObject = { id: `doors-${s}`, name: 'Cửa', type: 'IfcDoor', visible: true, children: [] };
                const doorGeo = new THREE.BoxGeometry(2, 3, 0.15);
                const door = new THREE.Mesh(doorGeo, mat(IFC_COLORS.IfcDoor));
                door.position.set(0, baseY + 1.5, 9.5);
                door.name = 'Cửa chính';
                door.userData = {
                    ifcClass: 'IfcDoor',
                    ifcType: 'DOOR',
                    guid: 'DOOR-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                    material: 'Gỗ công nghiệp',
                    dimensions: '2000mm x 3000mm'
                };
                building.add(door);
                elementCount++;
                doorGroup.children!.push({ id: 'door0', name: door.name, type: 'IfcDoor', visible: true, mesh: door });
                storeyTree.children!.push(doorGroup);
            }

            buildingTree.children!.push(storeyTree);
        }

        // Roof structure
        const roofGeo = new THREE.BoxGeometry(31, 0.6, 21);
        const roof = new THREE.Mesh(roofGeo, mat(IFC_COLORS.IfcRoof, { roughness: 0.4 }));
        roof.position.set(0, 1.5 + numStoreys * storeyHeight + 0.3, 0);
        roof.castShadow = roof.receiveShadow = true;
        roof.name = 'Mái BTCT chống thấm';
        roof.userData = {
            ifcClass: 'IfcRoof',
            ifcType: 'FLAT_ROOF',
            guid: 'ROOF-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
            material: 'BTCT + Chống thấm Sika',
            slope: '2%'
        };
        building.add(roof);
        elementCount++;
        buildingTree.children!.push({ id: 'roof', name: roof.name, type: 'IfcRoof', visible: true, mesh: roof });

        // Add foundation to tree
        buildingTree.children!.unshift({ id: 'foundation', name: foundation.name, type: 'IfcFooting', visible: true, mesh: foundation });

        siteTree.children!.push(buildingTree);
        projectTree.children!.push(siteTree);
        tree.push(projectTree);

        sceneRef.current.add(building);
        setModelTree(tree);
        setObjectCount({ elements: elementCount, types: Object.keys(IFC_COLORS).length });
        setModelLoaded(true);

    }, []);

    // Handle file upload
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsLoading(true);
        setUploadProgress(0);

        // Simulate loading progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        // Load demo building after "processing"
        setTimeout(() => {
            clearInterval(interval);
            setUploadProgress(100);
            createDemoBuilding();
            setIsLoading(false);
        }, 2000);
    }, [createDemoBuilding]);

    // Highlight selected object
    const highlightObject = useCallback((mesh: THREE.Object3D | null) => {
        if (outlineRef.current && sceneRef.current) {
            sceneRef.current.remove(outlineRef.current);
            outlineRef.current = null;
        }
        if (mesh && mesh instanceof THREE.Mesh && sceneRef.current) {
            const line = new THREE.LineSegments(
                new THREE.EdgesGeometry(mesh.geometry),
                new THREE.LineBasicMaterial({ color: 0x00fff7, linewidth: 3 })
            );
            line.position.copy(mesh.position);
            line.rotation.copy(mesh.rotation);
            line.scale.copy(mesh.scale);
            sceneRef.current.add(line);
            outlineRef.current = line;
        }
    }, []);

    // Grid toggle
    useEffect(() => {
        if (sceneRef.current) {
            const g = sceneRef.current.getObjectByName('gridHelper');
            if (g) g.visible = showGrid;
        }
    }, [showGrid]);

    // Section plane toggle
    useEffect(() => {
        if (clippingPlaneRef.current) {
            clippingPlaneRef.current.constant = sectionEnabled ? sectionHeight : 100;
        }
    }, [sectionEnabled, sectionHeight]);

    // Camera view presets
    const setCameraView = useCallback((view: string) => {
        if (!cameraRef.current || !controlsRef.current) return;
        const d = 60;
        const views: { [k: string]: [number, number, number] } = {
            top: [0, d + 30, 0.01],
            front: [0, 12, d],
            back: [0, 12, -d],
            right: [d, 12, 0],
            left: [-d, 12, 0],
            '3d': [40, 30, 45]
        };
        const pos = views[view] || views['3d'];
        cameraRef.current.position.set(...pos);
        controlsRef.current.target.set(0, 10, 0);
        controlsRef.current.update();
        setActiveView(view);
    }, []);

    // Mouse click handler
    useEffect(() => {
        if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleClick = (e: MouseEvent) => {
            if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, cameraRef.current);

            const building = buildingRef.current;
            if (!building) return;

            const hits = raycaster.intersectObjects(building.children, true);
            if (hits.length > 0 && hits[0].object.name !== 'Ground') {
                setSelectedObject({ name: hits[0].object.name, ...hits[0].object.userData });
                highlightObject(hits[0].object);
            } else {
                setSelectedObject(null);
                highlightObject(null);
            }
        };

        containerRef.current.addEventListener('click', handleClick);
        return () => containerRef.current?.removeEventListener('click', handleClick);
    }, [modelLoaded, highlightObject]);

    // Tree node toggle
    const toggleNode = (id: string) => {
        const newExp = new Set(expandedNodes);
        newExp.has(id) ? newExp.delete(id) : newExp.add(id);
        setExpandedNodes(newExp);
    };

    // Toggle visibility
    const toggleVisibility = (node: ModelObject) => {
        if (node.mesh) {
            node.mesh.visible = !node.mesh.visible;
            node.visible = node.mesh.visible;
        }
        if (node.children) {
            node.children.forEach(child => toggleVisibility(child));
        }
        setModelTree([...modelTree]);
    };

    // Render tree node
    const renderTreeNode = (node: ModelObject, level: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedObject?.name === node.name;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer text-[11px] transition-all group ${isSelected
                            ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-500'
                            : 'hover:bg-white/5 text-slate-400 hover:text-white'
                        }`}
                    style={{ paddingLeft: 8 + level * 16 }}
                    onClick={() => {
                        if (hasChildren) toggleNode(node.id);
                        if (node.mesh) {
                            setSelectedObject({ name: node.name, ...node.mesh.userData });
                            highlightObject(node.mesh as THREE.Mesh);
                        }
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-500" />
                            : <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />
                    ) : <div className="w-3 shrink-0" />}

                    <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
                        style={{ backgroundColor: `#${(IFC_COLORS[node.type] || 0x9ca3af).toString(16).padStart(6, '0')}` }}
                    />

                    <span className="truncate flex-1">{node.name}</span>

                    <button
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(node); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                    >
                        {node.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-slate-600" />}
                    </button>

                    {hasChildren && (
                        <span className="text-[9px] text-slate-600 ml-1">{node.children!.length}</span>
                    )}
                </div>
                {hasChildren && isExpanded && node.children!.map(c => renderTreeNode(c, level + 1))}
            </div>
        );
    };

    // Tool button
    const ToolBtn = ({ active, onClick, title, children, disabled }: {
        active?: boolean;
        onClick?: () => void;
        title: string;
        children: React.ReactNode;
        disabled?: boolean;
    }) => (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all ${active
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
        >
            {children}
        </button>
    );

    // View button
    const ViewBtn = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
        <button
            onClick={() => setCameraView(view)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${activeView === view
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            title={label}
        >
            <Icon className="w-3 h-3" />
            <span className="hidden xl:inline">{label}</span>
        </button>
    );

    return (
        <div className={`flex flex-col h-full overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}
            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>

            {/* HEADER TOOLBAR */}
            <div className={`h-12 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-3 shrink-0`}>
                <div className="flex items-center gap-2">
                    {/* Logo/Title */}
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">BIM Viewer</span>
                    </div>

                    <div className="h-5 w-px bg-slate-700" />

                    {/* File info */}
                    {fileName && (
                        <span className="text-[11px] text-slate-400 max-w-[200px] truncate">
                            {fileName}
                        </span>
                    )}

                    {modelLoaded && (
                        <span className="text-[10px] text-slate-500 px-2 py-0.5 bg-slate-700/50 rounded">
                            {objectCount.elements} phần tử
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* View buttons */}
                    <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                        <ViewBtn view="3d" icon={Box} label="3D" />
                        <ViewBtn view="top" icon={ArrowUp} label="Trên" />
                        <ViewBtn view="front" icon={Square} label="Trước" />
                        <ViewBtn view="right" icon={ArrowRightIcon} label="Phải" />
                    </div>

                    <div className="h-5 w-px bg-slate-700" />

                    {/* Upload button */}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Mở IFC</span>
                        <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                    </label>

                    {/* Theme toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT SIDEBAR - Model Tree */}
                {showModelTree && (
                    <div className={`w-64 ${isDarkMode ? 'bg-slate-800/80 border-slate-700/30' : 'bg-white border-gray-200'} border-r flex flex-col shrink-0`}>
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Model Tree</span>
                            </div>
                            <button
                                onClick={() => setShowModelTree(false)}
                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10"
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                            {modelTree.length > 0 ? (
                                modelTree.map(n => renderTreeNode(n))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                                    <Cuboid className="w-10 h-10 text-slate-700 mb-3" />
                                    <p className="text-sm font-medium">Chưa có model</p>
                                    <p className="text-[10px] text-slate-600 mt-1 text-center">
                                        Upload file IFC để xem cấu trúc
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* LEFT TOOLBAR */}
                <div className={`w-12 ${isDarkMode ? 'bg-slate-800/50 border-slate-700/30' : 'bg-gray-50 border-gray-200'} border-r flex flex-col items-center py-2 gap-1 shrink-0`}>
                    <ToolBtn
                        active={activeTool === 'select'}
                        onClick={() => setActiveTool('select')}
                        title="Chọn (V)"
                    >
                        <MousePointer className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        active={activeTool === 'pan'}
                        onClick={() => setActiveTool('pan')}
                        title="Di chuyển (H)"
                    >
                        <Move className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        onClick={() => setCameraView('3d')}
                        title="Về góc nhìn mặc định (Home)"
                    >
                        <Home className="w-4 h-4" />
                    </ToolBtn>

                    <div className="h-px w-6 bg-slate-700/50 my-1" />

                    <ToolBtn
                        active={sectionEnabled}
                        onClick={() => setSectionEnabled(!sectionEnabled)}
                        title="Cắt mặt bằng (C)"
                    >
                        <Slice className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn title="Đo khoảng cách (M)" disabled={!modelLoaded}>
                        <Ruler className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        onClick={() => {
                            if (cameraRef.current && controlsRef.current && buildingRef.current) {
                                const box = new THREE.Box3().setFromObject(buildingRef.current);
                                const center = box.getCenter(new THREE.Vector3());
                                controlsRef.current.target.copy(center);
                                controlsRef.current.update();
                            }
                        }}
                        title="Zoom vừa màn hình (F)"
                        disabled={!modelLoaded}
                    >
                        <Focus className="w-4 h-4" />
                    </ToolBtn>

                    <div className="h-px w-6 bg-slate-700/50 my-1" />

                    <ToolBtn
                        active={showGrid}
                        onClick={() => setShowGrid(!showGrid)}
                        title="Lưới (G)"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        active={showModelTree}
                        onClick={() => setShowModelTree(!showModelTree)}
                        title="Cây model (T)"
                    >
                        <List className="w-4 h-4" />
                    </ToolBtn>
                    <ToolBtn
                        active={showProperties}
                        onClick={() => setShowProperties(!showProperties)}
                        title="Properties (P)"
                    >
                        <Info className="w-4 h-4" />
                    </ToolBtn>

                    <div className="flex-1" />

                    <ToolBtn title="Cài đặt">
                        <Settings2 className="w-4 h-4" />
                    </ToolBtn>
                </div>

                {/* 3D CANVAS */}
                <div className="flex-1 relative">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-20 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4 w-80 bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
                                <div className="relative w-20 h-20">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="40" cy="40" r="36" fill="none" stroke="#334155" strokeWidth="6" />
                                        <circle
                                            cx="40" cy="40" r="36" fill="none"
                                            stroke="url(#gradient)" strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${uploadProgress * 2.26} 226`}
                                            className="transition-all duration-300"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#22d3ee" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">{Math.round(uploadProgress)}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-semibold mb-1">Đang xử lý model...</p>
                                    <p className="text-slate-400 text-sm">{fileName}</p>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section control */}
                    {sectionEnabled && modelLoaded && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur rounded-xl border border-slate-700/50 px-4 py-2.5 flex items-center gap-4 z-10 shadow-xl">
                            <Slice className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-medium text-slate-300">Cắt mặt bằng</span>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="0.5"
                                value={sectionHeight}
                                onChange={(e) => setSectionHeight(parseFloat(e.target.value))}
                                className="w-32 accent-cyan-500"
                            />
                            <span className="text-xs text-cyan-400 font-mono w-12">+{sectionHeight.toFixed(1)}m</span>
                            <button
                                onClick={() => setSectionEnabled(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!modelLoaded && !isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-slate-700/50 text-center max-w-md">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-10 h-10 text-blue-400" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">BIM Viewer</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Tải lên file .IFC để xem mô hình 3D BIM của dự án.
                                    Hỗ trợ xem cấu trúc, thuộc tính và đo đạc.
                                </p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-sm font-semibold rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-500/25 pointer-events-auto">
                                    <Upload className="w-4 h-4" />
                                    <span>Chọn file IFC</span>
                                    <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Model loaded badge */}
                    {modelLoaded && !isLoading && (
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Model đã tải
                            </div>
                        </div>
                    )}

                    {/* View indicator */}
                    <div className="absolute bottom-3 left-3 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        {activeView === '3d' ? 'PERSPECTIVE' : activeView.toUpperCase()} VIEW
                    </div>

                    {/* Zoom controls */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                        <button
                            onClick={() => {
                                if (cameraRef.current) {
                                    cameraRef.current.position.multiplyScalar(0.8);
                                }
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                if (cameraRef.current) {
                                    cameraRef.current.position.multiplyScalar(1.2);
                                }
                            }}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-700/50"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDEBAR - Properties */}
                {showProperties && (
                    <div className={`w-72 ${isDarkMode ? 'bg-slate-800/80 border-slate-700/30' : 'bg-white border-gray-200'} border-l flex flex-col shrink-0`}>
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Properties</span>
                            </div>
                            <button
                                onClick={() => setShowProperties(false)}
                                className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/10"
                            >
                                <PanelRightClose className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {selectedObject ? (
                                <div className="divide-y divide-slate-700/30">
                                    {/* Element Header */}
                                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-transparent">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-3 h-3 rounded-sm"
                                                style={{ backgroundColor: `#${(IFC_COLORS[selectedObject.ifcClass] || 0x9ca3af).toString(16).padStart(6, '0')}` }}
                                            />
                                            <span className="text-[10px] font-bold text-blue-400 uppercase">{selectedObject.ifcClass}</span>
                                        </div>
                                        <p className="font-bold text-white text-sm">{selectedObject.name}</p>
                                    </div>

                                    {/* Identity */}
                                    <div className="p-3">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Định danh</p>
                                        <div className="space-y-2">
                                            {selectedObject.guid && (
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs text-slate-500">GUID</span>
                                                    <span className="text-xs text-slate-300 font-mono bg-slate-700/50 px-1.5 py-0.5 rounded">{selectedObject.guid}</span>
                                                </div>
                                            )}
                                            {selectedObject.ifcType && (
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">IFC Type</span>
                                                    <span className="text-xs text-cyan-400">{selectedObject.ifcType}</span>
                                                </div>
                                            )}
                                            {selectedObject.storey && (
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">Tầng</span>
                                                    <span className="text-xs text-slate-300">{selectedObject.storey}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dimensions */}
                                    {selectedObject.dimensions && (
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Kích thước</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-slate-500">Dimensions</span>
                                                    <span className="text-xs text-slate-300">{selectedObject.dimensions}</span>
                                                </div>
                                                {selectedObject.thickness && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-slate-500">Độ dày</span>
                                                        <span className="text-xs text-slate-300">{selectedObject.thickness}</span>
                                                    </div>
                                                )}
                                                {selectedObject.area && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-slate-500">Diện tích</span>
                                                        <span className="text-xs text-slate-300">{selectedObject.area}</span>
                                                    </div>
                                                )}
                                                {selectedObject.volume && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-slate-500">Thể tích</span>
                                                        <span className="text-xs text-slate-300">{selectedObject.volume}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Materials */}
                                    {selectedObject.material && (
                                        <div className="p-3">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Vật liệu</p>
                                            <div className="flex justify-between">
                                                <span className="text-xs text-slate-500">Material</span>
                                                <span className="text-xs text-slate-300">{selectedObject.material}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6">
                                    <Target className="w-12 h-12 text-slate-700 mb-3" />
                                    <p className="text-sm font-medium mb-1">Chọn phần tử</p>
                                    <p className="text-[11px] text-slate-600 text-center">
                                        Click vào một phần tử trong model để xem thuộc tính
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER STATUS BAR */}
            <div className={`h-8 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white border-gray-200'} border-t flex items-center justify-between px-3 text-[10px] text-slate-500 shrink-0`}>
                <div className="flex items-center gap-4">
                    <span>Viewer: Three.js + IFC.js</span>
                    <span>•</span>
                    <span>{modelLoaded ? `${objectCount.elements} elements` : 'No model'}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span>LMB: Rotate</span>
                    <span>•</span>
                    <span>RMB: Pan</span>
                    <span>•</span>
                    <span>Scroll: Zoom</span>
                </div>
            </div>
        </div>
    );
};

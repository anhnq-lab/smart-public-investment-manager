
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Box, Maximize2, RotateCcw, Loader2, Upload, Eye, EyeOff,
    Layers, X, ChevronRight, ChevronDown, Ruler,
    ArrowUp, ArrowRight as ArrowRightIcon, List, Square,
    MousePointer, Copy, Grid3X3, Slice, Target, Hash, Home,
    Scan, Focus, Move, ZoomIn, Settings2, Bookmark, MessageSquare
} from 'lucide-react';

interface BIMViewerProps {
    projectId: string;
}

interface ModelObject {
    id: string;
    name: string;
    type: string;
    visible: boolean;
    children?: ModelObject[];
    mesh?: THREE.Object3D;
}

const IFC_COLORS: { [key: string]: number } = {
    IfcFooting: 0x6b7280, IfcColumn: 0x78716c, IfcSlab: 0xd1d5db,
    IfcWall: 0xfef3c7, IfcWindow: 0x22d3ee, IfcDoor: 0x92400e,
    IfcRoof: 0xef4444, IfcBeam: 0x9ca3af, IfcStair: 0xe5e7eb,
};

export const BIMViewer: React.FC<BIMViewerProps> = ({ projectId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const clippingPlaneRef = useRef<THREE.Plane | null>(null);
    const outlineRef = useRef<THREE.LineSegments | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [showGrid, setShowGrid] = useState(true);

    const [showModelTree, setShowModelTree] = useState(false);
    const [modelTree, setModelTree] = useState<ModelObject[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['structure', 'walls', 'roof', 'columns', 'slabs', 'windows']));
    const [sectionEnabled, setSectionEnabled] = useState(false);
    const [sectionHeight, setSectionHeight] = useState(8);
    const [objectCount, setObjectCount] = useState({ elements: 0 });
    const [activeView, setActiveView] = useState('3d');

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1f2e);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 2000);
        camera.position.set(30, 25, 35);
        camera.lookAt(0, 5, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.localClippingEnabled = true;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const clippingPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
        clippingPlaneRef.current = clippingPlane;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.screenSpacePanning = true;
        controls.minDistance = 5;
        controls.maxDistance = 200;
        controls.maxPolarAngle = Math.PI / 2.05;
        controls.target.set(0, 5, 0);
        controlsRef.current = controls;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        scene.add(new THREE.HemisphereLight(0x87ceeb, 0x2d5a27, 0.3));

        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(40, 60, 40);
        sun.castShadow = true;
        sun.shadow.mapSize.set(4096, 4096);
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = sun.shadow.camera.bottom = -60;
        sun.shadow.camera.right = sun.shadow.camera.top = 60;
        sun.shadow.bias = -0.0001;
        scene.add(sun);
        scene.add(new THREE.DirectionalLight(0xffffff, 0.2).translateX(-30).translateY(10).translateZ(-30));

        // Grid
        const grid = new THREE.GridHelper(120, 120, 0x3b4a6b, 0x2a3550);
        grid.name = 'gridHelper';
        grid.position.y = 0.02;
        scene.add(grid);

        // Ground
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(300, 300),
            new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'Ground';
        scene.add(ground);

        const { tree, count } = createBuilding(scene, clippingPlane);
        setModelTree(tree);
        setObjectCount({ elements: count });
        setModelLoaded(true);

        const animate = () => { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
        animate();

        const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth, h = containerRef.current.clientHeight;
            if (w > 0 && h > 0) { camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); }
        };
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 50);

        return () => { window.removeEventListener('resize', handleResize); containerRef.current?.contains(renderer.domElement) && containerRef.current.removeChild(renderer.domElement); renderer.dispose(); };
    }, []);

    const createBuilding = (scene: THREE.Scene, clip: THREE.Plane) => {
        const building = new THREE.Group();
        building.name = 'DemoBuilding';
        const tree: ModelObject[] = [];
        let count = 0;

        const mat = (color: number, opts: any = {}) => new THREE.MeshStandardMaterial({ color, clippingPlanes: [clip], clipShadows: true, roughness: opts.r || 0.6, metalness: opts.m || 0.1, ...opts });

        // Foundation
        const structTree: ModelObject = { id: 'structure', name: 'Kết cấu', type: 'IfcBuilding', visible: true, children: [] };
        const foundation = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 16), mat(IFC_COLORS.IfcFooting));
        foundation.position.set(0, 0.6, 0);
        foundation.receiveShadow = foundation.castShadow = true;
        foundation.name = 'Móng BTCT';
        foundation.userData = { ifcClass: 'IfcFooting', ifcType: 'STRIP_FOOTING', guid: 'F-' + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'Bê tông M350', volume: '422 m³' };
        building.add(foundation); count++;
        structTree.children!.push({ id: 'f1', name: foundation.name, type: 'IfcFooting', visible: true, mesh: foundation });

        // Columns
        const colTree: ModelObject = { id: 'columns', name: 'Cột', type: 'IfcColumn', visible: true, children: [] };
        const colGeo = new THREE.BoxGeometry(0.5, 15, 0.5);
        [[-10, 6], [-5, 6], [0, 6], [5, 6], [10, 6], [-10, 0], [0, 0], [10, 0], [-10, -6], [-5, -6], [0, -6], [5, -6], [10, -6]].forEach(([x, z], i) => {
            const col = new THREE.Mesh(colGeo, mat(IFC_COLORS.IfcColumn));
            col.position.set(x, 8.7, z);
            col.castShadow = true;
            col.name = `Cột C${i + 1}`;
            col.userData = { ifcClass: 'IfcColumn', ifcType: 'COLUMN', guid: `C${i}-` + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'BTCT M400', size: '500x500mm' };
            building.add(col); count++;
            colTree.children!.push({ id: `c${i}`, name: col.name, type: 'IfcColumn', visible: true, mesh: col });
        });
        structTree.children!.push(colTree);

        // Slabs
        const slabTree: ModelObject = { id: 'slabs', name: 'Sàn', type: 'IfcSlab', visible: true, children: [] };
        [1, 2, 3, 4].forEach(f => {
            const slab = new THREE.Mesh(new THREE.BoxGeometry(21, 0.25, 15), mat(IFC_COLORS.IfcSlab));
            slab.position.set(0, f * 3.8 + 1.2, 0);
            slab.receiveShadow = slab.castShadow = true;
            slab.name = `Sàn tầng ${f}`;
            slab.userData = { ifcClass: 'IfcSlab', ifcType: 'FLOOR', guid: `S${f}-` + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'BTCT M300', thickness: '250mm' };
            building.add(slab); count++;
            slabTree.children!.push({ id: `s${f}`, name: slab.name, type: 'IfcSlab', visible: true, mesh: slab });
        });
        structTree.children!.push(slabTree);
        tree.push(structTree);

        // Walls
        const wallTree: ModelObject = { id: 'walls', name: 'Tường', type: 'IfcWall', visible: true, children: [] };
        [[0, 8.5, 7.2, 21, 15, 0.22, 'Tường trước'], [0, 8.5, -7.2, 21, 15, 0.22, 'Tường sau'], [-10.4, 8.5, 0, 0.22, 15, 14, 'Tường trái'], [10.4, 8.5, 0, 0.22, 15, 14, 'Tường phải']].forEach(([x, y, z, w, h, d, name], i) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w as number, h as number, d as number), mat(IFC_COLORS.IfcWall));
            wall.position.set(x as number, y as number, z as number);
            wall.castShadow = wall.receiveShadow = true;
            wall.name = name as string;
            wall.userData = { ifcClass: 'IfcWall', ifcType: 'STANDARD', guid: `W${i}-` + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'Gạch 220mm' };
            building.add(wall); count++;
            wallTree.children!.push({ id: `w${i}`, name: wall.name, type: 'IfcWall', visible: true, mesh: wall });
        });
        tree.push(wallTree);

        // Windows
        const winTree: ModelObject = { id: 'windows', name: 'Cửa sổ', type: 'IfcWindow', visible: true, children: [] };
        const glassMat = mat(IFC_COLORS.IfcWindow, { transparent: true, opacity: 0.4, r: 0.05, m: 0.9 });
        [1, 2, 3, 4].forEach(f => {
            [-8, -4, 0, 4, 8].forEach((x, i) => {
                const win = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.08), glassMat);
                win.position.set(x, f * 3.8 - 0.3, 7.35);
                win.name = `Cửa sổ T${f}-${i + 1}`;
                win.userData = { ifcClass: 'IfcWindow', ifcType: 'WINDOW', guid: `WIN-` + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'Kính Low-E 12mm' };
                building.add(win); count++;
                if (f === 1) winTree.children!.push({ id: `win${f}${i}`, name: win.name, type: 'IfcWindow', visible: true, mesh: win });
            });
        });
        tree.push(winTree);

        // Roof
        const roofTree: ModelObject = { id: 'roof', name: 'Mái', type: 'IfcRoof', visible: true, children: [] };
        const roof = new THREE.Mesh(new THREE.BoxGeometry(23, 0.5, 17), mat(IFC_COLORS.IfcRoof, { r: 0.4 }));
        roof.position.set(0, 16.7, 0);
        roof.castShadow = roof.receiveShadow = true;
        roof.name = 'Mái BTCT';
        roof.userData = { ifcClass: 'IfcRoof', ifcType: 'FLAT_ROOF', guid: 'ROOF-' + Math.random().toString(36).substr(2, 8).toUpperCase(), material: 'BTCT + Chống thấm' };
        building.add(roof); count++;
        roofTree.children!.push({ id: 'roof1', name: roof.name, type: 'IfcRoof', visible: true, mesh: roof });
        tree.push(roofTree);

        scene.add(building);
        return { tree, count };
    };

    const highlightObject = useCallback((mesh: THREE.Object3D | null) => {
        if (outlineRef.current && sceneRef.current) { sceneRef.current.remove(outlineRef.current); outlineRef.current = null; }
        if (mesh && mesh instanceof THREE.Mesh && sceneRef.current) {
            const line = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0x00fff7, linewidth: 2 }));
            line.position.copy(mesh.position); line.rotation.copy(mesh.rotation); line.scale.copy(mesh.scale);
            sceneRef.current.add(line);
            outlineRef.current = line;
        }
    }, []);

    useEffect(() => { if (sceneRef.current) { const g = sceneRef.current.getObjectByName('gridHelper'); if (g) g.visible = showGrid; } }, [showGrid]);
    useEffect(() => { if (clippingPlaneRef.current) clippingPlaneRef.current.constant = sectionEnabled ? sectionHeight : 100; }, [sectionEnabled, sectionHeight]);

    const setCameraView = (view: string) => {
        if (!cameraRef.current || !controlsRef.current) return;
        const d = 45;
        const views: { [k: string]: [number, number, number] } = { top: [0, d + 20, 0.01], front: [0, 8, d], right: [d, 8, 0], iso: [30, 25, 35] };
        const pos = views[view] || views.iso;
        cameraRef.current.position.set(...pos);
        controlsRef.current.target.set(0, 7, 0);
        controlsRef.current.update();
        setActiveView(view);
    };

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
            const building = sceneRef.current.getObjectByName('DemoBuilding');
            if (!building) return;
            const hits = raycaster.intersectObjects(building.children, true);
            if (hits.length > 0 && hits[0].object.name !== 'Ground') {
                setSelectedObject({ name: hits[0].object.name, ...hits[0].object.userData });
                highlightObject(hits[0].object);
            } else { setSelectedObject(null); highlightObject(null); }
        };
        containerRef.current.addEventListener('click', handleClick);
        return () => containerRef.current?.removeEventListener('click', handleClick);
    }, [modelLoaded, highlightObject]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        setTimeout(() => { setIsLoading(false); alert(`✅ File "${file.name}" đã tải lên thành công!`); }, 1500);
    };

    const toggleNode = (id: string) => { const n = new Set(expandedNodes); n.has(id) ? n.delete(id) : n.add(id); setExpandedNodes(n); };

    const renderTreeNode = (node: ModelObject, lvl: number = 0) => {
        const hasKids = node.children && node.children.length > 0;
        const exp = expandedNodes.has(node.id);
        const sel = selectedObject?.name === node.name;
        return (
            <div key={node.id}>
                <div className={`flex items-center gap-1.5 py-1.5 px-2 rounded cursor-pointer text-[11px] transition-all ${sel ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-white/5 text-slate-400'}`}
                    style={{ paddingLeft: 8 + lvl * 14 }}
                    onClick={() => { if (hasKids) toggleNode(node.id); if (node.mesh) { setSelectedObject({ name: node.name, ...node.mesh.userData }); highlightObject(node.mesh as THREE.Mesh); } }}>
                    {hasKids ? (exp ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-500" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-500" />) : <div className="w-3 shrink-0" />}
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: `#${(IFC_COLORS[node.type] || 0x9ca3af).toString(16).padStart(6, '0')}` }} />
                    <span className="truncate">{node.name}</span>
                    {hasKids && <span className="text-[9px] text-slate-600 ml-auto">{node.children!.length}</span>}
                </div>
                {hasKids && exp && node.children!.map(c => renderTreeNode(c, lvl + 1))}
            </div>
        );
    };

    const ToolBtn = ({ active, onClick, title, children }: { active?: boolean; onClick?: () => void; title: string; children: React.ReactNode }) => (
        <button onClick={onClick} title={title} className={`p-2 rounded-lg transition-all ${active ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>{children}</button>
    );

    return (
        <div className="rounded-2xl overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-2xl" style={{ height: 'calc(100vh - 260px)', minHeight: '550px', maxHeight: '850px' }}>
            {/* HEADER */}
            <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/30">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">BIM Viewer</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700" />
                    <span className="text-[10px] text-slate-500 font-mono">{objectCount.elements} elements</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
                        {[
                            { view: 'top', icon: ArrowUp },
                            { view: 'front', icon: Square },
                            { view: 'right', icon: ArrowRightIcon },
                            { view: 'iso', icon: Box }
                        ].map(({ view, icon: IconComp }) => (
                            <button key={view} onClick={() => setCameraView(view)} className={`p-1.5 rounded-md transition-all ${activeView === view ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`} title={view}>
                                <IconComp className="w-3.5 h-3.5" />
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-lg shadow-cyan-500/20">
                        <Upload className="w-3.5 h-3.5" /> Upload IFC
                        <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT TOOLBAR */}
                <div className="w-12 bg-slate-800/50 border-r border-slate-700/30 flex flex-col items-center py-3 gap-1 shrink-0">
                    <ToolBtn active title="Select"><MousePointer className="w-4 h-4" /></ToolBtn>
                    <ToolBtn onClick={() => setCameraView('iso')} title="Home"><Home className="w-4 h-4" /></ToolBtn>
                    <div className="h-px w-6 bg-slate-700/50 my-1" />
                    <ToolBtn active={sectionEnabled} onClick={() => setSectionEnabled(!sectionEnabled)} title="Section"><Slice className="w-4 h-4" /></ToolBtn>
                    <ToolBtn title="Measure"><Ruler className="w-4 h-4" /></ToolBtn>
                    <ToolBtn title="Focus"><Focus className="w-4 h-4" /></ToolBtn>
                    <div className="h-px w-6 bg-slate-700/50 my-1" />
                    <ToolBtn active={showGrid} onClick={() => setShowGrid(!showGrid)} title="Grid"><Grid3X3 className="w-4 h-4" /></ToolBtn>
                    <ToolBtn active={showModelTree} onClick={() => setShowModelTree(!showModelTree)} title="Tree"><List className="w-4 h-4" /></ToolBtn>
                    <div className="flex-1" />
                    <ToolBtn title="Settings"><Settings2 className="w-4 h-4" /></ToolBtn>
                </div>

                {/* MODEL TREE */}
                {showModelTree && (
                    <div className="w-56 bg-slate-800/80 border-r border-slate-700/30 flex flex-col shrink-0">
                        <div className="p-2.5 border-b border-slate-700/30 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Model Tree</span>
                            <button onClick={() => setShowModelTree(false)} className="text-slate-500 hover:text-white p-0.5"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-700">{modelTree.map(n => renderTreeNode(n))}</div>
                    </div>
                )}

                {/* 3D CANVAS */}
                <div className="flex-1 relative">
                    <div ref={containerRef} className="w-full h-full" />

                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                                <p className="text-sm font-medium text-cyan-300">Loading model...</p>
                            </div>
                        </div>
                    )}

                    {sectionEnabled && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur rounded-xl border border-slate-700/50 px-4 py-2.5 flex items-center gap-4 z-10 shadow-xl">
                            <Scan className="w-4 h-4 text-cyan-400" />
                            <span className="text-[11px] font-medium text-slate-300">Section Height</span>
                            <input type="range" min="1" max="18" step="0.5" value={sectionHeight} onChange={(e) => setSectionHeight(parseFloat(e.target.value))} className="w-28 accent-cyan-500" />
                            <span className="text-[11px] text-cyan-400 font-mono w-10">{sectionHeight.toFixed(1)}m</span>
                        </div>
                    )}

                    {modelLoaded && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Model Loaded
                        </div>
                    )}

                    {/* View Cube Hint */}
                    <div className="absolute bottom-3 left-3 text-[9px] text-slate-500 uppercase tracking-widest">{activeView.toUpperCase()} VIEW</div>
                </div>

                {/* PROPERTIES PANEL */}
                <div className="w-64 bg-slate-800/80 border-l border-slate-700/30 flex flex-col shrink-0">
                    <div className="p-3 border-b border-slate-700/30 bg-gradient-to-r from-slate-800 to-slate-800/50">
                        <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Properties</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto text-[11px]">
                        {selectedObject ? (
                            <div className="divide-y divide-slate-700/30">
                                <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-transparent">
                                    <p className="text-[9px] font-bold text-cyan-400 uppercase mb-1">Element</p>
                                    <p className="font-bold text-white">{selectedObject.name}</p>
                                </div>
                                <div className="p-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Identity</p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between"><span className="text-slate-500">GUID</span><span className="text-slate-300 font-mono text-[9px]">{selectedObject.guid}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Geometry</span><span className="text-slate-300">Parametric</span></div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">IFC Properties</p>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between"><span className="text-slate-500">IFC Class</span><span className="text-cyan-300">{selectedObject.ifcClass}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">IFC Type</span><span className="text-slate-300">{selectedObject.ifcType}</span></div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Materials</p>
                                    <div className="space-y-1.5">
                                        {selectedObject.material && <div className="flex justify-between"><span className="text-slate-500">Material</span><span className="text-slate-300">{selectedObject.material}</span></div>}
                                        {selectedObject.size && <div className="flex justify-between"><span className="text-slate-500">Size</span><span className="text-slate-300">{selectedObject.size}</span></div>}
                                        {selectedObject.thickness && <div className="flex justify-between"><span className="text-slate-500">Thickness</span><span className="text-slate-300">{selectedObject.thickness}</span></div>}
                                        {selectedObject.volume && <div className="flex justify-between"><span className="text-slate-500">Volume</span><span className="text-slate-300">{selectedObject.volume}</span></div>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4">
                                <Target className="w-8 h-8 text-slate-700 mb-2" />
                                <p className="text-sm font-medium">Select Element</p>
                                <p className="text-[10px] text-slate-600 mt-1">Click on model to view properties</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="h-9 bg-gradient-to-r from-slate-800 to-slate-900 border-t border-slate-700/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-500">Powered by <span className="text-cyan-400">Three.js</span> + <span className="text-cyan-400">IFC.js</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Maximize2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 text-slate-500 hover:text-white transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                </div>
            </div>
        </div>
    );
};

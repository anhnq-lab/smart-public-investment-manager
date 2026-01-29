import React, { useEffect, useRef, useState } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Loader2, Upload, Box, Scissors } from 'lucide-react';
import { Color } from 'three';

interface ProjectBimTabProps {
    projectID: string;
}

export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<IfcViewerAPI | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            // Initialize viewer with Three.js Color object
            const viewer = new IfcViewerAPI({
                container,
                backgroundColor: new Color(0xffffff)
            });

            // Basic Setup
            viewer.grid.setGrid();
            viewer.axes.setAxes();

            viewerRef.current = viewer;

            // Cleanup
            return () => {
                viewer.dispose();
                viewerRef.current = null;
            };
        }
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !viewerRef.current) return;

        try {
            setIsLoading(true);
            // Load IFC File
            await viewerRef.current.IFC.loadIfc(file, true);
            setIsLoaded(true);
        } catch (error) {
            console.error("Error loading IFC:", error);
            alert("Không thể tải mô hình IFC. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleClipping = () => {
        if (viewerRef.current) {
            viewerRef.current.clipper.active = !viewerRef.current.clipper.active;
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
            {/* Toolbar */}
            <div className="bg-white px-4 py-2 border-b border-gray-200 flex items-center gap-3">
                <div className="flex items-center gap-2 mr-4">
                    <Box className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-700">Mô hình BIM (IFC)</span>
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    <span>Mở file IFC</span>
                    <input type="file" accept=".ifc" className="hidden" onChange={handleFileUpload} />
                </label>

                {isLoaded && (
                    <>
                        <div className="h-6 w-px bg-gray-200 mx-2"></div>

                        <button
                            onClick={toggleClipping}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 tooltip"
                            title="Cắt mặt phẳng"
                        >
                            <Scissors className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* Viewer Container */}
            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={containerRef}
                    className="absolute inset-0 outline-none"
                    id="viewer-container"
                ></div>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-gray-600 font-medium">Đang xử lý mô hình...</p>
                        </div>
                    </div>
                )}

                {!isLoaded && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-gray-100 text-center max-w-sm">
                            <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-800 font-bold mb-1">Chưa có mô hình</h3>
                            <p className="text-sm text-gray-500">
                                Vui lòng tải lên file định dạng .IFC để xem mô hình 3D của dự án.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend / Status */}
            <div className="bg-white px-4 py-1.5 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
                <span>Viewer: web-ifc-viewer</span>
                <span>Controls: Left Click (Rotate) | Right Click (Pan) | Scroll (Zoom)</span>
            </div>
        </div>
    );
};

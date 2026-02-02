import React, { useEffect, useRef, useState } from 'react';
import { IfcViewerAPI } from 'web-ifc-viewer';
import { Loader2, Upload, Box, Scissors, AlertCircle, CheckCircle, FileWarning } from 'lucide-react';
import { Color } from 'three';

interface ProjectBimTabProps {
    projectID: string;
}

type LoadStatus = 'idle' | 'initializing' | 'loading' | 'processing' | 'success' | 'error';

interface StatusInfo {
    status: LoadStatus;
    message: string;
    progress: number;
}

export const ProjectBimTab: React.FC<ProjectBimTabProps> = ({ projectID }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<IfcViewerAPI | null>(null);
    const [statusInfo, setStatusInfo] = useState<StatusInfo>({
        status: 'idle',
        message: '',
        progress: 0
    });
    const [isLoaded, setIsLoaded] = useState(false);
    const [viewerReady, setViewerReady] = useState(false);
    const [fileName, setFileName] = useState<string>('');

    useEffect(() => {
        if (containerRef.current && !viewerRef.current) {
            const container = containerRef.current;

            setStatusInfo({ status: 'initializing', message: 'Đang khởi tạo viewer...', progress: 0 });

            try {
                // Initialize viewer with Three.js Color object
                const viewer = new IfcViewerAPI({
                    container,
                    backgroundColor: new Color(0xf8fafc)
                });

                // Set WASM path - try different paths
                viewer.IFC.setWasmPath("/wasm/");

                // Basic Setup
                viewer.grid.setGrid();
                viewer.axes.setAxes();

                viewerRef.current = viewer;
                setViewerReady(true);
                setStatusInfo({ status: 'idle', message: '', progress: 0 });

            } catch (error: any) {
                console.error('Viewer init error:', error);
                setStatusInfo({
                    status: 'error',
                    message: `Lỗi khởi tạo: ${error.message}`,
                    progress: 0
                });
            }

            // Cleanup
            return () => {
                if (viewerRef.current) {
                    viewerRef.current.dispose();
                    viewerRef.current = null;
                }
            };
        }
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!viewerRef.current) {
            setStatusInfo({
                status: 'error',
                message: 'Viewer chưa sẵn sàng. Vui lòng tải lại trang.',
                progress: 0
            });
            return;
        }

        // Validate file
        if (!file.name.toLowerCase().endsWith('.ifc')) {
            setStatusInfo({
                status: 'error',
                message: 'Định dạng không hợp lệ. Vui lòng chọn file .IFC',
                progress: 0
            });
            return;
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 100) {
            setStatusInfo({
                status: 'error',
                message: `File quá lớn (${fileSizeMB.toFixed(1)}MB). Giới hạn 100MB`,
                progress: 0
            });
            return;
        }

        setFileName(file.name);
        setStatusInfo({
            status: 'loading',
            message: `Đang tải "${file.name}" (${fileSizeMB.toFixed(1)}MB)...`,
            progress: 0
        });

        try {
            // Load IFC File with Progress Callback
            await viewerRef.current.IFC.loadIfc(
                file,
                true,
                (error) => {
                    console.error('IFC Load Error:', error);
                    setStatusInfo({
                        status: 'error',
                        message: 'Lỗi đọc file IFC. File có thể bị hỏng hoặc không hợp lệ.',
                        progress: 0
                    });
                },
                (progressEvent) => {
                    const { total, loaded } = progressEvent;
                    const percent = Math.round((loaded / total) * 100);

                    let message = `Đang tải: ${percent}%`;
                    if (percent > 80) {
                        message = 'Đang xử lý geometry...';
                    } else if (percent > 50) {
                        message = 'Đang phân tích cấu trúc...';
                    }

                    setStatusInfo({
                        status: percent > 80 ? 'processing' : 'loading',
                        message,
                        progress: percent
                    });
                }
            );

            setIsLoaded(true);
            setStatusInfo({
                status: 'success',
                message: `✓ Đã tải "${file.name}" thành công!`,
                progress: 100
            });

            // Auto hide success message after 3s
            setTimeout(() => {
                setStatusInfo(prev =>
                    prev.status === 'success'
                        ? { status: 'idle', message: '', progress: 0 }
                        : prev
                );
            }, 3000);

        } catch (error: any) {
            console.error("Error loading IFC:", error);
            setStatusInfo({
                status: 'error',
                message: `Lỗi: ${error.message || 'Không thể tải mô hình'}`,
                progress: 0
            });
        }
    };

    const toggleClipping = () => {
        if (viewerRef.current) {
            viewerRef.current.clipper.active = !viewerRef.current.clipper.active;
        }
    };

    const getStatusColor = () => {
        switch (statusInfo.status) {
            case 'loading':
            case 'processing':
            case 'initializing':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'success':
                return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-700';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    const getStatusIcon = () => {
        switch (statusInfo.status) {
            case 'loading':
            case 'processing':
            case 'initializing':
                return <Loader2 className="w-5 h-5 animate-spin" />;
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return null;
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
                    <input
                        type="file"
                        accept=".ifc"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={statusInfo.status === 'loading' || statusInfo.status === 'processing'}
                    />
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

                {/* Viewer Ready Indicator */}
                <div className="ml-auto flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${viewerReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-xs text-gray-400">
                        {viewerReady ? 'Viewer sẵn sàng' : 'Đang khởi tạo...'}
                    </span>
                </div>
            </div>

            {/* Status Bar - Always visible when there's a status */}
            {statusInfo.status !== 'idle' && (
                <div className={`px-4 py-2 border-b flex items-center gap-3 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    <span className="text-sm font-medium flex-1">{statusInfo.message}</span>

                    {(statusInfo.status === 'loading' || statusInfo.status === 'processing') && (
                        <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${statusInfo.progress}%` }}
                                />
                            </div>
                            <span className="text-xs font-mono w-8">{statusInfo.progress}%</span>
                        </div>
                    )}

                    {statusInfo.status === 'error' && (
                        <button
                            onClick={() => setStatusInfo({ status: 'idle', message: '', progress: 0 })}
                            className="text-red-500 hover:text-red-700 text-sm"
                        >
                            Đóng
                        </button>
                    )}
                </div>
            )}

            {/* Viewer Container */}
            <div className="relative flex-1 overflow-hidden">
                <div
                    ref={containerRef}
                    className="absolute inset-0 outline-none"
                    id="viewer-container"
                ></div>

                {/* Loading Overlay */}
                {(statusInfo.status === 'loading' || statusInfo.status === 'processing') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 transition-all duration-300">
                        <div className="flex flex-col items-center gap-4 w-72 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                            <div className="relative">
                                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-600">{statusInfo.progress}%</span>
                                </div>
                            </div>
                            <div className="w-full space-y-2 text-center">
                                <p className="text-gray-700 font-semibold text-sm">{statusInfo.message}</p>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300 ease-out"
                                        style={{ width: `${statusInfo.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">
                                    {statusInfo.status === 'processing'
                                        ? 'Đang render geometry...'
                                        : `${fileName}`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoaded && statusInfo.status !== 'loading' && statusInfo.status !== 'processing' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-gray-100 text-center max-w-sm">
                            <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-800 font-bold mb-1">Chưa có mô hình</h3>
                            <p className="text-sm text-gray-500">
                                Vui lòng tải lên file định dạng .IFC để xem mô hình 3D của dự án.
                            </p>
                            {!viewerReady && (
                                <div className="mt-3 flex items-center justify-center gap-2 text-amber-600 text-xs">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Đang khởi tạo viewer...
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Success Indicator */}
                {isLoaded && statusInfo.status === 'idle' && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Mô hình đã tải
                    </div>
                )}
            </div>

            {/* Legend / Status */}
            <div className="bg-white px-4 py-1.5 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
                <span>Viewer: web-ifc-viewer | {isLoaded ? fileName : 'Chưa có file'}</span>
                <span>Controls: Left Click (Rotate) | Right Click (Pan) | Scroll (Zoom)</span>
            </div>
        </div>
    );
};

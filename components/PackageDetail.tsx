
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    mockBiddingPackages, mockProjects, mockContractors, mockContracts, mockPayments, 
    formatFullCurrency, mockPackageIssues, analyzePackageHealth, formatCurrency 
} from '../mockData';
import { PackageStatus, ContractStatus, PackageIssue, RiskLevel, PackageHealthCheck, PaymentStatus } from '../types';
import { 
    ArrowLeft, FileText, Calendar, DollarSign, 
    Users, Clock, CheckCircle2, AlertCircle, 
    Gavel, Award, FileCheck, Download, ExternalLink, HardHat,
    FileSignature, ShieldCheck, ArrowRight, Activity, TrendingUp, AlertTriangle, List, PlusCircle, BrainCircuit,
    Building2, Loader2, ChevronDown
} from 'lucide-react';
import { Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const PackageDetail: React.FC = () => {
    const { projectId, packageId } = useParams<{ projectId: string, packageId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'info' | 'financials' | 'issues' | 'bidders' | 'documents'>('info');
    const [healthCheck, setHealthCheck] = useState<PackageHealthCheck | null>(null);
    const [isLoadingHealth, setIsLoadingHealth] = useState(false);

    const pkg = mockBiddingPackages.find(p => p.PackageID === packageId);
    const project = mockProjects.find(p => p.ProjectID === projectId);
    const contract = mockContracts.find(c => c.PackageID === packageId);
    const payments = mockPayments.filter(p => p.ContractID === contract?.ContractID);
    const issues = mockPackageIssues.filter(i => i.PackageID === packageId);

    // Initial Data Fetch Simulation for AI Health Check
    useEffect(() => {
        if (pkg && activeTab === 'issues') {
            setIsLoadingHealth(true);
            analyzePackageHealth(pkg.PackageID).then(res => {
                setHealthCheck(res);
                setIsLoadingHealth(false);
            });
        }
    }, [activeTab, pkg]);

    if (!pkg || !project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy gói thầu</h2>
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Quay lại</button>
            </div>
        );
    }

    const winningContractor = mockContractors.find(c => c.ContractorID === pkg.WinningContractorID);
    const totalDisbursed = payments.filter(p => p.Status === PaymentStatus.Transferred).reduce((acc, p) => acc + p.Amount, 0);
    const disbursedPercent = contract ? (totalDisbursed / contract.Value) * 100 : 0;

    // Charts Data
    const financialData = [
        { name: 'Giá gói thầu', value: pkg.Price, fill: '#94a3b8' },
        { name: 'Giá trúng thầu', value: pkg.WinningPrice || 0, fill: '#3b82f6' },
        { name: 'Giá trị HĐ', value: contract?.Value || 0, fill: '#8b5cf6' },
        { name: 'Đã giải ngân', value: totalDisbursed, fill: '#10b981' },
    ];

    const getRiskColor = (level?: RiskLevel) => {
        switch (level) {
            case RiskLevel.Critical: return 'bg-red-100 text-red-700 border-red-200';
            case RiskLevel.High: return 'bg-orange-100 text-orange-700 border-orange-200';
            case RiskLevel.Medium: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <button onClick={() => navigate(`/projects/${projectId}`)} className="mt-1 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{pkg.NotificationCode || pkg.PackageNumber}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    pkg.Status === PackageStatus.Awarded ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {pkg.Status === PackageStatus.Awarded ? 'Đã có KQLCNT' : pkg.Status === PackageStatus.Bidding ? 'Đang mời thầu' : 'Đang thực hiện'}
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-gray-900 leading-tight max-w-4xl">{pkg.PackageName}</h1>
                            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                Thuộc dự án: <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/projects/${projectId}`)}>{project.ProjectName}</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* Header Action Buttons for PM */}
                    <div className="flex gap-2 mt-4 md:mt-0">
                         <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm">
                             <Download className="w-4 h-4" /> Báo cáo
                         </button>
                         <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 text-sm shadow-lg shadow-blue-200">
                             <Activity className="w-4 h-4" /> Cập nhật tiến độ
                         </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Giá gói thầu</p>
                        <p className="text-lg font-bold text-gray-800">{formatFullCurrency(pkg.Price)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-semibold uppercase mb-1">Đã giải ngân</p>
                        <div className="flex items-end gap-2">
                             <p className="text-lg font-bold text-emerald-700">{formatFullCurrency(totalDisbursed)}</p>
                             <span className="text-xs font-bold text-emerald-600 mb-1">({contract?.Value ? disbursedPercent.toFixed(1) : 0}%)</span>
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Thời gian thực hiện</p>
                        <p className="text-lg font-bold text-blue-700 flex items-center gap-2">
                            {pkg.Duration || "Theo HĐ"}
                        </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                         <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Thời điểm đóng thầu</p>
                         <p className="text-lg font-bold text-purple-700">{pkg.BidClosingDate || 'Chưa xác định'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 flex gap-6 px-2 overflow-x-auto">
                {[
                    { id: 'info', label: 'Thông tin chung', icon: FileText },
                    { id: 'financials', label: 'Tài chính & Hiệu quả', icon: DollarSign },
                    { id: 'issues', label: 'Quản lý Rủi ro', icon: AlertTriangle },
                    { id: 'bidders', label: 'Nhà thầu & KQLCNT', icon: Users },
                    { id: 'documents', label: 'Hồ sơ tài liệu', icon: FileCheck },
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- TAB: INFO (DETAILED VIEW) --- */}
                {activeTab === 'info' && (
                    <div className="lg:col-span-3 space-y-8 max-w-5xl mx-auto">
                        
                        {/* 1. Thông tin cơ bản */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin cơ bản</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Mã TBMT</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.NotificationCode || '---'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Ngày đăng tải</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.PostingDate || '---'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Phiên bản thay đổi</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1 flex items-center gap-1">
                                        00 <ChevronDown className="w-4 h-4 text-blue-500" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Thông tin chung của KHLCNT */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin chung của KHLCNT</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Mã KHLCNT</span>
                                    <span className="text-sm font-medium text-blue-600 flex-1 cursor-pointer hover:underline">{pkg.KHLCNTCode || '---'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Phân loại KHLCNT</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Chi đầu tư phát triển</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Tên dự án</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{project.ProjectName}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Thông tin gói thầu */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin gói thầu</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Quy trình áp dụng</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Luật Đấu thầu/ Áp dụng Luật Đấu thầu</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Tên gói thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.PackageName}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Chủ đầu tư</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{project.InvestorName}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Chi tiết nguồn vốn</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Nguồn vốn ngân sách tỉnh giai đoạn 2021-2025: 26,0 tỷ đồng; nguồn vốn ngân sách tỉnh giai đoạn 2026-2030: 79,8 tỷ đồng</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Lĩnh vực</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.Field || 'Hỗn hợp'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Hình thức lựa chọn nhà thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.SelectionMethod}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Loại hợp đồng</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.ContractType}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Trong nước/ Quốc tế</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Trong nước</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Phương thức lựa chọn nhà thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Một giai đoạn hai túi hồ sơ</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Thời gian thực hiện gói thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.Duration || '---'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Gói thầu có nhiều phần/lô</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Không</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. Cách thức dự thầu & Thông tin dự thầu */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Cách thức dự thầu & Thông tin dự thầu</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Hình thức dự thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Qua mạng</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Địa điểm phát hành e-HSMT</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">https://muasamcong.mpi.gov.vn</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Chi phí nộp e-HSDT</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.BidFee ? formatCurrency(pkg.BidFee) : '330.000 VND'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Địa điểm nhận e-HSDT</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">https://muasamcong.mpi.gov.vn</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Địa điểm thực hiện gói thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">Tỉnh Hà Tĩnh</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Thời điểm đóng thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.BidClosingDate}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Thời điểm mở thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.BidClosingDate}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Địa điểm mở thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">https://muasamcong.mpi.gov.vn</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Hiệu lực hồ sơ dự thầu</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">120 ngày</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. Thông tin quyết định phê duyệt */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h3 className="font-bold text-gray-800 text-sm uppercase">Thông tin quyết định phê duyệt</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-4">
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Số quyết định phê duyệt</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.DecisionNumber || '241'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Ngày phê duyệt</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.DecisionDate || '20/11/2025'}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Cơ quan ban hành quyết định</span>
                                    <span className="text-sm font-medium text-gray-900 flex-1">{pkg.DecisionAgency || project.InvestorName}</span>
                                </div>
                                <div className="flex border-b border-gray-100 pb-2">
                                    <span className="text-sm text-gray-500 w-1/3">Quyết định phê duyệt</span>
                                    <div className="flex-1">
                                        <a href="#" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded">
                                            {pkg.DecisionFile || 'QuyetDinhPheDuyet.pdf'} <Download className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- TAB: FINANCIALS --- */}
                {activeTab === 'financials' && (
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-600" /> Hiệu quả tài chính
                            </h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={financialData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                                        <RechartsTooltip formatter={(value) => formatFullCurrency(Number(value))} />
                                        <Bar dataKey="value" barSize={30} radius={[0, 4, 4, 0]}>
                                            {financialData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-blue-600" /> Chi tiết dòng tiền
                            </h3>
                            
                            <div className="flex-1 space-y-6">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-600">Tiết kiệm qua đấu thầu</span>
                                        <span className="text-sm font-bold text-emerald-600">
                                            {pkg.WinningPrice ? formatFullCurrency(pkg.Price - pkg.WinningPrice) : '0 ₫'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div 
                                            className="bg-emerald-500 h-1.5 rounded-full" 
                                            style={{ width: `${pkg.WinningPrice ? ((pkg.Price - pkg.WinningPrice)/pkg.Price)*100 : 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-right">
                                        Tỷ lệ giảm giá: {pkg.WinningPrice ? ((1 - pkg.WinningPrice/pkg.Price)*100).toFixed(2) : 0}%
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700">Lịch sử thanh toán gần nhất</h4>
                                    {payments.length > 0 ? payments.map(pay => (
                                        <div key={pay.PaymentID} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Đợt {pay.BatchNo} - {pay.Type === 'Advance' ? 'Tạm ứng' : 'KL hoàn thành'}</p>
                                                <p className="text-xs text-gray-400">GD: {pay.TreasuryRef}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-900">{formatFullCurrency(pay.Amount)}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                                    pay.Status === PaymentStatus.Transferred ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {pay.Status === PaymentStatus.Transferred ? 'Đã chuyển' : 'Chờ duyệt'}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-500 italic">Chưa có dữ liệu thanh toán.</p>
                                    )}
                                </div>
                                
                                <button onClick={() => navigate('/payments')} className="w-full mt-auto py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                                    Xem toàn bộ lịch sử thanh toán
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: ISSUES & RISK --- */}
                {activeTab === 'issues' && (
                    <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* AI Analysis Card */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                                    <BrainCircuit className="w-5 h-5 text-indigo-300" />
                                    AI Health Check
                                </h3>

                                {isLoadingHealth ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                                        <p className="text-sm text-indigo-200">Đang phân tích dữ liệu...</p>
                                    </div>
                                ) : healthCheck ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-center">
                                            <div className="relative w-32 h-32 flex items-center justify-center">
                                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-gray-700"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                    />
                                                    <path
                                                        className={`${healthCheck.score > 80 ? 'text-emerald-500' : healthCheck.score > 50 ? 'text-yellow-500' : 'text-red-500'}`}
                                                        strokeDasharray={`${healthCheck.score}, 100`}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <span className="text-3xl font-bold">{healthCheck.score}</span>
                                                    <span className="text-[10px] text-indigo-300 uppercase">Điểm số</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                            <p className="text-xs text-indigo-300 uppercase font-bold mb-2">Đánh giá rủi ro</p>
                                            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mb-3 ${getRiskColor(healthCheck.riskLevel)}`}>
                                                {healthCheck.riskLevel === 'Low' ? 'Thấp - An toàn' : 
                                                 healthCheck.riskLevel === 'Medium' ? 'Trung bình - Cần chú ý' : 
                                                 'Cao - Nguy hiểm'}
                                            </div>
                                            <ul className="space-y-1">
                                                {healthCheck.factors.map((factor, idx) => (
                                                    <li key={idx} className="text-sm flex items-start gap-2">
                                                        <span className="mt-1.5 w-1 h-1 bg-indigo-400 rounded-full"></span>
                                                        <span className="text-indigo-100">{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-indigo-600/50 rounded-xl p-4 border border-indigo-500/30">
                                            <p className="text-xs text-indigo-200 uppercase font-bold mb-1">Khuyến nghị</p>
                                            <p className="text-sm font-medium">{healthCheck.recommendation}</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <List className="w-5 h-5 text-gray-600" /> Danh sách Vấn đề (Issues)
                                </h3>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                                    <PlusCircle className="w-4 h-4" /> Báo cáo sự cố
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {issues.length > 0 ? issues.map(issue => (
                                    <div key={issue.IssueID} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow bg-white group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRiskColor(issue.Severity)}`}>
                                                    {issue.Severity}
                                                </span>
                                                <h4 className="font-bold text-gray-800">{issue.Title}</h4>
                                            </div>
                                            <span className="text-xs text-gray-400">{issue.ReportedDate}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{issue.Description}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-4 text-gray-500">
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {issue.Reporter}</span>
                                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                    issue.Status === 'Resolved' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {issue.Status === 'Resolved' ? 'Đã xử lý' : issue.Status === 'InProgress' ? 'Đang xử lý' : 'Mới mở'}
                                                </span>
                                            </div>
                                            <button className="text-blue-600 font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                                        <p className="text-gray-500">Không có vấn đề rủi ro nào được ghi nhận.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: BIDDERS --- */}
                {activeTab === 'bidders' && (
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                <tr>
                                    <th className="px-6 py-4">Tên nhà thầu</th>
                                    <th className="px-6 py-4 text-right">Giá dự thầu</th>
                                    <th className="px-6 py-4 text-center">Điểm kỹ thuật</th>
                                    <th className="px-6 py-4 text-center">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Mock Data for Display */}
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">Công ty CP Xây dựng A</td>
                                    <td className="px-6 py-4 text-right font-mono">{formatFullCurrency(pkg.Price * 0.95)}</td>
                                    <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">92/100</span></td>
                                    <td className="px-6 py-4 text-center text-gray-400">Trượt thầu</td>
                                </tr>
                                <tr className="bg-emerald-50/30">
                                    <td className="px-6 py-4 font-medium text-gray-900">{winningContractor?.FullName || "Nhà thầu trúng thầu"}</td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">{formatFullCurrency(pkg.WinningPrice || 0)}</td>
                                    <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">95/100</span></td>
                                    <td className="px-6 py-4 text-center text-emerald-600 font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4"/> Trúng thầu</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* --- TAB: DOCUMENTS --- */}
                {activeTab === 'documents' && (
                    <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">E-HSMT.pdf</h4>
                                        <p className="text-xs text-gray-500">Hồ sơ mời thầu • 2.5 MB</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-blue-600"><Download className="w-5 h-5" /></button>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">QD-Phe-duyet-KHLCNT.pdf</h4>
                                        <p className="text-xs text-gray-500">Quyết định phê duyệt • 1.1 MB</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-blue-600"><Download className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PackageDetail;

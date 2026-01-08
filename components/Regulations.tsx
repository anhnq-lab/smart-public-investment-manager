import React, { useState, useMemo } from 'react';
import { 
    Search, 
    ChevronRight, 
    BookOpen, 
    Users, 
    Layout, 
    FileText, 
    Share2, 
    MoreHorizontal, 
    MessageSquare, 
    CornerDownRight, 
    User, 
    Info, 
    Gavel, 
    Shield, 
    Clock, 
    CheckCircle2, 
    Send,
    BarChart3,
    PenTool,
    Briefcase,
    TrendingUp,
    ArrowDownCircle,
    UserCheck,
    Award,
    Network,
    FileCheck,
    ArrowRight,
    Landmark,
    HardHat,
    Map
} from 'lucide-react';

// --- TYPES ---
interface Comment {
    id: string;
    user: string;
    avatar: string;
    content: string;
    date: string;
}

interface Article {
    id: string; // e.g., "1.1", "10.10"
    code: string; // e.g., "Điều 1"
    title: string;
    content: string | React.ReactNode;
    type?: 'text' | 'chart' | 'list';
    comments?: Comment[];
    subItems?: string[];
}

interface Chapter {
    id: string;
    code: string; // e.g., "Chương I"
    title: string;
    icon?: React.ElementType;
    articles: Article[];
    type?: 'text' | 'chart' | 'list';
}

// --- VISUAL COMPONENTS ---

const OrgChart = () => {
    return (
        <div className="py-8 overflow-x-auto flex justify-center">
            <div className="flex flex-col items-center min-w-[700px] max-w-full">
                {/* Level 1: Lãnh đạo Ban */}
                <div className="relative z-10 mb-8 group">
                    <div className="bg-orange-600 text-white px-8 py-3 rounded-xl shadow-lg border-2 border-white ring-1 ring-gray-200 text-center relative cursor-default hover:scale-105 transition-transform">
                        <h4 className="font-black text-sm uppercase tracking-tight">GIÁM ĐỐC</h4>
                        <div className="w-2 h-2 bg-white rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                    {/* Connection to VDs */}
                    <div className="absolute top-full left-1/2 w-px h-6 bg-gray-300 -translate-x-1/2"></div>
                </div>

                {/* Level 2: Phó Giám đốc */}
                <div className="relative z-10 mb-10 w-full flex justify-center">
                    {/* Horizontal bar for VDs */}
                    <div className="bg-white border border-gray-200 px-6 py-2 rounded-lg shadow-sm text-center relative z-10">
                        <h4 className="font-bold text-xs uppercase text-blue-700">CÁC PHÓ GIÁM ĐỐC</h4>
                        <div className="w-2 h-2 bg-gray-300 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                    {/* Line down to Departments */}
                    <div className="absolute top-full left-1/2 w-px h-8 bg-gray-300 -translate-x-1/2"></div>
                </div>

                {/* Level 3: Departments */}
                <div className="relative w-full flex justify-between items-start gap-2">
                    {/* Connector Line Top */}
                    <div className="absolute -top-2 left-[7%] right-[7%] h-px bg-gray-300"></div>
                    
                    {/* Dept Nodes */}
                    {[
                        { name: "Phòng Hành chính - Tổng hợp", color: "bg-blue-50 text-blue-700 border-blue-200" },
                        { name: "Phòng Kế hoạch - Đấu thầu", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                        { name: "Phòng Kỹ thuật - Thẩm định", color: "bg-purple-50 text-purple-700 border-purple-200" },
                        { name: "Phòng Quản lý dự án 1", color: "bg-orange-50 text-orange-700 border-orange-200" },
                        { name: "Phòng Quản lý dự án 2", color: "bg-orange-50 text-orange-700 border-orange-200" },
                        { name: "Phòng Quản lý dự án 3", color: "bg-orange-50 text-orange-700 border-orange-200" },
                        { name: "Phòng Phát triển dịch vụ", color: "bg-teal-50 text-teal-700 border-teal-200" },
                    ].map((dept, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1 relative group">
                            {/* Vertical Connector */}
                            <div className="w-px h-2 bg-gray-300 mb-1 absolute -top-3"></div>
                            
                            <div className={`w-full p-2 rounded-lg border ${dept.color} shadow-sm text-center hover:shadow-md transition-all h-20 flex items-center justify-center cursor-default`}>
                                <p className="text-[10px] font-bold leading-tight uppercase">{dept.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Note */}
                <div className="mt-8 text-[10px] text-gray-400 italic text-center max-w-lg">
                    * Sơ đồ tổ chức thể hiện mối quan hệ chỉ đạo, điều hành. Các Phó Giám đốc phụ trách các lĩnh vực và phòng chuyên môn theo phân công của Giám đốc.
                </div>
            </div>
        </div>
    );
};

const SubmissionProcessChart = () => {
    const steps = [
        {
            id: 1,
            title: "Soạn thảo & Đề xuất",
            actor: "Chuyên viên / Phòng CM",
            desc: "Chuẩn bị hồ sơ đầy đủ, dự thảo văn bản, tờ trình.",
            icon: PenTool,
            color: "bg-gray-100 text-gray-600 border-gray-200"
        },
        {
            id: 2,
            title: "Kiểm tra & Ký nháy",
            actor: "Lãnh đạo Phòng",
            desc: "Kiểm tra nội dung, ký nháy tờ trình/văn bản.",
            icon: UserCheck,
            color: "bg-blue-50 text-blue-600 border-blue-200"
        },
        {
            id: 3,
            title: "Thẩm định thể thức",
            actor: "Phòng Hành chính - TH",
            desc: "Kiểm tra thể thức văn bản, trình tự thủ tục.",
            icon: FileCheck,
            color: "bg-emerald-50 text-emerald-600 border-emerald-200"
        },
        {
            id: 4,
            title: "Xem xét & Chỉ đạo",
            actor: "Phó Giám đốc phụ trách",
            desc: "Xem xét hồ sơ, ký duyệt hoặc cho ý kiến chỉ đạo.",
            icon: User,
            color: "bg-purple-50 text-purple-600 border-purple-200"
        },
        {
            id: 5,
            title: "Quyết định / Ký ban hành",
            actor: "Giám đốc Ban",
            desc: "Quyết định cuối cùng đối với các vấn đề thuộc thẩm quyền.",
            icon: Gavel,
            color: "bg-orange-50 text-orange-600 border-orange-200"
        }
    ];

    return (
        <div className="py-6">
            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 border-l border-dashed border-gray-300"></div>
                
                <div className="space-y-6">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="relative flex items-start group">
                            {/* Node Circle */}
                            <div className={`z-10 w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-sm shrink-0 transition-transform group-hover:scale-110 ${step.color}`}>
                                <step.icon className="w-6 h-6" />
                            </div>
                            
                            {/* Arrow Connector (except last) */}
                            {idx < steps.length - 1 && (
                                <div className="absolute left-8 top-16 w-0.5 h-6 bg-gray-300"></div>
                            )}

                            {/* Content Bubble */}
                            <div className="ml-6 flex-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                                {/* Triangle pointer */}
                                <div className="absolute top-6 -left-2 w-4 h-4 bg-white border-l border-b border-gray-100 transform rotate-45"></div>
                                
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className="font-bold text-gray-800 text-sm">{step.title}</h5>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded text-gray-500">{step.actor}</span>
                                </div>
                                <p className="text-xs text-gray-500">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-6 italic">Sơ đồ khái quát quy trình trình ký hồ sơ tại Ban QLDA</p>
        </div>
    );
};

const RelationshipMap = () => {
    return (
        <div className="py-8 flex justify-center">
            <div className="relative w-[600px] h-[400px] bg-slate-50 rounded-[40px] border border-slate-200 p-8 flex items-center justify-center overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-200 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-dashed border-gray-200 rounded-full"></div>
                </div>

                {/* Center Node */}
                <div className="relative z-20 w-32 h-32 bg-blue-600 rounded-full shadow-xl shadow-blue-200 flex flex-col items-center justify-center text-white border-4 border-white ring-4 ring-blue-50">
                    <Layout className="w-8 h-8 mb-1" />
                    <span className="font-black text-xs text-center uppercase leading-tight">Ban QLDA<br/>Đầu tư công</span>
                </div>

                {/* Node: UBND Tỉnh (Top) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Landmark className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-800 uppercase">UBND Tỉnh</p>
                        <p className="text-[8px] text-gray-500">Chỉ đạo & Giám sát</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-red-200"></div>
                    <div className="absolute top-24 left-1/2 -translate-x-1/2"><ArrowDownCircle className="w-4 h-4 text-red-300 bg-slate-50 rounded-full" /></div>
                </div>

                {/* Node: Sở Ban Ngành (Right) */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 border border-purple-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Network className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-800 uppercase">Các Sở, Ngành</p>
                        <p className="text-[8px] text-gray-500">Phối hợp & Hướng dẫn</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute right-14 top-5 w-24 h-0.5 bg-purple-200"></div>
                </div>

                {/* Node: Nhà thầu (Bottom) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center z-10 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <HardHat className="w-6 h-6" />
                    </div>
                    <div className="mb-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-800 uppercase">Nhà thầu / Đối tác</p>
                        <p className="text-[8px] text-gray-500">Hợp đồng kinh tế</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-emerald-200"></div>
                </div>

                {/* Node: Địa phương (Left) */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center z-10 group">
                    <div className="w-14 h-14 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Map className="w-6 h-6" />
                    </div>
                    <div className="mt-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-800 uppercase">UBND Xã/Phường</p>
                        <p className="text-[8px] text-gray-500">GPMB & An ninh</p>
                    </div>
                    {/* Connector */}
                    <div className="absolute left-14 top-5 w-24 h-0.5 bg-orange-200"></div>
                </div>

            </div>
        </div>
    );
};

const ResponsibilityList: React.FC<{ items: (string | React.ReactNode)[] }> = ({ items }) => (
    <ul className="space-y-4">
        {items.map((item, idx) => (
            <li key={idx} className="flex gap-4 text-sm text-gray-700 leading-relaxed text-justify group">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[10px] font-bold mt-0.5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shadow-sm">
                    {idx + 1}
                </span>
                <span className="flex-1">{item}</span>
            </li>
        ))}
    </ul>
);

const Article2Visual = () => {
    const points = [
        {
            idx: 1,
            title: "Nguyên tắc tập trung dân chủ & Chế độ thủ trưởng",
            content: "Ban QLDA làm việc theo nguyên tắc tập trung dân chủ, thực hiện chế độ thủ trưởng, đảm bảo sự chỉ đạo, điều hành thống nhất của Giám đốc đối với các lĩnh vực công tác của Ban QLDA, phát huy quyền làm chủ của VC, NLĐ gắn với sự lãnh đạo của Đảng và phát huy vai trò của các tổ chức đoàn thể trong cơ quan. Mọi hoạt động của Ban QLDA tỉnh đều phải tuân thủ quy định của pháp luật và Quy chế này. VC, NLĐ thuộc Ban QLDA phải xử lý và giải quyết công việc đúng phạm vi trách nhiệm, thẩm quyền;"
        },
        {
            idx: 2,
            title: "Chấp hành nghiêm túc sự chỉ đạo",
            content: "Chấp hành nghiêm túc sự chỉ đạo của Giám đốc và Phó Giám đốc phụ trách. Khi giải quyết, xử lý công việc, đơn vị trình trực tiếp Phó Giám đốc phụ trách. Trường hợp Phó Giám đốc phụ trách đi vắng thì đơn vị trình Giám đốc (hoặc Phó Giám đốc được Giám đốc phân công) xem xét xử lý và đơn vị đó phải báo cáo kết quả xử lý cho Phó Giám đốc phụ trách khi Phó Giám đốc phụ trách có mặt ở cơ quan;"
        },
        {
            idx: 3,
            title: "Phân công công việc & Trách nhiệm cá nhân",
            content: "Trong phân công công việc, mỗi việc chỉ được giao một đơn vị, một cá nhân phụ trách và chịu trách nhiệm chính. Đơn vị, người đứng đầu đơn vị được giao công việc phải chịu trách nhiệm về tiến độ và kết quả công việc được phân công. Cấp trên không làm thay công việc của cấp dưới, tập thể không làm thay công việc của cá nhân và ngược lại;"
        },
        {
            idx: 4,
            title: "Tuân thủ trình tự, thủ tục & Thời hạn",
            content: "Bảo đảm tuân thủ trình tự, thủ tục và thời hạn giải quyết công việc theo đúng quy định của pháp luật, chương trình, kế hoạch, lịch làm việc và Quy chế làm việc, trừ trường hợp đột xuất hoặc có yêu cầu khác của cơ quan cấp trên;"
        },
        {
            idx: 5,
            title: "Phát huy năng lực & Phối hợp công tác",
            content: "Bảo đảm phát huy năng lực và sở trường của VC, NLĐ, đề cao sự phối hợp công tác, trách nhiệm làm việc nhóm, phát huy trí tuệ tập thể và trao đổi thông tin trong giải quyết công việc và trong mọi hoạt động theo chức năng, nhiệm vụ, quyền hạn được pháp luật quy định;"
        },
        {
            idx: 6,
            title: "Dân chủ, minh bạch & Hiệu quả",
            content: "Bảo đảm dân chủ, rõ ràng, minh bạch và hiệu quả trong mọi hoạt động."
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {points.map((p) => (
                <div key={p.idx} className="relative group h-48 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden cursor-default shadow-sm hover:shadow-md transition-all">
                    {/* Default State: Summary */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-90">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-black text-blue-600 mb-4 border border-blue-50">{p.idx}</div>
                        <h5 className="font-bold text-gray-800 text-sm uppercase tracking-tight leading-relaxed px-4">{p.title}</h5>
                        <p className="text-[10px] text-gray-400 mt-4 italic flex items-center gap-1">
                            <Info className="w-3 h-3" /> Rê chuột để xem chi tiết
                        </p>
                    </div>
                    
                    {/* Hover State: Full Content */}
                    <div className="absolute inset-0 bg-blue-600 p-6 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                        <div className="overflow-y-auto custom-scrollbar max-h-full pr-2">
                            <p className="text-xs font-medium leading-relaxed text-justify">
                                {p.content}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- REUSABLE INTERACTIVE LIST COMPONENT ---
const DeptTasksLayout: React.FC<{ 
    functionContent: string[], 
    tasks: { id: string, short: string, title: string, full: string }[],
    baseColor: 'blue' | 'emerald' | 'purple' | 'orange' | 'teal',
    icon: React.ElementType
}> = ({ functionContent, tasks, baseColor, icon: Icon }) => {
    const [hoveredTask, setHoveredTask] = useState('a');

    // Color Maps
    const colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-100', active: 'bg-blue-600', activeText: 'text-white' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-100', active: 'bg-emerald-600', activeText: 'text-white' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-100', active: 'bg-purple-600', activeText: 'text-white' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-100', active: 'bg-orange-600', activeText: 'text-white' },
        teal: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-100', active: 'bg-teal-600', activeText: 'text-white' },
    };
    
    const c = colors[baseColor];

    return (
        <div className="space-y-6">
            {/* Chức năng chung */}
            <div className={`p-5 ${c.bg} rounded-2xl border ${c.border}`}>
                <h4 className={`font-bold ${c.text} text-sm mb-3 flex items-center gap-2`}>
                    <CheckCircle2 className="w-4 h-4" /> 1. Chức năng
                </h4>
                <ul className="space-y-3 text-sm text-gray-700 list-disc pl-5 leading-relaxed">
                    {functionContent.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>

            {/* Nhiệm vụ chi tiết - Interactive Layout */}
            <div>
                <h4 className="font-bold text-gray-800 text-sm mb-4 px-1 flex items-center gap-2">
                    2. Nhiệm vụ cụ thể 
                    <span className="text-[10px] font-normal text-gray-400 italic bg-gray-50 px-2 py-0.5 rounded">(Rê chuột vào các mục bên dưới để xem chi tiết)</span>
                </h4>
                
                <div className="flex flex-col md:flex-row gap-6 h-[400px]">
                    {/* Left: Navigation List */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                        {tasks.map(task => (
                            <div 
                                key={task.id}
                                onMouseEnter={() => setHoveredTask(task.id)}
                                className={`p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 flex items-center justify-between group ${
                                    hoveredTask === task.id 
                                    ? `${c.active} text-white shadow-lg border-transparent scale-105` 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-100'
                                }`}
                            >
                                <h5 className="font-bold text-xs uppercase tracking-wide">{task.short}</h5>
                                <ChevronRight className={`w-4 h-4 transition-transform ${hoveredTask === task.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-50'}`} />
                            </div>
                        ))}
                    </div>

                    {/* Right: Content Display */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden shadow-sm">
                        {tasks.map(task => (
                            <div 
                                key={task.id}
                                className={`absolute inset-0 p-8 overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out bg-white ${
                                    hoveredTask === task.id 
                                    ? 'opacity-100 translate-y-0 z-10' 
                                    : 'opacity-0 translate-y-4 pointer-events-none z-0'
                                }`}
                            >
                                <h4 className={`font-black ${c.text} text-base mb-6 uppercase border-b ${c.border} pb-3 flex items-center gap-2`}>
                                    <div className={`w-1 h-6 ${c.active.replace('bg-', 'bg-')} rounded-full`}></div>
                                    {task.title}
                                </h4>
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-justify font-medium">
                                    {task.full}
                                </div>
                            </div>
                        ))}
                        {/* Background Decoration */}
                        <div className="absolute bottom-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Icon className="w-40 h-40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban chỉ đạo, điều hành công việc và duy trì chế độ làm việc tại cơ quan.",
        "Trực tiếp tham mưu Giám đốc Ban về công tác hành chính – quản trị; công tác tổ chức bộ máy, quản lý viên chức và người lao động.",
        "Tham mưu, giúp Giám đốc Ban tổ chức thực hiện công tác quản lý tài chính, tài sản, chế độ kế toán và sử dụng có hiệu quả, đúng mục đích các nguồn tài chính của Ban theo quy định."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Hành chính - Quản trị',
            title: 'Công tác Hành chính - Quản trị',
            full: `Tham mưu xây dựng các quy chế, theo dõi, giám sát quá trình tổ chức thực hiện nội quy, quy chế của cơ quan; theo dõi công tác phòng chống tham nhũng, cải cách hành chính, văn hóa công sở, kỷ luật, kỷ cương hành chính; thi đua khen thưởng.

Tham mưu công tác mua sắm, sửa chữa, quản lý tài sản, phương tiện, thiết bị; điều hành xe ô tô; công tác an ninh trật tự, PCCC; công tác đối nội, đối ngoại, lễ tân; bố trí lịch công tác.

Thực hiện công tác văn thư, lưu trữ, sử dụng con dấu; chuyển đổi số, số hóa tài liệu. Trưởng phòng được ký thừa lệnh Giám đốc các văn bản hành chính theo ủy quyền.`
        },
        {
            id: 'b',
            short: 'B) Tổ chức bộ máy',
            title: 'Công tác tổ chức bộ máy',
            full: `Tham mưu công tác tổ chức bộ máy của Ban QLDA; xây dựng, điều chỉnh Đề án vị trí việc làm, phương án sử dụng viên chức, người lao động.

Chịu trách nhiệm chủ trì thực hiện các thủ tục liên quan đến công tác nhân sự: tuyển dụng, bổ nhiệm, miễn nhiệm, luân chuyển, điều động, thôi việc, nghỉ hưu, quy hoạch, khen thưởng, kỷ luật, đào tạo, nâng lương.

Quản lý hồ sơ viên chức, người lao động theo quy định; thực hiện chế độ chính sách cán bộ, người lao động.`
        },
        {
            id: 'c',
            short: 'C) Quản lý tài chính',
            title: 'Công tác quản lý tài chính',
            full: `Thực hiện nhiệm vụ quản lý tài chính, quản lý tài sản theo đúng theo Quy chế chi tiêu nội bộ của Ban QLDA và các quy định khác của Pháp luật hiện hành; thực hiện công tác kế toán theo Luật kế toán và các quy định hiện hành.

Theo dõi, quản lý các nguồn kinh phí, thực hiện giải ngân các nguồn vốn được giao, quyết toán các công trình, dự án đúng quy định; thực hiện việc trích lập và tham mưu công tác quản lý, sử dụng các Quỹ.

Xây dựng quy chế chi tiêu nội bộ, cơ chế tiền lương, thu nhập tăng thêm và phương án trích lập các quỹ. Lập, trình phê duyệt Dự toán thu – chi, quyết toán chi quản lý hàng năm.`
        },
        {
            id: 'd',
            short: 'D) Nhiệm vụ khác',
            title: 'Các nhiệm vụ khác',
            full: `Thực hiện công tác Văn phòng Đảng ủy và các nhiệm vụ khác do Giám đốc phân công.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="blue" icon={Layout} />;
};

const PlanningDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban QLDA thực hiện Công tác Kế hoạch: xây dựng chương trình, kế hoạch tổng thể, kế hoạch đầu tư công trung hạn/hàng năm, kế hoạch vốn đầu tư.",
        "Công tác tổ chức lựa chọn nhà thầu, thương thảo, hoàn thiện, ký kết hợp đồng."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác Kế hoạch',
            title: 'Công tác Kế hoạch',
            full: `Lập, theo dõi, tổng hợp, đánh giá và tham mưu kế hoạch tổng thể, kế hoạch đầu tư công trung hạn, kế hoạch thực hiện hàng năm và quản lý nguồn vốn của các chương trình/dự án/công trình/nguồn vốn được giao.

Tham mưu, đề xuất Giám đốc Ban QLDA phê duyệt kế hoạch giải ngân nguồn vốn, phân khai nguồn vốn giải ngân của từng nhà thầu, từng hạng mục.

Thực hiện công tác lập báo cáo tháng/quý/năm về công tác giải ngân; phối hợp với Bộ, ngành Trung ương, Sở, ngành địa phương để quản lý nguồn vốn.

Tổng hợp kết quả thực hiện các kết luận thanh tra, kiểm toán của Ban QLDA.`
        },
        {
            id: 'b',
            short: 'B) Công tác lựa chọn nhà thầu',
            title: 'Công tác lựa chọn nhà thầu',
            full: `Chuẩn bị và tổ chức lựa chọn nhà thầu; đánh giá hồ sơ quan tâm, dự tuyển, dự thầu, đề xuất; yêu cầu làm rõ hồ sơ. Chịu trách nhiệm bảo mật thông tin và cung cấp thông tin chính xác trên Hệ thống mạng đấu thầu quốc gia.

Chủ trì thẩm định, trình Giám đốc phê duyệt Kế hoạch lựa chọn nhà thầu; quyết định chỉ định thầu. Đăng tải thông tin (KHLCNT, TBMT, KQLCNT) đúng quy định.

Chủ trì tham mưu xử lý tình huống trong đấu thầu; giải quyết kiến nghị; hủy thầu; lưu trữ hồ sơ.

Chủ trì, phối hợp soát xét các loại hợp đồng, tham mưu ký kết hợp đồng thi công để phòng tránh rủi ro.`
        },
        {
            id: 'c',
            short: 'C) Nhiệm vụ liên quan khác',
            title: 'Các nhiệm vụ liên quan khác',
            full: `Chủ trì nghiên cứu Quy hoạch, kế hoạch để tìm kiếm cơ hội đầu tư; đề xuất danh mục đầu tư hàng năm và trung hạn.

Chủ trì tham mưu vận động, xúc tiến và quản lý thực hiện các dự án ODA.

Thực hiện công tác phiên dịch, biên dịch Anh-Việt. Phối hợp lập BCNCTKT, BCĐXCTĐT. Giám sát đánh giá đầu tư. Lập báo cáo định kỳ về công tác đấu thầu, thực hiện dự án.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="emerald" icon={BarChart3} />;
};

const TechnicalDeptDetail = () => {
    const functionContent = [
        "Tham mưu, giúp Giám đốc Ban tổ chức thực hiện công tác thẩm định thuộc thẩm quyền Chủ đầu tư.",
        "Chịu trách nhiệm về mặt kỹ thuật các công trình, dự án do Ban QLDA làm chủ đầu tư."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác thẩm định',
            title: 'Công tác thẩm định',
            full: `Thẩm định, trình phê duyệt: Nhiệm vụ và dự toán tư vấn (khảo sát, quy hoạch, BCNCKT/BCKTKT, TKBVTC).

Thẩm định hồ sơ thiết kế, dự toán công trình; dự toán gói thầu; điều chỉnh thiết kế, dự toán thuộc thẩm quyền CĐT.

Thẩm định hồ sơ mời quan tâm/sơ tuyển/mời thầu/yêu cầu và kết quả đánh giá hồ sơ, kết quả lựa chọn nhà thầu theo Luật Đấu thầu.

Tham mưu thành lập Tổ thẩm định đấu thầu khi cần thiết.`
        },
        {
            id: 'b',
            short: 'B) Công tác kỹ thuật',
            title: 'Công tác kỹ thuật',
            full: `Chủ trì rà soát, cập nhật các quy định pháp luật về đầu tư xây dựng, tham mưu tổ chức thực hiện kịp thời.

Kiểm tra, rà soát trình tự thủ tục pháp lý, sự phù hợp của hồ sơ các bước chuẩn bị dự án, TKBVTC và dự toán trước khi trình cơ quan chuyên môn.

Thực hiện chức năng chủ đầu tư: Kiểm tra chất lượng, tiến độ, an toàn thi công; kiểm tra xác nhận các nội dung điều chỉnh bổ sung trong quá trình thi công.`
        },
        {
            id: 'c',
            short: 'C) Nhiệm vụ khác liên quan',
            title: 'Các nhiệm vụ khác liên quan',
            full: `Phối hợp xử lý nội dung liên quan đến thủ tục pháp lý, ý kiến sở ngành giai đoạn chuẩn bị đầu tư.

Phối hợp làm rõ hồ sơ mời thầu/dự thầu, giải quyết kiến nghị trong lựa chọn nhà thầu.

Liên hệ, phối hợp với các đơn vị liên quan để tham mưu vấn đề kỹ thuật. Thực hiện báo cáo định kỳ và trách nhiệm giải trình. Nghiên cứu áp dụng sáng kiến kinh nghiệm.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="purple" icon={PenTool} />;
};

const ProjectMgmtDeptDetail = () => {
    const functionContent = [
        "Thực hiện chức năng quản lý các công trình, dự án đầu tư xây dựng thuộc lĩnh vực dân dụng, công nghiệp, hạ tầng khu vực và các chương trình, dự án khác do Giám đốc Ban QLDA giao, đảm bảo quy định pháp luật.",
        "Thực hiện các chức năng khác do Giám đốc Ban QLDA giao theo đúng quy định của pháp luật."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Công tác chuẩn bị đầu tư',
            title: 'Công tác chuẩn bị đầu tư',
            full: `Chủ trì, phối hợp với các Phòng Kỹ thuật, Kế hoạch tổ chức lập BCNCTKT, BCĐXCTĐT các dự án được giao.

Tổ chức lập và trình cơ quan thẩm quyền thẩm định, phê duyệt các hồ sơ: đề cương tư vấn, BCNCKT/BCKTKT, TKKT, TKBVTC, dự toán.

Tham mưu Ban Giám đốc trong việc thỏa thuận với các đơn vị liên quan và trình cấp phép xây dựng các công trình/dự án.`
        },
        {
            id: 'b',
            short: 'B) Công tác đấu thầu',
            title: 'Công tác đấu thầu',
            full: `Lập hồ sơ kế hoạch lựa chọn nhà thầu; kết quả chỉ định thầu/đấu thầu các gói thầu thuộc dự án trực tiếp quản lý trình phòng chuyên môn thẩm định.

Chủ trì tham mưu thành lập Tổ chuyên gia đấu thầu. Phối hợp với Phòng Kế hoạch - Đấu thầu xử lý tình huống, kiến nghị trong đấu thầu.`
        },
        {
            id: 'c',
            short: 'C) Quản lý, thực hiện dự án',
            title: 'Công tác quản lý, thực hiện dự án',
            full: `Chủ trì thương thảo, dự thảo và quản lý hợp đồng (bao gồm điều chỉnh, bổ sung).

Thực hiện quản lý dự án từ khâu chuẩn bị đến khi bàn giao, quyết toán. Chịu trách nhiệm về tiến độ, khối lượng, chất lượng, an toàn, vệ sinh môi trường.

Rà soát hồ sơ nghiệm thu, thanh toán, quyết toán đúng quy định. Tổ chức lập hồ sơ điều chỉnh, bổ sung phát sinh (nếu có).`
        },
        {
            id: 'd',
            short: 'D) Nhiệm vụ khác',
            title: 'Các nhiệm vụ khác liên quan',
            full: `Lập/cập nhật báo cáo tiến độ định kỳ. Lập hồ sơ ĐTM, rà phá bom mìn, GPMB, tái định cư.

Phối hợp với phòng Kế hoạch thực hiện giám sát đánh giá đầu tư. Phối hợp phòng Phát triển dịch vụ thực hiện tư vấn QLDA cho chủ đầu tư khác.

Thực hiện công tác báo cáo và trách nhiệm giải trình.`
        },
        {
            id: 'e',
            short: 'Đ) Phân công cụ thể',
            title: 'Phân công nhiệm vụ các phòng',
            full: `Phòng Quản lý dự án 1: Thực hiện quản lý các dự án chuyển tiếp do Ban QLDA đầu tư XDCT Dân dụng và Công nghiêp thực hiện trước khi bàn giao; các dự án chuyển tiếp thuộc huyện Đức Thọ, Vũ Quang; Các dự án lĩnh vực văn hóa, y tế, giáo dục, quản lý nhà nước; dự án khởi công mới khu vực Đức Thọ, Vũ Quang.

Phòng Quản lý dự án 2: Quản lý các dự án ODA, dự án BIG2; các dự án chuyển tiếp thuộc huyện Can Lộc, Cẩm Xuyên; dự án khởi công mới khu vực Can Lộc, Cẩm Xuyên.

Phòng Quản lý dự án 3: Quản lý các dự án chuyển tiếp thuộc huyện Thạch Hà, Hương Khê; dự án khởi công mới khu vực Thạch Hà, Hương Khê.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="orange" icon={Briefcase} />;
};

const ServiceDevDeptDetail = () => {
    const functionContent = [
        "Tìm kiếm vận động các chương trình dự án trong và ngoài nước.",
        "Tìm kiếm và thực hiện các dịch vụ tư vấn quản lý dự án, tư vấn giám sát xây dựng công trình và các dịch vụ tư vấn khác phù hợp năng lực của Ban QLDA."
    ];

    const tasks = [
        {
            id: 'a',
            short: 'A) Xúc tiến & Ký kết',
            title: 'Công tác xúc tiến & ký kết',
            full: `Chủ trì khâu nối, phối hợp, xúc tiến ký kết các hợp đồng Quản lý dự án với các chủ đầu tư khác.

Tìm kiếm các nguồn việc mới thông qua quan hệ đối ngoại và năng lực của Ban.`
        },
        {
            id: 'b',
            short: 'B) Thực hiện dịch vụ tư vấn',
            title: 'Thực hiện dịch vụ tư vấn',
            full: `Chủ trì thực hiện công tác tư vấn quản lý dự án, tư vấn giám sát thi công xây dựng các công trình/dự án cho các Chủ đầu tư khác theo Quy định của pháp luật.

Đảm bảo chất lượng và tiến độ cam kết trong hợp đồng tư vấn.`
        },
        {
            id: 'c',
            short: 'C) Gói thầu tự thực hiện',
            title: 'Các gói thầu tự thực hiện',
            full: `Chủ trì thực hiện các gói thầu áp dụng hình thức "tự thực hiện" do Ban QLDA làm Chủ đầu tư.

Trường hợp cần thiết lập Tổ/Nhóm thực hiện TVGS cho 01 công trình cụ thể: Xây dựng phương án, báo cáo Phó Giám đốc phụ trách xem xét, quyết định. Tổ chịu sự lãnh đạo trực tiếp của Phó GĐ và Trưởng phòng.`
        },
        {
            id: 'd',
            short: 'D) Hồ sơ & Báo cáo',
            title: 'Công tác hồ sơ & báo cáo',
            full: `Cập nhật hồ sơ, tài liệu, số liệu liên quan đến nhiệm vụ của phòng để phối hợp với bộ phận kế toán (Phòng HC-TH) thực hiện việc thanh, quyết toán kịp thời, đúng quy định.

Thực hiện công tác báo cáo và trách nhiệm giải trình khi có yêu cầu của cơ quan chức năng.`
        }
    ];

    return <DeptTasksLayout functionContent={functionContent} tasks={tasks} baseColor="teal" icon={TrendingUp} />;
};

// --- DATA POPULATION FROM PDF ---
const regulationsData: Chapter[] = [
    {
        id: "CH1",
        code: "Chương I",
        title: "NHỮNG QUY ĐỊNH CHUNG",
        icon: Shield,
        articles: [
            {
                id: "01.01",
                code: "Điều 1",
                title: "Phạm vi điều chỉnh và đối tượng áp dụng",
                content: (
                    <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                        <p><strong>1. Phạm vi điều chỉnh:</strong> Quy chế này quy định nguyên tắc làm việc; chức năng, nhiệm vụ các phòng; quyền hạn, trách nhiệm, cách thức giải quyết công việc; chế độ làm việc; mối quan hệ công tác; trình tự giải quyết công việc của Ban QLDA.</p>
                        <p><strong>2. Đối tượng áp dụng:</strong> Quy chế này áp dụng đối với tất cả viên chức (VC), người lao động (NLĐ) của Ban QLDA.</p>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-xs italic">
                            <Info className="w-3 h-3 inline mr-1" />
                            Các tổ chức, cá nhân bên ngoài khi đến làm việc phải chấp hành quy định của Ban QLDA.
                        </div>
                    </div>
                ),
                comments: [
                    { id: "c1", user: "Phòng HC-TH", avatar: "https://i.pravatar.cc/150?u=1", content: "Đã cập nhật phạm vi áp dụng theo quyết định mới nhất 2025.", date: "10:30 AM" }
                ]
            },
            {
                id: "01.02",
                code: "Điều 2",
                title: "Nguyên tắc làm việc",
                content: <Article2Visual />
            }
        ]
    },
    {
        id: "CH2",
        code: "Chương II",
        title: "TỔ CHỨC BỘ MÁY, CHỨC NĂNG NHIỆM VỤ",
        icon: Layout,
        type: 'chart',
        articles: [
            {
                id: "02.03",
                code: "Điều 3",
                title: "Cơ cấu tổ chức Ban QLDA",
                content: <OrgChart />,
                type: "chart"
            },
            {
                id: "02.04",
                code: "Điều 4",
                title: "Chức năng, nhiệm vụ và quyền hạn chung",
                content: "Thực hiện theo Quyết định số 2760/QĐ-UBND ngày 06/11/2025 của UBND tỉnh Hà Tĩnh về việc Quy định chức năng, nhiệm vụ và quyền hạn của Ban QLDA."
            },
            {
                id: "02.05",
                code: "Điều 5",
                title: "Nhiệm vụ cụ thể của các phòng",
                content: (
                    <div className="space-y-8">
                        {/* TABLE OF CONTENTS - QUICK NAV */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ArrowDownCircle className="w-4 h-4" /> Mục lục nhanh
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {[
                                    { id: 'dept-1', label: '1. Hành chính - Tổng hợp', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                                    { id: 'dept-2', label: '2. Kế hoạch - Đấu thầu', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                                    { id: 'dept-3', label: '3. Kỹ thuật - Thẩm định', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                                    { id: 'dept-4', label: '4. Các Phòng QLDA', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                                    { id: 'dept-5', label: '5. Phát triển dịch vụ', color: 'text-teal-600 bg-teal-50 border-teal-200' },
                                ].map(item => (
                                    <button 
                                        key={item.id}
                                        onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-transform hover:-translate-y-0.5 hover:shadow-sm text-left truncate ${item.color}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 1. Phòng Hành chính Tổng hợp */}
                        <div id="dept-1" className="border border-blue-200 rounded-3xl p-6 bg-white shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5"><Layout className="w-32 h-32" /></div>
                             <h3 className="text-xl font-black text-blue-800 mb-6 border-b border-blue-100 pb-3 uppercase tracking-tight flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">01</div>
                                 Phòng Hành chính – Tổng hợp
                             </h3>
                             <AdminDeptDetail />
                        </div>

                        {/* 2. Phòng Kế hoạch - Đấu thầu */}
                        <div id="dept-2" className="border border-emerald-200 rounded-3xl p-6 bg-white shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5 text-emerald-900"><BarChart3 className="w-32 h-32" /></div>
                             <h3 className="text-xl font-black text-emerald-800 mb-6 border-b border-emerald-100 pb-3 uppercase tracking-tight flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">02</div>
                                 Phòng Kế hoạch - Đấu thầu
                             </h3>
                             <PlanningDeptDetail />
                        </div>

                        {/* 3. Phòng Kỹ thuật - Thẩm định */}
                        <div id="dept-3" className="border border-purple-200 rounded-3xl p-6 bg-white shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5 text-purple-900"><PenTool className="w-32 h-32" /></div>
                             <h3 className="text-xl font-black text-purple-800 mb-6 border-b border-purple-100 pb-3 uppercase tracking-tight flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-sm">03</div>
                                 Phòng Kỹ thuật - Thẩm định
                             </h3>
                             <TechnicalDeptDetail />
                        </div>

                        {/* 4. Các Phòng Quản lý dự án */}
                        <div id="dept-4" className="border border-orange-200 rounded-3xl p-6 bg-white shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5 text-orange-900"><Briefcase className="w-32 h-32" /></div>
                             <h3 className="text-xl font-black text-orange-800 mb-6 border-b border-orange-100 pb-3 uppercase tracking-tight flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center text-sm">04</div>
                                 Các Phòng Quản lý dự án
                             </h3>
                             <ProjectMgmtDeptDetail />
                        </div>

                        {/* 5. Phòng Phát triển dịch vụ */}
                        <div id="dept-5" className="border border-teal-200 rounded-3xl p-6 bg-white shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5 text-teal-900"><TrendingUp className="w-32 h-32" /></div>
                             <h3 className="text-xl font-black text-teal-800 mb-6 border-b border-teal-100 pb-3 uppercase tracking-tight flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center text-sm">05</div>
                                 Phòng Phát triển dịch vụ
                             </h3>
                             <ServiceDevDeptDetail />
                        </div>
                    </div>
                )
            }
        ]
    },
    {
        id: "CH3",
        code: "Chương III",
        title: "QUYỀN HẠN, TRÁCH NHIỆM",
        icon: Users,
        articles: [
            {
                id: "03.06",
                code: "Điều 6",
                title: "Quyền hạn, trách nhiệm của Giám đốc Ban QLDA",
                content: <ResponsibilityList items={[
                    "Là người đứng đầu, phụ trách chung, lãnh đạo, chỉ đạo, điều hành và quản lý toàn diện mọi hoạt động của Ban QLDA theo chức năng, nhiệm vụ, quyền hạn; chịu trách nhiệm trước UBND tỉnh, Chủ tịch UBND tỉnh và trước pháp luật về toàn bộ hoạt động thuộc thẩm quyền của Ban.",
                    "Chỉ đạo tổ chức triển khai tất cả các dự án được cấp có thẩm quyền giao cho Ban QLDA làm Chủ đầu tư hoặc của các Chủ đầu tư khác thông qua hợp đồng tư vấn quản lý dự án.",
                    "Ban hành Quy chế làm việc, quy định cụ thể chức năng, nhiệm vụ, quyền hạn của các phòng trực thuộc, mối liên hệ công tác giữa các phòng và các quy chế khác đảm bảo công tác quản lý điều hành.",
                    "Ban hành Đề án vị trí việc làm theo đúng quy định; phân công, bố trí, sắp xếp hợp lý đội ngũ viên chức đúng cơ cấu, đảm bảo tiêu chuẩn ngạch và khung năng lực theo từng vị trí việc làm đã phê duyệt; phân công công việc cho các Phó Giám đốc; ủy quyền cho một Phó Giám đốc điều hành hoạt động của Ban khi vắng mặt.",
                    "Chỉ đạo, kiểm tra, giám sát và đôn đốc tổ chức, cá nhân và các Phòng trực thuộc Ban QLDA trong việc thực hiện các nhiệm vụ đã phân công.",
                    "Phụ trách công tác quản lý tài chính; tổ chức bộ máy, nhân sự; đào tạo, thi đua - khen thưởng, kỷ luật; bảo vệ chính trị nội bộ; kế hoạch - đầu tư - đấu thầu; thanh tra, kiểm tra, kiểm toán; phòng chống tham nhũng, lãng phí; tiếp công dân và giải quyết khiếu nại, tố cáo; chiến lược phát triển chung.",
                    "Tổ chức, chủ trì các cuộc họp định kỳ và đột xuất của Ban Quản lý dự án, đôn đốc, kiểm tra, giám sát việc thực hiện nhiệm vụ công tác của các phòng và của các thành viên Ban QLDA.",
                    "Ký các văn bản trình Thường trực Tỉnh uỷ, Thường trực HĐND tỉnh, UBND tỉnh và Chủ tịch UBND tỉnh. Ký các văn bản, hợp đồng xây dựng, hồ sơ liên quan đến dự án; ký chứng từ thanh toán, tạm ứng; ký hợp đồng làm việc/lao động.",
                    "Là người phát ngôn của Ban QLDA hoặc ủy quyền cho Phó Giám đốc phát ngôn, cung cấp thông tin của đơn vị cho báo chí và các cơ quan chức năng khi có yêu cầu.",
                    "Trực tiếp giải quyết một số công việc đã phân công cho Phó Giám đốc phụ trách trong các trường hợp: cấp bách, quan trọng; Phó Giám đốc đi vắng; hoặc vấn đề có ý kiến khác nhau giữa các Phó Giám đốc.",
                    (
                        <div key="item-11">
                            <strong>Những công việc cần thảo luận tập thể Lãnh đạo Ban QLDA trước khi Giám đốc quyết định:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 font-medium">
                                <li>Chiến lược, quy hoạch, kế hoạch phát triển Ban QLDA.</li>
                                <li>Chương trình công tác, kế hoạch và dự thảo văn bản được UBND tỉnh giao chủ trì.</li>
                                <li>Kế hoạch triển khai các chủ trương, chính sách quan trọng.</li>
                                <li>Công tác tổ chức bộ máy và nhân sự theo quy định.</li>
                                <li>Báo cáo hàng năm về tổng kết tình hình thực hiện kế hoạch và kiểm điểm chỉ đạo điều hành.</li>
                                <li>Những vấn đề khác mà Giám đốc thấy cần thiết.</li>
                            </ul>
                            <p className="mt-2 italic text-xs text-gray-500">Sau khi có ý kiến tập thể, Giám đốc là người đưa ra quyết định cuối cùng và chịu trách nhiệm.</p>
                        </div>
                    )
                ]} />
            },
            {
                id: "03.07",
                code: "Điều 7",
                title: "Quyền hạn, trách nhiệm của Phó Giám đốc Ban QLDA",
                content: <ResponsibilityList items={[
                    "Tham mưu, giúp việc cho Giám đốc, được phân công phụ trách một số lĩnh vực và phòng chuyên môn; thay mặt Giám đốc giải quyết công việc trong phạm vi được giao và chịu trách nhiệm trước Giám đốc, UBND tỉnh và pháp luật về kết quả thực hiện.",
                    "Chủ động phân công nhiệm vụ, bố trí nhân sự cho các phòng được giao phụ trách; tham mưu về việc điều chuyển, xử lý kỷ luật nhân sự thuộc lĩnh vực phụ trách khi có vi phạm.",
                    "Khi được giao QLDA: Chủ trì, chỉ đạo các phòng QLDA đề xuất nhân sự Tổ thực hiện dự án và phòng Kế hoạch - Đấu thầu đề xuất Tổ chuyên gia đấu thầu trình Giám đốc thành lập.",
                    "Tham gia các cuộc họp, đề xuất hoặc kiến nghị về các giải pháp, biện pháp cần thiết để thực hiện các nhiệm vụ của Ban Quản lý dự án.",
                    "Giúp Giám đốc chỉ đạo, điều hành, hướng dẫn, đôn đốc, kiểm tra và xử lý công việc theo sự phân công, ủy quyền; chịu trách nhiệm về việc thực hiện nhiệm vụ được giao.",
                    "Đối với vấn đề chủ trương, nguyên tắc chưa có quy định hoặc nhạy cảm, quan trọng thì phải xin ý kiến Giám đốc trước khi quyết định.",
                    "Được duyệt, ký văn bản thuộc lĩnh vực được phân công (trừ văn bản thuộc thẩm quyền Giám đốc); ký các văn bản, hợp đồng xây dựng, hồ sơ dự án khi được Giám đốc ủy quyền.",
                    "Khi vắng mặt, Giám đốc trực tiếp hoặc phân công Phó Giám đốc khác giải quyết công việc thay thế và thông báo lại.",
                    "Chủ động giải quyết công việc và phối hợp với các Phó Giám đốc khác; trường hợp còn ý kiến khác nhau hoặc nội dung quan trọng thì báo cáo Giám đốc quyết định.",
                    "Thực hiện các nhiệm vụ khác khi được UBND tỉnh, Chủ tịch UBND tỉnh giao, Giám đốc Ban giao."
                ]} />
            },
            {
                id: "03.08",
                code: "Điều 8",
                title: "Trách nhiệm, quyền hạn của Trưởng phòng",
                content: <ResponsibilityList items={[
                    "Chủ động tổ chức thực hiện công việc thuộc chức năng, nhiệm vụ của Phòng; chịu trách nhiệm trước Giám đốc, Phó Giám đốc phụ trách và pháp luật về kết quả và tiến độ công việc. Thực hiện chế độ báo cáo đầy đủ.",
                    "Việc phát sinh vượt quá thẩm quyền phải báo cáo kịp thời xin ý kiến chỉ đạo; không chuyển việc của phòng mình sang phòng khác hoặc lên lãnh đạo Ban; không làm thay việc của phòng khác khi chưa có chỉ đạo.",
                    "Chủ trì tham mưu xây dựng, góp ý văn bản quy phạm pháp luật, chính sách, kế hoạch chiến lược thuộc lĩnh vực phụ trách.",
                    "Chủ động phối hợp với các Trưởng phòng khác để xử lý vấn đề liên quan và thực hiện nhiệm vụ chung của Ban.",
                    "Chủ trì theo dõi, đôn đốc, chịu trách nhiệm thực hiện kết luận của Thanh tra, Kiểm toán tại Phòng.",
                    "Tổ chức thực hiện công việc theo Quy chế làm việc; phân công nhiệm vụ cụ thể cho cấp phó và nhân viên.",
                    "Khi vắng mặt 01 ngày phải được sự đồng ý của PGĐ phụ trách và ủy quyền cho cấp phó, thông báo cho Phòng HC-TH. Người được ủy quyền chịu trách nhiệm trước Trưởng phòng và Lãnh đạo Ban.",
                    "Được phép cho nhân viên nghỉ 1/2 ngày khi có việc đột xuất; nghỉ từ 1 ngày phải báo cáo Phòng HC-TH và PGĐ phụ trách.",
                    "Khi được ủy quyền dự họp cấp trên: Chậm nhất sau 01 ngày phải báo cáo kết quả cuộc họp với PGĐ phụ trách (và Giám đốc nếu quan trọng).",
                    "Kiểm tra, rà soát, ký nháy và chịu trách nhiệm đối với các dự thảo văn bản của phòng trước khi trình lãnh đạo Ban.",
                    "Thực hiện nhiệm vụ khác do Giám đốc hoặc Phó Giám đốc giao."
                ]} />
            },
            {
                id: "03.09",
                code: "Điều 9",
                title: "Trách nhiệm, quyền hạn của Phó Trưởng phòng",
                content: <ResponsibilityList items={[
                    "Trực tiếp thực hiện nhiệm vụ chuyên môn được phân công; giúp Trưởng phòng chỉ đạo, quản lý một số lĩnh vực cụ thể; chịu trách nhiệm trước Trưởng phòng và Lãnh đạo Ban về nhiệm vụ được giao.",
                    "Thực hiện trách nhiệm, quyền hạn của Trưởng phòng khi được ủy quyền.",
                    "Tham gia tổ chức quản lý, điều hành công tác của phòng theo phân công; hỗ trợ, đôn đốc nhân viên hoàn thành nhiệm vụ; Báo cáo Trưởng phòng kết quả thực hiện.",
                    "Kiểm tra, soát xét, ký nháy và chịu trách nhiệm đối với các dự thảo văn bản của phòng trình Lãnh đạo Ban khi được Trưởng phòng phân công.",
                    "Thực hiện các nhiệm vụ khác do Trưởng phòng và lãnh đạo Ban giao."
                ]} />
            },
            {
                id: "03.10",
                code: "Điều 10",
                title: "Quyền hạn và trách nhiệm của Kế toán trưởng",
                content: <ResponsibilityList items={[
                    "Tổ chức bộ máy kế toán, thực hiện nhiệm vụ, quyền hạn theo Luật Kế toán và các quy định hiện hành; trực tiếp phân công nhiệm vụ cho kế toán viên; chịu trách nhiệm chuyên môn về công tác kế toán.",
                    "Được bảo đảm điều kiện làm việc, đào tạo nâng cao trình độ và hưởng các quyền lợi theo quy định pháp luật.",
                    "Chịu sự quản lý, giám sát, phân công của Lãnh đạo phòng Hành chính - Tổng hợp (trừ công việc chuyên môn thuộc thẩm quyền Kế toán trưởng); chịu trách nhiệm trước Giám đốc và pháp luật về nhiệm vụ được giao."
                ]} />
            },
            {
                id: "03.11",
                code: "Điều 11",
                title: "Quyền, nghĩa vụ, trách nhiệm của viên chức, NLĐ",
                content: (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                            <UserCheck className="w-5 h-5 text-blue-600 mt-1" />
                            <p className="text-sm text-blue-800 font-medium italic">
                                Áp dụng chung cho toàn thể viên chức và người lao động làm việc tại Ban QLDA.
                            </p>
                        </div>
                        <ResponsibilityList items={[
                            "Được bảo đảm về điều kiện làm việc, được đào tạo nâng cao trình độ và hưởng các quyền lợi theo quy định pháp luật.",
                            "Có quyền đề xuất đóng góp ý kiến, các biện pháp để thực hiện hiệu quả nhiệm vụ được giao.",
                            "Có trách nhiệm thực hiện và hoàn thành nhiệm vụ được giao, chấp hành nghiêm quy định pháp luật và quy chế làm việc.",
                            "Chịu trách nhiệm cá nhân trước Tổ trưởng/Lãnh đạo phòng/Ban Giám đốc và pháp luật về ý kiến đề xuất, tiến độ, chất lượng công việc được giao.",
                            "Thực hiện các quy định của pháp luật về viên chức, hợp đồng lao động, quy định của Ban và của phòng.",
                            "Phối hợp tốt với đồng nghiệp; xây dựng và thực hiện chương trình công tác; thường xuyên trau dồi kiến thức, rèn luyện đạo đức.",
                            "Có trách nhiệm bảo quản, sử dụng tiết kiệm, hiệu quả tài sản của Ban QLDA.",
                            "Bảo vệ bí mật nhà nước, bí mật công tác theo đúng quy định.",
                            "Tuân thủ đúng nội quy, quy chế của đơn vị.",
                            "Đối với lao động hợp đồng: Thực hiện theo điều khoản hợp đồng ký kết.",
                            "Không được tham gia, can thiệp vào các quyết định có xung đột lợi ích với bản thân, người thân; phải báo cáo khi có nguy cơ xung đột lợi ích."
                        ]} />
                    </div>
                )
            }
        ]
    },
    {
        id: "CH4",
        code: "Chương IV",
        title: "TRÌNH TỰ GIẢI QUYẾT CÔNG VIỆC",
        icon: FileText,
        articles: [
            {
                id: "04.12",
                code: "Điều 12",
                title: "Cách thức giải quyết công việc",
                content: <ResponsibilityList items={[
                    "Giám đốc và các Phó Giám đốc điều hành công việc trên cơ sở chương trình, kế hoạch công tác của Ban QLDA; tình hình thực tế; yêu cầu chỉ đạo của UBND tỉnh, các sở, ban, ngành; và các nhiệm vụ đột xuất.",
                    "Giám đốc, Phó Giám đốc chủ trì họp, làm việc với lãnh đạo các cơ quan, tổ chức có liên quan để tham khảo ý kiến trước khi quyết định những vấn đề quan trọng hoặc còn vướng mắc chưa xử lý được ngay.",
                    "Khi trình hồ sơ giải quyết công việc cho Lãnh đạo Ban, cán bộ thụ lý hồ sơ phải có Tờ trình/Văn bản và đầy đủ hồ sơ kèm theo; đồng thời thực hiện xử lý công việc thông qua phần mềm hồ sơ quản lý công việc (TDO).",
                    "Lãnh đạo phòng, viên chức, người lao động chỉ được xử lý công việc sau khi lãnh đạo Ban QLDA đã có ý kiến chỉ đạo cụ thể trên phiếu trình hoặc thông qua phần mềm hồ sơ quản lý công việc."
                ]} />
            },
            {
                id: "04.13",
                code: "Điều 13",
                title: "Trách nhiệm của các phòng trực thuộc trong việc trình Lãnh đạo Ban",
                content: (
                    <div className="space-y-4">
                        {/* CHART HERE */}
                        <SubmissionProcessChart />
                        <p className="text-sm font-medium text-gray-700 italic">Các phòng trực thuộc chỉ trình Giám đốc, Phó Giám đốc những vấn đề thuộc phạm vi giải quyết của Giám đốc, Phó Giám đốc khi có đủ các hồ sơ theo quy định.</p>
                        <ResponsibilityList items={[
                            (
                                <div key="item-2">
                                    <strong>Nhiệm vụ khi trình hồ sơ:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li><span className="font-bold">Thẩm định về mặt thủ tục:</span> Kiểm tra tính đầy đủ, đúng quy định của hồ sơ. Nếu thiếu phải hướng dẫn bổ sung ngay. Trường hợp gấp, làm phiếu báo bổ sung và báo cáo Lãnh đạo Ban biết.</li>
                                        <li><span className="font-bold">Thẩm tra về mặt nội dung:</span> Nếu nội dung chưa rõ hoặc có ý kiến khác nhau, yêu cầu giải trình thêm hoặc Phòng HC-TH tổ chức họp lấy ý kiến để báo cáo Lãnh đạo quyết định.</li>
                                    </ul>
                                </div>
                            ),
                            (
                                <div key="item-3">
                                    <strong>Thủ tục trình Giám đốc, Phó Giám đốc:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li><span className="font-bold">Bản giấy:</span> Áp dụng cho văn bản mật, quyết định, biên bản, hoặc theo quy định pháp luật. Phải có "ký nháy" của người soạn thảo và lãnh đạo Phòng. Cán bộ tham mưu trực tiếp trình.</li>
                                        <li><span className="font-bold">Điện tử (TDO):</span> Trưởng phòng ký nháy trước khi trình Lãnh đạo Ban. Nếu vắng mặt, ủy quyền cho Phó phòng ký nháy.</li>
                                    </ul>
                                </div>
                            ),
                            "Quy trình xin ý kiến: Trưởng phòng báo cáo, xin ý kiến Phó Giám đốc phụ trách ký duyệt. Nếu vấn đề cần xin ý kiến Giám đốc, Phó Giám đốc phụ trách sẽ trực tiếp báo cáo Giám đốc.",
                            (
                                <div key="item-5">
                                    <strong>Các quy trình thực hiện công việc:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li>Các phòng xây dựng, áp dụng và vận hành Hệ thống quản lý chất lượng theo tiêu chuẩn TCVN ISO 9001:2015.</li>
                                        <li>Phòng HC-TH theo dõi, giám sát việc thực hiện quy trình, lập danh mục theo dõi hồ sơ trình.</li>
                                        <li>Ứng dụng CNTT và chuyển đổi số trong quản lý, điều hành, tuân thủ quy định về bảo mật an toàn thông tin.</li>
                                    </ul>
                                </div>
                            ),
                            (
                                <div key="item-6">
                                    <strong>Xử lý hồ sơ trình và thông báo kết quả:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li>Lãnh đạo Ban xem xét, xử lý và ghi ý kiến vào phiếu trình hoặc trên phần mềm trong thời hạn quy định.</li>
                                        <li>Nếu cần tham khảo ý kiến chuyên gia hoặc giải trình, phòng chuyên môn phối hợp chuẩn bị nội dung họp/làm việc.</li>
                                        <li>Có thể ủy quyền cho Trưởng phòng chủ trì cuộc họp và báo cáo kết quả.</li>
                                        <li>Phòng chuyên môn hoàn chỉnh dự thảo sau khi có ý kiến chỉ đạo. Phòng HC-TH ban hành văn bản thông báo kết quả nếu không cần ban hành văn bản do Lãnh đạo Ban ký.</li>
                                    </ul>
                                </div>
                            )
                        ]} />
                    </div>
                )
            },
            {
                id: "04.14",
                code: "Điều 14",
                title: "Tiếp nhận, xử lý và ban hành văn bản",
                content: <ResponsibilityList items={[
                    "Quy trình tiếp nhận, xử lý và ban hành văn bản phải tuân thủ theo quy định pháp luật về công tác văn thư và Quy định tiếp nhận, xử lý, ban hành văn bản tại Ban QLDA.",
                    "Các phòng chuyên môn, cán bộ Ban QLDA phải kiểm tra và chịu trách nhiệm về độ chính xác của văn bản; Đối với dự toán/dự toán điều chỉnh, báo cáo,... có file excel đính kèm, thì bắt buộc phải gửi file pdf để ban hành kèm theo.",
                    "Trưởng bộ phận chuyên môn phải kiểm tra và chịu trách nhiệm về hình thức, thể thức, kỹ thuật trình bày và thủ tục ban hành văn bản theo đúng quy định của pháp luật, đồng thời phải ký nháy vào văn bản tham mưu ban hành."
                ]} />
            },
            {
                id: "04.15",
                code: "Điều 15",
                title: "Quy định về sử dụng dấu của cơ quan",
                content: <ResponsibilityList items={[
                    "Việc quản lý, sử dụng con dấu được thực hiện theo quy định của pháp luật về quản lý và sử dụng con dấu.",
                    (
                        <div key="item-2">
                            <strong>Trách nhiệm của nhân viên văn thư:</strong>
                            <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                <li>Không giao con dấu cho người khác khi chưa được phép bằng văn bản của người có thẩm quyền.</li>
                                <li>Phải tự tay đóng dấu vào các văn bản của Ban QLDA ban hành.</li>
                                <li>Chỉ được đóng dấu vào những văn bản, giấy tờ sau khi có chữ ký của người có thẩm quyền.</li>
                            </ul>
                        </div>
                    )
                ]} />
            }
        ]
    },
    {
        id: "CH5",
        code: "Chương V",
        title: "MỐI QUAN HỆ CÔNG TÁC",
        icon: Network,
        articles: [
            {
                id: "05.16",
                code: "Điều 16",
                title: "Quan hệ công tác với UBND tỉnh, Chủ tịch UBND tỉnh",
                content: (
                    <div className="space-y-4">
                        <RelationshipMap />
                        <ResponsibilityList items={[
                            "Chịu sự chỉ đạo, kiểm tra, giám sát trực tiếp của UBND tỉnh, Chủ tịch UBND tỉnh về thực hiện chức năng, nhiệm vụ được giao.",
                            "Trình cấp quyết định đầu tư phê duyệt các nội dung thuộc trách nhiệm của chủ đầu tư theo nhiệm vụ được giao và theo quy định của pháp luật.",
                            "Báo cáo định kỳ hoặc đột xuất về tình hình triển khai thực hiện các dự án được giao quản lý; đề xuất biện pháp xử lý những vấn đề vượt quá thẩm quyền giải quyết.",
                            "Giải trình các nội dung cần thiết theo yêu cầu của UBND tỉnh, Chủ tịch UBND tỉnh.",
                            "Phối hợp với các cơ quan, đơn vị chức năng của UBND tỉnh trong việc thực hiện các nhiệm vụ quản lý dự án."
                        ]} />
                    </div>
                )
            },
            {
                id: "05.17",
                code: "Điều 17",
                title: "Quan hệ công tác với các Sở, ban ngành thuộc tỉnh",
                content: <ResponsibilityList items={[
                    "Khi giải quyết vấn đề thuộc thẩm quyền nhưng có liên quan đến chức năng của các Sở, ban, ngành khác thì chủ động tham khảo ý kiến các cơ quan đó.",
                    "Đối với các vấn đề vượt thẩm quyền hoặc còn ý kiến khác nhau giữa các sở, ban ngành, địa phương thì báo cáo Chủ tịch/Phó Chủ tịch UBND tỉnh (trưởng Ban chỉ đạo dự án) phụ trách lĩnh vực giải quyết.",
                    "Báo cáo, giải trình về tình hình thực hiện dự án, sự cố công trình, an toàn xây dựng khi được yêu cầu; đề xuất biện pháp phối hợp xử lý vấn đề vượt thẩm quyền.",
                    "Chịu sự kiểm tra, giám sát của cơ quan nhà nước có thẩm quyền. Chủ động phối hợp chặt chẽ với các sở, ban, ngành và chủ đầu tư dự án."
                ]} />
            },
            {
                id: "05.18",
                code: "Điều 18",
                title: "Quan hệ công tác với UBND các phường/xã",
                content: <ResponsibilityList items={[
                    "Giám đốc Ban làm việc trực tiếp với Chủ tịch UBND phường/xã để giải quyết vấn đề liên quan. Ý kiến của người được Giám đốc ủy quyền (Phó Giám đốc, Trưởng phòng) được coi là ý kiến của Giám đốc.",
                    "Nếu đề nghị của địa phương liên quan nhiều ngành, Ban phải chủ động phối hợp xử lý. Nếu không thống nhất thì báo cáo Lãnh đạo UBND tỉnh giải quyết.",
                    "Phối hợp thực hiện công tác bồi thường, GPMB, tái định cư; quản lý hành chính, bảo đảm an ninh trật tự trong quá trình thực hiện dự án và bàn giao công trình."
                ]} />
            },
            {
                id: "05.19",
                code: "Điều 19",
                title: "Quan hệ với Chủ đầu tư, Chủ quản lý sử dụng công trình",
                content: <ResponsibilityList items={[
                    "Thực hiện quyền, nghĩa vụ đối với chủ đầu tư, chịu sự kiểm tra giám sát của chủ đầu tư theo hợp đồng và quy định pháp luật.",
                    "Phối hợp với chủ quản lý sử dụng khi lập nhiệm vụ thiết kế, trong quá trình thực hiện dự án và khi nghiệm thu, bàn giao công trình vào sử dụng (bao gồm bảo hành).",
                    "Bàn giao công trình hoàn thành cho chủ đầu tư hoặc đơn vị quản lý sử dụng; quản lý công trình trong thời gian chưa bàn giao.",
                    "Thực hiện nhiệm vụ tư vấn QLDA của chủ đầu tư theo ủy quyền."
                ]} />
            },
            {
                id: "05.20",
                code: "Điều 20",
                title: "Quan hệ công tác với Nhà thầu",
                content: <ResponsibilityList items={[
                    "Tổ chức lựa chọn nhà thầu, đàm phán, ký kết và thực hiện hợp đồng với nhà thầu được lựa chọn theo quy định.",
                    "Thực hiện quyền, nghĩa vụ của chủ đầu tư đối với nhà thầu xây dựng theo hợp đồng và pháp luật.",
                    "Tiếp nhận, xử lý theo thẩm quyền hoặc kiến nghị giải quyết các đề xuất, vướng mắc của nhà thầu trong quá trình thực hiện."
                ]} />
            },
            {
                id: "05.22",
                code: "Điều 22",
                title: "Quan hệ giữa Lãnh đạo Ban với các Phòng",
                content: <ResponsibilityList items={[
                    "Giám đốc, Phó Giám đốc định kỳ hoặc đột xuất họp/làm việc với lãnh đạo các phòng để chỉ đạo thực hiện chương trình công tác.",
                    "Trưởng/phụ trách các phòng có trách nhiệm báo cáo kết quả thực hiện, kiến nghị giải quyết khó khăn vướng mắc và đề xuất điều chỉnh cơ chế chính sách với Ban Giám đốc."
                ]} />
            },
            {
                id: "05.23",
                code: "Điều 23",
                title: "Quan hệ giữa các phòng trực thuộc Ban QLDA",
                content: <ResponsibilityList items={[
                    "Phòng chủ trì giải quyết vấn đề liên quan phải trao đổi ý kiến với các phòng khác. Phòng được xin ý kiến có trách nhiệm trả lời đúng yêu cầu.",
                    "Các phòng có trách nhiệm phối hợp thực hiện dự án chung. Vấn đề vượt thẩm quyền hoặc không đủ điều kiện thì phòng chủ trì báo cáo Lãnh đạo Ban quyết định.",
                    "Nguyên tắc: Việc thuộc chức năng phòng nào phòng đó chủ trì; chủ động phối hợp để thực hiện nhiệm vụ. Nếu có ý kiến khác nhau, phòng chủ trì báo cáo Ban Giám đốc.",
                    "Tuân thủ Quy chế làm việc; phối hợp bằng văn bản hoặc trực tiếp đảm bảo chuyên môn, chất lượng và tiến độ.",
                    "Bảo đảm kỷ luật, kỷ cương trong phối hợp, đề cao trách nhiệm cá nhân."
                ]} />
            }
        ]
    },
    {
        id: "CH6",
        code: "Chương VI",
        title: "CHẾ ĐỘ LÀM VIỆC",
        icon: Clock,
        articles: [
            {
                id: "06.25",
                code: "Điều 25",
                title: "Chế độ hội họp",
                content: <ResponsibilityList items={[
                    "Chế độ họp với UBND tỉnh, các cơ quan liên quan: Thực hiện theo quy định chung và khi cần thiết.",
                    "Họp với đối tác (nhà thầu, tư vấn...): Tổ chức thường xuyên (ký HĐ, tiến độ, nghiệm thu, giải quyết vướng mắc...).",
                    "Giao ban nội bộ: Định kỳ hàng tuần, tháng, quý hoặc đột xuất do Giám đốc (hoặc PGĐ được ủy quyền) chủ trì.",
                    "Hội nghị sơ kết, tổng kết: Do Giám đốc quyết định nội dung, thành phần, thời gian.",
                    "PGĐ triệu tập họp chuyên môn với các phòng theo kế hoạch được Giám đốc đồng ý và báo cáo kết quả.",
                    "Phòng HC-TH: Thông báo triệu tập, chuẩn bị phòng họp, ghi biên bản và thông báo kết luận."
                ]} />
            },
            {
                id: "06.26",
                code: "Điều 26",
                title: "Chế độ báo cáo",
                content: (
                    <div className="space-y-4">
                        <ResponsibilityList items={[
                            "Thực hiện báo cáo định kỳ/đột xuất với UBND tỉnh và cơ quan thẩm quyền.",
                            (
                                <div key="internal-report">
                                    <strong>Báo cáo nội bộ:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li>PGĐ báo cáo Giám đốc: Tình hình công việc phụ trách, việc vượt thẩm quyền, kết quả họp/công tác được ủy quyền.</li>
                                        <li>Trưởng phòng báo cáo Ban Giám đốc: Báo cáo tháng, 6 tháng, năm, chuyên đề, đột xuất.</li>
                                        <li>Phòng Kế hoạch - Đấu thầu: Tổng hợp báo cáo giao ban, số liệu hoạt động; theo dõi đôn đốc chế độ báo cáo.</li>
                                        <li>Cán bộ đi họp thay Lãnh đạo: Phải báo cáo kết quả làm việc.</li>
                                    </ul>
                                </div>
                            )
                        ]} />
                    </div>
                )
            },
            {
                id: "06.27",
                code: "Điều 27",
                title: "Chế độ kiểm tra, giám sát",
                content: (
                    <div className="space-y-4">
                        <ResponsibilityList items={[
                            (
                                <div key="project-monitor">
                                    <strong>Giám sát đầu tư dự án:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li>Theo dõi toàn bộ quá trình đầu tư: Kế hoạch, tiến độ, khối lượng, chất lượng, biến động, vốn, giải ngân, quyết toán, nợ đọng.</li>
                                        <li>Lập và cập nhật báo cáo giám sát đánh giá đầu tư lên Hệ thống thông tin quốc gia.</li>
                                    </ul>
                                </div>
                            ),
                            (
                                <div key="internal-monitor">
                                    <strong>Kiểm tra nội bộ:</strong>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                                        <li>Kiểm tra việc thực hiện nội quy, quy chế, đạo đức nghề nghiệp, quy trình quản lý dự án (chất lượng, tiến độ, an toàn...).</li>
                                        <li>Đảm bảo công khai, minh bạch, hiệu quả, chống tham nhũng lãng phí. Xử lý nghiêm sai phạm nếu có.</li>
                                    </ul>
                                </div>
                            )
                        ]} />
                    </div>
                )
            },
            {
                id: "06.28",
                code: "Điều 28",
                title: "Cung cấp thông tin hoạt động nội bộ",
                content: "Lãnh đạo Ban và các phòng có trách nhiệm thông báo các thông tin: Chủ trương chính sách mới; Công tác cán bộ (tuyển dụng, bổ nhiệm, khen thưởng, kỷ luật...); Kết luận giải quyết khiếu nại tố cáo; Nội quy, quy chế mới."
            },
            {
                id: "06.29",
                code: "Điều 29",
                title: "Thời gian làm việc, nghỉ phép",
                content: <ResponsibilityList items={[
                    "Thực hiện nghiêm túc giờ hành chính (8h/ngày) theo quy định. Giữ gìn vệ sinh, bảo quản tài sản công.",
                    "Tập trung nghiên cứu, thực hiện công việc đảm bảo tiến độ, chất lượng khi ở cơ quan.",
                    "Chế độ nghỉ phép thực hiện theo quy định pháp luật.",
                    "Nghỉ việc riêng: Trừ vào phép năm (trừ các ngày nghỉ riêng được hưởng nguyên lương theo Luật Lao động). Trường hợp đặc biệt do Giám đốc quyết định."
                ]} />
            },
            {
                id: "06.30",
                code: "Điều 30",
                title: "Đi công tác trong và ngoài nước",
                content: <ResponsibilityList items={[
                    "Lãnh đạo Ban đi công tác: Các phòng chuẩn bị nội dung; Phòng HC-TH chuẩn bị hậu cần.",
                    "Cán bộ đi công tác: Phải có chương trình, kế hoạch (nội dung, địa điểm, thời gian) trình Trưởng phòng báo cáo Giám đốc quyết định.",
                    "Cử cán bộ tham gia đoàn công tác liên ngành/tỉnh: Phải đúng thành phần yêu cầu.",
                    "Đi công tác nước ngoài: Thực hiện theo quy định pháp luật và quy chế đối ngoại của tỉnh.",
                    "Chế độ công tác phí: Theo Quy chế chi tiêu nội bộ và quy định hiện hành."
                ]} />
            },
            {
                id: "06.31",
                code: "Điều 31",
                title: "Khen thưởng, kỷ luật & PCTN",
                content: <ResponsibilityList items={[
                    "Khen thưởng: Thực hiện thường xuyên, đột xuất theo Quy chế thi đua khen thưởng.",
                    "Kỷ luật: Xử lý cán bộ vi phạm theo quy định của Nhà nước.",
                    "Giải quyết khiếu nại, tố cáo: Lãnh đạo Ban giao bộ phận liên quan thẩm tra, xác minh, báo cáo hướng giải quyết theo luật định.",
                    "Phòng chống tham nhũng: Thực hiện nghiêm quy định pháp luật; kê khai tài sản thu nhập; chủ động phòng ngừa, phát hiện, báo cáo hành vi tiêu cực. Bảo vệ người tố cáo."
                ]} />
            }
        ]
    },
    {
        id: "CH7",
        code: "Chương VII",
        title: "ĐIỀU KHOẢN THI HÀNH",
        icon: FileCheck,
        articles: [
            {
                id: "07.32",
                code: "Điều 32",
                title: "Hiệu lực thi hành",
                content: (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-medium text-sm flex gap-3 items-center">
                            <CheckCircle2 className="w-5 h-5" />
                            Quy chế này có hiệu lực kể từ ngày ban hành và được phổ biến đến toàn thể cán bộ, viên chức, người lao động.
                        </div>
                        <ResponsibilityList items={[
                            "Giám đốc, Phó Giám đốc, các phòng và toàn thể viên chức, NLĐ có trách nhiệm thực hiện Quy chế này.",
                            "Giám đốc phân công nhiệm vụ cụ thể phù hợp với thực tiễn và quy định pháp luật.",
                            "Trong quá trình thực hiện, nếu văn bản pháp luật mới làm thay đổi nội dung Quy chế, thì thực hiện theo văn bản mới.",
                            "Mọi vướng mắc cần được báo cáo kịp thời cho Lãnh đạo Ban (qua Phòng HC-TH) để nghiên cứu sửa đổi, bổ sung."
                        ]} />
                    </div>
                )
            }
        ]
    }
];

const Regulations: React.FC = () => {
    const [selectedChapterId, setSelectedChapterId] = useState<string>("CH2");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

    const selectedChapter = regulationsData.find(c => c.id === selectedChapterId);

    const filteredChapters = useMemo(() => {
        if (!searchQuery) return regulationsData;
        return regulationsData.filter(c => 
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.articles.some(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [searchQuery]);

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
            
            {/* LEFT SIDEBAR - NAVIGATION */}
            <div className="w-80 bg-gray-50/50 border-r border-gray-200 flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h2 className="text-lg font-black text-gray-800 tracking-tight mb-4 flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-blue-600" />
                        Quy chế Nội bộ
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm điều khoản, quy định..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {filteredChapters.map(chapter => (
                        <button
                            key={chapter.id}
                            onClick={() => setSelectedChapterId(chapter.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${
                                selectedChapterId === chapter.id 
                                ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                                : 'hover:bg-gray-100 border border-transparent'
                            }`}
                        >
                            <div className={`mt-0.5 p-2 rounded-lg ${selectedChapterId === chapter.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-white'}`}>
                                {chapter.icon ? <chapter.icon className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${selectedChapterId === chapter.id ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {chapter.code}
                                </p>
                                <p className={`text-sm font-bold truncate ${selectedChapterId === chapter.id ? 'text-gray-900' : 'text-gray-600'}`}>
                                    {chapter.title}
                                </p>
                            </div>
                            {selectedChapterId === chapter.id && <ChevronRight className="w-4 h-4 text-blue-600 self-center" />}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">Văn bản hiện hành</p>
                            <p className="text-xs font-bold text-gray-800">QĐ số 188/QĐ-BQLDA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT CONTENT - DETAILS */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                {/* Header */}
                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white shrink-0 z-10 sticky top-0">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                            <span>Hệ thống Quy chế</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="font-bold text-blue-600 uppercase">{selectedChapter?.code}</span>
                        </div>
                        <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">{selectedChapter?.title}</h1>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all" title="Chia sẻ"><Share2 className="w-5 h-5" /></button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all" title="Tùy chọn"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                    <div className="max-w-5xl mx-auto space-y-6 pb-20">
                        {selectedChapter?.articles.map((article, idx) => (
                            <div key={idx} id={article.id} className="group relative transition-all duration-500 animate-in slide-in-from-bottom-2">
                                {/* Article Header Badge */}
                                <div className="flex items-center gap-3 mb-3 ml-1">
                                    <span className="bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest">
                                        {article.code}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-800">{article.title}</h3>
                                </div>

                                {/* Content Card */}
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                    {/* Action Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button 
                                            onClick={() => setActiveCommentId(activeCommentId === article.id ? null : article.id)}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${activeCommentId === article.id ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {article.comments?.length || 0} Thảo luận
                                        </button>
                                    </div>

                                    {/* Dynamic Content Rendering */}
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        {typeof article.content === 'string' ? (
                                            article.content.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)
                                        ) : (
                                            article.content
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    {(activeCommentId === article.id) && (
                                        <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Thảo luận nội bộ</h4>
                                            
                                            <div className="space-y-4 mb-4">
                                                {article.comments?.map(comment => (
                                                    <div key={comment.id} className="flex gap-3 items-start">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                                                            {comment.user.charAt(0)}
                                                        </div>
                                                        <div className="bg-gray-50 rounded-2xl rounded-tl-none p-3 flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-gray-800">{comment.user}</span>
                                                                <span className="text-[10px] text-gray-400">{comment.date}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-600">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!article.comments || article.comments.length === 0) && (
                                                    <p className="text-xs text-gray-400 italic text-center py-2">Chưa có thảo luận nào.</p>
                                                )}
                                            </div>
                                            
                                            {/* Add Comment Input */}
                                            <div className="flex gap-3 items-center mt-4">
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white shrink-0">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 relative">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Viết ý kiến đóng góp..." 
                                                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Footer Notes */}
                        {selectedChapter?.type === 'chart' && (
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 flex items-start gap-3">
                                <Info className="w-5 h-5 text-yellow-600 shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">Lưu ý về cơ cấu tổ chức:</p>
                                    <p>Sơ đồ trên thể hiện mối quan hệ báo cáo trực tiếp. Các phòng ban có trách nhiệm phối hợp ngang hàng để giải quyết công việc chung của Ban QLDA.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Regulations;
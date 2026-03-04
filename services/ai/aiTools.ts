// AI Tools — Gemini Function Calling declarations
// Cho phép AI tự quyết định khi nào cần query dữ liệu từ Supabase

import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

/**
 * Tool definitions cho Gemini Function Calling
 * AI sẽ tự chọn tool phù hợp dựa trên câu hỏi của user
 */
export const AI_TOOLS: FunctionDeclaration[] = [
    {
        name: 'get_all_projects',
        description: 'Lấy danh sách tất cả dự án đầu tư công. Dùng khi user hỏi về danh sách dự án, tổng số dự án, dự án theo trạng thái.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                status: {
                    type: SchemaType.STRING,
                    description: 'Lọc theo trạng thái: 1=Chuẩn bị, 2=Thực hiện, 3=Hoàn thành',
                },
                search: {
                    type: SchemaType.STRING,
                    description: 'Từ khóa tìm kiếm tên dự án',
                },
            },
        },
    },
    {
        name: 'get_project_by_id',
        description: 'Lấy thông tin chi tiết một dự án theo ProjectID hoặc ProjectNumber. Dùng khi user hỏi chi tiết về một dự án cụ thể.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                projectId: {
                    type: SchemaType.STRING,
                    description: 'Mã dự án (ProjectID) hoặc số hiệu dự án (ProjectNumber)',
                },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_statistics',
        description: 'Lấy thống kê tổng hợp về dự án: tổng số, phân bổ theo trạng thái, nhóm, tổng vốn đầu tư. Dùng khi user hỏi tổng quan, thống kê.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: 'get_all_contracts',
        description: 'Lấy danh sách tất cả hợp đồng. Dùng khi user hỏi về hợp đồng, tổng giá trị HĐ, HĐ theo trạng thái.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                status: {
                    type: SchemaType.STRING,
                    description: 'Lọc theo trạng thái: 1=Đang thực hiện, 2=Tạm dừng, 3=Đã thanh lý',
                },
            },
        },
    },
    {
        name: 'get_all_payments',
        description: 'Lấy danh sách thanh toán. Dùng khi user hỏi về tiến độ thanh toán, số tiền đã giải ngân.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                contractId: {
                    type: SchemaType.STRING,
                    description: 'Lọc theo mã hợp đồng',
                },
            },
        },
    },
    {
        name: 'get_dashboard_metrics',
        description: 'Lấy chỉ số tổng hợp dashboard: tổng vốn đầu tư, tổng giải ngân, tỷ lệ giải ngân, số cảnh báo rủi ro. Dùng khi user hỏi tổng quan tình hình.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: 'get_capital_info',
        description: 'Lấy thông tin vốn và giải ngân của một dự án: kế hoạch vốn, tiến độ giải ngân, tóm tắt tài chính. Dùng khi user hỏi về vốn, giải ngân, tỷ lệ giải ngân của dự án.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                projectId: {
                    type: SchemaType.STRING,
                    description: 'Mã dự án',
                },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_dashboard_risks',
        description: 'Lấy danh sách cảnh báo rủi ro hiện tại từ dashboard. Dùng khi user hỏi về rủi ro, cảnh báo, vấn đề cần xử lý.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: 'get_upcoming_deadlines',
        description: 'Lấy danh sách công việc sắp đến hạn. Dùng khi user hỏi về deadline, việc cần làm, lịch trình.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {},
        },
    },
    {
        name: 'get_bidding_packages',
        description: 'Lấy danh sách gói thầu của một dự án hoặc tất cả gói thầu. Dùng khi user hỏi về đấu thầu, gói thầu, KHLCNT.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                projectId: {
                    type: SchemaType.STRING,
                    description: 'Mã dự án (để trống = lấy tất cả)',
                },
            },
        },
    },
];

/**
 * Quick suggestion buttons cho chatbot UI
 */
export const QUICK_SUGGESTIONS = [
    { label: '📊 Tổng quan tình hình', prompt: 'Cho tôi tổng quan tình hình dự án hiện tại' },
    { label: '⚠️ Rủi ro & Cảnh báo', prompt: 'Có cảnh báo rủi ro nào không?' },
    { label: '💰 Tiến độ giải ngân', prompt: 'Tiến độ giải ngân hiện tại như thế nào?' },
    { label: '📋 Việc cần làm', prompt: 'Những công việc nào sắp đến hạn?' },
    { label: '🏗️ Dự án lớn nhất', prompt: 'Dự án nào có tổng mức đầu tư lớn nhất?' },
];

// AI Image Extractor — Trích xuất thông tin dự án từ ảnh chụp màn hình
// Sử dụng Gemini 2.0 Flash Vision API

import { GoogleGenerativeAI } from '@google/generative-ai';

/** Kết quả trích xuất từ ảnh */
export interface ExtractedProjectData {
    ProjectName?: string;
    GroupCode?: string;        // 'A' | 'B' | 'C' | 'QN'
    TotalInvestment?: number;
    CapitalSource?: string;
    ProvinceName?: string;     // Tên tỉnh (sẽ map sang ProvinceCode phía UI)
    LocationCode?: string;     // Địa điểm XD
    ConstructionType?: string;
    ConstructionGrade?: string;
    CompetentAuthority?: string;
    InvestorName?: string;
    Duration?: string;
    StartDate?: string;        // YYYY-MM-DD
    ApplicableStandards?: string;
    FeasibilityContractor?: string;
    SurveyContractor?: string;
    ReviewContractor?: string;
}

const EXTRACTION_PROMPT = `Bạn là chuyên gia quản lý dự án đầu tư công Việt Nam. 
Hãy phân tích ảnh chụp màn hình chứa thông tin dự án và trích xuất các trường sau.

Trả về KẾT QUẢ DƯỚI DẠNG JSON object với các key sau:
{
  "ProjectName": "Tên dự án",
  "GroupCode": "Nhóm dự án: A, B, C hoặc QN (Quan trọng quốc gia)",
  "TotalInvestment": 0,
  "CapitalSource": "Nguồn vốn (VD: Ngân sách Tỉnh, NSTW...)",
  "ProvinceName": "Tên tỉnh/thành phố",
  "LocationCode": "Địa điểm xây dựng chi tiết",
  "ConstructionType": "Loại công trình: Dân dụng / Công nghiệp / Giao thông / Nông nghiệp & PTNT / Hạ tầng kỹ thuật / Quốc phòng, an ninh",
  "ConstructionGrade": "Cấp công trình: ĐB / I / II / III / IV",
  "CompetentAuthority": "Người quyết định đầu tư",
  "InvestorName": "Tên chủ đầu tư",
  "Duration": "Thời gian thực hiện (VD: 36 tháng (2025-2028))",
  "StartDate": "Ngày bắt đầu dự kiến (YYYY-MM-DD)",
  "ApplicableStandards": "Tiêu chuẩn, quy chuẩn áp dụng",
  "FeasibilityContractor": "Nhà thầu lập BCNCKT",
  "SurveyContractor": "Nhà thầu khảo sát XD",
  "ReviewContractor": "Nhà thầu thẩm tra"
}

QUY TẮC:
- TotalInvestment phải là SỐ NGUYÊN (đơn vị VNĐ), ví dụ 5000000000 (5 tỷ). Nếu ghi "5 tỷ" thì chuyển thành 5000000000.
- StartDate phải ở dạng YYYY-MM-DD. Nếu ghi "05/03/2026" thì chuyển thành "2026-03-05".
- GroupCode chỉ nhận: "A", "B", "C", hoặc "QN".
- Nếu không tìm thấy thông tin cho field nào, để null.
- CHỈ TRẢ VỀ JSON, KHÔNG có markdown, text hay giải thích.`;

/**
 * Trích xuất thông tin dự án từ ảnh bằng Gemini Vision API
 * @param imageBase64 - Base64 encoded image data (không bao gồm prefix "data:...")
 * @param mimeType - MIME type của ảnh (image/png, image/jpeg, image/webp)
 */
export const extractProjectFromImage = async (
    imageBase64: string,
    mimeType: string = 'image/png'
): Promise<ExtractedProjectData> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Thiếu VITE_GEMINI_API_KEY');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType,
                data: imageBase64,
            },
        },
        { text: EXTRACTION_PROMPT },
    ]);

    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

    try {
        const parsed = JSON.parse(jsonStr);
        // Clean up: remove null/undefined values
        const cleaned: ExtractedProjectData = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (value !== null && value !== undefined && value !== '') {
                (cleaned as any)[key] = value;
            }
        }
        return cleaned;
    } catch (err) {
        console.error('AI parse error:', text);
        throw new Error('Không thể phân tích kết quả AI. Vui lòng thử lại.');
    }
};

/**
 * Convert File/Blob to base64 string (không bao gồm data URI prefix)
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove "data:image/png;base64," prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Injects the parsed NĐ 175 chapters into legalData.ts
 * Replaces the existing sparse entry with the full content.
 */
const fs = require('fs');
const path = require('path');

const legalDataPath = path.join(__dirname, '..', 'features', 'legal-documents', 'legalData.ts');
const parsedPath = path.join(__dirname, '..', 'Doccument', 'nd175-parsed-chapters.txt');

const legalData = fs.readFileSync(legalDataPath, 'utf-8');
const parsedChapters = fs.readFileSync(parsedPath, 'utf-8');

// Also fix the title and code to match the actual document
const newEntry = `    // ========== NGHỊ ĐỊNH ==========
    {
        id: 'nd-175-2024',
        code: 'NĐ 175/2024/NĐ-CP',
        title: 'Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật Xây dựng về quản lý hoạt động xây dựng',
        shortTitle: 'NĐ 175/2024 (quản lý HĐXD)',
        type: 'nghi-dinh',
        issuedDate: '30/12/2024',
        effectiveDate: '01/01/2025',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Quy định chi tiết một số điều của Luật Xây dựng 2014 (sửa đổi 2020) về quản lý hoạt động xây dựng: phân loại dự án ĐTXD, lập/thẩm định/phê duyệt dự án và thiết kế XD, cấp phép XD, quản lý trật tự XD, năng lực hoạt động XD, BIM, và các biện pháp thi hành.',
        fileName: 'NĐ 175-2024.pdf',
        filePath: '/resources/NĐ 175-2024.pdf',
        fileSize: '24.9 MB',
        tags: ['quản lý hoạt động xây dựng', 'lập dự án', 'thẩm định', 'thiết kế xây dựng', 'giấy phép xây dựng', 'năng lực xây dựng', 'BIM', 'khảo sát xây dựng', 'phân loại dự án'],
        relatedDocIds: ['luat-xay-dung-2025', 'nd-111-2024', 'tt-06-2021'],
        ${parsedChapters}
    },`;

// Find and replace the old entry
// The old entry starts at "    // ========== NGHỊ ĐỊNH ==========" 
// and ends just before the next entry starting with "    {"
const startMarker = '    // ========== NGHỊ ĐỊNH ==========\n    {\n        id: \'nd-175-2024\',';
const endMarker = '\n    },\n    {\n        id: \'nd-111-2024\',';

const startIdx = legalData.indexOf(startMarker);
const endIdx = legalData.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find markers in legalData.ts');
    console.log('startIdx:', startIdx, 'endIdx:', endIdx);
    // Try CR LF
    const startMarkerCR = startMarker.replace(/\n/g, '\r\n');
    const endMarkerCR = endMarker.replace(/\n/g, '\r\n');
    const startIdxCR = legalData.indexOf(startMarkerCR);
    const endIdxCR = legalData.indexOf(endMarkerCR);
    console.log('With CRLF - startIdx:', startIdxCR, 'endIdx:', endIdxCR);

    if (startIdxCR !== -1 && endIdxCR !== -1) {
        const before = legalData.substring(0, startIdxCR);
        const after = legalData.substring(endIdxCR + '\r\n    },'.length);
        const result = before + newEntry + after;
        fs.writeFileSync(legalDataPath, result, 'utf-8');
        console.log('Successfully replaced NĐ 175 entry (CRLF mode)!');
        console.log('New file size:', (result.length / 1024).toFixed(1), 'KB');
    } else {
        console.error('Failed to find entry in either mode');
    }
} else {
    const before = legalData.substring(0, startIdx);
    const after = legalData.substring(endIdx + '\n    },'.length);
    const result = before + newEntry + after;
    fs.writeFileSync(legalDataPath, result, 'utf-8');
    console.log('Successfully replaced NĐ 175 entry!');
    console.log('New file size:', (result.length / 1024).toFixed(1), 'KB');
}

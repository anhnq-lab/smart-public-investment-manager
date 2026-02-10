const { PdfReader } = require('pdfreader');
const path = require('path');
const fs = require('fs');

const files = [
    {
        input: path.join(__dirname, 'Doccument', 'Nghi_dinh_144_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_quyen,_phan_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785955601.pdf'),
        output: 'nd144-output.txt',
        label: 'NĐ 144/2025'
    },
    {
        input: path.join(__dirname, 'Doccument', 'Nghi_dinh_140_2025_ND-CP_cua_Chinh_phu_quy_dinh_ve_phan_dinh_tham_quyen_cua_chinh_quyen_dia_phuong_02_cap_trong_linh_vuc_quan_ly_Nha_nuoc_cua_Bo_Xay_dung_1749785465897.pdf'),
        output: 'nd140-output.txt',
        label: 'NĐ 140/2025'
    }
];

let completed = 0;

files.forEach(f => {
    const lines = [];
    let currentPage = 0;

    new PdfReader().parseFileItems(f.input, (err, item) => {
        if (err) {
            console.error(`Error reading ${f.label}:`, err);
            completed++;
            return;
        }
        if (!item) {
            const text = lines.join('\n');
            fs.writeFileSync(f.output, text, 'utf8');
            console.log(`\n=== ${f.label} ===`);
            console.log(`Pages: ${currentPage}, Lines: ${lines.length}`);
            console.log(`Written to: ${f.output}`);
            console.log(`Text length: ${text.length} chars`);
            completed++;
            if (completed === files.length) {
                console.log('\n--- Done! ---');
            }
            return;
        }
        if (item.page) {
            currentPage = item.page;
            lines.push(`\n=== PAGE ${item.page} ===\n`);
        }
        if (item.text) {
            lines.push(item.text);
        }
    });
});

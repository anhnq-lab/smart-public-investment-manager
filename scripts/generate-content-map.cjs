/**
 * Generate updated legalData articles with full content
 * Reads luat135-articles.json and outputs the article blocks for legalData.ts
 */
const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('resources/luat135-articles.json', 'utf-8'));

// Chapter structure matching the actual PDF
const chapters = [
    { code: 'Chương I', title: 'Những quy định chung', range: [1, 15] },
    { code: 'Chương II', title: 'Quản lý dự án đầu tư xây dựng', range: [16, 42] },
    { code: 'Chương III', title: 'Giấy phép xây dựng và quản lý trật tự xây dựng', range: [43, 47] },
    { code: 'Chương IV', title: 'Xây dựng công trình', range: [48, 72] },
    { code: 'Chương V', title: 'Chi phí đầu tư xây dựng và hợp đồng xây dựng', range: [73, 87] },
    { code: 'Chương VI', title: 'Điều kiện năng lực hoạt động xây dựng', range: [88, 92] },
    { code: 'Chương VII', title: 'Quản lý nhà nước về xây dựng', range: [91, 92] },
    { code: 'Chương VIII', title: 'Điều khoản thi hành', range: [93, 95] },
];

// For the summary, we keep the existing summaries from legalData.ts
// For the content, we use the full extracted text
// Since we can't read TS easily, we'll just output the content field mapping

const output = {};
for (const [key, value] of Object.entries(articles)) {
    const num = value.number;
    // Escape special chars for TypeScript string
    const content = value.content
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');

    output[`Điều ${num}`] = {
        id: `luat135-d${num}`,
        code: `Điều ${num}`,
        title: value.title,
        contentLength: value.content.length,
        content: content
    };
}

// Write the mapping
fs.writeFileSync('resources/luat135-content-map.json', JSON.stringify(output, null, 2), 'utf-8');

// Stats
let totalChars = 0;
for (const v of Object.values(articles)) {
    totalChars += v.content.length;
}
console.log(`Total articles: ${Object.keys(output).length}`);
console.log(`Total content size: ${(totalChars / 1024).toFixed(1)} KB`);
console.log(`Average per article: ${(totalChars / Object.keys(output).length).toFixed(0)} chars`);

// Show breakdown by chapter
for (const ch of chapters) {
    let count = 0;
    let chars = 0;
    for (let i = ch.range[0]; i <= ch.range[1]; i++) {
        const key = `Điều ${i}`;
        if (articles[key]) {
            count++;
            chars += articles[key].content.length;
        }
    }
    console.log(`${ch.code}: ${count} articles, ${(chars / 1024).toFixed(1)} KB`);
}

console.log('\n✅ Written to resources/luat135-content-map.json');

/**
 * Parse Luật Quy hoạch 112/2025/QH15 and generate legalData.ts entries
 */
const fs = require('fs');
const path = require('path');

const fullText = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'luat112-full-text.txt'),
    'utf-8'
);

// Split into lines and clean
const lines = fullText.split('\n').map(l => l.replace(/\r/g, '').trim()).filter(Boolean);

// Parse articles
const articles = [];
let currentArticle = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match "Điều X." or "Điều X:" pattern
    const match = line.match(/^Điều\s+(\d+)\.\s*(.*)$/);
    if (match) {
        if (currentArticle) {
            articles.push(currentArticle);
        }
        currentArticle = {
            number: parseInt(match[1]),
            title: match[2].trim(),
            lines: []
        };
    } else if (currentArticle) {
        // Stop collecting at chapter headings or appendix
        if (line.match(/^Chương\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)/) ||
            line === 'PHỤ LỤC' ||
            line === 'CHỦ TỊCH QUỐC HỘI') {
            articles.push(currentArticle);
            currentArticle = null;
        } else {
            currentArticle.lines.push(line);
        }
    }
}
if (currentArticle) articles.push(currentArticle);

console.log(`Parsed ${articles.length} articles`);
articles.forEach(a => console.log(`  Điều ${a.number}: ${a.title.substring(0, 60)}...`));

// Define chapter structure
const chapters = [
    {
        id: 'qh112-ch1',
        code: 'Chương I',
        title: 'Quy định chung',
        articleRange: [1, 16]
    },
    {
        id: 'qh112-ch2',
        code: 'Chương II',
        title: 'Lập quy hoạch',
        articleRange: [17, 31]
    },
    {
        id: 'qh112-ch3',
        code: 'Chương III',
        title: 'Thẩm định, quyết định hoặc phê duyệt quy hoạch',
        articleRange: [32, 40]
    },
    {
        id: 'qh112-ch4',
        code: 'Chương IV',
        title: 'Công bố, cung cấp thông tin và thực hiện quy hoạch',
        articleRange: [41, 48]
    },
    {
        id: 'qh112-ch5',
        code: 'Chương V',
        title: 'Đánh giá, điều chỉnh quy hoạch',
        articleRange: [49, 54]
    },
    {
        id: 'qh112-ch6',
        code: 'Chương VI',
        title: 'Điều khoản thi hành',
        articleRange: [55, 58]
    }
];

// Build data structure
function escapeTS(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function generateSummary(article) {
    // Use first 1-2 meaningful lines as summary
    const contentLines = article.lines.filter(l => l.length > 10);
    if (contentLines.length === 0) return article.title;
    const summary = contentLines.slice(0, 2).join(' ');
    return summary.length > 300 ? summary.substring(0, 297) + '...' : summary;
}

// Generate TypeScript code
let tsCode = '';

// Document metadata
tsCode += `\n// ============================================\n`;
tsCode += `// Luật Quy hoạch 112/2025/QH15\n`;
tsCode += `// ============================================\n\n`;

tsCode += `const luatQuyHoach: LegalDocument = {\n`;
tsCode += `    id: 'luat-quy-hoach-2025',\n`;
tsCode += `    code: '112/2025/QH15',\n`;
tsCode += `    title: 'Luật Quy hoạch',\n`;
tsCode += `    shortTitle: 'Luật QH 2025',\n`;
tsCode += `    type: 'luat',\n`;
tsCode += `    issuedDate: '2025-12-10',\n`;
tsCode += `    effectiveDate: '2026-03-01',\n`;
tsCode += `    issuedBy: 'Quốc hội',\n`;
tsCode += `    status: 'hieu-luc',\n`;
tsCode += `    summary: 'Luật Quy hoạch quy định hệ thống quy hoạch; việc lập, thẩm định, quyết định hoặc phê duyệt, công bố, cung cấp thông tin, thực hiện, đánh giá và điều chỉnh quy hoạch; quản lý nhà nước về hoạt động quy hoạch.',\n`;
tsCode += `    fileName: '112_2025_QH15_586814.doc',\n`;
tsCode += `    filePath: '/documents/112_2025_QH15_586814.doc',\n`;
tsCode += `    fileSize: '1.2 MB',\n`;
tsCode += `    tags: ['quy hoạch', 'quy hoạch tổng thể', 'quy hoạch vùng', 'quy hoạch tỉnh', 'quy hoạch ngành', 'thẩm định', 'phê duyệt'],\n`;
tsCode += `    relatedDocIds: ['luat-xay-dung-2025', 'luat-dau-tu-cong-2019'],\n`;
tsCode += `    chapters: [\n`;

for (const chapter of chapters) {
    const chapterArticles = articles.filter(
        a => a.number >= chapter.articleRange[0] && a.number <= chapter.articleRange[1]
    );

    tsCode += `        {\n`;
    tsCode += `            id: '${chapter.id}',\n`;
    tsCode += `            code: '${chapter.code}',\n`;
    tsCode += `            title: '${escapeTS(chapter.title)}',\n`;
    tsCode += `            articles: [\n`;

    for (const article of chapterArticles) {
        const content = article.lines.join('\n');
        const summary = generateSummary(article);

        tsCode += `                {\n`;
        tsCode += `                    id: 'qh112-d${article.number}',\n`;
        tsCode += `                    code: 'Điều ${article.number}',\n`;
        tsCode += `                    title: '${escapeTS(article.title)}',\n`;
        tsCode += `                    summary: '${escapeTS(summary)}',\n`;
        tsCode += `                    content: '${escapeTS(content)}',\n`;
        tsCode += `                },\n`;
    }

    tsCode += `            ],\n`;
    tsCode += `        },\n`;
}

tsCode += `    ],\n`;
tsCode += `};\n`;

// Save generated code
const outputPath = path.join(__dirname, '..', 'resources', 'luat112-generated.ts');
fs.writeFileSync(outputPath, tsCode, 'utf-8');
console.log(`\nGenerated TypeScript code saved to: ${outputPath}`);
console.log(`File size: ${(Buffer.byteLength(tsCode) / 1024).toFixed(1)} KB`);

// Stats
console.log('\n--- Chapter Statistics ---');
for (const chapter of chapters) {
    const chapterArticles = articles.filter(
        a => a.number >= chapter.articleRange[0] && a.number <= chapter.articleRange[1]
    );
    const totalContent = chapterArticles.reduce((sum, a) => sum + a.lines.join('\n').length, 0);
    console.log(`${chapter.code} ${chapter.title}: ${chapterArticles.length} điều, ${(totalContent / 1024).toFixed(1)} KB`);
}

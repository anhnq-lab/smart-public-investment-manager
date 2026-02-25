const fs = require('fs');
const path = require('path');

// Read with utf-8, strip BOM
let rawText = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'luat58-full-text.txt'),
    'utf-8'
);
if (rawText.charCodeAt(0) === 0xFEFF) rawText = rawText.slice(1);

const lines = rawText.split(/\r?\n/);
console.log(`Total lines: ${lines.length}`);

// Find "Điều X." pattern
function matchDieu(line) {
    const normalized = line.normalize('NFC').trim();
    const patterns = [
        /^Điều\s+(\d+)\.\s*(.*)$/,
        /^Đi[eề]u\s+(\d+)\.\s*(.*)$/,
    ];
    for (const p of patterns) {
        const m = normalized.match(p);
        if (m) return { num: parseInt(m[1]), title: m[2].trim() };
    }
    const nfd = line.normalize('NFD').trim();
    const nfdMatch = nfd.match(/^\u0110i\u00ea\u0300u\s+(\d+)\.\s*(.*)$/);
    if (nfdMatch) return { num: parseInt(nfdMatch[1]), title: nfdMatch[2].normalize('NFC').trim() };
    const stripped = normalized.replace(/[\u0300-\u036f]/g, '');
    const simpleMatch = stripped.match(/^Dieu\s+(\d+)\.\s*(.*)$/i);
    if (simpleMatch) {
        const titleStart = normalized.indexOf('.') + 1;
        return { num: parseInt(simpleMatch[1]), title: normalized.substring(titleStart).trim() };
    }
    return null;
}

// Detect chapter headers
function isChapterHeader(line) {
    const n = line.normalize('NFC').trim();
    return /^Ch\u01b0\u01a1ng\s+[IVX]+/i.test(n) || /^CH\u01af\u01a0NG\s+[IVX]+/i.test(n);
}

// Detect section headers (Mục)
function isSectionHeader(line) {
    const n = line.normalize('NFC').trim();
    return /^M\u1ee5c\s+\d+/i.test(n);
}

// Parse all articles
const articlePositions = [];
for (let i = 0; i < lines.length; i++) {
    const result = matchDieu(lines[i]);
    if (result) articlePositions.push({ line: i, ...result });
}
console.log(`Found ${articlePositions.length} articles`);

// Define chapter structure
const chapters = [
    { id: 'luat58-ch1', code: 'Chương I', title: 'Những quy định chung', startArticle: 1, endArticle: 17 },
    { id: 'luat58-ch2', code: 'Chương II', title: 'Chủ trương đầu tư và quyết định đầu tư chương trình, dự án đầu tư công', startArticle: 18, endArticle: 48 },
    { id: 'luat58-ch3', code: 'Chương III', title: 'Lập, thẩm định, phê duyệt và giao kế hoạch đầu tư công', startArticle: 49, endArticle: 62 },
    { id: 'luat58-ch4', code: 'Chương IV', title: 'Chủ trương đầu tư, quyết định đầu tư chương trình, dự án sử dụng vốn ODA, vốn vay ưu đãi nước ngoài', startArticle: 63, endArticle: 67 },
    { id: 'luat58-ch5', code: 'Chương V', title: 'Thực hiện và theo dõi, kiểm tra, đánh giá, giám sát kế hoạch, chương trình, dự án đầu tư công', startArticle: 68, endArticle: 80 },
    { id: 'luat58-ch6', code: 'Chương VI', title: 'Nhiệm vụ, quyền hạn, trách nhiệm của cơ quan, tổ chức, cá nhân trong hoạt động đầu tư công', startArticle: 81, endArticle: 101 },
    { id: 'luat58-ch7', code: 'Chương VII', title: 'Điều khoản thi hành', startArticle: 102, endArticle: 103 },
];

// Build articles with content
const articles = [];
for (let a = 0; a < articlePositions.length; a++) {
    const pos = articlePositions[a];
    const nextLine = a < articlePositions.length - 1 ? articlePositions[a + 1].line : lines.length;

    let contentLines = [];
    for (let j = pos.line + 1; j < nextLine; j++) {
        const trimmed = lines[j].trim();
        if (isChapterHeader(trimmed)) continue;
        if (isSectionHeader(trimmed)) continue;
        if (trimmed.length > 0) contentLines.push(trimmed);
    }

    // Summary: first 250 chars, with proper truncation
    let summary = contentLines.slice(0, 3).join(' ');
    if (summary.length > 250) summary = summary.substring(0, 247) + '...';

    articles.push({
        num: pos.num,
        title: pos.title,
        summary,
        contentLines,
    });
}

console.log(`Processed ${articles.length} articles with content`);

// Escape for single-quoted strings, but keep \n as REAL newlines
function esc(s) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Generate TypeScript with REAL newlines in content (using backtick template literals)
let ts = `    {
        id: 'luat-dau-tu-cong-2024',
        code: 'Luật số 58/2024/QH15',
        title: 'Luật Đầu tư công',
        shortTitle: 'Luật Đầu tư công 2024',
        type: 'luat',
        issuedDate: '29/11/2024',
        effectiveDate: '01/01/2025',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Quy định việc quản lý nhà nước về đầu tư công; quản lý và sử dụng vốn đầu tư công; quyền, nghĩa vụ và trách nhiệm của cơ quan, đơn vị, tổ chức, cá nhân liên quan đến hoạt động đầu tư công. Thay thế Luật Đầu tư công số 39/2019/QH14.',
        fileName: 'Luật đầu tư công.pdf',
        filePath: '/resources/Luật đầu tư công.pdf',
        fileSize: '12.6 MB',
        tags: ['đầu tư công', 'vốn nhà nước', 'kế hoạch đầu tư', 'thẩm định dự án', 'ODA', 'giám sát đầu tư'],
        relatedDocIds: ['nd-175-2024', 'nd-111-2024'],
        chapters: [\n`;

for (const ch of chapters) {
    const chArticles = articles.filter(a => a.num >= ch.startArticle && a.num <= ch.endArticle);

    ts += `            {\n`;
    ts += `                id: '${ch.id}', code: '${ch.code}', title: '${esc(ch.title)}',\n`;
    ts += `                articles: [\n`;

    for (const art of chArticles) {
        // Build fullContent with REAL \n between lines
        const fullContent = art.contentLines.join('\n');

        ts += `                    {\n`;
        ts += `                        id: 'luat58-d${art.num}',\n`;
        ts += `                        code: 'Điều ${art.num}',\n`;
        ts += `                        title: '${esc(art.title)}',\n`;
        ts += `                        summary: '${esc(art.summary)}',\n`;

        if (fullContent.length > 0) {
            // Use backtick template literals to preserve actual newlines
            ts += `                        content: \`${fullContent.replace(/\\/g, '\\\\').replace(/\`/g, '\\`').replace(/\$/g, '\\$')}\`,\n`;
        }

        ts += `                    },\n`;
    }

    ts += `                ]\n`;
    ts += `            },\n`;
}

ts += `        ]\n    },`;

const outputPath = path.join(__dirname, 'luat58-replacement.ts');
fs.writeFileSync(outputPath, ts, 'utf-8');
console.log(`\nWritten to ${outputPath}`);
console.log(`Size: ${(ts.length / 1024).toFixed(1)} KB`);
console.log(`Articles per chapter:`, chapters.map(ch => {
    const count = articles.filter(a => a.num >= ch.startArticle && a.num <= ch.endArticle).length;
    return `${ch.code}: ${count}`;
}).join(', '));

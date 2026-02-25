const fs = require('fs');
const path = require('path');

// Read with utf-8, strip BOM
let rawText = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'luat58-full-text.txt'),
    'utf-8'
);
// Strip BOM
if (rawText.charCodeAt(0) === 0xFEFF) rawText = rawText.slice(1);

const lines = rawText.split(/\r?\n/);
console.log(`Total lines: ${lines.length}`);

// Normalize Unicode - Vietnamese can use NFC or NFD forms
const { normalize } = require('string_decoder');

// Find "Điều X." pattern - handle both composed and decomposed Unicode
function matchDieu(line) {
    // Normalize to NFC first
    const normalized = line.normalize('NFC').trim();
    // Try multiple patterns
    const patterns = [
        /^Điều\s+(\d+)\.\s*(.*)$/,
        /^Đi[eề]u\s+(\d+)\.\s*(.*)$/,
    ];
    for (const p of patterns) {
        const m = normalized.match(p);
        if (m) return { num: parseInt(m[1]), title: m[2].trim() };
    }

    // Fallback: check for article-like pattern with Unicode normalization
    const nfd = line.normalize('NFD').trim();
    const nfdMatch = nfd.match(/^\u0110i\u00ea\u0300u\s+(\d+)\.\s*(.*)$/);
    if (nfdMatch) return { num: parseInt(nfdMatch[1]), title: nfdMatch[2].normalize('NFC').trim() };

    const nfdMatch2 = nfd.match(/^\u0110i\u1EC1u\s+(\d+)\.\s*(.*)$/);
    if (nfdMatch2) return { num: parseInt(nfdMatch2[1]), title: nfdMatch2[2].normalize('NFC').trim() };

    // Last resort: look for any line that starts with D followed by "ieu" + number + dot
    const stripped = normalized.replace(/[\u0300-\u036f]/g, ''); // remove combining marks
    const simpleMatch = stripped.match(/^Dieu\s+(\d+)\.\s*(.*)$/i);
    if (simpleMatch) {
        // Re-extract title from original
        const titleStart = normalized.indexOf('.') + 1;
        return { num: parseInt(simpleMatch[1]), title: normalized.substring(titleStart).trim() };
    }

    return null;
}

// Test on first few lines
let articleCount = 0;
const articlePositions = [];
for (let i = 0; i < lines.length; i++) {
    const result = matchDieu(lines[i]);
    if (result) {
        articleCount++;
        articlePositions.push({ line: i, ...result });
    }
}
console.log(`Found ${articleCount} articles`);
if (articleCount < 50) {
    // Debug: show lines that look like they could be articles
    console.log('\nLooking for article-like lines...');
    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const l = lines[i].trim();
        if (l.length > 0 && l.length < 200) {
            const codes = [...l.substring(0, 15)].map(c => c.charCodeAt(0).toString(16)).join(' ');
            if (l.includes('1.') || l.includes('2.') || i < 5) {
                console.log(`Line ${i}: [${codes}] "${l.substring(0, 60)}"`);
            }
        }
    }

    // Try to find the specific character code for first article
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (/\d+\./.test(l) && l.length < 200 && l.length > 10) {
            const first5 = [...l.substring(0, 10)].map(c => `${c}(${c.charCodeAt(0).toString(16)})`).join('');
            if (l.includes('Ph') || l.includes('Đ') || l.charCodeAt(0) > 127) {
                console.log(`Potential Art Line ${i}: ${first5} | "${l.substring(0, 60)}"`);
                if (articlePositions.length === 0) break; // Just show first one
            }
        }
    }
}

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

if (articlePositions.length >= 50) {
    // Build content for each article
    const articles = [];
    for (let a = 0; a < articlePositions.length; a++) {
        const pos = articlePositions[a];
        const nextLine = a < articlePositions.length - 1 ? articlePositions[a + 1].line : lines.length;

        // Collect content between this article and the next
        let contentLines = [];
        for (let j = pos.line + 1; j < nextLine; j++) {
            const trimmed = lines[j].trim();
            // Skip chapter headers, section headers
            if (/^Ch\u01b0\u01a1ng\s+[IVX]+/i.test(trimmed.normalize('NFC'))) continue;
            if (/^M\u1ee5c\s+\d+/i.test(trimmed.normalize('NFC'))) continue;
            if (trimmed.length > 0) contentLines.push(trimmed);
        }

        // Summary: first 250 chars
        let summary = contentLines.slice(0, 3).join(' ');
        if (summary.length > 250) summary = summary.substring(0, 247) + '...';

        articles.push({
            num: pos.num,
            title: pos.title,
            summary: summary,
            contentLines: contentLines,
        });
    }

    console.log(`Processed ${articles.length} articles with content`);

    // Generate TypeScript
    function esc(s) {
        return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

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
            const fullContent = art.contentLines.join('\\n');
            ts += `                    { id: 'luat58-d${art.num}', code: 'Điều ${art.num}', title: '${esc(art.title)}', summary: '${esc(art.summary)}'`;
            if (fullContent.length > 0 && fullContent.length < 8000) {
                ts += `, fullContent: '${esc(fullContent)}'`;
            }
            ts += ` },\n`;
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
}

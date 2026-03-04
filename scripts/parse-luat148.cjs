/**
 * Parse Luật 148/2025/QH15 (Luật Chuyển đổi số) full text and generate legalData.ts entry
 */
const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'luat148-full-text.txt'),
    'utf-8'
);

const lines = text.split(/\r?\n/);

const chapters = [];
let currentChapter = null;
let currentArticle = null;
let articleContentLines = [];

function flushArticle() {
    if (currentArticle) {
        currentArticle.content = articleContentLines.join('\n').trim();
        if (currentChapter) {
            currentChapter.articles.push(currentArticle);
        }
        currentArticle = null;
        articleContentLines = [];
    }
}

function flushChapter() {
    flushArticle();
    if (currentChapter) {
        chapters.push(currentChapter);
        currentChapter = null;
    }
}

// Match chapter headers like "Chương I", "Chương II", "Chương VII ", "Chương VIII"
const chapterRegex = /^Chương\s+(I{1,4}V?|VI{0,4}|IX|XI{0,4}V?|XIV)\s*$/i;
const articleRegex = /^Điều\s+(\d+)\.\s+(.+)/;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const chMatch = line.match(chapterRegex);
    if (chMatch) {
        flushChapter();
        const chCode = chMatch[1];
        // Next non-empty line is title
        let title = '';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !nextLine.match(articleRegex) && !nextLine.match(chapterRegex)) {
                title = nextLine;
                break;
            }
        }
        currentChapter = {
            code: `Chương ${chCode}`,
            title: title,
            articles: []
        };
        continue;
    }

    const artMatch = line.match(articleRegex);
    if (artMatch) {
        flushArticle();
        const artNum = artMatch[1];
        const artTitle = artMatch[2].trim();
        currentArticle = {
            num: parseInt(artNum),
            code: `Điều ${artNum}`,
            title: artTitle,
            content: ''
        };
        continue;
    }

    if (currentArticle) {
        articleContentLines.push(lines[i]);
    }
}

flushChapter();

// Escape backticks and ${} for template literals
function escapeTemplateStr(s) {
    return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

let chapterIdx = 0;
const chapterEntries = chapters.map(ch => {
    chapterIdx++;
    const articleEntries = ch.articles.map(art => {
        const escapedContent = escapeTemplateStr(art.content);
        const escapedTitle = escapeTemplateStr(art.title);

        return `                    {
                        id: 'luat148-d${art.num}',
                        code: '${art.code}',
                        title: \`${escapedTitle}\`,
                        summary: '',
                        content: \`${escapedContent}\`
                    }`;
    });

    const escapedChTitle = escapeTemplateStr(ch.title);

    return `            {
                id: 'luat148-ch${chapterIdx}', code: '${ch.code}', title: \`${escapedChTitle}\`,
                articles: [
${articleEntries.join(',\n')}
                ]
            }`;
});

const output = `    {
        id: 'luat-cds-2025',
        code: 'Luật số 148/2025/QH15',
        title: 'Luật Chuyển đổi số',
        shortTitle: 'Luật CĐS 148/2025',
        type: 'luat',
        issuedDate: '11/12/2025',
        effectiveDate: '01/07/2026',
        issuedBy: 'Quốc hội',
        status: 'hieu-luc',
        summary: 'Quy định về chuyển đổi số, bao gồm: nguyên tắc, chính sách; điều phối quốc gia; biện pháp bảo đảm; Chính phủ số; kinh tế số, xã hội số; trách nhiệm của cơ quan, tổ chức, cá nhân trong chuyển đổi số.',
        fileName: 'luat148-CĐS-2025.pdf',
        filePath: '/resources/luat148-CĐS-2025.pdf',
        fileSize: '',
        tags: ['chuyển đổi số', 'chính phủ số', 'kinh tế số', 'xã hội số', 'hạ tầng số', 'dịch vụ công trực tuyến', 'năng lực số', 'công dân số'],
        relatedDocIds: [],
        chapters: [
${chapterEntries.join(',\n')}
        ]
    },`;

fs.writeFileSync(path.join(__dirname, 'luat148-output.ts'), output, 'utf-8');

console.log('Parsed ' + chapters.length + ' chapters, total ' + chapters.reduce((s, c) => s + c.articles.length, 0) + ' articles.');
chapters.forEach((ch, i) => console.log('  Ch' + (i + 1) + ': ' + ch.code + ' - ' + ch.title + ' (' + ch.articles.length + ' articles)'));
console.log('Output written to scripts/luat148-output.ts');

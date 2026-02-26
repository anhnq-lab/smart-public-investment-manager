/**
 * Parse NĐ 214/2025/NĐ-CP full text and generate legalData.ts entry
 * Uses backtick template literals to avoid escaping issues
 */
const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'nghidinh214-full-text.txt'),
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

const chapterRegex = /^Chương\s+(I{1,4}V?|VI{0,4}|IX|XI{0,4}V?|XIV)\s*$/;
const articleRegex = /^Điều\s+(\d+)\.\s+(.+)/;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const chMatch = line.match(chapterRegex);
    if (chMatch) {
        flushChapter();
        const chCode = chMatch[1];
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

// Escape backticks and ${} in content for template literals
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
                        id: 'nd214-d${art.num}',
                        code: '${art.code}',
                        title: \`${escapedTitle}\`,
                        content: \`${escapedContent}\`
                    }`;
    });

    const escapedChTitle = escapeTemplateStr(ch.title);

    return `            {
                id: 'nd214-ch${chapterIdx}', code: '${ch.code}', title: \`${escapedChTitle}\`,
                articles: [
${articleEntries.join(',\n')}
                ]
            }`;
});

const output = `    {
        id: 'nd-214-2025',
        code: 'NĐ 214/2025/NĐ-CP',
        title: 'Nghị định quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu về lựa chọn nhà thầu',
        shortTitle: 'NĐ 214/2025 (đấu thầu nhà thầu)',
        type: 'nghi-dinh',
        issuedDate: '04/08/2025',
        effectiveDate: '04/08/2025',
        issuedBy: 'Chính phủ',
        status: 'hieu-luc',
        summary: 'Quy định chi tiết một số điều và biện pháp thi hành Luật Đấu thầu số 22/2023/QH15 về lựa chọn nhà thầu, bao gồm: bảo đảm cạnh tranh, ưu đãi, kế hoạch lựa chọn nhà thầu, quy trình đấu thầu, hợp đồng, mua sắm tập trung, xử lý vi phạm.',
        tags: ['đấu thầu', 'lựa chọn nhà thầu', 'hồ sơ mời thầu', 'đánh giá HSDT', 'hợp đồng', 'mua sắm tập trung', 'chào giá trực tuyến'],
        relatedDocIds: ['luat-dau-tu-cong-2024', 'nd-175-2024'],
        chapters: [
${chapterEntries.join(',\n')}
        ]
    },`;

fs.writeFileSync(path.join(__dirname, 'nd214-output.ts'), output, 'utf-8');

console.log(`Parsed ${chapters.length} chapters, total ${chapters.reduce((s, c) => s + c.articles.length, 0)} articles.`);
console.log('Output written to scripts/nd214-output.ts');

/**
 * Parses nghidinh175-full-text.txt and outputs a TypeScript data structure
 * for legalData.ts chapters/articles format.
 */
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(
    path.join(__dirname, '..', 'Doccument', 'nghidinh175-full-text.txt'),
    'utf-8'
);

// Normalize line endings
const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const lines = text.split('\n');

const chapters = [];
let currentChapter = null;
let currentArticle = null;
let currentContent = [];

function flushArticle() {
    if (currentArticle) {
        const content = currentContent.join('\n').trim();
        // summary = first 200 chars
        const summary = content.substring(0, 250).replace(/\n/g, ' ').trim();
        currentArticle.summary = summary + (content.length > 250 ? '...' : '');
        currentArticle.content = content;
        if (currentChapter) {
            currentChapter.articles.push(currentArticle);
        }
        currentArticle = null;
        currentContent = [];
    }
}

function flushChapter() {
    flushArticle();
    if (currentChapter) {
        chapters.push(currentChapter);
        currentChapter = null;
    }
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect Chapter: "Chương I", "Chương II", etc. at start of line
    const chapterMatch = line.match(/^Chương\s+(I{1,3}V?|V?I{0,3}|[IVXLCDM]+)\s*$/i);
    if (chapterMatch) {
        flushChapter();
        // Next line is the chapter title
        const titleLine = (lines[i + 1] || '').trim();
        const romanNum = chapterMatch[1].toUpperCase();
        currentChapter = {
            code: `Chương ${romanNum}`,
            title: titleLine,
            articles: []
        };
        i++; // skip title line
        continue;
    }

    // Detect "Mục N. TITLE" as sub-section (we merge into current chapter)
    const mucMatch = line.match(/^Mục\s+(\d+)\.\s+(.+)/);
    if (mucMatch) {
        // We don't create separate chapters for Mục, just continue
        continue;
    }

    // Detect Article: "Điều N. Title"
    const articleMatch = line.match(/^Điều\s+(\d+)\.\s+(.+)/);
    if (articleMatch) {
        flushArticle();
        const artNum = articleMatch[1];
        const artTitle = articleMatch[2].trim();
        currentArticle = {
            num: artNum,
            code: `Điều ${artNum}`,
            title: artTitle,
            summary: '',
            content: ''
        };
        continue;
    }

    // Accumulate content lines
    if (currentArticle && line) {
        currentContent.push(line);
    }
}

flushChapter();

// Output as TypeScript
let output = 'chapters: [\n';
for (const ch of chapters) {
    const chId = `nd175-ch${chapters.indexOf(ch) + 1}`;
    output += `            {\n`;
    output += `                id: '${chId}', code: '${ch.code}', title: '${ch.title.replace(/'/g, "\\'")}',\n`;
    output += `                articles: [\n`;
    for (const art of ch.articles) {
        const artId = `nd175-d${art.num}`;
        const escapedTitle = art.title.replace(/'/g, "\\'");
        const escapedSummary = art.summary.replace(/'/g, "\\'").replace(/\\/g, '\\\\');
        // For content we use template literal
        const escapedContent = art.content.replace(/`/g, '\\`').replace(/\${/g, '\\${');
        output += `                    {\n`;
        output += `                        id: '${artId}',\n`;
        output += `                        code: '${art.code}',\n`;
        output += `                        title: '${escapedTitle}',\n`;
        output += `                        summary: '${escapedSummary}',\n`;
        output += `                        content: \`${escapedContent}\`,\n`;
        output += `                    },\n`;
    }
    output += `                ]\n`;
    output += `            },\n`;
}
output += '        ]';

// Write output
const outPath = path.join(__dirname, '..', 'Doccument', 'nd175-parsed-chapters.txt');
fs.writeFileSync(outPath, output, 'utf-8');

// Print stats
let totalArticles = 0;
for (const ch of chapters) {
    totalArticles += ch.articles.length;
    console.log(`${ch.code}: ${ch.title} => ${ch.articles.length} articles`);
}
console.log(`\nTotal: ${chapters.length} chapters, ${totalArticles} articles`);
console.log(`Output written to: ${outPath}`);

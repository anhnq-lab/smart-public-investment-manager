/**
 * Parse luat135-full-text.txt → Extract full article content
 * Output: JSON mapping { "Điều X": "full content..." }
 */
const fs = require('fs');

const text = fs.readFileSync('resources/luat135-full-text.txt', 'utf-8');
const lines = text.split(/\r?\n/);

// Find all article boundaries
const articleRegex = /^Điều (\d+)\.\s+(.+)/;
const chapterRegex = /^Chương [IVX]+$/;
const sectionRegex = /^(Mục \d+\.|CHI PHÍ|HỢP ĐỒNG|ĐIỀU KIỆN|QUẢN LÝ NHÀ|ĐIỀU KHOẢN)/;

const articles = {};
let currentArticle = null;
let currentContent = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a new article start
    const match = line.match(articleRegex);
    if (match) {
        // Save previous article
        if (currentArticle) {
            articles[currentArticle.code] = {
                number: currentArticle.number,
                title: currentArticle.title,
                content: currentContent.join('\n').trim()
            };
        }

        currentArticle = {
            code: `Điều ${match[1]}`,
            number: parseInt(match[1]),
            title: match[2]
        };
        currentContent = [];
        continue;
    }

    // Skip chapter/section headers when inside an article
    if (currentArticle && line && !chapterRegex.test(line)) {
        // Skip section headers like "Mục 1. ..."  and chapter sub-headers
        if (sectionRegex.test(line)) continue;
        if (/^[A-ZĐ\s]+$/.test(line) && line.length > 5) continue; // ALL CAPS headers

        currentContent.push(line);
    }
}

// Save last article
if (currentArticle) {
    articles[currentArticle.code] = {
        number: currentArticle.number,
        title: currentArticle.title,
        content: currentContent.join('\n').trim()
    };
}

// Output stats
const articleNumbers = Object.keys(articles).map(k => articles[k].number).sort((a, b) => a - b);
console.log(`Total articles extracted: ${Object.keys(articles).length}`);
console.log(`Article range: Điều ${articleNumbers[0]} - Điều ${articleNumbers[articleNumbers.length - 1]}`);
console.log('---');

// Show first 3 articles as preview
for (const key of Object.keys(articles).slice(0, 3)) {
    const a = articles[key];
    console.log(`\n${key}. ${a.title}`);
    console.log(`Content (${a.content.length} chars):`);
    console.log(a.content.substring(0, 200) + '...');
}

// Write full JSON output
fs.writeFileSync('resources/luat135-articles.json', JSON.stringify(articles, null, 2), 'utf-8');
console.log('\n✅ Written to resources/luat135-articles.json');

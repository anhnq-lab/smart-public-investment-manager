/**
 * Inject full article content into legalData.ts
 * Reads current file, adds content field to LegalArticle interface,
 * and injects content from luat135-content-map.json
 */
const fs = require('fs');

const contentMap = JSON.parse(fs.readFileSync('resources/luat135-articles.json', 'utf-8'));

// Read existing legalData.ts
let data = fs.readFileSync('features/legal-documents/legalData.ts', 'utf-8');

// Step 1: Add content field to LegalArticle interface  
data = data.replace(
    'export interface LegalArticle {\r\n    id: string;\r\n    code: string;\r\n    title: string;\r\n    summary: string;\r\n}',
    'export interface LegalArticle {\r\n    id: string;\r\n    code: string;\r\n    title: string;\r\n    summary: string;\r\n    content?: string;\r\n}'
);

// Also try without \r
data = data.replace(
    'export interface LegalArticle {\n    id: string;\n    code: string;\n    title: string;\n    summary: string;\n}',
    'export interface LegalArticle {\n    id: string;\n    code: string;\n    title: string;\n    summary: string;\n    content?: string;\n}'
);

// Step 2: For each article in luat135 (luat-xay-dung-2025), inject content
// Pattern: { id: 'luat135-dXX', code: 'Điều XX', title: '...', summary: '...' }
// We need to add: content: '...' after summary

let injectedCount = 0;

for (const [key, value] of Object.entries(contentMap)) {
    const articleNum = value.number;
    const articleId = `luat135-d${articleNum}`;

    // Find this article in the data
    // Match pattern: { id: 'luat135-dXX', ... summary: '...' }
    const regex = new RegExp(
        `(\\{\\s*id:\\s*'${articleId}',\\s*code:\\s*'Điều ${articleNum}',\\s*title:\\s*'[^']*',\\s*summary:\\s*'[^']*')\\s*\\}`,
        'g'
    );

    // Escape the content for TypeScript string literal
    const escapedContent = value.content
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n');

    const replacement = `$1, content: '${escapedContent}' }`;

    const before = data;
    data = data.replace(regex, replacement);

    if (data !== before) {
        injectedCount++;
    }
}

console.log(`Injected content into ${injectedCount} articles`);

// Step 3: Update searchDocuments and deepSearchArticles to also search content
// Add content search to the searchDocuments function
data = data.replace(
    `a.summary.toLowerCase().includes(q)\n            )\n        )\n    );`,
    `a.summary.toLowerCase().includes(q) ||\n                (a.content && a.content.toLowerCase().includes(q))\n            )\n        )\n    );`
);

// Also try with \r\n
data = data.replace(
    `a.summary.toLowerCase().includes(q)\r\n            )\r\n        )\r\n    );`,
    `a.summary.toLowerCase().includes(q) ||\r\n                (a.content && a.content.toLowerCase().includes(q))\r\n            )\r\n        )\r\n    );`
);

// Write back
fs.writeFileSync('features/legal-documents/legalData.ts', data, 'utf-8');

// Verify
const newSize = fs.statSync('features/legal-documents/legalData.ts').size;
console.log(`New file size: ${(newSize / 1024).toFixed(1)} KB`);
console.log('✅ Done! legalData.ts updated with full content.');

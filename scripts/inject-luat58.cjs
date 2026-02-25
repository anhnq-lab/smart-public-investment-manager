const fs = require('fs');
const path = require('path');

const legalDataPath = path.join(__dirname, '..', 'features', 'legal-documents', 'legalData.ts');
const replacementPath = path.join(__dirname, 'luat58-replacement.ts');

// Read files
const legalData = fs.readFileSync(legalDataPath, 'utf-8');
const replacement = fs.readFileSync(replacementPath, 'utf-8');

const lines = legalData.split('\n');
console.log(`legalData.ts has ${lines.length} lines`);

// Find the old entry: look for id: 'luat-dau-tu-cong-2019'
let startLine = -1;
let endLine = -1;
let braceDepth = 0;
let foundStart = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("id: 'luat-dau-tu-cong-2019'")) {
        // Find the opening { before this line
        for (let j = i; j >= 0; j--) {
            if (lines[j].trim().startsWith('{')) {
                startLine = j;
                break;
            }
        }
        if (startLine === -1) startLine = i - 1;
        foundStart = true;
        braceDepth = 0;

        // Count braces from startLine to find the matching closing brace
        for (let j = startLine; j < lines.length; j++) {
            for (const ch of lines[j]) {
                if (ch === '{') braceDepth++;
                if (ch === '}') braceDepth--;
            }
            if (braceDepth === 0 && j > startLine) {
                // Check if next non-empty line has a comma
                endLine = j;
                if (lines[j].trim().endsWith(',')) {
                    endLine = j;
                }
                break;
            }
        }
        break;
    }
}

console.log(`Old entry: lines ${startLine + 1} to ${endLine + 1} (0-indexed: ${startLine}-${endLine})`);

if (startLine === -1 || endLine === -1) {
    console.error('Could not find old entry!');
    process.exit(1);
}

// Build new content
const before = lines.slice(0, startLine);
const after = lines.slice(endLine + 1);

let newContent = before.join('\n') + '\n' + replacement + '\n' + after.join('\n');

// Update cross-references: replace 'luat-dau-tu-cong-2019' with 'luat-dau-tu-cong-2024'
newContent = newContent.replace(/luat-dau-tu-cong-2019/g, 'luat-dau-tu-cong-2024');

fs.writeFileSync(legalDataPath, newContent, 'utf-8');

const newLines = newContent.split('\n');
console.log(`Updated legalData.ts: ${newLines.length} lines`);
console.log(`Replaced references: ${(legalData.match(/luat-dau-tu-cong-2019/g) || []).length} occurrences`);

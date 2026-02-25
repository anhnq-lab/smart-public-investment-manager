/**
 * Inject Luật Quy hoạch 112/2025 into legalData.ts
 * Appends the new document to the legalDocuments array
 */
const fs = require('fs');
const path = require('path');

const legalDataPath = path.join(__dirname, '..', 'features', 'legal-documents', 'legalData.ts');
const generatedPath = path.join(__dirname, '..', 'resources', 'luat112-generated.ts');

let legalData = fs.readFileSync(legalDataPath, 'utf-8');
const generatedCode = fs.readFileSync(generatedPath, 'utf-8');

// Extract the document object from generated code (everything between first { and last };)
const docStart = generatedCode.indexOf('{');
const docEnd = generatedCode.lastIndexOf('};');
const docObject = generatedCode.substring(docStart, docEnd + 1);

// Find the closing of the legalDocuments array: "];" after the last document
// We look for the pattern "    }\n];" which closes the array
// Find the last occurrence of "];" that is part of the legalDocuments array
const arrayClosePattern = /\n\];\s*\n\n\/\/ =+\n\/\/ HELPER FUNCTIONS/;
const match = legalData.match(arrayClosePattern);

if (!match) {
    console.error('Could not find the legalDocuments array closing pattern');
    console.log('Trying alternative approach...');

    // Alternative: find "];" followed by "// HELPER"
    const altPattern = /\];\r?\n\r?\n\/\/ =+\r?\n\/\/ HELPER/;
    const altMatch = legalData.match(altPattern);

    if (!altMatch) {
        console.error('Alternative pattern also failed. Looking for array close...');
        // Just look for the last "];" before "HELPER FUNCTIONS"
        const helperIdx = legalData.indexOf('HELPER FUNCTIONS');
        if (helperIdx === -1) {
            console.error('Cannot find HELPER FUNCTIONS section');
            process.exit(1);
        }

        // Search backwards from HELPER FUNCTIONS for "];"
        const beforeHelper = legalData.substring(0, helperIdx);
        const lastArrayClose = beforeHelper.lastIndexOf('];');

        if (lastArrayClose === -1) {
            console.error('Cannot find array close');
            process.exit(1);
        }

        console.log(`Found array close at position ${lastArrayClose}`);

        // Insert new document before "];"
        const newContent = legalData.substring(0, lastArrayClose) +
            '    // Luật Quy hoạch 112/2025/QH15\n' +
            '    ' + docObject + ',\n' +
            legalData.substring(lastArrayClose);

        fs.writeFileSync(legalDataPath, newContent, 'utf-8');
        console.log('Successfully injected Luật Quy hoạch into legalData.ts');
        const newSize = Buffer.byteLength(newContent);
        console.log(`New file size: ${(newSize / 1024).toFixed(1)} KB`);
    } else {
        const insertPos = altMatch.index;
        const newContent = legalData.substring(0, insertPos) +
            '\n    // Luật Quy hoạch 112/2025/QH15\n' +
            '    ' + docObject + ',\n' +
            legalData.substring(insertPos);

        fs.writeFileSync(legalDataPath, newContent, 'utf-8');
        console.log('Successfully injected Luật Quy hoạch into legalData.ts (alt)');
        const newSize = Buffer.byteLength(newContent);
        console.log(`New file size: ${(newSize / 1024).toFixed(1)} KB`);
    }
} else {
    const insertPos = match.index;
    const newContent = legalData.substring(0, insertPos) +
        '\n    // Luật Quy hoạch 112/2025/QH15\n' +
        '    ' + docObject + ',\n' +
        legalData.substring(insertPos);

    fs.writeFileSync(legalDataPath, newContent, 'utf-8');
    console.log('Successfully injected Luật Quy hoạch into legalData.ts');
    const newSize = Buffer.byteLength(newContent);
    console.log(`New file size: ${(newSize / 1024).toFixed(1)} KB`);
}

// Also update relatedDocIds for existing docs to reference the new one
let updatedData = fs.readFileSync(legalDataPath, 'utf-8');
// Add 'luat-quy-hoach-2025' to luat-xay-dung-2025's relatedDocIds if not already
if (!updatedData.includes("'luat-quy-hoach-2025'")) {
    console.log('Note: luat-quy-hoach-2025 reference not found yet in related docs');
}

// Verify
const artCount = (updatedData.match(/id: 'qh112-d\d+'/g) || []).length;
console.log(`\nVerification: Found ${artCount} article entries for Luật Quy hoạch`);

const fs = require('fs');

async function main() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const data = new Uint8Array(fs.readFileSync('resources/luat135-XD-2025.pdf'));
    const doc = await pdfjsLib.getDocument({ data }).promise;

    console.log(`PDF has ${doc.numPages} pages`);

    // Check page 1 in detail
    const page = await doc.getPage(1);
    const content = await page.getTextContent();

    console.log(`Page 1 has ${content.items.length} text items`);
    console.log('First 20 items:');
    for (let i = 0; i < Math.min(20, content.items.length); i++) {
        const item = content.items[i];
        console.log(`  [${i}] str="${item.str}" | dir="${item.dir}" | w=${item.width} | h=${item.height} | font=${item.fontName}`);
    }

    // Check page 3 (should have actual law content)
    const page3 = await doc.getPage(3);
    const content3 = await page3.getTextContent();
    console.log(`\nPage 3 has ${content3.items.length} text items`);
    for (let i = 0; i < Math.min(30, content3.items.length); i++) {
        const item = content3.items[i];
        console.log(`  [${i}] str="${item.str}" | font=${item.fontName}`);
    }

    // Check if there are annotations or something else
    const ops = await page.getOperatorList();
    console.log(`\nPage 1 operator list: ${ops.fnArray.length} operators`);
}
main().catch(console.error);

const fs = require('fs');

try {
    const rawData = fs.readFileSync('./pdf_raw.json');
    const pdfData = JSON.parse(rawData);

    console.log("Total Pages:", pdfData.Pages.length);

    let totalTextItems = 0;
    pdfData.Pages.forEach((page, i) => {
        const textCount = page.Texts ? page.Texts.length : 0;
        totalTextItems += textCount;
        console.log(`Page ${i + 1}: ${textCount} text items`);

        if (textCount > 0 && i < 3) { // Show first few items of first few pages
            console.log(`--- Page ${i + 1} Sample ---`);
            page.Texts.slice(0, 3).forEach(t => {
                console.log(decodeURIComponent(t.R[0].T));
            });
        }
    });

    if (totalTextItems === 0) {
        console.log("WARNING: No text found in any page. The PDF might be an image scan.");
    }

} catch (e) {
    console.error("Error reading/parsing JSON:", e);
}

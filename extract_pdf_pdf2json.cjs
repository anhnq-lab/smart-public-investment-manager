const fs = require('fs');
const PDFParser = require("pdf2json");

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    // Write the raw JSON to a file
    fs.writeFileSync("./pdf_raw.json", JSON.stringify(pdfData));
    console.log("PDF parsed successfully. Data written to pdf_raw.json");

    // Perform some basic analysis
    console.log("Total Pages:", pdfData.Pages.length);

    // Try to find "Phụ lục" in the text to identify relevant pages
    pdfData.Pages.forEach((page, pageIndex) => {
        const textContent = page.Texts.map(t => decodeURIComponent(t.R[0].T)).join(' ');
        if (textContent.toLowerCase().includes('phụ lục') || textContent.toLowerCase().includes('bảng')) {
            console.log(`Potential Table/Appendix found on Page ${pageIndex + 1}`);
            // console.log("Text snippet:", textContent.substring(0, 100));
        }
    });
});

pdfParser.loadPDF("./BC ĐẤU THẦU BTC.pdf");

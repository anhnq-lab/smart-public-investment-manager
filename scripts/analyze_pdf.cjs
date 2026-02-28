const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('BC ĐẤU THẦU BTC.pdf');

pdf(dataBuffer).then(function (data) {
    console.log('numpages:', data.numpages);

    // Simple check for tables or appendices
    const lines = data.text.split('\n');
    const appendixLines = lines.filter(l => l.toLowerCase().includes('phụ lục'));
    console.log('Appendix lines found:', appendixLines.length);
    console.log('First 5 appendix lines:', appendixLines.slice(0, 5));

    fs.writeFileSync('pdf_full_text.txt', data.text);
}).catch(err => {
    console.error(err);
});

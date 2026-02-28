import { readFileSync } from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const buf = readFileSync('So tay dau tu cong - Hai duong - 2025.pdf');
const data = await pdf(buf);
console.log('Pages:', data.numpages);
console.log(data.text.substring(0, 15000));

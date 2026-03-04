/**
 * DOCX Generator chuẩn Nghị định 30/2020/NĐ-CP
 * 
 * Quy chuẩn:
 * - Font: Times New Roman, cỡ 13-14pt
 * - Lề: trên 20-25mm, dưới 20-25mm, trái 30-35mm, phải 15-20mm
 * - Khoảng cách dòng: Exactly 18pt (1.5 lines)
 * - Quốc hiệu: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
 * - Tiêu ngữ: Độc lập - Tự do - Hạnh phúc
 * - Tên cơ quan ban hành
 * - Số, ký hiệu văn bản
 * - Địa danh, ngày tháng năm
 */

import {
    Document,
    Paragraph,
    TextRun,
    Header,
    Footer,
    AlignmentType,
    TabStopPosition,
    TabStopType,
    PageNumber,
    NumberFormat,
    convertMillimetersToTwip,
    BorderStyle,
    UnderlineType,
    Packer
} from 'docx';

// ── NĐ30 Constants ──────────────────────────────────────────────────
const FONT = 'Times New Roman';
const FONT_SIZE_13 = 26; // half-points
const FONT_SIZE_14 = 28;
const FONT_SIZE_12 = 24;
const FONT_SIZE_11 = 22;

// Margins in mm → twips
const MARGIN_TOP = convertMillimetersToTwip(20);
const MARGIN_BOTTOM = convertMillimetersToTwip(20);
const MARGIN_LEFT = convertMillimetersToTwip(30);
const MARGIN_RIGHT = convertMillimetersToTwip(15);

const LINE_SPACING = 276; // 1.15 lines × 240 = ~276 (close to NĐ30 standard)

interface DocxOptions {
    organizationName?: string;     // Tên cơ quan ban hành
    organizationParent?: string;   // Cơ quan chủ quản
    documentNumber?: string;       // Số văn bản
    documentSymbol?: string;       // Ký hiệu
    location?: string;             // Địa danh
    date?: Date;                   // Ngày ban hành
    title?: string;                // Trích yếu nội dung
    content: string;               // Nội dung văn bản (markdown-like)
    signerTitle?: string;          // Chức vụ người ký
    signerName?: string;           // Tên người ký
    recipientList?: string[];      // Nơi nhận
}

/**
 * Parse markdown-like content into paragraphs
 */
function sanitizeAIContent(content: string): string {
    // Strip duplicate header that AI sometimes generates
    let cleaned = content;
    // Remove lines that look like the document header (org name, doc number, date, etc.)
    const headerPatterns = [
        /^\s*```\s*$/gm,
        /^\s*CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM.*$/gm,
        /^\s*Độc lập\s*[-–]\s*Tự do\s*[-–]\s*Hạnh phúc.*$/gm,
        /^\s*ĐẢNG CỘNG SẢN VIỆT NAM.*$/gm,
        /^\s*HỌC VIỆN\s*(CHÍNH TRỊ|CTQG).*$/gm,
        /^\s*BAN\s*(QUẢN LÝ|QLDA).*ĐT(XD)?.*$/gm,
        /^\s*Số:\s*[\.…]+.*$/gm,
        /^\s*\*?Hà Nội,\s*ngày.*tháng.*năm.*\*?$/gm,
        /^\s*[-─═_]{3,}\s*$/gm, // horizontal rules
    ];
    for (const pattern of headerPatterns) {
        cleaned = cleaned.replace(pattern, '');
    }
    // Remove leading empty lines
    cleaned = cleaned.replace(/^\s*\n{2,}/g, '\n');
    return cleaned.trim();
}

function parseContentToParagraphs(rawContent: string): Paragraph[] {
    const content = sanitizeAIContent(rawContent);
    const paragraphs: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines — add spacing
        if (!trimmed) {
            paragraphs.push(new Paragraph({
                spacing: { after: 60 },
            }));
            continue;
        }

        // Heading level 1: **BOLD TEXT**
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.includes(':**')) {
            const text = trimmed.replace(/\*\*/g, '');
            paragraphs.push(new Paragraph({
                spacing: { before: 120, after: 60, line: LINE_SPACING },
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text,
                        font: FONT,
                        size: FONT_SIZE_14,
                        bold: true,
                    }),
                ],
            }));
            continue;
        }

        // Heading with colon: **Label:** content
        if (trimmed.startsWith('**') && trimmed.includes(':**')) {
            const match = trimmed.match(/^\*\*(.+?):\*\*\s*(.*)/);
            if (match) {
                const children: TextRun[] = [
                    new TextRun({
                        text: `${match[1]}: `,
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    }),
                ];
                if (match[2]) {
                    children.push(new TextRun({
                        text: match[2],
                        font: FONT,
                        size: FONT_SIZE_13,
                    }));
                }
                paragraphs.push(new Paragraph({
                    spacing: { before: 60, after: 60, line: LINE_SPACING },
                    indent: { firstLine: convertMillimetersToTwip(12.7) }, // first line indent
                    children,
                }));
                continue;
            }
        }

        // Bullet points: - text or * text
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.substring(2);
            // Handle bold within bullet: **text**
            const parts = text.split(/(\*\*.+?\*\*)/g);
            const children: TextRun[] = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    });
                }
                return new TextRun({
                    text: part,
                    font: FONT,
                    size: FONT_SIZE_13,
                });
            });

            paragraphs.push(new Paragraph({
                spacing: { before: 40, after: 40, line: LINE_SPACING },
                indent: { left: convertMillimetersToTwip(15), hanging: convertMillimetersToTwip(5) },
                children: [
                    new TextRun({ text: '– ', font: FONT, size: FONT_SIZE_13 }),
                    ...children,
                ],
            }));
            continue;
        }

        // Numbered items: 1. text, 2. text
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            const parts = numberedMatch[2].split(/(\*\*.+?\*\*)/g);
            const children: TextRun[] = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({
                        text: part.replace(/\*\*/g, ''),
                        font: FONT,
                        size: FONT_SIZE_13,
                        bold: true,
                    });
                }
                return new TextRun({ text: part, font: FONT, size: FONT_SIZE_13 });
            });

            paragraphs.push(new Paragraph({
                spacing: { before: 40, after: 40, line: LINE_SPACING },
                indent: { left: convertMillimetersToTwip(12.7), hanging: convertMillimetersToTwip(7) },
                children: [
                    new TextRun({ text: `${numberedMatch[1]}. `, font: FONT, size: FONT_SIZE_13 }),
                    ...children,
                ],
            }));
            continue;
        }

        // Section headers: I. II. III. etc.
        const romanMatch = trimmed.match(/^(I{1,3}V?|IV|V|VI{0,3})\.\s+(.+)/);
        if (romanMatch) {
            paragraphs.push(new Paragraph({
                spacing: { before: 120, after: 60, line: LINE_SPACING },
                children: [
                    new TextRun({
                        text: `${romanMatch[1]}. ${romanMatch[2]}`,
                        font: FONT,
                        size: FONT_SIZE_14,
                        bold: true,
                    }),
                ],
            }));
            continue;
        }

        // Default paragraph
        const parts = trimmed.split(/(\*\*.+?\*\*)/g);
        const children: TextRun[] = parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({
                    text: part.replace(/\*\*/g, ''),
                    font: FONT,
                    size: FONT_SIZE_13,
                    bold: true,
                });
            }
            return new TextRun({ text: part, font: FONT, size: FONT_SIZE_13 });
        });

        paragraphs.push(new Paragraph({
            spacing: { before: 40, after: 40, line: LINE_SPACING },
            indent: { firstLine: convertMillimetersToTwip(12.7) },
            alignment: AlignmentType.JUSTIFIED,
            children,
        }));
    }

    return paragraphs;
}

/**
 * Tạo DOCX chuẩn NĐ30/2020/NĐ-CP
 */
export async function generateNd30Docx(options: DocxOptions): Promise<Blob> {
    const {
        organizationName = 'BAN QUẢN LÝ DỰ ÁN ĐTXD CN',
        organizationParent = 'HỌC VIỆN CTQG HỒ CHÍ MINH',
        documentNumber = '……/BC-BQLDA',
        location = 'Hà Nội',
        date = new Date(),
        title = 'BÁO CÁO',
        content,
        signerTitle = 'TRƯỞNG BAN',
        signerName = '(Ký, ghi rõ họ tên)',
        recipientList = ['Ban Giám đốc Học viện (để b/c)', 'Các phòng ban liên quan', 'Lưu: VT.'],
    } = options;

    const dateStr = `${location}, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;

    // Parse content to paragraphs
    const contentParagraphs = parseContentToParagraphs(content);

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT,
                        size: FONT_SIZE_13,
                    },
                    paragraph: {
                        spacing: { line: LINE_SPACING },
                    },
                },
            },
        },
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: MARGIN_TOP,
                        bottom: MARGIN_BOTTOM,
                        left: MARGIN_LEFT,
                        right: MARGIN_RIGHT,
                    },
                    pageNumbers: {
                        start: 1,
                        formatType: NumberFormat.DECIMAL,
                    },
                },
            },
            headers: {
                default: new Header({
                    children: [], // Clean header
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                    font: FONT,
                                    size: FONT_SIZE_11,
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                // ═══ PHẦN ĐẦU: Quốc hiệu + Tên CQ ═══

                // Row 1: Cơ quan chủ quản (left) + ĐẢNG CỘNG SẢN VIỆT NAM (right)
                new Paragraph({
                    spacing: { after: 0 },
                    children: [
                        new TextRun({
                            text: organizationParent,
                            font: FONT,
                            size: FONT_SIZE_12,
                            bold: false,
                        }),
                        new TextRun({
                            text: '\t',
                        }),
                        new TextRun({
                            text: 'ĐẢNG CỘNG SẢN VIỆT NAM',
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                    tabStops: [{
                        type: TabStopType.CENTER,
                        position: TabStopPosition.MAX / 2 + 2000,
                    }],
                }),

                // Row 2: Tên cơ quan (left)
                new Paragraph({
                    spacing: { after: 0 },
                    children: [
                        new TextRun({
                            text: organizationName,
                            font: FONT,
                            size: FONT_SIZE_13,
                            bold: true,
                        }),
                    ],
                }),

                // Row 3: Số văn bản (left) + Địa danh, ngày tháng (right)
                new Paragraph({
                    spacing: { before: 120, after: 0 },
                    children: [
                        new TextRun({
                            text: `Số: ${documentNumber}`,
                            font: FONT,
                            size: FONT_SIZE_13,
                        }),
                        new TextRun({ text: '\t' }),
                        new TextRun({
                            text: dateStr,
                            font: FONT,
                            size: FONT_SIZE_13,
                            italics: true,
                        }),
                    ],
                    tabStops: [{
                        type: TabStopType.RIGHT,
                        position: TabStopPosition.MAX - 200,
                    }],
                }),

                // ═══ TRÍCH YẾU NỘI DUNG ═══
                new Paragraph({
                    spacing: { before: 360, after: 120, line: LINE_SPACING },
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: title.toUpperCase(),
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // ═══ NỘI DUNG VĂN BẢN ═══
                ...contentParagraphs,

                // ═══ CHỮ KÝ ═══
                new Paragraph({
                    spacing: { before: 480 },
                    alignment: AlignmentType.RIGHT,
                    indent: { right: convertMillimetersToTwip(10) },
                    children: [
                        new TextRun({
                            text: signerTitle,
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // Khoảng trống cho chữ ký
                new Paragraph({ spacing: { before: 120 } }),
                new Paragraph({ spacing: { before: 120 } }),

                // Tên người ký
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    indent: { right: convertMillimetersToTwip(10) },
                    children: [
                        new TextRun({
                            text: signerName,
                            font: FONT,
                            size: FONT_SIZE_14,
                            bold: true,
                        }),
                    ],
                }),

                // ═══ NƠI NHẬN ═══
                new Paragraph({
                    spacing: { before: 480 },
                    children: [
                        new TextRun({
                            text: 'Nơi nhận:',
                            font: FONT,
                            size: FONT_SIZE_11,
                            bold: true,
                            italics: true,
                        }),
                    ],
                }),

                ...recipientList.map(r => new Paragraph({
                    spacing: { before: 0, after: 0 },
                    indent: { left: convertMillimetersToTwip(5) },
                    children: [
                        new TextRun({
                            text: `– ${r}`,
                            font: FONT,
                            size: FONT_SIZE_11,
                        }),
                    ],
                })),
            ],
        }],
    });

    return await Packer.toBlob(doc);
}

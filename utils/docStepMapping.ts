/**
 * Document Cross-Reference Mapping
 * Maps step_code (from tasks/plan) ↔ TT24 row keys ↔ Hồ sơ legal doc keywords
 * 
 * This enables cross-linking: when a document is uploaded in one tab,
 * it can be discovered and displayed in the other tabs.
 */

export interface DocCrossRef {
    stepCode: string;          // From ProjectPlanTab phases
    stepTitle: string;         // Human-readable step name
    tt24Stt: string;           // TT24 row STT value
    tt24Label: string;         // TT24 row label (for matching tt24_field keys)
    legalKeywords: string[];   // Keywords used in Hồ sơ tab matching
    legalDocName: string;      // Legal doc display name in Hồ sơ
}

/**
 * Cross-reference table linking steps ↔ TT24 rows ↔ legal doc categories.
 * When a file is uploaded in any tab, this mapping is used to find
 * its corresponding entries in the other two tabs.
 */
export const DOC_CROSS_REFS: DocCrossRef[] = [
    // --- GIAI ĐOẠN CHUẨN BỊ ---
    {
        stepCode: 'PREP_POLICY',
        stepTitle: 'Quyết định chủ trương đầu tư',
        tt24Stt: '1',
        tt24Label: 'Văn bản chủ trương đầu tư',
        legalKeywords: ['chủ trương', 'phê duyệt chủ trương'],
        legalDocName: 'QĐ Phê duyệt chủ trương',
    },
    {
        stepCode: 'PREP_PLANNING',
        stepTitle: 'Lập, thẩm định, phê duyệt Quy hoạch xây dựng',
        tt24Stt: '2',
        tt24Label: 'Quyết định phê duyệt Quy hoạch có liên quan',
        legalKeywords: ['quy hoạch'],
        legalDocName: 'Quy hoạch xây dựng',
    },
    {
        stepCode: 'PREP_PREFEASIBILITY',
        stepTitle: 'Lập, thẩm định Báo cáo nghiên cứu tiền khả thi',
        tt24Stt: '4',
        tt24Label: 'Thông báo kết quả thẩm định',
        legalKeywords: ['tiền khả thi', 'pre-feasibility'],
        legalDocName: 'Báo cáo tiền khả thi',
    },
    {
        stepCode: 'PREP_FEASIBILITY',
        stepTitle: 'Lập, thẩm định Báo cáo NCKT',
        tt24Stt: '4',
        tt24Label: 'Thông báo kết quả thẩm định',
        legalKeywords: ['nghiên cứu khả thi', 'nckt', 'f/s', 'báo cáo nckt', 'bcnckt', 'bcktkt'],
        legalDocName: 'Báo cáo NCKT (F/S)',
    },
    {
        stepCode: 'PREP_DECISION',
        stepTitle: 'Quyết định phê duyệt dự án đầu tư xây dựng',
        tt24Stt: '5',
        tt24Label: 'Quyết định phê duyệt dự án',
        legalKeywords: ['phê duyệt dự án', 'quyết định phê duyệt'],
        legalDocName: 'QĐ Phê duyệt dự án',
    },
    {
        stepCode: 'PREP_SURVEY',
        stepTitle: 'Khảo sát xây dựng phục vụ lập dự án',
        tt24Stt: '',
        tt24Label: '',
        legalKeywords: ['khảo sát', 'survey'],
        legalDocName: 'Khảo sát xây dựng',
    },

    // --- GIAI ĐOẠN THỰC HIỆN ---
    {
        stepCode: 'IMPL_DESIGN',
        stepTitle: 'Thiết kế xây dựng & Dự toán',
        tt24Stt: '8',
        tt24Label: 'Thẩm định thiết kế',
        legalKeywords: ['thiết kế kỹ thuật', 'tkkt', 'bản vẽ thi công', 'bvtc', 'tkbvtc', 'dự toán', 'thiết kế cơ sở', 'tkcs'],
        legalDocName: 'TKKT / BVTC',
    },
    {
        stepCode: 'IMPL_BIDDING',
        stepTitle: 'Lựa chọn nhà thầu và ký kết hợp đồng',
        tt24Stt: '9',
        tt24Label: 'Lựa chọn nhà thầu',
        legalKeywords: ['kế hoạch lựa chọn', 'khlcnt', 'hợp đồng', 'contract'],
        legalDocName: 'KHLCNT / Hợp đồng',
    },
    {
        stepCode: 'IMPL_PERMIT',
        stepTitle: 'Cấp Giấy phép xây dựng',
        tt24Stt: '',
        tt24Label: '',
        legalKeywords: ['giấy phép xây dựng', 'gpxd'],
        legalDocName: 'Giấy phép XD',
    },

    // --- GIAI ĐOẠN KẾT THÚC ---
    {
        stepCode: 'IMPL_ACCEPTANCE',
        stepTitle: 'Nghiệm thu hoàn thành công trình',
        tt24Stt: '',
        tt24Label: '',
        legalKeywords: ['nghiệm thu', 'biên bản nghiệm thu'],
        legalDocName: 'BB Nghiệm thu',
    },
    {
        stepCode: 'CLOSE_HANDOVER',
        stepTitle: 'Bàn giao công trình đưa vào sử dụng',
        tt24Stt: '',
        tt24Label: '',
        legalKeywords: ['bàn giao', 'hoàn công'],
        legalDocName: 'Hồ sơ hoàn công / Bàn giao',
    },
    {
        stepCode: 'CLOSE_CAPITAL_SETTLEMENT',
        stepTitle: 'Quyết toán vốn đầu tư dự án hoàn thành',
        tt24Stt: '',
        tt24Label: '',
        legalKeywords: ['quyết toán'],
        legalDocName: 'QĐ Quyết toán',
    },
];

// --- Helper functions ---

/** Find cross-ref entry by step code */
export const findByStepCode = (stepCode: string): DocCrossRef | undefined =>
    DOC_CROSS_REFS.find(r => r.stepCode === stepCode);

/** Find cross-ref entries by TT24 stt */
export const findByTT24Stt = (stt: string): DocCrossRef[] =>
    DOC_CROSS_REFS.filter(r => r.tt24Stt === stt);

/** Find cross-ref entry by legal keywords match */
export const findByLegalKeywords = (keywords: string[]): DocCrossRef | undefined =>
    DOC_CROSS_REFS.find(ref =>
        ref.legalKeywords.some(kw =>
            keywords.some(k => k.toLowerCase().includes(kw.toLowerCase()))
        )
    );

/** Build TT24 field key from stt and label (same format as TT24 upload) */
export const buildTT24Key = (stt: string, label: string): string =>
    `doc_${stt}_${label}`;

/** Get all step codes that map to a given TT24 stt */
export const getStepCodesForTT24 = (stt: string): string[] =>
    DOC_CROSS_REFS.filter(r => r.tt24Stt === stt).map(r => r.stepCode);

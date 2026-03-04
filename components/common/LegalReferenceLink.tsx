import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale } from 'lucide-react';

/**
 * Mapping from short legal reference patterns → { docId, articlePrefix }
 * articlePrefix is used to build articleId = `${prefix}-d${articleNumber}`
 */
const LEGAL_DOC_MAP: {
    patterns: RegExp[];
    docId: string;
    articlePrefix: string;
    label: string;
}[] = [
        {
            patterns: [/NĐ\s*175/i, /Nghị\s*định\s*175/i, /NĐ[-\s]*175\/2024/i],
            docId: 'nd-175-2024',
            articlePrefix: 'nd175',
            label: 'NĐ 175/2024/NĐ-CP',
        },
        {
            patterns: [/NĐ\s*111/i, /Nghị\s*định\s*111/i, /NĐ[-\s]*111\/2024/i],
            docId: 'nd-111-2024',
            articlePrefix: 'nd111',
            label: 'NĐ 111/2024/NĐ-CP',
        },
        {
            patterns: [/NĐ\s*140/i, /Nghị\s*định\s*140/i, /NĐ[-\s]*140\/2025/i],
            docId: 'nd-140-2025',
            articlePrefix: 'nd140',
            label: 'NĐ 140/2025/NĐ-CP',
        },
        {
            patterns: [/NĐ\s*144/i, /Nghị\s*định\s*144/i, /NĐ[-\s]*144\/2025/i],
            docId: 'nd-144-2025',
            articlePrefix: 'nd144',
            label: 'NĐ 144/2025/NĐ-CP',
        },
        {
            patterns: [/Luật\s*ĐTC\s*58/i, /Luật\s*(số\s*)?58\/2024/i, /Luật\s*Đầu\s*tư\s*công/i],
            docId: 'luat-dau-tu-cong-2024',
            articlePrefix: 'luat58',
            label: 'Luật ĐTC 58/2024/QH15',
        },
        {
            patterns: [/Luật\s*XD\s*135/i, /Luật\s*(số\s*)?135\/2025/i, /Luật\s*Xây\s*dựng\s*(2025)?/i],
            docId: 'luat-xay-dung-2025',
            articlePrefix: 'luatxd135',
            label: 'Luật XD 135/2025/QH15',
        },
        {
            patterns: [/TT\s*24\/2024/i, /Thông\s*tư\s*24/i, /TT24/i],
            docId: 'tt-24-2024',
            articlePrefix: 'tt24',
            label: 'TT 24/2024/TT-BXD',
        },
        {
            patterns: [/NĐ\s*214/i, /Nghị\s*định\s*214/i, /NĐ[-\s]*214\/2025/i],
            docId: 'nd-214-2025',
            articlePrefix: 'nd214',
            label: 'NĐ 214/2025/NĐ-CP',
        },
        {
            patterns: [/Luật\s*(?:CĐS|Chuyển\s*đổi\s*số)\s*148/i, /Luật\s*(?:số\s*)?148\/2025/i, /Luật\s*Chuyển\s*đổi\s*số/i],
            docId: 'luat-cds-2025',
            articlePrefix: 'luat148',
            label: 'Luật CĐS 148/2025/QH15',
        },
    ];

interface LegalRef {
    start: number;
    end: number;
    docId: string;
    articleId?: string;
    label: string;
    matchedText: string;
}

/**
 * Parse a legal basis text and find all recognisable legal references.
 * Returns an array of LegalRef objects with positions for splitting the text into
 * linked and plain segments.
 */
function parseLegalRefs(text: string): LegalRef[] {
    const refs: LegalRef[] = [];

    for (const entry of LEGAL_DOC_MAP) {
        for (const pattern of entry.patterns) {
            // Build a global version
            const globalPattern = new RegExp(pattern.source, 'gi');
            let match;
            while ((match = globalPattern.exec(text)) !== null) {
                // Check if this range overlaps with an existing ref (avoid duplicates)
                const start = match.index;
                const end = match.index + match[0].length;
                const overlaps = refs.some(r =>
                    (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
                );
                if (overlaps) continue;

                // Look backward for article reference like Đ14, Điều 14, K2 Đ14
                let articleId: string | undefined;
                let expandedStart = start;

                // Pattern: look for "Đ{number}" or "Điều {number}" before the doc reference
                // e.g., "Đ14 NĐ 175" or "Điều 4, Nghị định 175"
                const beforeText = text.substring(Math.max(0, start - 30), start);
                const articleMatch = beforeText.match(/(?:Đ|Điều\s*)(\d+)(?:[-,;\s]*(?:K\d+)?[-,;\s]*)?$/i);
                if (articleMatch) {
                    const articleNum = articleMatch[1];
                    articleId = `${entry.articlePrefix}-d${articleNum}`;
                    // Expand start to include the article reference
                    expandedStart = start - (beforeText.length - (articleMatch.index || 0));
                }

                refs.push({
                    start: expandedStart,
                    end,
                    docId: entry.docId,
                    articleId,
                    label: entry.label,
                    matchedText: text.substring(expandedStart, end),
                });
            }
        }
    }

    // Sort by start position
    refs.sort((a, b) => a.start - b.start);

    // Deduplicate overlapping refs (keep the longest / first)
    const deduped: LegalRef[] = [];
    for (const ref of refs) {
        const lastRef = deduped[deduped.length - 1];
        if (lastRef && ref.start < lastRef.end) {
            // Overlaps — keep the wider one
            if (ref.end - ref.start > lastRef.end - lastRef.start) {
                deduped[deduped.length - 1] = ref;
            }
            continue;
        }
        deduped.push(ref);
    }

    return deduped;
}

interface LegalReferenceLinkProps {
    /** The raw legal text, e.g. "Đ14 NĐ 175; Luật 135/2025" */
    text: string;
    /** Optional className for the wrapper */
    className?: string;
    /** Show Scale icon before the text */
    showIcon?: boolean;
}

/**
 * Renders a legal basis string with auto-detected clickable links.
 * 
 * Usage:
 * ```tsx
 * <LegalReferenceLink text="Đ14 NĐ 175; Luật XD 135/2025" />
 * ```
 */
export const LegalReferenceLink: React.FC<LegalReferenceLinkProps> = ({ text, className, showIcon }) => {
    const location = useLocation();
    const refs = parseLegalRefs(text);

    if (refs.length === 0) {
        // No recognized references — render plain text
        return (
            <span className={className}>
                {showIcon && <Scale className="w-3.5 h-3.5 inline mr-1 opacity-50" />}
                {text}
            </span>
        );
    }

    // Build segments: plain text + linked references
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    refs.forEach((ref, idx) => {
        // Plain text before this ref
        if (ref.start > lastEnd) {
            segments.push(<span key={`plain-${idx}`}>{text.substring(lastEnd, ref.start)}</span>);
        }

        // Build the URL with from param for back navigation
        const params = new URLSearchParams({ docId: ref.docId });
        if (ref.articleId) {
            params.set('articleId', ref.articleId);
        }
        params.set('from', location.pathname);
        const url = `/legal-documents?${params.toString()}`;

        segments.push(
            <Link
                key={`link-${idx}`}
                to={url}
                className="inline-flex items-center gap-0.5 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 underline decoration-purple-300 dark:decoration-purple-600 decoration-dotted underline-offset-2 hover:decoration-solid font-medium transition-colors"
                title={`Xem ${ref.label}${ref.articleId ? ` — Điều ${ref.articleId.split('-d')[1]}` : ''}`}
            >
                <Scale className="w-3 h-3 opacity-60 shrink-0" />
                {ref.matchedText}
            </Link>
        );
        lastEnd = ref.end;
    });

    // Remaining text after last ref
    if (lastEnd < text.length) {
        segments.push(<span key="tail">{text.substring(lastEnd)}</span>);
    }

    return (
        <span className={className}>
            {showIcon && refs.length === 0 && <Scale className="w-3.5 h-3.5 inline mr-1 opacity-50" />}
            {segments}
        </span>
    );
};

export default LegalReferenceLink;

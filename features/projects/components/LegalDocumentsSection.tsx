import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Download, Calendar, Building2, MapPin, Target, Coins } from 'lucide-react';
import { InvestmentPolicyDecision, FeasibilityStudy } from '@/types';
import { formatCurrency } from '@/utils/format';

interface LegalDocumentsSectionProps {
    investmentPolicy?: InvestmentPolicyDecision;
    feasibilityStudy?: FeasibilityStudy;
    approvalDecision?: {
        number: string;
        date: string;
        authority: string;
    };
}

export const LegalDocumentsSection: React.FC<LegalDocumentsSectionProps> = ({
    investmentPolicy,
    feasibilityStudy,
    approvalDecision
}) => {
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const toggleCard = (cardId: string) => {
        setExpandedCard(expandedCard === cardId ? null : cardId);
    };

    // formatCurrency imported from @/utils/format

    const handleDownload = (path?: string) => {
        if (path) {
            // In production, this would trigger actual download
            alert(`Download: ${path}`);
        } else {
            alert('Chưa có file đính kèm');
        }
    };

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Văn bản pháp lý
            </h3>

            {/* Investment Policy Decision */}
            {investmentPolicy && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleCard('policy')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-900">QĐ Chủ trương đầu tư</p>
                                <p className="text-xs text-gray-500">{investmentPolicy.DecisionNumber}</p>
                            </div>
                        </div>
                        {expandedCard === 'policy' ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedCard === 'policy' && (
                        <div className="px-4 pb-4 border-t border-gray-200 pt-3 space-y-2 bg-gray-50">
                            <InfoRow icon={Calendar} label="Ngày ban hành" value={investmentPolicy.DecisionDate} />
                            <InfoRow icon={Building2} label="Cơ quan" value={investmentPolicy.Authority} />
                            <InfoRow icon={MapPin} label="Địa điểm" value={investmentPolicy.Location} />
                            <InfoRow icon={Target} label="Mục tiêu" value={investmentPolicy.Objectives} />
                            <InfoRow icon={Coins} label="Sơ bộ TMĐT" value={formatCurrency(investmentPolicy.PreliminaryInvestment)} highlight />

                            <button
                                onClick={() => handleDownload(investmentPolicy.DocumentPath)}
                                className="mt-3 w-full py-2 px-3 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Tải văn bản
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Feasibility Study */}
            {feasibilityStudy && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleCard('feasibility')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-900">Báo cáo NCKT (F/S)</p>
                                <p className="text-xs text-gray-500">{feasibilityStudy.ApprovalNumber}</p>
                            </div>
                        </div>
                        {expandedCard === 'feasibility' ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedCard === 'feasibility' && (
                        <div className="px-4 pb-4 border-t border-gray-200 pt-3 space-y-2 bg-gray-50">
                            <InfoRow icon={Calendar} label="Ngày phê duyệt" value={feasibilityStudy.ApprovalDate} />
                            <InfoRow icon={Building2} label="Cơ quan phê duyệt" value={feasibilityStudy.ApprovalAuthority} />
                            <InfoRow icon={Coins} label="Tổng mức ĐT" value={formatCurrency(feasibilityStudy.TotalInvestment)} highlight />
                            <InfoRow icon={Target} label="Số bước thiết kế" value={`${feasibilityStudy.DesignPhases} bước`} />
                            <InfoRow icon={Target} label="Quy mô" value={feasibilityStudy.ConstructionScale} />

                            <button
                                onClick={() => handleDownload(feasibilityStudy.DocumentPath)}
                                className="mt-3 w-full py-2 px-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Tải văn bản
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Approval Decision */}
            {approvalDecision && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <button
                        onClick={() => toggleCard('approval')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-900">QĐ Phê duyệt dự án</p>
                                <p className="text-xs text-gray-500">{approvalDecision.number}</p>
                            </div>
                        </div>
                        {expandedCard === 'approval' ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {expandedCard === 'approval' && (
                        <div className="px-4 pb-4 border-t border-gray-200 pt-3 space-y-2 bg-gray-50">
                            <InfoRow icon={Calendar} label="Ngày phê duyệt" value={approvalDecision.date} />
                            <InfoRow icon={Building2} label="Cơ quan ban hành" value={approvalDecision.authority} />
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!investmentPolicy && !feasibilityStudy && !approvalDecision && (
                <div className="text-center py-6 text-gray-400 text-sm">
                    Chưa có văn bản pháp lý
                </div>
            )}
        </div>
    );
};

// Helper component
const InfoRow: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    highlight?: boolean;
}> = ({ icon: Icon, label, value, highlight }) => (
    <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
            <span className="text-xs text-gray-500">{label}:</span>
            <span className={`ml-1 text-xs ${highlight ? 'font-bold text-blue-700' : 'font-medium text-gray-900'}`}>
                {value}
            </span>
        </div>
    </div>
);

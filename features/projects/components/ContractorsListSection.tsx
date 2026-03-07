import React from 'react';
import { Building2, HardHat, ExternalLink, CircleDollarSign } from 'lucide-react';
import { Contractor, BiddingPackage } from '@/types';
import { formatShortCurrency } from '@/utils/format';

interface ContractorsListSectionProps {
    contractors: Contractor[];
    packages?: BiddingPackage[];
    onViewContractor?: (contractorId: string) => void;
    onViewPackage?: (packageId: string) => void;
}

export const ContractorsListSection: React.FC<ContractorsListSectionProps> = ({
    contractors,
    packages = [],
    onViewContractor,
    onViewPackage
}) => {
    // Get unique contractors from packages if contractors array is empty
    const displayContractors = contractors.length > 0 ? contractors : [];

    if (displayContractors.length === 0 && packages.length === 0) {
        return (
            <div className="text-center py-6 text-gray-400 dark:text-slate-500 text-sm">
                Chưa có nhà thầu tham gia dự án
            </div>
        );
    }

    const formatCurrency = formatShortCurrency;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <HardHat className="w-4 h-4" />
                    Nhà thầu tham gia ({displayContractors.length || packages.length})
                </h3>
            </div>

            {/* Display contractors directly */}
            {displayContractors.length > 0 && (
                <div className="space-y-2">
                    {displayContractors.map((contractor) => (
                        <div
                            key={contractor.ContractorID}
                            className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors cursor-pointer group"
                            onClick={() => onViewContractor?.(contractor.ContractorID)}
                        >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>

                            {/* Info - Use correct Contractor properties */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                    {contractor.FullName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                    MST: {contractor.ContractorID} • {contractor.Address}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ExternalLink className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                        </div>
                    ))}
                </div>
            )}

            {/* Display packages as contractor source if no direct contractors */}
            {displayContractors.length === 0 && packages.length > 0 && (
                <div className="space-y-2">
                    {packages
                        .filter(pkg => pkg.WinningContractorID || pkg.Status === 'Awarded')
                        .slice(0, 5)
                        .map((pkg) => (
                            <div
                                key={pkg.PackageID}
                                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer group"
                                onClick={() => onViewPackage?.(pkg.PackageID)}
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>

                                {/* Info - Use correct BiddingPackage properties */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                        {pkg.WinningContractorID || 'Đang lựa chọn'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                        {pkg.PackageName}
                                    </p>
                                </div>

                                {/* Value - Use Price instead of EstimatedValue */}
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                                        <CircleDollarSign className="w-3 h-3" />
                                        {formatCurrency(pkg.Price)}
                                    </div>
                                </div>
                            </div>
                        ))}

                    {/* Show all packages if none awarded yet */}
                    {packages.filter(pkg => pkg.WinningContractorID || pkg.Status === 'Awarded').length === 0 && (
                        packages.slice(0, 5).map((pkg) => (
                            <div
                                key={pkg.PackageID}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                                onClick={() => onViewPackage?.(pkg.PackageID)}
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-600 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-gray-500 dark:text-slate-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                                        {pkg.PackageName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                        {pkg.Status === 'Planning' ? 'Trong kế hoạch' :
                                            pkg.Status === 'Bidding' ? 'Đang mời thầu' :
                                                pkg.Status === 'Evaluating' ? 'Đang xét thầu' : pkg.Status}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-slate-300">
                                        <CircleDollarSign className="w-3 h-3" />
                                        {formatCurrency(pkg.Price)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

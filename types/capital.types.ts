// Capital & Disbursement types

export interface CapitalAllocation {
    AllocationID: string;
    ProjectID: string;
    Year: number;
    Amount: number;
    Source: 'NganSachTrungUong' | 'NganSachDiaPhuong' | 'ODA' | 'Khac';
    DecisionNumber?: string;
    DateAssigned: string;
}

// Disbursement (Giải ngân) — NĐ 99/2021/NĐ-CP
export interface Disbursement {
    DisbursementID: string;
    ProjectID: string;
    CapitalPlanID?: string;
    AllocationID?: string;
    PaymentID?: number;
    Amount: number;
    Date: string;
    TreasuryCode?: string;
    FormType?: string;
    Description?: string;
    Status: 'Pending' | 'Approved' | 'Rejected';
    Type?: 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng';
    ContractNumber?: string;
    CumulativeBefore?: number;
    AdvanceBalance?: number;
}

// Capital Summary Extended (Tổng hợp vốn)
export interface CapitalSummaryExtended {
    totalInvestment: number;
    totalAllocated: number;
    totalDisbursed: number;
    totalAdvance: number;
    advanceRecovered: number;
    advanceBalance: number;
    completionPayment: number;
    disbursementRate: number;
    yearlyTarget: number;
    yearlyDisbursed: number;
}

// Capital Plan (Kế hoạch vốn)
export interface CapitalPlan {
    PlanID: string;
    ProjectID: string;
    Year: number;
    Amount: number;
    DecisionNumber?: string;
    DateAssigned?: string;
    Source: string;
    DisbursedAmount?: number;
    Status?: 'Draft' | 'Approved' | 'Allocated' | 'Closed';
}

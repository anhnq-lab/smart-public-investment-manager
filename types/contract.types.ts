// Contract & Payment types

// 5.2. Hợp đồng Xây dựng
export enum ContractStatus {
    Executing = 1, // Đang thực hiện
    Paused = 2,    // Tạm dừng
    Liquidated = 3 // Đã thanh lý
}

export interface Contract {
    ContractID: string;
    PackageID: string;
    ContractorID: string;
    ProjectID: string;
    ContractName: string;
    SignDate: string;
    Value: number;
    AdvanceRate: number;
    Warranty: number;
    Status: ContractStatus;
    VariationOrders?: VariationOrder[];
}

// 5.3. Thanh toán & Giải ngân
export enum PaymentType {
    Advance = 'Advance',
    Volume = 'Volume'
}

export enum PaymentStatus {
    Pending = 'Pending',
    Transferred = 'Transferred'
}

export interface Payment {
    PaymentID: number;
    ContractID: string;
    BatchNo: number;
    Type: PaymentType;
    Amount: number;
    TreasuryRef: string;
    Status: PaymentStatus;
}

// Module 4: Contracts & Bidding Enhancements
export interface VariationOrder {
    VOID: string;
    ContractID: string;
    Number: string;
    SignDate: string;
    Content: string;
    AdjustedAmount: number;
    AdjustedDuration: number;
    ApprovalFile?: string;
}

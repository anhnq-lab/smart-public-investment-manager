/**
 * Database Mappers — snake_case (DB) ↔ PascalCase (Frontend)
 * 
 * Frontend types use PascalCase (e.g., FullName, EmployeeID).
 * Database columns use snake_case (e.g., full_name, employee_id).
 * These mappers convert between the two formats.
 */

import type {
    Employee, EmployeeStatus, Role,
    Contractor, Project, ProjectGroup, InvestmentType, ProjectStatus, ProjectStage,
    Contract, ContractStatus, Payment, PaymentStatus, PaymentType,
    Task, TaskStatus, TaskPriority,
    BiddingPackage,
    CapitalAllocation,
} from '../types';

// ============================================================
// EMPLOYEE
// ============================================================

export const dbToEmployee = (row: any): Employee => ({
    EmployeeID: row.employee_id,
    FullName: row.full_name,
    Role: row.role as Role,
    Department: row.department || '',
    Position: row.position || '',
    Email: row.email || '',
    Phone: row.phone || '',
    AvatarUrl: row.avatar_url || '',
    Status: row.status as EmployeeStatus,
    JoinDate: row.join_date || '',
    Username: row.employee_id,
    Password: '',
});

export const employeeToDb = (emp: Partial<Employee>) => ({
    ...(emp.EmployeeID !== undefined && { employee_id: emp.EmployeeID }),
    ...(emp.FullName !== undefined && { full_name: emp.FullName }),
    ...(emp.Role !== undefined && { role: emp.Role }),
    ...(emp.Department !== undefined && { department: emp.Department }),
    ...(emp.Position !== undefined && { position: emp.Position }),
    ...(emp.Email !== undefined && { email: emp.Email }),
    ...(emp.Phone !== undefined && { phone: emp.Phone }),
    ...(emp.AvatarUrl !== undefined && { avatar_url: emp.AvatarUrl }),
    ...(emp.Status !== undefined && { status: emp.Status }),
    ...(emp.JoinDate !== undefined && { join_date: emp.JoinDate }),
});

// ============================================================
// CONTRACTOR
// ============================================================

export const dbToContractor = (row: any): Contractor => ({
    ContractorID: row.contractor_id,
    CapCertCode: row.cap_cert_code || '',
    FullName: row.full_name,
    IsForeign: row.is_foreign,
    OpLicenseNo: row.op_license_no || '',
    Address: row.address || '',
    ContactInfo: row.contact_info || '',
    TaxCode: row.tax_code || '',
    Representative: row.representative || '',
    EstablishedYear: row.established_year || 0,
});

export const contractorToDb = (c: Partial<Contractor>) => ({
    ...(c.ContractorID !== undefined && { contractor_id: c.ContractorID }),
    ...(c.CapCertCode !== undefined && { cap_cert_code: c.CapCertCode }),
    ...(c.FullName !== undefined && { full_name: c.FullName }),
    ...(c.IsForeign !== undefined && { is_foreign: c.IsForeign }),
    ...(c.OpLicenseNo !== undefined && { op_license_no: c.OpLicenseNo }),
    ...(c.Address !== undefined && { address: c.Address }),
    ...(c.ContactInfo !== undefined && { contact_info: c.ContactInfo }),
    ...(c.TaxCode !== undefined && { tax_code: c.TaxCode }),
    ...(c.Representative !== undefined && { representative: c.Representative }),
    ...(c.EstablishedYear !== undefined && { established_year: c.EstablishedYear }),
});

// ============================================================
// PROJECT
// ============================================================

export const dbToProject = (row: any): Project => ({
    ProjectID: row.project_id,
    ProjectName: row.project_name,
    GroupCode: row.group_code?.trim() as ProjectGroup,
    InvestmentType: row.investment_type as InvestmentType,
    DecisionMakerID: row.decision_maker_id ? parseInt(row.decision_maker_id) : 0,
    TotalInvestment: Number(row.total_investment) || 0,
    CapitalSource: row.capital_source || '',
    LocationCode: row.location_code || '',
    ApprovalDate: row.approval_date || '',
    Status: row.status as ProjectStatus,
    IsEmergency: row.is_emergency || false,
    ImageUrl: row.image_url || '',
    Progress: row.progress || 0,
    PaymentProgress: row.payment_progress || 0,
    InvestorName: row.investor_name || '',
    MainContractorName: row.main_contractor_name || '',
    ConstructionType: row.construction_type || '',
    ConstructionGrade: row.construction_grade || '',
    // Detail
    ProjectNumber: row.project_number || '',
    Version: row.version || '',
    Objective: row.objective || '',
    CompetentAuthority: row.competent_authority || '',
    Duration: row.duration || '',
    ManagementForm: row.management_form || '',
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAuthority: row.decision_authority || '',
    IsODA: row.is_oda || false,
    // Sector / BIM / Sync
    Sector: row.sector || 'Other',
    RequiresBIM: row.requires_bim || false,
    BIMStatus: row.bim_status || 'NotRequired',
    CDEProjectCode: row.cde_project_code || '',
    IsSynced: row.is_synced || false,
    LastSyncDate: row.last_sync_date || '',
    NationalProjectCode: row.national_project_code || '',
    SyncError: row.sync_error || '',
    Coordinates: row.coordinates || undefined,
    Stage: row.stage || 'Preparation',
    // Consultants
    FeasibilityContractor: row.feasibility_contractor || '',
    SurveyContractor: row.survey_contractor || '',
    DesignContractor: row.design_contractor || '',
    SupervisionContractor: row.supervision_contractor || '',
    ReviewContractor: row.review_contractor || '',
    ApplicableStandards: row.applicable_standards || '',
    StartDate: row.start_date || '',
    ExpectedEndDate: row.expected_end_date || '',
    ActualEndDate: row.actual_end_date || '',
    // TT24 Compliance
    InvestmentScale: row.investment_scale || '',
    PlanningApprovalNumber: row.planning_approval_number || '',
    PlanningApprovalDate: row.planning_approval_date || '',
    PCCCApprovalNumber: row.pccc_approval_number || '',
    PCCCApprovalDate: row.pccc_approval_date || '',
    PCCCApprovalAgency: row.pccc_approval_agency || '',
    EnvApprovalNumber: row.env_approval_number || '',
    EnvApprovalDate: row.env_approval_date || '',
    EnvApprovalType: row.env_approval_type || '',
    AppraisalResultNumber: row.appraisal_result_number || '',
    AppraisalResultDate: row.appraisal_result_date || '',
    AppraisalAgency: row.appraisal_agency || '',
    CostBreakdown: row.cost_breakdown || {},
    DesignAppraisalNumber: row.design_appraisal_number || '',
    DesignAppraisalDate: row.design_appraisal_date || '',
    DesignApprovalNumber: row.design_approval_number || '',
    DesignApprovalDate: row.design_approval_date || '',
    DesignApprovalAuthority: row.design_approval_authority || '',
    ConstructionPermitNumber: row.construction_permit_number || '',
    ConstructionPermitDate: row.construction_permit_date || '',
    ConstructionPermitAgency: row.construction_permit_agency || '',
    ActualStartDateConstruction: row.actual_start_date_construction || '',
    InsuranceContract: row.insurance_contract || '',
    InsuranceValue: Number(row.insurance_value) || 0,
    AcceptanceResult: row.acceptance_result || '',
    AcceptanceDate: row.acceptance_date || '',
    HandoverDate: row.handover_date || '',
    TT24CompletionPct: row.tt24_completion_pct || 0,
});

export const projectToDb = (p: Partial<Project>) => {
    const result: Record<string, any> = {};
    if (p.ProjectID !== undefined) result.project_id = p.ProjectID;
    if (p.ProjectName !== undefined) result.project_name = p.ProjectName;
    if (p.GroupCode !== undefined) result.group_code = p.GroupCode;
    if (p.InvestmentType !== undefined) result.investment_type = p.InvestmentType;
    if (p.TotalInvestment !== undefined) result.total_investment = p.TotalInvestment;
    if (p.CapitalSource !== undefined) result.capital_source = p.CapitalSource;
    if (p.Status !== undefined) result.status = p.Status;
    if (p.IsEmergency !== undefined) result.is_emergency = p.IsEmergency;
    if (p.ImageUrl !== undefined) result.image_url = p.ImageUrl;
    if (p.Progress !== undefined) result.progress = p.Progress;
    if (p.PaymentProgress !== undefined) result.payment_progress = p.PaymentProgress;
    if (p.InvestorName !== undefined) result.investor_name = p.InvestorName;
    if (p.MainContractorName !== undefined) result.main_contractor_name = p.MainContractorName;
    if (p.ConstructionType !== undefined) result.construction_type = p.ConstructionType;
    if (p.ConstructionGrade !== undefined) result.construction_grade = p.ConstructionGrade;
    if (p.ProjectNumber !== undefined) result.project_number = p.ProjectNumber;
    if (p.Objective !== undefined) result.objective = p.Objective;
    if (p.Duration !== undefined) result.duration = p.Duration;
    if (p.Stage !== undefined) result.stage = p.Stage;
    if (p.Sector !== undefined) result.sector = p.Sector;
    if (p.RequiresBIM !== undefined) result.requires_bim = p.RequiresBIM;
    if (p.DecisionNumber !== undefined) result.decision_number = p.DecisionNumber;
    if (p.DecisionDate !== undefined) result.decision_date = p.DecisionDate;
    if (p.DecisionAuthority !== undefined) result.decision_authority = p.DecisionAuthority;
    if (p.StartDate !== undefined) result.start_date = p.StartDate;
    if (p.ExpectedEndDate !== undefined) result.expected_end_date = p.ExpectedEndDate;
    // TT24 Compliance
    if (p.InvestmentScale !== undefined) result.investment_scale = p.InvestmentScale;
    if (p.PlanningApprovalNumber !== undefined) result.planning_approval_number = p.PlanningApprovalNumber;
    if (p.PlanningApprovalDate !== undefined) result.planning_approval_date = p.PlanningApprovalDate;
    if (p.PCCCApprovalNumber !== undefined) result.pccc_approval_number = p.PCCCApprovalNumber;
    if (p.PCCCApprovalDate !== undefined) result.pccc_approval_date = p.PCCCApprovalDate;
    if (p.PCCCApprovalAgency !== undefined) result.pccc_approval_agency = p.PCCCApprovalAgency;
    if (p.EnvApprovalNumber !== undefined) result.env_approval_number = p.EnvApprovalNumber;
    if (p.EnvApprovalDate !== undefined) result.env_approval_date = p.EnvApprovalDate;
    if (p.EnvApprovalType !== undefined) result.env_approval_type = p.EnvApprovalType;
    if (p.AppraisalResultNumber !== undefined) result.appraisal_result_number = p.AppraisalResultNumber;
    if (p.AppraisalResultDate !== undefined) result.appraisal_result_date = p.AppraisalResultDate;
    if (p.AppraisalAgency !== undefined) result.appraisal_agency = p.AppraisalAgency;
    if (p.CostBreakdown !== undefined) result.cost_breakdown = p.CostBreakdown;
    if (p.DesignAppraisalNumber !== undefined) result.design_appraisal_number = p.DesignAppraisalNumber;
    if (p.DesignAppraisalDate !== undefined) result.design_appraisal_date = p.DesignAppraisalDate;
    if (p.DesignApprovalNumber !== undefined) result.design_approval_number = p.DesignApprovalNumber;
    if (p.DesignApprovalDate !== undefined) result.design_approval_date = p.DesignApprovalDate;
    if (p.DesignApprovalAuthority !== undefined) result.design_approval_authority = p.DesignApprovalAuthority;
    if (p.DesignContractor !== undefined) result.design_contractor = p.DesignContractor;
    if (p.SupervisionContractor !== undefined) result.supervision_contractor = p.SupervisionContractor;
    if (p.ConstructionPermitNumber !== undefined) result.construction_permit_number = p.ConstructionPermitNumber;
    if (p.ConstructionPermitDate !== undefined) result.construction_permit_date = p.ConstructionPermitDate;
    if (p.ConstructionPermitAgency !== undefined) result.construction_permit_agency = p.ConstructionPermitAgency;
    if (p.ActualStartDateConstruction !== undefined) result.actual_start_date_construction = p.ActualStartDateConstruction;
    if (p.InsuranceContract !== undefined) result.insurance_contract = p.InsuranceContract;
    if (p.InsuranceValue !== undefined) result.insurance_value = p.InsuranceValue;
    if (p.AcceptanceResult !== undefined) result.acceptance_result = p.AcceptanceResult;
    if (p.AcceptanceDate !== undefined) result.acceptance_date = p.AcceptanceDate;
    if (p.HandoverDate !== undefined) result.handover_date = p.HandoverDate;
    if (p.TT24CompletionPct !== undefined) result.tt24_completion_pct = p.TT24CompletionPct;
    return result;
};

// ============================================================
// CONTRACT
// ============================================================

export const dbToContract = (row: any): Contract => ({
    ContractID: row.contract_id,
    PackageID: row.package_id || '',
    ContractorID: row.contractor_id || '',
    ProjectID: row.project_id || '',
    ContractName: row.contract_name || '',
    ContractType: row.contract_type || '',
    SignDate: row.sign_date || '',
    Value: Number(row.value) || 0,
    AdvanceRate: Number(row.advance_rate) || 0,
    Warranty: row.warranty || 12,
    Status: row.status as ContractStatus,
    HasVAT: row.has_vat ?? true,
    Scope: row.scope || '',
    DurationMonths: row.duration_months || 0,
    StartDate: row.start_date || '',
    EndDate: row.end_date || '',
    PaymentTerms: row.payment_terms || '',
});

export const contractToDb = (c: Partial<Contract>) => ({
    ...(c.ContractID !== undefined && { contract_id: c.ContractID }),
    ...(c.PackageID !== undefined && { package_id: c.PackageID }),
    ...(c.ContractorID !== undefined && { contractor_id: c.ContractorID }),
    ...(c.ProjectID !== undefined && { project_id: c.ProjectID }),
    ...(c.ContractName !== undefined && { contract_name: c.ContractName }),
    ...(c.ContractType !== undefined && { contract_type: c.ContractType }),
    ...(c.SignDate !== undefined && { sign_date: c.SignDate }),
    ...(c.Value !== undefined && { value: c.Value }),
    ...(c.AdvanceRate !== undefined && { advance_rate: c.AdvanceRate }),
    ...(c.Warranty !== undefined && { warranty: c.Warranty }),
    ...(c.Status !== undefined && { status: c.Status }),
    ...(c.HasVAT !== undefined && { has_vat: c.HasVAT }),
    ...(c.Scope !== undefined && { scope: c.Scope }),
    ...(c.DurationMonths !== undefined && { duration_months: c.DurationMonths }),
    ...(c.StartDate !== undefined && { start_date: c.StartDate }),
    ...(c.EndDate !== undefined && { end_date: c.EndDate }),
    ...(c.PaymentTerms !== undefined && { payment_terms: c.PaymentTerms }),
});

// ============================================================
// PAYMENT
// ============================================================

export const dbToPayment = (row: any): Payment => ({
    PaymentID: row.payment_id,
    ContractID: row.contract_id,
    ProjectID: row.project_id || '',
    BatchNo: row.batch_no || 1,
    Type: row.type as PaymentType,
    Amount: Number(row.amount) || 0,
    TreasuryRef: row.treasury_ref || '',
    Status: row.status as PaymentStatus,
    Description: row.description || '',
    RequestDate: row.request_date || '',
    ApprovedDate: row.approved_date || '',
    PaidDate: row.paid_date || '',
    ApprovedBy: row.approved_by || '',
});

export const paymentToDb = (p: Partial<Payment>) => ({
    ...(p.ContractID !== undefined && { contract_id: p.ContractID }),
    ...(p.ProjectID !== undefined && { project_id: p.ProjectID }),
    ...(p.BatchNo !== undefined && { batch_no: p.BatchNo }),
    ...(p.Type !== undefined && { type: p.Type }),
    ...(p.Amount !== undefined && { amount: p.Amount }),
    ...(p.TreasuryRef !== undefined && { treasury_ref: p.TreasuryRef }),
    ...(p.Status !== undefined && { status: p.Status }),
    ...(p.Description !== undefined && { description: p.Description }),
    ...(p.RequestDate !== undefined && { request_date: p.RequestDate }),
    ...(p.ApprovedDate !== undefined && { approved_date: p.ApprovedDate }),
    ...(p.PaidDate !== undefined && { paid_date: p.PaidDate }),
    ...(p.ApprovedBy !== undefined && { approved_by: p.ApprovedBy }),
});

// ============================================================
// TASK
// ============================================================

export const dbToTask = (row: any): Task => ({
    TaskID: row.task_id,
    Title: row.title,
    Description: row.description || '',
    ProjectID: row.project_id,
    AssigneeID: row.assignee_id || '',
    DueDate: row.due_date || '',
    Status: row.status as TaskStatus,
    Priority: row.priority as TaskPriority,
    Phase: row.phase || '',
    StepCode: row.step_code || '',
    LegalBasis: row.legal_basis || '',
    OutputDocument: row.output_document || '',
    DurationDays: row.duration_days || 0,
    PredecessorTaskID: row.predecessor_task_id || '',
    ApproverID: row.approver_id || '',
    EstimatedCost: Number(row.estimated_cost) || 0,
    ActualStartDate: row.actual_start_date || '',
    ActualEndDate: row.actual_end_date || '',
    Progress: row.progress || 0,
});

export const taskToDb = (t: Partial<Task>) => ({
    ...(t.TaskID !== undefined && { task_id: t.TaskID }),
    ...(t.Title !== undefined && { title: t.Title }),
    ...(t.Description !== undefined && { description: t.Description }),
    ...(t.ProjectID !== undefined && { project_id: t.ProjectID }),
    ...(t.AssigneeID !== undefined && { assignee_id: t.AssigneeID }),
    ...(t.DueDate !== undefined && { due_date: t.DueDate }),
    ...(t.Status !== undefined && { status: t.Status }),
    ...(t.Priority !== undefined && { priority: t.Priority }),
    ...(t.Phase !== undefined && { phase: t.Phase }),
    ...(t.StepCode !== undefined && { step_code: t.StepCode }),
    ...(t.LegalBasis !== undefined && { legal_basis: t.LegalBasis }),
    ...(t.OutputDocument !== undefined && { output_document: t.OutputDocument }),
    ...(t.DurationDays !== undefined && { duration_days: t.DurationDays }),
    ...(t.PredecessorTaskID !== undefined && { predecessor_task_id: t.PredecessorTaskID }),
    ...(t.ApproverID !== undefined && { approver_id: t.ApproverID }),
    ...(t.EstimatedCost !== undefined && { estimated_cost: t.EstimatedCost }),
    ...(t.Progress !== undefined && { progress: t.Progress }),
});

// ============================================================
// BIDDING PACKAGE
// ============================================================

export const dbToBiddingPackage = (row: any): BiddingPackage => ({
    PackageID: row.package_id,
    ProjectID: row.project_id,
    PackageNumber: row.package_number,
    PackageName: row.package_name,
    Price: Number(row.price) || 0,
    SelectionMethod: row.selection_method || '',
    BidType: row.bid_type || '',
    ContractType: row.contract_type || '',
    Status: row.status || 'Planning',
    NotificationCode: row.notification_code || '',
    PostingDate: row.posting_date || '',
    BidClosingDate: row.bid_closing_date || '',
    EstimatePrice: Number(row.estimate_price) || 0,
    WinningContractorID: row.winning_contractor_id || '',
    WinningPrice: Number(row.winning_price) || 0,
    KHLCNTCode: row.khlcnt_code || '',
    Field: row.field || '',
    Duration: row.duration || '',
    BidFee: Number(row.bid_fee) || 0,
    DecisionNumber: row.decision_number || '',
    DecisionDate: row.decision_date || '',
    DecisionAgency: row.decision_agency || '',
    DecisionFile: row.decision_file || '',
    CapitalSource: row.capital_source || '',
});

export const biddingPackageToDb = (bp: Partial<BiddingPackage>) => ({
    ...(bp.PackageID !== undefined && { package_id: bp.PackageID }),
    ...(bp.ProjectID !== undefined && { project_id: bp.ProjectID }),
    ...(bp.PackageNumber !== undefined && { package_number: bp.PackageNumber }),
    ...(bp.PackageName !== undefined && { package_name: bp.PackageName }),
    ...(bp.Price !== undefined && { price: bp.Price }),
    ...(bp.SelectionMethod !== undefined && { selection_method: bp.SelectionMethod }),
    ...(bp.BidType !== undefined && { bid_type: bp.BidType }),
    ...(bp.ContractType !== undefined && { contract_type: bp.ContractType }),
    ...(bp.Status !== undefined && { status: bp.Status }),
    ...(bp.Duration !== undefined && { duration: bp.Duration }),
    ...(bp.CapitalSource !== undefined && { capital_source: bp.CapitalSource }),
});

// ============================================================
// CAPITAL ALLOCATION
// ============================================================

export const dbToCapitalAllocation = (row: any): CapitalAllocation => ({
    AllocationID: row.plan_id,
    ProjectID: row.project_id,
    Year: row.year,
    Amount: Number(row.amount) || 0,
    Source: row.source || '',
    DecisionNumber: row.decision_number || '',
    DateAssigned: row.date_assigned || '',
    DisbursedAmount: Number(row.disbursed_amount) || 0,
});

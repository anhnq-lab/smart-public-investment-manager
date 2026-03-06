export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    action: string
                    changed_by: string
                    details: string | null
                    log_id: string
                    target_entity: string
                    target_id: string
                    timestamp: string
                }
                Insert: {
                    action: string
                    changed_by: string
                    details?: string | null
                    log_id?: string
                    target_entity: string
                    target_id: string
                    timestamp?: string
                }
                Update: {
                    action?: string
                    changed_by?: string
                    details?: string | null
                    log_id?: string
                    target_entity?: string
                    target_id?: string
                    timestamp?: string
                }
                Relationships: []
            }
            bidding_packages: {
                Row: {
                    bid_closing_date: string | null
                    bid_fee: number | null
                    bid_type: string | null
                    capital_source: string | null
                    contract_type: string | null
                    created_at: string
                    decision_agency: string | null
                    decision_date: string | null
                    decision_file: string | null
                    decision_number: string | null
                    duration: string | null
                    estimate_price: number | null
                    field: string | null
                    khlcnt_code: string | null
                    notification_code: string | null
                    package_id: string
                    package_name: string
                    package_number: string
                    posting_date: string | null
                    price: number
                    project_id: string
                    selection_method: string | null
                    status: string
                    updated_at: string
                    winning_contractor_id: string | null
                    winning_price: number | null
                }
                Insert: {
                    bid_closing_date?: string | null
                    bid_fee?: number | null
                    bid_type?: string | null
                    capital_source?: string | null
                    contract_type?: string | null
                    created_at?: string
                    decision_agency?: string | null
                    decision_date?: string | null
                    decision_file?: string | null
                    decision_number?: string | null
                    duration?: string | null
                    estimate_price?: number | null
                    field?: string | null
                    khlcnt_code?: string | null
                    notification_code?: string | null
                    package_id: string
                    package_name: string
                    package_number: string
                    posting_date?: string | null
                    price?: number
                    project_id: string
                    selection_method?: string | null
                    status?: string
                    updated_at?: string
                    winning_contractor_id?: string | null
                    winning_price?: number | null
                }
                Update: {
                    bid_closing_date?: string | null
                    bid_fee?: number | null
                    bid_type?: string | null
                    capital_source?: string | null
                    contract_type?: string | null
                    created_at?: string
                    decision_agency?: string | null
                    decision_date?: string | null
                    decision_file?: string | null
                    decision_number?: string | null
                    duration?: string | null
                    estimate_price?: number | null
                    field?: string | null
                    khlcnt_code?: string | null
                    notification_code?: string | null
                    package_id?: string
                    package_name?: string
                    package_number?: string
                    posting_date?: string | null
                    price?: number
                    project_id?: string
                    selection_method?: string | null
                    status?: string
                    updated_at?: string
                    winning_contractor_id?: string | null
                    winning_price?: number | null
                }
                Relationships: []
            }
            bim_models: {
                Row: {
                    created_at: string | null
                    discipline: string | null
                    element_count: number | null
                    error_message: string | null
                    file_name: string
                    file_size: number | null
                    frag_path: string | null
                    id: string
                    ifc_path: string | null
                    project_id: string
                    properties_path: string | null
                    status: string | null
                    updated_at: string | null
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    discipline?: string | null
                    element_count?: number | null
                    error_message?: string | null
                    file_name: string
                    file_size?: number | null
                    frag_path?: string | null
                    id?: string
                    ifc_path?: string | null
                    project_id: string
                    properties_path?: string | null
                    status?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    discipline?: string | null
                    element_count?: number | null
                    error_message?: string | null
                    file_name?: string
                    file_size?: number | null
                    frag_path?: string | null
                    id?: string
                    ifc_path?: string | null
                    project_id?: string
                    properties_path?: string | null
                    status?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
                }
                Relationships: []
            }
            capital_plans: {
                Row: {
                    amount: number
                    created_at: string
                    date_assigned: string | null
                    decision_number: string | null
                    disbursed_amount: number
                    plan_id: string
                    project_id: string
                    source: string | null
                    year: number
                }
                Insert: {
                    amount?: number
                    created_at?: string
                    date_assigned?: string | null
                    decision_number?: string | null
                    disbursed_amount?: number
                    plan_id: string
                    project_id: string
                    source?: string | null
                    year: number
                }
                Update: {
                    amount?: number
                    created_at?: string
                    date_assigned?: string | null
                    decision_number?: string | null
                    disbursed_amount?: number
                    plan_id?: string
                    project_id?: string
                    source?: string | null
                    year?: number
                }
                Relationships: []
            }
            construction_works: {
                Row: {
                    address: string | null
                    design_level: number | null
                    grade: number | null
                    project_id: string
                    type: string | null
                    work_id: string
                    work_name: string
                }
                Insert: {
                    address?: string | null
                    design_level?: number | null
                    grade?: number | null
                    project_id: string
                    type?: string | null
                    work_id?: string
                    work_name: string
                }
                Update: {
                    address?: string | null
                    design_level?: number | null
                    grade?: number | null
                    project_id?: string
                    type?: string | null
                    work_id?: string
                    work_name?: string
                }
                Relationships: []
            }
            contractors: {
                Row: {
                    address: string | null
                    cap_cert_code: string | null
                    contact_info: string | null
                    contractor_id: string
                    created_at: string
                    established_year: number | null
                    full_name: string
                    is_foreign: boolean
                    op_license_no: string | null
                    representative: string | null
                    tax_code: string | null
                    updated_at: string
                }
                Insert: {
                    address?: string | null
                    cap_cert_code?: string | null
                    contact_info?: string | null
                    contractor_id: string
                    created_at?: string
                    established_year?: number | null
                    full_name: string
                    is_foreign?: boolean
                    op_license_no?: string | null
                    representative?: string | null
                    tax_code?: string | null
                    updated_at?: string
                }
                Update: {
                    address?: string | null
                    cap_cert_code?: string | null
                    contact_info?: string | null
                    contractor_id?: string
                    created_at?: string
                    established_year?: number | null
                    full_name?: string
                    is_foreign?: boolean
                    op_license_no?: string | null
                    representative?: string | null
                    tax_code?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            contracts: {
                Row: {
                    advance_rate: number | null
                    contract_id: string
                    contract_name: string | null
                    contract_type: string | null
                    contractor_id: string | null
                    created_at: string
                    duration_months: number | null
                    end_date: string | null
                    has_vat: boolean | null
                    package_id: string | null
                    payment_terms: string | null
                    project_id: string | null
                    scope: string | null
                    sign_date: string | null
                    start_date: string | null
                    status: number
                    updated_at: string
                    value: number
                    warranty: number | null
                }
                Insert: {
                    advance_rate?: number | null
                    contract_id: string
                    contract_name?: string | null
                    contract_type?: string | null
                    contractor_id?: string | null
                    created_at?: string
                    duration_months?: number | null
                    end_date?: string | null
                    has_vat?: boolean | null
                    package_id?: string | null
                    payment_terms?: string | null
                    project_id?: string | null
                    scope?: string | null
                    sign_date?: string | null
                    start_date?: string | null
                    status?: number
                    updated_at?: string
                    value?: number
                    warranty?: number | null
                }
                Update: {
                    advance_rate?: number | null
                    contract_id?: string
                    contract_name?: string | null
                    contract_type?: string | null
                    contractor_id?: string | null
                    created_at?: string
                    duration_months?: number | null
                    end_date?: string | null
                    has_vat?: boolean | null
                    package_id?: string | null
                    payment_terms?: string | null
                    project_id?: string | null
                    scope?: string | null
                    sign_date?: string | null
                    start_date?: string | null
                    status?: number
                    updated_at?: string
                    value?: number
                    warranty?: number | null
                }
                Relationships: []
            }
            disbursements: {
                Row: {
                    amount: number
                    capital_plan_id: string | null
                    created_at: string
                    date: string
                    disbursement_id: string
                    form_type: string | null
                    payment_id: number | null
                    project_id: string
                    status: string
                    treasury_code: string | null
                }
                Insert: {
                    amount?: number
                    capital_plan_id?: string | null
                    created_at?: string
                    date: string
                    disbursement_id: string
                    form_type?: string | null
                    payment_id?: number | null
                    project_id: string
                    status?: string
                    treasury_code?: string | null
                }
                Update: {
                    amount?: number
                    capital_plan_id?: string | null
                    created_at?: string
                    date?: string
                    disbursement_id?: string
                    form_type?: string | null
                    payment_id?: number | null
                    project_id?: string
                    status?: string
                    treasury_code?: string | null
                }
                Relationships: []
            }
            documents: {
                Row: {
                    category: number
                    created_at: string
                    doc_id: number
                    doc_name: string
                    folder_id: string | null
                    is_digitized: boolean | null
                    iso_status: string | null
                    project_id: string | null
                    reference_id: string | null
                    revision: string | null
                    size: string | null
                    storage_path: string
                    upload_date: string
                    uploaded_by: string | null
                    version: string | null
                }
                Insert: {
                    category?: number
                    created_at?: string
                    doc_id?: number
                    doc_name: string
                    folder_id?: string | null
                    is_digitized?: boolean | null
                    iso_status?: string | null
                    project_id?: string | null
                    reference_id?: string | null
                    revision?: string | null
                    size?: string | null
                    storage_path: string
                    upload_date?: string
                    uploaded_by?: string | null
                    version?: string | null
                }
                Update: {
                    category?: number
                    created_at?: string
                    doc_id?: number
                    doc_name?: string
                    folder_id?: string | null
                    is_digitized?: boolean | null
                    iso_status?: string | null
                    project_id?: string | null
                    reference_id?: string | null
                    revision?: string | null
                    size?: string | null
                    storage_path?: string
                    upload_date?: string
                    uploaded_by?: string | null
                    version?: string | null
                }
                Relationships: []
            }
            employees: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    department: string | null
                    email: string | null
                    employee_id: string
                    full_name: string
                    join_date: string | null
                    phone: string | null
                    position: string | null
                    role: string
                    status: number
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    department?: string | null
                    email?: string | null
                    employee_id: string
                    full_name: string
                    join_date?: string | null
                    phone?: string | null
                    position?: string | null
                    role?: string
                    status?: number
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    department?: string | null
                    email?: string | null
                    employee_id?: string
                    full_name?: string
                    join_date?: string | null
                    phone?: string | null
                    position?: string | null
                    role?: string
                    status?: number
                    updated_at?: string
                }
                Relationships: []
            }
            facility_assets: {
                Row: {
                    asset_code: string | null
                    asset_id: string
                    asset_name: string
                    bim_element_id: string | null
                    category: string | null
                    condition: string | null
                    created_at: string | null
                    install_date: string | null
                    last_maintenance: string | null
                    location: string | null
                    maintenance_cycle_days: number | null
                    manufacturer: string | null
                    model: string | null
                    next_maintenance: string | null
                    notes: string | null
                    project_id: string
                    status: string | null
                    updated_at: string | null
                    warranty_expiry: string | null
                }
                Insert: {
                    asset_code?: string | null
                    asset_id?: string
                    asset_name: string
                    bim_element_id?: string | null
                    category?: string | null
                    condition?: string | null
                    created_at?: string | null
                    install_date?: string | null
                    last_maintenance?: string | null
                    location?: string | null
                    maintenance_cycle_days?: number | null
                    manufacturer?: string | null
                    model?: string | null
                    next_maintenance?: string | null
                    notes?: string | null
                    project_id: string
                    status?: string | null
                    updated_at?: string | null
                    warranty_expiry?: string | null
                }
                Update: {
                    asset_code?: string | null
                    asset_id?: string
                    asset_name?: string
                    bim_element_id?: string | null
                    category?: string | null
                    condition?: string | null
                    created_at?: string | null
                    install_date?: string | null
                    last_maintenance?: string | null
                    location?: string | null
                    maintenance_cycle_days?: number | null
                    manufacturer?: string | null
                    model?: string | null
                    next_maintenance?: string | null
                    notes?: string | null
                    project_id?: string
                    status?: string | null
                    updated_at?: string | null
                    warranty_expiry?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "facility_assets_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["project_id"]
                    },
                ]
            }
            feasibility_studies: {
                Row: {
                    approval_authority: string | null
                    approval_date: string | null
                    approval_number: string | null
                    construction_scale: string | null
                    created_at: string
                    design_phases: number | null
                    document_path: string | null
                    environmental_approval: string | null
                    main_technology: string | null
                    project_id: string
                    report_id: string
                    report_type: string | null
                    total_investment: number | null
                }
                Insert: {
                    approval_authority?: string | null
                    approval_date?: string | null
                    approval_number?: string | null
                    construction_scale?: string | null
                    created_at?: string
                    design_phases?: number | null
                    document_path?: string | null
                    environmental_approval?: string | null
                    main_technology?: string | null
                    project_id: string
                    report_id?: string
                    report_type?: string | null
                    total_investment?: number | null
                }
                Update: {
                    approval_authority?: string | null
                    approval_date?: string | null
                    approval_number?: string | null
                    construction_scale?: string | null
                    created_at?: string
                    design_phases?: number | null
                    document_path?: string | null
                    environmental_approval?: string | null
                    main_technology?: string | null
                    project_id?: string
                    report_id?: string
                    report_type?: string | null
                    total_investment?: number | null
                }
                Relationships: []
            }
            folders: {
                Row: {
                    folder_id: string
                    name: string
                    parent_id: string | null
                    path: string
                    type: string | null
                }
                Insert: {
                    folder_id?: string
                    name: string
                    parent_id?: string | null
                    path: string
                    type?: string | null
                }
                Update: {
                    folder_id?: string
                    name?: string
                    parent_id?: string | null
                    path?: string
                    type?: string | null
                }
                Relationships: []
            }
            investment_policy_decisions: {
                Row: {
                    authority: string | null
                    capital_sources: string[] | null
                    created_at: string
                    decision_date: string | null
                    decision_number: string
                    document_path: string | null
                    duration: string | null
                    id: string
                    location: string | null
                    objectives: string | null
                    preliminary_investment: number | null
                    project_id: string
                }
                Insert: {
                    authority?: string | null
                    capital_sources?: string[] | null
                    created_at?: string
                    decision_date?: string | null
                    decision_number: string
                    document_path?: string | null
                    duration?: string | null
                    id?: string
                    location?: string | null
                    objectives?: string | null
                    preliminary_investment?: number | null
                    project_id: string
                }
                Update: {
                    authority?: string | null
                    capital_sources?: string[] | null
                    created_at?: string
                    decision_date?: string | null
                    decision_number?: string
                    document_path?: string | null
                    duration?: string | null
                    id?: string
                    location?: string | null
                    objectives?: string | null
                    preliminary_investment?: number | null
                    project_id?: string
                }
                Relationships: []
            }
            package_issues: {
                Row: {
                    description: string | null
                    issue_id: string
                    package_id: string
                    reported_date: string
                    reporter: string | null
                    severity: string
                    status: string
                    title: string
                }
                Insert: {
                    description?: string | null
                    issue_id?: string
                    package_id: string
                    reported_date?: string
                    reporter?: string | null
                    severity?: string
                    status?: string
                    title: string
                }
                Update: {
                    description?: string | null
                    issue_id?: string
                    package_id?: string
                    reported_date?: string
                    reporter?: string | null
                    severity?: string
                    status?: string
                    title?: string
                }
                Relationships: []
            }
            payments: {
                Row: {
                    amount: number
                    approved_by: string | null
                    approved_date: string | null
                    batch_no: number
                    contract_id: string
                    created_at: string
                    description: string | null
                    paid_date: string | null
                    payment_id: number
                    project_id: string | null
                    request_date: string | null
                    status: string
                    treasury_ref: string | null
                    type: string
                    updated_at: string
                }
                Insert: {
                    amount?: number
                    approved_by?: string | null
                    approved_date?: string | null
                    batch_no?: number
                    contract_id: string
                    created_at?: string
                    description?: string | null
                    paid_date?: string | null
                    payment_id?: number
                    project_id?: string | null
                    request_date?: string | null
                    status?: string
                    treasury_ref?: string | null
                    type?: string
                    updated_at?: string
                }
                Update: {
                    amount?: number
                    approved_by?: string | null
                    approved_date?: string | null
                    batch_no?: number
                    contract_id?: string
                    created_at?: string
                    description?: string | null
                    paid_date?: string | null
                    payment_id?: number
                    project_id?: string | null
                    request_date?: string | null
                    status?: string
                    treasury_ref?: string | null
                    type?: string
                    updated_at?: string
                }
                Relationships: []
            }
            project_members: {
                Row: {
                    employee_id: string
                    id: string
                    joined_at: string | null
                    project_id: string
                    role: string | null
                }
                Insert: {
                    employee_id: string
                    id?: string
                    joined_at?: string | null
                    project_id: string
                    role?: string | null
                }
                Update: {
                    employee_id?: string
                    id?: string
                    joined_at?: string | null
                    project_id?: string
                    role?: string | null
                }
                Relationships: []
            }
            projects: {
                Row: {
                    actual_end_date: string | null
                    applicable_standards: string | null
                    approval_date: string | null
                    bim_status: string | null
                    capital_source: string | null
                    cde_project_code: string | null
                    competent_authority: string | null
                    construction_grade: string | null
                    construction_type: string | null
                    coordinates: Json | null
                    created_at: string
                    decision_authority: string | null
                    decision_date: string | null
                    decision_maker_id: string | null
                    decision_number: string | null
                    design_contractor: string | null
                    duration: string | null
                    expected_end_date: string | null
                    feasibility_contractor: string | null
                    group_code: string
                    image_url: string | null
                    investment_type: number
                    investor_name: string | null
                    is_emergency: boolean
                    is_oda: boolean | null
                    is_synced: boolean | null
                    last_sync_date: string | null
                    location_code: string | null
                    main_contractor_name: string | null
                    management_form: string | null
                    national_project_code: string | null
                    objective: string | null
                    payment_progress: number | null
                    progress: number | null
                    project_id: string
                    project_name: string
                    project_number: string | null
                    requires_bim: boolean | null
                    review_contractor: string | null
                    sector: string | null
                    stage: string | null
                    start_date: string | null
                    status: number
                    supervision_contractor: string | null
                    survey_contractor: string | null
                    sync_error: string | null
                    total_investment: number
                    updated_at: string
                    version: string | null
                }
                Insert: {
                    actual_end_date?: string | null
                    applicable_standards?: string | null
                    approval_date?: string | null
                    bim_status?: string | null
                    capital_source?: string | null
                    cde_project_code?: string | null
                    competent_authority?: string | null
                    construction_grade?: string | null
                    construction_type?: string | null
                    coordinates?: Json | null
                    created_at?: string
                    decision_authority?: string | null
                    decision_date?: string | null
                    decision_maker_id?: string | null
                    decision_number?: string | null
                    design_contractor?: string | null
                    duration?: string | null
                    expected_end_date?: string | null
                    feasibility_contractor?: string | null
                    group_code?: string
                    image_url?: string | null
                    investment_type?: number
                    investor_name?: string | null
                    is_emergency?: boolean
                    is_oda?: boolean | null
                    is_synced?: boolean | null
                    last_sync_date?: string | null
                    location_code?: string | null
                    main_contractor_name?: string | null
                    management_form?: string | null
                    national_project_code?: string | null
                    objective?: string | null
                    payment_progress?: number | null
                    progress?: number | null
                    project_id: string
                    project_name: string
                    project_number?: string | null
                    requires_bim?: boolean | null
                    review_contractor?: string | null
                    sector?: string | null
                    stage?: string | null
                    start_date?: string | null
                    status?: number
                    supervision_contractor?: string | null
                    survey_contractor?: string | null
                    sync_error?: string | null
                    total_investment?: number
                    updated_at?: string
                    version?: string | null
                }
                Update: {
                    actual_end_date?: string | null
                    applicable_standards?: string | null
                    approval_date?: string | null
                    bim_status?: string | null
                    capital_source?: string | null
                    cde_project_code?: string | null
                    competent_authority?: string | null
                    construction_grade?: string | null
                    construction_type?: string | null
                    coordinates?: Json | null
                    created_at?: string
                    decision_authority?: string | null
                    decision_date?: string | null
                    decision_maker_id?: string | null
                    decision_number?: string | null
                    design_contractor?: string | null
                    duration?: string | null
                    expected_end_date?: string | null
                    feasibility_contractor?: string | null
                    group_code?: string
                    image_url?: string | null
                    investment_type?: number
                    investor_name?: string | null
                    is_emergency?: boolean
                    is_oda?: boolean | null
                    is_synced?: boolean | null
                    last_sync_date?: string | null
                    location_code?: string | null
                    main_contractor_name?: string | null
                    management_form?: string | null
                    national_project_code?: string | null
                    objective?: string | null
                    payment_progress?: number | null
                    progress?: number | null
                    project_id?: string
                    project_name?: string
                    project_number?: string | null
                    requires_bim?: boolean | null
                    review_contractor?: string | null
                    sector?: string | null
                    stage?: string | null
                    start_date?: string | null
                    status?: number
                    supervision_contractor?: string | null
                    survey_contractor?: string | null
                    sync_error?: string | null
                    total_investment?: number
                    updated_at?: string
                    version?: string | null
                }
                Relationships: []
            }
            stage_transitions: {
                Row: {
                    decision_date: string | null
                    decision_number: string | null
                    end_date: string | null
                    id: string
                    notes: string | null
                    project_id: string
                    stage: string
                    start_date: string
                }
                Insert: {
                    decision_date?: string | null
                    decision_number?: string | null
                    end_date?: string | null
                    id?: string
                    notes?: string | null
                    project_id: string
                    stage: string
                    start_date?: string
                }
                Update: {
                    decision_date?: string | null
                    decision_number?: string | null
                    end_date?: string | null
                    id?: string
                    notes?: string | null
                    project_id?: string
                    stage?: string
                    start_date?: string
                }
                Relationships: []
            }
            sub_tasks: {
                Row: {
                    assignee_id: string | null
                    due_date: string | null
                    status: string
                    sub_task_id: string
                    task_id: string
                    title: string
                }
                Insert: {
                    assignee_id?: string | null
                    due_date?: string | null
                    status?: string
                    sub_task_id?: string
                    task_id: string
                    title: string
                }
                Update: {
                    assignee_id?: string | null
                    due_date?: string | null
                    status?: string
                    sub_task_id?: string
                    task_id?: string
                    title?: string
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    actual_end_date: string | null
                    actual_start_date: string | null
                    approver_id: string | null
                    assignee_id: string | null
                    created_at: string
                    description: string | null
                    due_date: string | null
                    duration_days: number | null
                    estimated_cost: number | null
                    legal_basis: string | null
                    output_document: string | null
                    phase: string | null
                    predecessor_task_id: string | null
                    priority: string
                    progress: number | null
                    project_id: string
                    status: string
                    step_code: string | null
                    task_id: string
                    title: string
                    updated_at: string
                }
                Insert: {
                    actual_end_date?: string | null
                    actual_start_date?: string | null
                    approver_id?: string | null
                    assignee_id?: string | null
                    created_at?: string
                    description?: string | null
                    due_date?: string | null
                    duration_days?: number | null
                    estimated_cost?: number | null
                    legal_basis?: string | null
                    output_document?: string | null
                    phase?: string | null
                    predecessor_task_id?: string | null
                    priority?: string
                    progress?: number | null
                    project_id: string
                    status?: string
                    step_code?: string | null
                    task_id: string
                    title: string
                    updated_at?: string
                }
                Update: {
                    actual_end_date?: string | null
                    actual_start_date?: string | null
                    approver_id?: string | null
                    assignee_id?: string | null
                    created_at?: string
                    description?: string | null
                    due_date?: string | null
                    duration_days?: number | null
                    estimated_cost?: number | null
                    legal_basis?: string | null
                    output_document?: string | null
                    phase?: string | null
                    predecessor_task_id?: string | null
                    priority?: string
                    progress?: number | null
                    project_id?: string
                    status?: string
                    step_code?: string | null
                    task_id?: string
                    title?: string
                    updated_at?: string
                }
                Relationships: []
            }
            variation_orders: {
                Row: {
                    adjusted_amount: number
                    adjusted_duration: number | null
                    approval_file: string | null
                    content: string | null
                    contract_id: string
                    created_at: string
                    number: string
                    sign_date: string | null
                    vo_id: string
                }
                Insert: {
                    adjusted_amount?: number
                    adjusted_duration?: number | null
                    approval_file?: string | null
                    content?: string | null
                    contract_id: string
                    created_at?: string
                    number: string
                    sign_date?: string | null
                    vo_id?: string
                }
                Update: {
                    adjusted_amount?: number
                    adjusted_duration?: number | null
                    approval_file?: string | null
                    content?: string | null
                    contract_id?: string
                    created_at?: string
                    number?: string
                    sign_date?: string | null
                    vo_id?: string
                }
                Relationships: []
            }
            user_accounts: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    employee_id: string
                    id: string
                    is_active: boolean | null
                    last_login: string | null
                    password_hash: string
                    updated_at: string | null
                    username: string
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    employee_id: string
                    id?: string
                    is_active?: boolean | null
                    last_login?: string | null
                    password_hash: string
                    updated_at?: string | null
                    username: string
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    employee_id?: string
                    id?: string
                    is_active?: boolean | null
                    last_login?: string | null
                    password_hash?: string
                    updated_at?: string | null
                    username?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_accounts_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: true
                        referencedRelation: "employees"
                        referencedColumns: ["employee_id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

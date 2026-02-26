// Project Service - Supabase CRUD operations
import { supabase } from '../lib/supabase';
import { dbToProject, projectToDb, dbToBiddingPackage, dbToCapitalAllocation } from '../lib/dbMappers';
import { Project, ProjectStatus, ProjectGroup, BiddingPackage, CapitalAllocation, Disbursement } from '../types';
import type { QueryParams } from '../types/api';

export class ProjectService {
    /**
     * Get all projects with optional filtering
     */
    static async getAll(params?: QueryParams): Promise<Project[]> {
        let query = supabase.from('projects').select('*');

        if (params?.search) {
            const s = params.search;
            query = query.or(`project_name.ilike.%${s}%,project_id.ilike.%${s}%,investor_name.ilike.%${s}%`);
        }

        if (params?.filters?.status !== undefined) {
            query = query.eq('status', params.filters.status);
        }

        if (params?.filters?.group) {
            query = query.eq('group_code', params.filters.group);
        }

        if (params?.filters?.investmentType) {
            query = query.eq('investment_type', params.filters.investmentType);
        }

        if (params?.filters?.stage) {
            query = query.eq('stage', params.filters.stage);
        }

        if (params?.filters?.sector) {
            query = query.eq('sector', params.filters.sector);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw new Error(`Failed to fetch projects: ${error.message}`);
        return (data || []).map(dbToProject);
    }

    /**
     * Get a single project by ID (supports both ProjectID and ProjectNumber)
     */
    static async getById(id: string): Promise<Project | undefined> {
        // Try by project_id first
        let { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('project_id', id)
            .maybeSingle();

        if (!data && !error) {
            // Try by project_number
            const result = await supabase
                .from('projects')
                .select('*')
                .eq('project_number', id)
                .maybeSingle();
            data = result.data;
            error = result.error;
        }

        if (error) {
            throw new Error(`Failed to fetch project: ${error.message}`);
        }
        return data ? dbToProject(data) : undefined;
    }

    /**
     * Create a new project
     */
    static async create(projectData: Partial<Project>): Promise<Project> {
        const insertData = projectToDb({
            ProjectID: projectData.ProjectID || `DA-${Date.now()}`,
            ProjectName: projectData.ProjectName || 'Dự án mới',
            GroupCode: projectData.GroupCode || ProjectGroup.C,
            Status: projectData.Status || ProjectStatus.Preparation,
            TotalInvestment: projectData.TotalInvestment || 0,
            IsEmergency: projectData.IsEmergency || false,
            ...projectData,
        });

        const { data, error } = await supabase
            .from('projects')
            .insert(insertData as any)
            .select()
            .single();

        if (error) throw new Error(`Failed to create project: ${error.message}`);
        return dbToProject(data);
    }

    /**
     * Update an existing project
     */
    static async update(id: string, data: Partial<Project>): Promise<Project> {
        const updateData = projectToDb(data);

        const { data: updated, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('project_id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update project: ${error.message}`);
        return dbToProject(updated);
    }

    /**
     * Delete a project
     */
    static async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('project_id', id);

        if (error) throw new Error(`Failed to delete project: ${error.message}`);
    }

    /**
     * Get project statistics
     */
    static async getStatistics(): Promise<{
        total: number;
        byStatus: Record<ProjectStatus, number>;
        byGroup: Record<ProjectGroup, number>;
        totalInvestment: number;
    }> {
        const projects = await this.getAll();

        const byStatus = {
            [ProjectStatus.Preparation]: 0,
            [ProjectStatus.Execution]: 0,
            [ProjectStatus.Completion]: 0,
        };
        const byGroup = {
            [ProjectGroup.QN]: 0,
            [ProjectGroup.A]: 0,
            [ProjectGroup.B]: 0,
            [ProjectGroup.C]: 0,
        };

        let totalInvestment = 0;

        projects.forEach(p => {
            byStatus[p.Status]++;
            byGroup[p.GroupCode]++;
            totalInvestment += p.TotalInvestment;
        });

        return {
            total: projects.length,
            byStatus,
            byGroup,
            totalInvestment,
        };
    }

    /**
     * Get projects by status
     */
    static async getByStatus(status: ProjectStatus): Promise<Project[]> {
        return this.getAll({ filters: { status } });
    }

    /**
     * Search projects
     */
    static async search(query: string): Promise<Project[]> {
        return this.getAll({ search: query });
    }

    /**
     * Get all bidding packages (across all projects)
     */
    static async getAllBiddingPackages(): Promise<BiddingPackage[]> {
        const { data, error } = await supabase
            .from('bidding_packages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch all packages: ${error.message}`);
        return (data || []).map(dbToBiddingPackage);
    }

    /**
     * Get bidding packages for a project
     */
    static async getPackagesByProject(projectId: string): Promise<BiddingPackage[]> {
        const { data, error } = await supabase
            .from('bidding_packages')
            .select('*')
            .eq('project_id', projectId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw new Error(`Failed to fetch packages: ${error.message}`);
        return (data || []).map(dbToBiddingPackage);
    }

    /**
     * Get capital and disbursement info (NĐ 99/2021/NĐ-CP)
     */
    static async getCapitalInfo(projectId: string): Promise<{
        allocations: CapitalAllocation[];
        disbursements: Disbursement[];
        summary: {
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
    }> {
        // Fetch allocations from capital_plans table
        const { data: allocationRows } = await supabase
            .from('capital_plans')
            .select('*')
            .eq('project_id', projectId);

        const allocations: CapitalAllocation[] = (allocationRows || []).map(dbToCapitalAllocation);

        // Fetch disbursements
        const { data: disbursementRows } = await supabase
            .from('disbursements')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: true });

        const disbursements: Disbursement[] = (disbursementRows || []).map((row: any) => ({
            DisbursementID: row.disbursement_id,
            ProjectID: row.project_id,
            CapitalPlanID: row.capital_plan_id || undefined,
            AllocationID: row.capital_plan_id || undefined,
            PaymentID: row.payment_id || undefined,
            Amount: Number(row.amount) || 0,
            Date: row.date,
            TreasuryCode: row.treasury_code || '',
            FormType: row.form_type || '',
            Description: '',
            Status: row.status as 'Pending' | 'Approved' | 'Rejected',
        }));

        // Get project total investment
        const project = await this.getById(projectId);
        const totalInvestment = project?.TotalInvestment || 0;

        // Compute summary
        const totalAdvance = disbursements
            .filter(d => d.Type === 'TamUng' && d.Status === 'Approved')
            .reduce((s, d) => s + d.Amount, 0);
        const advanceRecovered = disbursements
            .filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved')
            .reduce((s, d) => s + d.Amount, 0);
        const completionPayment = disbursements
            .filter(d => d.Type === 'ThanhToanKLHT' && d.Status === 'Approved')
            .reduce((s, d) => s + d.Amount, 0);
        const totalDisbursed = totalAdvance + completionPayment - advanceRecovered;
        const totalAllocated = allocations.reduce((s, a) => s + a.Amount, 0);

        const currentYear = new Date().getFullYear();
        const yearlyTarget = allocations
            .filter(a => a.Year === currentYear)
            .reduce((s, a) => s + a.Amount, 0);
        const yearlyDisbursed = disbursements
            .filter(d => new Date(d.Date).getFullYear() === currentYear && d.Status === 'Approved')
            .reduce((s, d) => s + d.Amount, 0);

        return {
            allocations,
            disbursements,
            summary: {
                totalInvestment,
                totalAllocated,
                totalDisbursed,
                totalAdvance,
                advanceRecovered,
                advanceBalance: totalAdvance - advanceRecovered,
                completionPayment,
                disbursementRate: totalAllocated > 0 ? Math.round((totalDisbursed / totalAllocated) * 100) : 0,
                yearlyTarget,
                yearlyDisbursed,
            }
        };
    }
}

export default ProjectService;

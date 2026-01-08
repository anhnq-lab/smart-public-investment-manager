
import { Project } from '../types';

export interface SyncResult {
    success: boolean;
    message: string;
    nationalCode?: string;
    timestamp: string;
}

export interface InvestmentReport {
    id: string;
    type: 'Monitoring' | 'Settlement'; // Giám sát đầu tư | Quyết toán
    projectId: string;
    generatedDate: string;
    url: string;
}

export class NationalGatewayService {

    /**
     * Simulate syncing project with National Database (ND111)
     */
    static async syncProject(project: Project): Promise<SyncResult> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate success for most, error for specific cases if needed
                if (project.ProjectID.includes('ERROR')) {
                    resolve({
                        success: false,
                        message: 'Lỗi kết nối đến CSDL Quốc gia. Vui lòng thử lại sau.',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    resolve({
                        success: true,
                        message: 'Đồng bộ thành công với CSDL Quốc gia về hoạt động xây dựng.',
                        nationalCode: `ND111-${project.ProjectID.substring(0, 6)}-${new Date().getFullYear()}`,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 2000); // Simulate network delay
        });
    }

    /**
     * Generate Investment Monitoring Report (Báo cáo giám sát đầu tư)
     */
    static async generateMonitoringReport(projectId: string): Promise<InvestmentReport> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: `RPT-MON-${Date.now()}`,
                    type: 'Monitoring',
                    projectId: projectId,
                    generatedDate: new Date().toISOString(),
                    url: '/reports/mau_bao_cao_giam_sat_dau_tu.pdf' // Mock URL
                });
            }, 1500);
        });
    }

    /**
     * Generate Settlement Report (Báo cáo quyết toán)
     */
    static async generateSettlementReport(projectId: string): Promise<InvestmentReport> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: `RPT-SET-${Date.now()}`,
                    type: 'Settlement',
                    projectId: projectId,
                    generatedDate: new Date().toISOString(),
                    url: '/reports/mau_bao_cao_quyet_toan_du_an.pdf' // Mock URL
                });
            }, 2000);
        });
    }
}

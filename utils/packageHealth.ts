// Package health analysis utilities - extracted from mockData
import { PackageIssue, PackageHealthCheck, RiskLevel } from '../types';

// Temporary static issues data — will be replaced by Supabase table later
export const packageIssues: PackageIssue[] = [
    {
        IssueID: "ISS-001",
        PackageID: "PKG-001",
        Title: "Vướng mắc mặt bằng thi công phân khu 2",
        Description: "Chưa bàn giao được 500m2 đất nông nghiệp do hộ dân chưa đồng ý phương án đền bù.",
        Status: "Open",
        Severity: RiskLevel.High,
        ReportedDate: "2024-05-20",
        Reporter: "Ban GPMB"
    }
];

// Simulate Backend AI Health Check
export const analyzePackageHealth = (pkgId: string): Promise<PackageHealthCheck> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const issues = packageIssues.filter(i => i.PackageID === pkgId);
            const highRiskCount = issues.filter(i => i.Severity === RiskLevel.High || i.Severity === RiskLevel.Critical).length;

            let score = 95;
            let factors = ["Tiến độ giải ngân tốt", "Hồ sơ pháp lý đầy đủ"];
            let recommendation = "Tiếp tục duy trì giám sát định kỳ.";
            let risk = RiskLevel.Low;

            if (highRiskCount > 0) {
                score = 65;
                risk = RiskLevel.High;
                factors = ["Vướng mắc mặt bằng chưa giải quyết", "Có nguy cơ chậm tiến độ thi công"];
                recommendation = "Cần tổ chức họp khẩn với Ban GPMB và Lãnh đạo địa phương để tháo gỡ.";
            }

            resolve({ score, riskLevel: risk, factors, recommendation });
        }, 1200);
    });
};

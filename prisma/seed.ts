import { PrismaClient } from '@prisma/client';
import { mockProjects, mockEmployees } from '../mockData'; // Note .js extension for ESM if needed, or rely on bun/tsx resolution
// Since mockData.ts is a TS file, tsx should handle it. But we might need to adjust imports in mockData.ts if it imports other TS files without extensions.
// Let's assume standard TS node resolution.

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // 1. Seed Employees
    console.log('Seeding employees...');
    for (const emp of mockEmployees) {
        await prisma.employee.upsert({
            where: { EmployeeID: emp.EmployeeID },
            update: {},
            create: {
                EmployeeID: emp.EmployeeID,
                FullName: emp.FullName,
                Username: emp.Username,
                Password: emp.Password || '123456', // Default password
                Role: emp.Role,
                Department: emp.Department,
                Position: emp.Position,
                Email: emp.Email,
                Phone: emp.Phone,
                AvatarUrl: emp.AvatarUrl,
                Status: emp.Status,
                JoinDate: emp.JoinDate ? new Date(emp.JoinDate) : null,
            },
        });
    }

    // 2. Seed Projects
    console.log('Seeding projects...');
    for (const proj of mockProjects) {
        // Helper to parse date or undefined
        const parseDate = (d: string | undefined) => (d ? new Date(d) : null);

        await prisma.project.upsert({
            where: { ProjectID: proj.ProjectID },
            update: {},
            create: {
                ProjectID: proj.ProjectID,
                ProjectName: proj.ProjectName,
                GroupCode: proj.GroupCode,
                InvestmentType: proj.InvestmentType,
                DecisionMakerID: proj.DecisionMakerID,
                TotalInvestment: proj.TotalInvestment,
                CapitalSource: proj.CapitalSource,
                LocationCode: proj.LocationCode,
                ApprovalDate: parseDate(proj.ApprovalDate),
                Status: proj.Status,
                IsEmergency: proj.IsEmergency,
                ImageUrl: proj.ImageUrl,
                Progress: proj.Progress,
                PaymentProgress: proj.PaymentProgress,
                InvestorName: proj.InvestorName,
                MainContractorName: proj.MainContractorName,
                ConstructionType: proj.ConstructionType,
                ConstructionGrade: proj.ConstructionGrade,

                // Detailed Fields
                ProjectNumber: proj.ProjectNumber,
                Version: proj.Version,
                Objective: proj.Objective,
                CompetentAuthority: proj.CompetentAuthority,
                Duration: proj.Duration,
                ManagementForm: proj.ManagementForm,
                DecisionNumber: proj.DecisionNumber,
                DecisionDate: parseDate(proj.DecisionDate),
                DecisionAuthority: proj.DecisionAuthority,
                IsODA: proj.IsODA,

                // Sync Status
                IsSynced: (proj as any).SyncStatus?.IsSynced,
                LastSyncDate: parseDate((proj as any).SyncStatus?.LastSyncDate),
                NationalProjectCode: (proj as any).SyncStatus?.NationalProjectCode,
                SyncError: (proj as any).SyncStatus?.SyncError,

                Coordinates: proj.Coordinates as any, // JSON type in Prisma

                // Connect Members (Employees)
                Members: {
                    create: proj.Members?.map((empId) => ({
                        Employee: { connect: { EmployeeID: empId } }
                    }))
                }
            },
        });
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

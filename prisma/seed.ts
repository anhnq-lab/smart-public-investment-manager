import { PrismaClient } from '@prisma/client';
import {
    mockProjects, mockEmployees, mockContractors, mockBiddingPackages,
    mockContracts, mockPayments, mockDocuments, mockCapitalPlans,
    mockDisbursements, mockTasks
} from '../mockData';

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
                Password: emp.Password || '123456',
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
        const parseDate = (d: string | undefined) => (d ? new Date(d) : null);

        // Handle Coordinates json safely
        const coords = proj.Coordinates as any;

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
                IsEmergency: proj.IsEmergency || false,
                ImageUrl: proj.ImageUrl,
                Progress: proj.Progress,
                PaymentProgress: proj.PaymentProgress,
                InvestorName: proj.InvestorName,
                MainContractorName: proj.MainContractorName,
                ConstructionType: proj.ConstructionType,
                ConstructionGrade: proj.ConstructionGrade,
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
                IsSynced: (proj as any).SyncStatus?.IsSynced,
                LastSyncDate: parseDate((proj as any).SyncStatus?.LastSyncDate),
                NationalProjectCode: (proj as any).SyncStatus?.NationalProjectCode,
                SyncError: (proj as any).SyncStatus?.SyncError,
                Coordinates: coords || undefined,
            },
        });
    }

    // 3. Seed Contractors
    console.log('Seeding contractors...');
    for (const contractor of mockContractors || []) {
        await prisma.contractor.upsert({
            where: { ContractorID: contractor.ContractorID },
            update: {},
            create: {
                ContractorID: contractor.ContractorID,
                FullName: contractor.FullName,
                CapCertCode: contractor.CapCertCode,
                IsForeign: contractor.IsForeign,
                OpLicenseNo: contractor.OpLicenseNo,
                Address: contractor.Address,
                ContactInfo: contractor.ContactInfo
            }
        });
    }

    // 4. Seed Bidding Packages
    console.log('Seeding packages...');
    for (const pkg of mockBiddingPackages || []) {
        // Ensure Project exists before connecting
        const projectExists = await prisma.project.findUnique({ where: { ProjectID: pkg.ProjectID } });
        if (!projectExists) continue;

        await prisma.biddingPackage.upsert({
            where: { PackageID: pkg.PackageID },
            update: {},
            create: {
                PackageID: pkg.PackageID,
                ProjectID: pkg.ProjectID,
                PackageNumber: pkg.PackageNumber,
                PackageName: pkg.PackageName,
                Price: pkg.Price,
                SelectionMethod: pkg.SelectionMethod,
                BidType: pkg.BidType,
                ContractType: pkg.ContractType,
                Status: pkg.Status,
                NotificationCode: pkg.NotificationCode,
                PostingDate: pkg.PostingDate ? new Date(pkg.PostingDate) : null,
                BidClosingDate: pkg.BidClosingDate ? new Date(pkg.BidClosingDate) : null,
            }
        });
    }

    // 5. Seed Contracts
    console.log('Seeding contracts...');
    for (const contract of mockContracts || []) {
        const pkgExists = await prisma.biddingPackage.findUnique({ where: { PackageID: contract.PackageID } });
        const contractorExists = await prisma.contractor.findUnique({ where: { ContractorID: contract.ContractorID } });

        if (!pkgExists || !contractorExists) continue;

        await prisma.contract.upsert({
            where: { ContractID: contract.ContractID },
            update: {},
            create: {
                ContractID: contract.ContractID,
                PackageID: contract.PackageID,
                ContractorID: contract.ContractorID,
                SignDate: contract.SignDate ? new Date(contract.SignDate) : null,
                Value: contract.Value,
                AdvanceRate: contract.AdvanceRate,
                Warranty: contract.Warranty,
                Status: contract.Status
            }
        });
    }

    // 6. Seed Payments
    console.log('Seeding payments...');
    for (const pay of mockPayments || []) {
        const contractExists = await prisma.contract.findUnique({ where: { ContractID: pay.ContractID } });
        if (!contractExists) continue;

        // PaymentID is autoincrement in DB but provided in mock. 
        // We can't force ID on autoincrement easily without raw query or just letting it auto-gen.
        // For simplicity, we just create. To avoid duplicates, we might check existance by other fields or just ignore if strict ID mapping isn't critical for mock data.
        // Or if we treat PaymentID as non-auto in schema? Schema says @default(autoincrement()).
        // We will create without specifying ID to let DB handle it.
        await prisma.payment.create({
            data: {
                ContractID: pay.ContractID,
                BatchNo: pay.BatchNo,
                Type: pay.Type,
                Amount: pay.Amount,
                TreasuryRef: pay.TreasuryRef,
                Status: pay.Status
            }
        });
    }

    // 7. Seed Documents
    console.log('Seeding documents...');
    for (const doc of mockDocuments || []) {
        await prisma.document.create({
            data: {
                DocName: doc.DocName,
                ProjectID: doc.ProjectID, // Optional relation
                Category: doc.Category,
                StoragePath: doc.StoragePath,
                IsDigitized: doc.IsDigitized,
                UploadDate: doc.UploadDate ? new Date(doc.UploadDate) : new Date(),
                Version: doc.Version,
                Size: doc.Size
            }
        });
    }

    // 8. Seed Capital Plans
    console.log('Seeding capital plans...');
    for (const plan of mockCapitalPlans || []) {
        const projectExists = await prisma.project.findUnique({ where: { ProjectID: plan.ProjectID } });
        if (!projectExists) continue;

        await prisma.capitalPlan.upsert({
            where: { PlanID: plan.PlanID },
            update: {},
            create: {
                PlanID: plan.PlanID,
                ProjectID: plan.ProjectID,
                Year: plan.Year,
                Amount: plan.Amount,
                DecisionNumber: plan.DecisionNumber,
                DateAssigned: plan.DateAssigned ? new Date(plan.DateAssigned) : null,
                Source: plan.Source,
                DisbursedAmount: plan.DisbursedAmount
            }
        });
    }

    // 9. Seed Disbursements
    console.log('Seeding disbursements...');
    for (const dis of mockDisbursements || []) {
        const projectExists = await prisma.project.findUnique({ where: { ProjectID: dis.ProjectID } });
        if (!projectExists) continue;

        await prisma.disbursement.upsert({
            where: { DisbursementID: dis.DisbursementID },
            update: {},
            create: {
                DisbursementID: dis.DisbursementID,
                ProjectID: dis.ProjectID,
                Amount: dis.Amount,
                Date: new Date(dis.Date),
                TreasuryCode: dis.TreasuryCode,
                FormType: dis.FormType,
                Status: dis.Status
            }
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

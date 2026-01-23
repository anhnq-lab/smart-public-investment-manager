import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            // List Projects with optional filtering
            const { status, group, search, sortBy, sortOrder } = req.query;

            const where: any = {};

            if (status) {
                where.Status = parseInt(String(status));
            }

            if (group) {
                where.GroupCode = String(group);
            }

            if (search) {
                where.OR = [
                    { ProjectName: { contains: String(search), mode: 'insensitive' as const } },
                    { ProjectID: { contains: String(search), mode: 'insensitive' as const } },
                    { ProjectNumber: { contains: String(search), mode: 'insensitive' as const } },
                ];
            }

            // Determine sort field and order
            const orderByField = sortBy ? String(sortBy) : 'ProjectName';
            const orderByDirection = sortOrder === 'desc' ? 'desc' : 'asc';

            const projects = await prisma.project.findMany({
                where,
                orderBy: { [orderByField]: orderByDirection } as any,
                include: {
                    BiddingPackages: {
                        select: {
                            PackageID: true,
                            PackageName: true,
                            Status: true,
                        }
                    },
                    CapitalPlans: true,
                    Members: {
                        include: {
                            Employee: {
                                select: {
                                    EmployeeID: true,
                                    FullName: true,
                                    Role: true,
                                }
                            }
                        }
                    },
                    Tasks: {
                        where: { Status: 'InProgress' },
                        select: {
                            TaskID: true,
                            Title: true,
                            DueDate: true,
                        }
                    }
                }
            });

            return res.status(200).json({ data: projects });
        }

        if (req.method === 'POST') {
            // Create Project
            const data = req.body;

            const newProject = await prisma.project.create({
                data: {
                    ProjectID: data.ProjectID,
                    ProjectName: data.ProjectName,
                    GroupCode: data.GroupCode || 'C',
                    InvestmentType: data.InvestmentType || 1,
                    DecisionMakerID: data.DecisionMakerID,
                    TotalInvestment: data.TotalInvestment || 0,
                    CapitalSource: data.CapitalSource || 'Ngân sách Tỉnh',
                    LocationCode: data.LocationCode || '',
                    ApprovalDate: data.ApprovalDate,
                    Status: data.Status || 1,
                    IsEmergency: data.IsEmergency || false,
                    ImageUrl: data.ImageUrl,
                    Progress: data.Progress ?? 0,
                    PaymentProgress: data.PaymentProgress ?? 0,
                    InvestorName: data.InvestorName,
                    MainContractorName: data.MainContractorName,
                    ConstructionType: data.ConstructionType,
                    ConstructionGrade: data.ConstructionGrade,
                    ProjectNumber: data.ProjectNumber,
                    Version: data.Version,
                    Objective: data.Objective,
                    CompetentAuthority: data.CompetentAuthority,
                    Duration: data.Duration,
                    ManagementForm: data.ManagementForm,
                    DecisionNumber: data.DecisionNumber,
                    DecisionDate: data.DecisionDate,
                    DecisionAuthority: data.DecisionAuthority,
                    IsODA: data.IsODA,
                    IsSynced: data.IsSynced,
                    LastSyncDate: data.LastSyncDate,
                    NationalProjectCode: data.NationalProjectCode,
                    SyncError: data.SyncError,
                    Coordinates: data.Coordinates,
                }
            });

            return res.status(201).json({ data: newProject });
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Projects API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
}

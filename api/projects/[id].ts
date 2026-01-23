import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { id } = req.query;
    const projectId = Array.isArray(id) ? id[0] : id;

    try {
        if (req.method === 'GET') {
            const project = await prisma.project.findUnique({
                where: { ProjectID: projectId },
                include: {
                    BiddingPackages: {
                        include: {
                            Contracts: {
                                include: {
                                    Contractor: true,
                                    Payments: true,
                                }
                            }
                        }
                    },
                    Members: {
                        include: {
                            Employee: {
                                select: {
                                    EmployeeID: true,
                                    FullName: true,
                                    Role: true,
                                    Department: true,
                                    Email: true,
                                    AvatarUrl: true,
                                }
                            }
                        }
                    },
                    CapitalPlans: true,
                    Documents: true,
                    Tasks: true,
                    Disbursements: true,
                }
            });

            if (!project) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Project not found' }
                });
            }

            return res.status(200).json({ data: project });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            const data = req.body;

            const updatedProject = await prisma.project.update({
                where: { ProjectID: projectId },
                data: {
                    ProjectName: data.ProjectName,
                    GroupCode: data.GroupCode,
                    InvestmentType: data.InvestmentType,
                    DecisionMakerID: data.DecisionMakerID,
                    TotalInvestment: data.TotalInvestment,
                    CapitalSource: data.CapitalSource,
                    LocationCode: data.LocationCode,
                    ApprovalDate: data.ApprovalDate,
                    Status: data.Status,
                    IsEmergency: data.IsEmergency,
                    ImageUrl: data.ImageUrl,
                    Progress: data.Progress,
                    PaymentProgress: data.PaymentProgress,
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
                    Coordinates: data.Coordinates,
                }
            });

            return res.status(200).json({ data: updatedProject });
        }

        if (req.method === 'DELETE') {
            await prisma.project.delete({
                where: { ProjectID: projectId }
            });

            return res.status(204).end();
        }

        return res.status(405).json({
            error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not implemented' }
        });
    } catch (error: any) {
        console.error('Project API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
}

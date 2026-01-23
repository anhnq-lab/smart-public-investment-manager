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
            // List Bidding Packages with optional filters
            const { projectId, status, search } = req.query;

            const where: any = {};

            if (projectId) {
                where.ProjectID = String(projectId);
            }

            if (status) {
                where.Status = String(status);
            }

            if (search) {
                where.OR = [
                    { PackageName: { contains: String(search), mode: 'insensitive' as const } },
                    { PackageNumber: { contains: String(search), mode: 'insensitive' as const } },
                ];
            }

            const packages = await prisma.biddingPackage.findMany({
                where,
                orderBy: { PackageNumber: 'asc' },
                include: {
                    Project: {
                        select: {
                            ProjectID: true,
                            ProjectName: true,
                        }
                    },
                    Contracts: {
                        include: {
                            Contractor: true
                        }
                    },
                    Issues: true
                }
            });

            return res.status(200).json({ data: packages });
        }

        if (req.method === 'POST') {
            // Create Bidding Package
            const data = req.body;

            const newPackage = await prisma.biddingPackage.create({
                data: {
                    PackageID: data.PackageID,
                    ProjectID: data.ProjectID,
                    PackageNumber: data.PackageNumber,
                    PackageName: data.PackageName,
                    Price: data.Price || 0,
                    SelectionMethod: data.SelectionMethod,
                    BidType: data.BidType,
                    ContractType: data.ContractType,
                    Status: data.Status || 'Chuẩn bị',
                    NotificationCode: data.NotificationCode,
                    PostingDate: data.PostingDate,
                    BidClosingDate: data.BidClosingDate,
                    EstimatePrice: data.EstimatePrice,
                    WinningContractorID: data.WinningContractorID,
                    WinningPrice: data.WinningPrice,
                    KHLCNTCode: data.KHLCNTCode,
                    Field: data.Field,
                    Duration: data.Duration,
                    BidFee: data.BidFee,
                    DecisionNumber: data.DecisionNumber,
                    DecisionDate: data.DecisionDate,
                    DecisionAgency: data.DecisionAgency,
                    DecisionFile: data.DecisionFile,
                }
            });

            return res.status(201).json({ data: newPackage });
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Bidding Packages API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
}

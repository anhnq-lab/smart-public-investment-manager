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
    const packageId = Array.isArray(id) ? id[0] : id;

    try {
        if (req.method === 'GET') {
            const biddingPackage = await prisma.biddingPackage.findUnique({
                where: { PackageID: packageId },
                include: {
                    Project: true,
                    Contracts: {
                        include: {
                            Contractor: true,
                            Payments: true,
                            VariationOrders: true
                        }
                    },
                    Issues: true
                }
            });

            if (!biddingPackage) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Bidding package not found' }
                });
            }

            return res.status(200).json({ data: biddingPackage });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            const data = req.body;

            const updatedPackage = await prisma.biddingPackage.update({
                where: { PackageID: packageId },
                data: {
                    PackageNumber: data.PackageNumber,
                    PackageName: data.PackageName,
                    Price: data.Price,
                    SelectionMethod: data.SelectionMethod,
                    BidType: data.BidType,
                    ContractType: data.ContractType,
                    Status: data.Status,
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

            return res.status(200).json({ data: updatedPackage });
        }

        if (req.method === 'DELETE') {
            await prisma.biddingPackage.delete({
                where: { PackageID: packageId }
            });

            return res.status(204).end();
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Bidding Package API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
}

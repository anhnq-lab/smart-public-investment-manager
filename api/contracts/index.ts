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
            // List Contracts with optional filters
            const { packageId, contractorId, status } = req.query;

            const where: any = {};

            if (packageId) {
                where.PackageID = String(packageId);
            }

            if (contractorId) {
                where.ContractorID = String(contractorId);
            }

            if (status) {
                where.Status = parseInt(String(status));
            }

            const contracts = await prisma.contract.findMany({
                where,
                orderBy: { SignDate: 'desc' },
                include: {
                    Package: {
                        include: {
                            Project: {
                                select: {
                                    ProjectID: true,
                                    ProjectName: true,
                                }
                            }
                        }
                    },
                    Contractor: true,
                    Payments: true,
                    VariationOrders: true
                }
            });

            return res.status(200).json({ data: contracts });
        }

        if (req.method === 'POST') {
            // Create Contract
            const data = req.body;

            const newContract = await prisma.contract.create({
                data: {
                    ContractID: data.ContractID,
                    PackageID: data.PackageID,
                    ContractorID: data.ContractorID,
                    SignDate: data.SignDate,
                    Value: data.Value || 0,
                    AdvanceRate: data.AdvanceRate || 0,
                    Warranty: data.Warranty,
                    Status: data.Status || 1,
                }
            });

            return res.status(201).json({ data: newContract });
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Contracts API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
}

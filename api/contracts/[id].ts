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
    const contractId = Array.isArray(id) ? id[0] : id;

    try {
        if (req.method === 'GET') {
            const contract = await prisma.contract.findUnique({
                where: { ContractID: contractId },
                include: {
                    Package: {
                        include: {
                            Project: true
                        }
                    },
                    Contractor: true,
                    Payments: true,
                    VariationOrders: true
                }
            });

            if (!contract) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Contract not found' }
                });
            }

            return res.status(200).json({ data: contract });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            const data = req.body;

            const updatedContract = await prisma.contract.update({
                where: { ContractID: contractId },
                data: {
                    SignDate: data.SignDate,
                    Value: data.Value,
                    AdvanceRate: data.AdvanceRate,
                    Warranty: data.Warranty,
                    Status: data.Status,
                }
            });

            return res.status(200).json({ data: updatedContract });
        }

        if (req.method === 'DELETE') {
            await prisma.contract.delete({
                where: { ContractID: contractId }
            });

            return res.status(204).end();
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Contract API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
}

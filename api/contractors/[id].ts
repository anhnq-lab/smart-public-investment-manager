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
    const contractorId = Array.isArray(id) ? id[0] : id;

    try {
        if (req.method === 'GET') {
            const contractor = await prisma.contractor.findUnique({
                where: { ContractorID: contractorId },
                include: {
                    Contracts: {
                        include: {
                            Package: {
                                include: {
                                    Project: true
                                }
                            }
                        }
                    }
                }
            });

            if (!contractor) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Contractor not found' }
                });
            }

            return res.status(200).json({ data: contractor });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            const data = req.body;

            const updatedContractor = await prisma.contractor.update({
                where: { ContractorID: contractorId },
                data: {
                    FullName: data.FullName,
                    CapCertCode: data.CapCertCode,
                    IsForeign: data.IsForeign,
                    OpLicenseNo: data.OpLicenseNo,
                    Address: data.Address,
                    ContactInfo: data.ContactInfo,
                }
            });

            return res.status(200).json({ data: updatedContractor });
        }

        if (req.method === 'DELETE') {
            await prisma.contractor.delete({
                where: { ContractorID: contractorId }
            });

            return res.status(204).end();
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Contractor API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
}

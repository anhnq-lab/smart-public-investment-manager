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
            // List Contractors with optional search
            const { search } = req.query;

            const where = search
                ? {
                    OR: [
                        { FullName: { contains: String(search), mode: 'insensitive' as const } },
                        { ContractorID: { contains: String(search), mode: 'insensitive' as const } },
                    ]
                }
                : {};

            const contractors = await prisma.contractor.findMany({
                where,
                orderBy: { FullName: 'asc' },
                include: {
                    Contracts: {
                        include: {
                            Package: true
                        }
                    }
                }
            });

            return res.status(200).json({ data: contractors });
        }

        if (req.method === 'POST') {
            // Create Contractor
            const data = req.body;

            const newContractor = await prisma.contractor.create({
                data: {
                    ContractorID: data.ContractorID,
                    FullName: data.FullName,
                    CapCertCode: data.CapCertCode,
                    IsForeign: data.IsForeign || false,
                    OpLicenseNo: data.OpLicenseNo,
                    Address: data.Address,
                    ContactInfo: data.ContactInfo,
                }
            });

            return res.status(201).json({ data: newContractor });
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Contractors API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
}

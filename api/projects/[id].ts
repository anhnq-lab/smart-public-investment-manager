import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

    const { id } = req.query; // file: api/projects/[id].ts -> returns id in query
    const projectId = Array.isArray(id) ? id[0] : id;

    if (req.method === 'GET') {
        try {
            const project = await prisma.project.findUnique({
                where: { ProjectID: projectId },
                include: {
                    BiddingPackages: true,
                    Contracts: true,
                    Members: { include: { Employee: true } },
                    CapitalPlans: true,
                    Documents: true
                }
            });

            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            return res.status(200).json(project);
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    }

    // Handle PUT/PATCH/DELETE...
    res.status(405).json({ error: 'Method Not Implemented in this demo' });
}

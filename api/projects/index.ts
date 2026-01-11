import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Check (optional here if handled by vercel.json or middleware, but good to add for direct access)
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
            // List Projects
            const projects = await prisma.project.findMany({
                orderBy: { ProjectName: 'asc' },
                include: {
                    CapitalPlans: true,
                    Tasks: { where: { Status: 'InProgress' } } // Include active tasks count maybe
                }
            });
            return res.status(200).json(projects);
        }

        if (req.method === 'POST') {
            // Create Project
            const data = req.body;
            // Basic Validation would go here
            const newProject = await prisma.project.create({
                data: {
                    ProjectID: data.ProjectID, // Should ideally be auto-generated or passed
                    ProjectName: data.ProjectName,
                    GroupCode: data.GroupCode || 'C',
                    InvestmentType: data.InvestmentType || 1,
                    ProjectStatus: 1, // Preparation
                    TotalInvestment: data.TotalInvestment || 0,
                    // ... map other fields
                } as any // using any for brevity in this initial pass, ideally strictly typed
            });
            return res.status(201).json(newProject);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

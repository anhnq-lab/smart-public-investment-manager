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
            // List Employees with optional filters
            const { role, department, search } = req.query;

            const where: any = {};

            if (role) {
                where.Role = String(role);
            }

            if (department) {
                where.Department = String(department);
            }

            if (search) {
                where.OR = [
                    { FullName: { contains: String(search), mode: 'insensitive' as const } },
                    { EmployeeID: { contains: String(search), mode: 'insensitive' as const } },
                    { Email: { contains: String(search), mode: 'insensitive' as const } },
                ];
            }

            const employees = await prisma.employee.findMany({
                where,
                orderBy: { FullName: 'asc' },
                select: {
                    EmployeeID: true,
                    FullName: true,
                    Username: true,
                    Role: true,
                    Department: true,
                    Position: true,
                    Email: true,
                    Phone: true,
                    AvatarUrl: true,
                    Status: true,
                    JoinDate: true,
                    // Exclude Password from response
                }
            });

            return res.status(200).json({ data: employees });
        }

        if (req.method === 'POST') {
            // Create Employee
            const data = req.body;

            // Note: In production, hash the password before storing
            const newEmployee = await prisma.employee.create({
                data: {
                    EmployeeID: data.EmployeeID,
                    FullName: data.FullName,
                    Username: data.Username,
                    Password: data.Password, // Should be hashed in production
                    Role: data.Role || 'User',
                    Department: data.Department,
                    Position: data.Position,
                    Email: data.Email,
                    Phone: data.Phone,
                    AvatarUrl: data.AvatarUrl,
                    Status: data.Status ?? 1,
                    JoinDate: data.JoinDate,
                },
                select: {
                    EmployeeID: true,
                    FullName: true,
                    Username: true,
                    Role: true,
                    Department: true,
                    Position: true,
                    Email: true,
                    Phone: true,
                    AvatarUrl: true,
                    Status: true,
                    JoinDate: true,
                }
            });

            return res.status(201).json({ data: newEmployee });
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Employees API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal Server Error',
                details: error.message
            }
        });
    }
}

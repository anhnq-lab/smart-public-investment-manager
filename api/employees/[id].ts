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
    const employeeId = Array.isArray(id) ? id[0] : id;

    try {
        if (req.method === 'GET') {
            const employee = await prisma.employee.findUnique({
                where: { EmployeeID: employeeId },
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
                    ProjectMembers: {
                        include: {
                            Project: {
                                select: {
                                    ProjectID: true,
                                    ProjectName: true,
                                    Status: true,
                                }
                            }
                        }
                    },
                    Tasks: {
                        include: {
                            Project: {
                                select: {
                                    ProjectID: true,
                                    ProjectName: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!employee) {
                return res.status(404).json({
                    error: { code: 'NOT_FOUND', message: 'Employee not found' }
                });
            }

            return res.status(200).json({ data: employee });
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            const data = req.body;

            const updateData: any = {
                FullName: data.FullName,
                Role: data.Role,
                Department: data.Department,
                Position: data.Position,
                Email: data.Email,
                Phone: data.Phone,
                AvatarUrl: data.AvatarUrl,
                Status: data.Status,
            };

            // Only update password if provided
            if (data.Password) {
                updateData.Password = data.Password; // Should be hashed in production
            }

            const updatedEmployee = await prisma.employee.update({
                where: { EmployeeID: employeeId },
                data: updateData,
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

            return res.status(200).json({ data: updatedEmployee });
        }

        if (req.method === 'DELETE') {
            await prisma.employee.delete({
                where: { EmployeeID: employeeId }
            });

            return res.status(204).end();
        }

        return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Employee API Error:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message
            }
        });
    }
}

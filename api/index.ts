import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        status: 'ok',
        message: 'Backend is running on Vercel Serverless Functions',
        timestamp: new Date().toISOString(),
    });
}

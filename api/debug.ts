import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        HAS_DATABASE_URL: !!process.env.DATABASE_URL,
        HAS_DIRECT_URL: !!process.env.DIRECT_URL,
        // Safe subset of keys to inspect
        KEYS: Object.keys(process.env).filter(key =>
            !key.includes('KEY') &&
            !key.includes('SECRET') &&
            !key.includes('PASSWORD') &&
            !key.includes('TOKEN')
        )
    };

    res.status(200).json({
        message: 'Debug Environment Variables',
        timestamp: new Date().toISOString(),
        environment: envVars
    });
}

import jwt from 'jsonwebtoken';
import { prisma } from '@econeura/db';
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        const errName = (error && typeof error === 'object' && 'name' in error && typeof error['name'] === 'string')
            ? String(error['name'])
            : undefined;
        if (errName === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(403).json({ message: 'Invalid token' });
    }
};
export const withTenant = async (req, res, next) => {
    try {
        const user = req.user;
        const orgId = user?.orgId;
        if (!orgId) {
            return res.status(400).json({ message: 'Missing orgId in token' });
        }
        const org = await prisma.organization?.findUnique({ where: { id: orgId } });
        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        await prisma.$executeRaw `SELECT set_config('app.org_id', ${orgId}, true)`;
        next();
    }
    catch (error) {
        console.error('Error in tenant middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
//# sourceMappingURL=auth.js.map
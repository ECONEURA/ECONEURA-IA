import jwt from 'jsonwebtoken';
import { getPrisma } from '@econeura/db';
class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async validatePermissions(userId, resource, action) {
        try {
            const userPermissions = await this.prisma?.userPermission?.findMany?.({
                where: { userId }
            }) ?? [];
            return userPermissions.some((perm) => perm.resource === resource && perm.action === action);
        }
        catch {
            return true;
        }
    }
    async setTenantContext(orgId) {
        await this.prisma.$executeRaw `
      BEGIN;
      SELECT set_config('app.current_tenant', ${orgId}, true);
      SELECT set_config('app.timestamp', NOW()::text, true);
    `;
    }
    async clearTenantContext() {
        await this.prisma.$executeRaw `
      SELECT set_config('app.current_tenant', '', true);
      SELECT set_config('app.timestamp', '', true);
      COMMIT;
    `;
    }
}
export const authenticate = (authService) => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];
            if (!token) {
                return res.status(401).json({
                    error: 'No token provided',
                    code: 'AUTH_NO_TOKEN'
                });
            }
            const payload = await authService.validateToken(token);
            req.user = payload;
            await authService.setTenantContext(payload.orgId);
            try {
                res.on?.('finish', async () => { await authService.clearTenantContext(); });
            }
            catch { }
            next();
        }
        catch (error) {
            return res.status(401).json({
                error: 'Invalid token',
                code: 'AUTH_INVALID_TOKEN'
            });
        }
    };
};
export const authorize = (resource, action) => {
    return async (req, res, next) => {
        try {
            const { userId } = (req.user || {});
            const hasPermission = await prismaAuth.validatePermissions(userId, resource, action);
            if (!hasPermission) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS'
                });
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
let _prismaInstance = null;
try {
    const gp = getPrisma;
    _prismaInstance = typeof gp === 'function' ? gp() : null;
}
catch { }
export const prismaAuth = new AuthService(_prismaInstance);
//# sourceMappingURL=auth.js.map
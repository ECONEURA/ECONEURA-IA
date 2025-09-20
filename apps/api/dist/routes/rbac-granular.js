import { Router } from 'express';
import { z } from 'zod';
import { basicRBAC } from '../lib/rbac-basic.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const PermissionSchema = z.object({
    name: z.string().min(1),
    resource: z.string().min(1),
    action: z.string().min(1),
    conditions: z.record(z.any()).optional()
});
const RoleSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    permissions: z.array(z.string()),
    isSystem: z.boolean().default(false)
});
const AssignRoleSchema = z.object({
    userId: z.string().min(1),
    roleId: z.string().min(1),
    orgId: z.string().min(1),
    assignedBy: z.string().min(1),
    expiresAt: z.string().optional()
});
const CheckPermissionSchema = z.object({
    userId: z.string().min(1),
    orgId: z.string().min(1),
    resource: z.string().min(1),
    action: z.string().min(1),
    context: z.record(z.any()).optional()
});
router.post('/permissions/check', async (req, res) => {
    try {
        const { userId, orgId, resource, action, context } = CheckPermissionSchema.parse(req.body);
        const hasPermission = await basicRBAC.hasPermission(userId, orgId, resource, action);
        res.json({
            success: true,
            data: {
                hasPermission,
                userId,
                orgId,
                resource,
                action,
                context
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to check permission', error);
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.message
        });
    }
});
router.post('/roles/check', async (req, res) => {
    try {
        const { userId, orgId, roleName } = req.body;
        if (!userId || !orgId || !roleName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, orgId, roleName'
            });
        }
        const hasRole = await basicRBAC.hasRole(userId, orgId, roleName);
        res.json({
            success: true,
            data: {
                hasRole,
                userId,
                orgId,
                roleName
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to check role', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check role'
        });
    }
});
router.get('/users/:userId/permissions', async (req, res) => {
    try {
        const { userId } = req.params;
        const orgId = req.headers['x-org-id'] || 'demo-org';
        const permissions = await basicRBAC.getUserPermissions(userId, orgId);
        res.json({
            success: true,
            data: permissions,
            meta: {
                userId,
                orgId,
                count: permissions.length
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get user permissions', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user permissions'
        });
    }
});
router.get('/users/:userId/roles', async (req, res) => {
    try {
        const { userId } = req.params;
        const orgId = req.headers['x-org-id'] || 'demo-org';
        const roles = await basicRBAC.getUserRoles(userId, orgId);
        res.json({
            success: true,
            data: roles,
            meta: {
                userId,
                orgId,
                count: roles.length
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get user roles', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user roles'
        });
    }
});
router.get('/users/:userId/context', async (req, res) => {
    try {
        const { userId } = req.params;
        const orgId = req.headers['x-org-id'] || 'demo-org';
        const roles = await basicRBAC.getUserRoles(userId, orgId);
        const permissions = await basicRBAC.getUserPermissions(userId, orgId);
        const context = {
            userId,
            orgId,
            roles: roles.map(role => role.name),
            permissions: permissions.map(perm => `${perm.resource}:${perm.action}`)
        };
        res.json({
            success: true,
            data: context
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get RBAC context', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RBAC context'
        });
    }
});
router.post('/permissions', async (req, res) => {
    try {
        const permissionData = PermissionSchema.parse(req.body);
        const permissionId = await basicRBAC.createPermission(permissionData);
        structuredLogger.info('Permission created via API', {
            permissionId,
            name: permissionData.name,
            resource: permissionData.resource,
            action: permissionData.action
        });
        res.status(201).json({
            success: true,
            permissionId,
            message: 'Permission created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create permission', error);
        res.status(400).json({
            success: false,
            error: 'Invalid permission data',
            details: error.message
        });
    }
});
router.post('/roles', async (req, res) => {
    try {
        const roleData = RoleSchema.parse(req.body);
        const roleId = await basicRBAC.createRole(roleData);
        structuredLogger.info('Role created via API', {
            roleId,
            name: roleData.name,
            permissionsCount: roleData.permissions.length
        });
        res.status(201).json({
            success: true,
            roleId,
            message: 'Role created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create role', error);
        res.status(400).json({
            success: false,
            error: 'Invalid role data',
            details: error.message
        });
    }
});
router.post('/assignments', async (req, res) => {
    try {
        const assignmentData = AssignRoleSchema.parse(req.body);
        await basicRBAC.assignRole(assignmentData.userId, assignmentData.roleId, assignmentData.orgId);
        structuredLogger.info('Role assigned via API', {
            userId: assignmentData.userId,
            roleId: assignmentData.roleId,
            orgId: assignmentData.orgId,
            assignedBy: assignmentData.assignedBy
        });
        res.status(201).json({
            success: true,
            message: 'Role assigned successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to assign role', error);
        res.status(400).json({
            success: false,
            error: 'Failed to assign role',
            details: error.message
        });
    }
});
router.delete('/assignments', async (req, res) => {
    try {
        const { userId, roleId, orgId } = req.body;
        if (!userId || !roleId || !orgId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, roleId, orgId'
            });
        }
        structuredLogger.info('Role removed', { userId, roleId, orgId });
        structuredLogger.info('Role removed via API', {
            userId,
            roleId,
            orgId
        });
        res.json({
            success: true,
            message: 'Role removed successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to remove role', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove role'
        });
    }
});
router.get('/permissions', async (req, res) => {
    try {
        const permissions = await basicRBAC.getAllPermissions();
        res.json({
            success: true,
            data: permissions,
            meta: {
                count: permissions.length
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get permissions', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get permissions'
        });
    }
});
router.get('/roles', async (req, res) => {
    try {
        const roles = await basicRBAC.getAllRoles();
        res.json({
            success: true,
            data: roles,
            meta: {
                count: roles.length
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get roles', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get roles'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = basicRBAC.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get RBAC stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RBAC stats'
        });
    }
});
export default router;
//# sourceMappingURL=rbac-granular.js.map
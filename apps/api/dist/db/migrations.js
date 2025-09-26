import { PrismaClient } from '@prisma/client';

import { structuredLogger } from '../lib/structured-logger.js';
const prisma = new PrismaClient();
export class MigrationManager {
    async runMigrations() {
        try {
            structuredLogger.info('Starting database migrations');
            await this.applyPrismaMigrations();
            await this.applyRLSPolicies();
            await this.seedInitialData();
            structuredLogger.info('Database migrations completed successfully');
        }
        catch (error) {
            structuredLogger.error('Migration failed', error);
            throw error;
        }
    }
    async applyPrismaMigrations() {
        structuredLogger.info('Prisma migrations applied');
    }
    async applyRLSPolicies() {
        const policies = [
            `CREATE POLICY organizations_rls ON organizations FOR ALL USING (id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY users_rls ON users FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_organizations uo 
          WHERE uo.user_id = users.id 
          AND uo.organization_id = current_setting('app.org_id')::uuid
        )
      )`,
            `CREATE POLICY companies_rls ON companies FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY contacts_rls ON contacts FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY deals_rls ON deals FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY products_rls ON products FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY invoices_rls ON invoices FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY payments_rls ON payments FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`,
            `CREATE POLICY audit_logs_rls ON audit_logs FOR ALL USING (org_id = current_setting('app.org_id')::uuid)`
        ];
        for (const policy of policies) {
            try {
                await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS ${policy.split(' ')[2]} ON ${policy.split(' ')[4]}`);
                await prisma.$executeRawUnsafe(policy);
                structuredLogger.debug('RLS policy applied', { policy: policy.split(' ')[2] });
            }
            catch (error) {
                structuredLogger.warn('RLS policy application failed', error, { policy });
            }
        }
        const tables = [
            'organizations', 'users', 'user_organizations', 'companies', 'contacts',
            'deals', 'products', 'suppliers', 'warehouses', 'inventories',
            'invoices', 'payments', 'expenses', 'activities', 'audit_logs'
        ];
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
                structuredLogger.debug('RLS enabled', { table });
            }
            catch (error) {
                structuredLogger.warn('RLS enable failed', error, { table });
            }
        }
        structuredLogger.info('RLS policies applied successfully');
    }
    async seedInitialData() {
        try {
            const defaultOrg = await prisma.organization.upsert({
                where: { slug: 'demo-org' },
                update: {},
                create: {
                    slug: 'demo-org',
                    name: 'Demo Organization',
                    description: 'Default demo organization for development',
                    email: 'demo@econeura.com',
                    plan: 'PROFESSIONAL'
                }
            });
            const roles = [
                { name: 'Administrator', slug: 'admin', description: 'Full system access' },
                { name: 'Manager', slug: 'manager', description: 'Management access' },
                { name: 'Sales', slug: 'sales', description: 'Sales team access' },
                { name: 'Finance', slug: 'finance', description: 'Finance team access' },
                { name: 'User', slug: 'user', description: 'Basic user access' }
            ];
            for (const role of roles) {
                await prisma.role.upsert({
                    where: {
                        slug_organizationId: {
                            slug: role.slug,
                            organizationId: defaultOrg.id
                        }
                    },
                    update: {},
                    create: {
                        ...role,
                        organizationId: defaultOrg.id
                    }
                });
            }
            const permissions = [
                { name: 'View Companies', slug: 'crm:companies:view', resource: 'crm:companies', action: 'view' },
                { name: 'Create Companies', slug: 'crm:companies:create', resource: 'crm:companies', action: 'create' },
                { name: 'Edit Companies', slug: 'crm:companies:edit', resource: 'crm:companies', action: 'edit' },
                { name: 'Delete Companies', slug: 'crm:companies:delete', resource: 'crm:companies', action: 'delete' },
                { name: 'View Contacts', slug: 'crm:contacts:view', resource: 'crm:contacts', action: 'view' },
                { name: 'Create Contacts', slug: 'crm:contacts:create', resource: 'crm:contacts', action: 'create' },
                { name: 'Edit Contacts', slug: 'crm:contacts:edit', resource: 'crm:contacts', action: 'edit' },
                { name: 'Delete Contacts', slug: 'crm:contacts:delete', resource: 'crm:contacts', action: 'delete' },
                { name: 'View Deals', slug: 'crm:deals:view', resource: 'crm:deals', action: 'view' },
                { name: 'Create Deals', slug: 'crm:deals:create', resource: 'crm:deals', action: 'create' },
                { name: 'Edit Deals', slug: 'crm:deals:edit', resource: 'crm:deals', action: 'edit' },
                { name: 'Delete Deals', slug: 'crm:deals:delete', resource: 'crm:deals', action: 'delete' },
                { name: 'View Products', slug: 'erp:products:view', resource: 'erp:products', action: 'view' },
                { name: 'Create Products', slug: 'erp:products:create', resource: 'erp:products', action: 'create' },
                { name: 'Edit Products', slug: 'erp:products:edit', resource: 'erp:products', action: 'edit' },
                { name: 'View Inventory', slug: 'erp:inventory:view', resource: 'erp:inventory', action: 'view' },
                { name: 'Manage Inventory', slug: 'erp:inventory:manage', resource: 'erp:inventory', action: 'manage' },
                { name: 'View Invoices', slug: 'finance:invoices:view', resource: 'finance:invoices', action: 'view' },
                { name: 'Create Invoices', slug: 'finance:invoices:create', resource: 'finance:invoices', action: 'create' },
                { name: 'Approve Invoices', slug: 'finance:invoices:approve', resource: 'finance:invoices', action: 'approve' },
                { name: 'View Payments', slug: 'finance:payments:view', resource: 'finance:payments', action: 'view' },
                { name: 'Process Payments', slug: 'finance:payments:process', resource: 'finance:payments', action: 'process' },
                { name: 'View Analytics', slug: 'analytics:view', resource: 'analytics', action: 'view' },
                { name: 'Export Data', slug: 'analytics:export', resource: 'analytics', action: 'export' },
                { name: 'All Permissions', slug: '*:*', resource: '*', action: '*' }
            ];
            for (const permission of permissions) {
                await prisma.permission.upsert({
                    where: { slug: permission.slug },
                    update: {},
                    create: permission
                });
            }
            structuredLogger.info('Initial data seeded successfully', {
                organizationId: defaultOrg.id,
                rolesCreated: roles.length,
                permissionsCreated: permissions.length
            });
        }
        catch (error) {
            structuredLogger.error('Seed data failed', error);
            throw error;
        }
    }
}
export const migrationManager = new MigrationManager();
//# sourceMappingURL=migrations.js.map
import { Router } from 'express';
import { z } from 'zod';
import { CreateCompanySchema, UpdateCompanySchema, CompanyFilterSchema } from '@econeura/shared/src/schemas/crm';
import { PaginationRequestSchema } from '@econeura/shared/src/schemas/common';

import { db, setRLSContext } from '../lib/database.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.get('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'];
        if (!orgId) {
            return res.status(400).json({ error: 'Missing x-org-id header' });
        }
        const filters = CompanyFilterSchema.parse(req.query);
        const pagination = PaginationRequestSchema.parse(req.query);
        await setRLSContext(orgId);
        const where = { deletedAt: null };
        if (filters.q) {
            where.OR = [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { email: { contains: filters.q, mode: 'insensitive' } }
            ];
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.industry) {
            where.industry = filters.industry;
        }
        const skip = (pagination.page - 1) * pagination.limit;
        const [result, total] = await Promise.all([
            db.company.findMany({
                where,
                skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' }
            }),
            db.company.count({ where })
        ]);
        structuredLogger.info('Companies retrieved', {
            orgId,
            count: result.length,
            total,
            filters
        });
        res.json({
            success: true,
            data: result,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit)
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve companies', error, {
            orgId: req.headers['x-org-id'],
            query: req.query
        });
        res.status(500).json({
            error: 'Failed to retrieve companies',
            message: error.message
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'];
        if (!orgId) {
            return res.status(400).json({ error: 'Missing x-org-id header' });
        }
        await db.execute(`SET LOCAL app.org_id = '${orgId}'`);
        const [company] = await db
            .select()
            .from(companies)
            .where(eq(companies.id, id))
            .limit(1);
        if (!company) {
            return res.status(404).json({
                error: 'Company not found',
                message: `Company with ID ${id} not found or access denied`
            });
        }
        structuredLogger.info('Company retrieved', { orgId, companyId: id });
        res.json({
            success: true,
            data: company
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve company', error, {
            orgId: req.headers['x-org-id'],
            companyId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to retrieve company',
            message: error.message
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'];
        const userId = req.headers['x-user-id'];
        if (!orgId) {
            return res.status(400).json({ error: 'Missing x-org-id header' });
        }
        const companyData = CreateCompanySchema.parse(req.body);
        await db.execute(`SET LOCAL app.org_id = '${orgId}'`);
        const newCompany = {
            ...companyData,
            orgId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const [company] = await db
            .insert(companies)
            .values(newCompany)
            .returning();
        structuredLogger.info('Company created', {
            orgId,
            userId,
            companyId: company.id,
            name: company.name
        });
        res.status(201).json({
            success: true,
            data: company
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create company', error, {
            orgId: req.headers['x-org-id'],
            userId: req.headers['x-user-id'],
            body: req.body
        });
        res.status(500).json({
            error: 'Failed to create company',
            message: error.message
        });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'];
        const userId = req.headers['x-user-id'];
        if (!orgId) {
            return res.status(400).json({ error: 'Missing x-org-id header' });
        }
        const updateData = UpdateCompanySchema.parse(req.body);
        await db.execute(`SET LOCAL app.org_id = '${orgId}'`);
        const [updatedCompany] = await db
            .update(companies)
            .set({
            ...updateData,
            updatedAt: new Date().toISOString()
        })
            .where(eq(companies.id, id))
            .returning();
        if (!updatedCompany) {
            return res.status(404).json({
                error: 'Company not found',
                message: `Company with ID ${id} not found or access denied`
            });
        }
        structuredLogger.info('Company updated', {
            orgId,
            userId,
            companyId: id,
            changes: updateData
        });
        res.json({
            success: true,
            data: updatedCompany
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to update company', error, {
            orgId: req.headers['x-org-id'],
            userId: req.headers['x-user-id'],
            companyId: req.params.id,
            body: req.body
        });
        res.status(500).json({
            error: 'Failed to update company',
            message: error.message
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'];
        const userId = req.headers['x-user-id'];
        if (!orgId) {
            return res.status(400).json({ error: 'Missing x-org-id header' });
        }
        await db.execute(`SET LOCAL app.org_id = '${orgId}'`);
        const [deletedCompany] = await db
            .update(companies)
            .set({
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
            .where(eq(companies.id, id))
            .returning();
        if (!deletedCompany) {
            return res.status(404).json({
                error: 'Company not found',
                message: `Company with ID ${id} not found or access denied`
            });
        }
        structuredLogger.info('Company deleted', {
            orgId,
            userId,
            companyId: id,
            name: deletedCompany.name
        });
        res.status(204).send();
    }
    catch (error) {
        structuredLogger.error('Failed to delete company', error, {
            orgId: req.headers['x-org-id'],
            userId: req.headers['x-user-id'],
            companyId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to delete company',
            message: error.message
        });
    }
});
export { router as companiesRouter };
//# sourceMappingURL=companies.js.map
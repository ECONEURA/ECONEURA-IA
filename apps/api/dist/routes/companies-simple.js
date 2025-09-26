import { Router } from 'express';

import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const companiesStore = new Map();
companiesStore.set('comp-1', {
    id: 'comp-1',
    orgId: 'org-demo',
    name: 'Acme Corporation',
    industry: 'Technology',
    website: 'https://acme.com',
    email: 'contact@acme.com',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
companiesStore.set('comp-2', {
    id: 'comp-2',
    orgId: 'org-demo',
    name: 'Global Industries',
    industry: 'Manufacturing',
    website: 'https://global-ind.com',
    email: 'info@global-ind.com',
    status: 'prospect',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
router.get('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const companies = Array.from(companiesStore.values())
            .filter(company => company.orgId === orgId && !company.deletedAt);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const paginatedResults = companies.slice(skip, skip + limit);
        const total = companies.length;
        structuredLogger.info('Companies retrieved', {
            orgId,
            count: paginatedResults.length,
            total
        });
        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
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
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const company = companiesStore.get(id);
        if (!company || company.orgId !== orgId || company.deletedAt) {
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
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const userId = req.headers['x-user-id'] || 'user-demo';
        const companyData = req.body;
        const companyId = `comp-${Date.now()}`;
        const newCompany = {
            id: companyId,
            orgId,
            ...companyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        companiesStore.set(companyId, newCompany);
        structuredLogger.info('Company created', {
            orgId,
            userId,
            companyId,
            name: newCompany.name
        });
        res.status(201).json({
            success: true,
            data: newCompany
        });
    }
    catch (error) {
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
export { router as companiesRouter };
//# sourceMappingURL=companies-simple.js.map
import { Router } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const contactsStore = new Map();
contactsStore.set('cont-1', {
    id: 'cont-1',
    orgId: 'org-demo',
    companyId: 'comp-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+1-555-0123',
    position: 'CEO',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
contactsStore.set('cont-2', {
    id: 'cont-2',
    orgId: 'org-demo',
    companyId: 'comp-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@global-ind.com',
    phone: '+1-555-0124',
    position: 'CTO',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});
router.get('/', async (req, res) => {
    try {
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const contacts = Array.from(contactsStore.values())
            .filter(contact => contact.orgId === orgId && !contact.deletedAt);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const paginatedResults = contacts.slice(skip, skip + limit);
        const total = contacts.length;
        structuredLogger.info('Contacts retrieved', {
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
        structuredLogger.error('Failed to retrieve contacts', error, {
            orgId: req.headers['x-org-id']
        });
        res.status(500).json({
            error: 'Failed to retrieve contacts',
            message: error.message
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = req.headers['x-org-id'] || 'org-demo';
        const contact = contactsStore.get(id);
        if (!contact || contact.orgId !== orgId || contact.deletedAt) {
            return res.status(404).json({
                error: 'Contact not found',
                message: `Contact with ID ${id} not found or access denied`
            });
        }
        structuredLogger.info('Contact retrieved', { orgId, contactId: id });
        res.json({
            success: true,
            data: contact
        });
    }
    catch (error) {
        structuredLogger.error('Failed to retrieve contact', error, {
            orgId: req.headers['x-org-id'],
            contactId: req.params.id
        });
        res.status(500).json({
            error: 'Failed to retrieve contact',
            message: error.message
        });
    }
});
export { router as contactsRouter };
//# sourceMappingURL=contacts-simple.js.map
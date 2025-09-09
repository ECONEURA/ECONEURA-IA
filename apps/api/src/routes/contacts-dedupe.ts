/**
 * PR-52: Contacts Dedupe Routes
 *
 * Rutas para el sistema de deduplicación de contactos
 */

import { Router } from 'express';
import { z } from 'zod';
import { contactsDedupeService } from '../lib/contacts-dedupe.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const contactSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  phoneE164: z.string().optional(),
  company: z.string().optional(),
  organizationId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

const dedupeConfigSchema = z.object({
  enabled: z.boolean().optional(),
  autoMerge: z.boolean().optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  fuzzyMatching: z.boolean().optional(),
  machineLearning: z.boolean().optional(),
  batchSize: z.number().min(1).optional(),
  maxProcessingTime: z.number().min(1000).optional(),
  notificationChannels: z.array(z.string()).optional()
});

const mergeOperationSchema = z.object({
  mergeId: z.string().min(1),
  approvedBy: z.string().min(1)
});

// GET /api/contacts-dedupe/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = contactsDedupeService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    structuredLogger.error('Failed to get dedupe stats', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// POST /api/contacts-dedupe/process
router.post('/process', async (req, res) => {
  try {
    const stats = await contactsDedupeService.processDeduplication();
    res.json({ success: true, data: stats });
  } catch (error) {
    structuredLogger.error('Failed to process deduplication', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to process deduplication' });
  }
});

// GET /api/contacts-dedupe/contacts
router.get('/contacts', async (req, res) => {
  try {
    const contacts = await contactsDedupeService.getAllContacts();
    res.json({ success: true, data: contacts });
  } catch (error) {
    structuredLogger.error('Failed to get contacts', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get contacts' });
  }
});

// POST /api/contacts-dedupe/contacts
router.post('/contacts', async (req, res) => {
  try {
    const contact = contactSchema.parse(req.body);
    await contactsDedupeService.addContact(contact);
    res.json({ success: true, message: 'Contact added successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid contact data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to add contact', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to add contact' });
  }
});

// GET /api/contacts-dedupe/contacts/:id
router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await contactsDedupeService.getContact(id);

    if (!contact) {
      res.status(404).json({ success: false, error: 'Contact not found' });
      return;
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    structuredLogger.error('Failed to get contact', {
      error: (error as Error).message,
      contactId: req.params.id,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get contact' });
  }
});

// DELETE /api/contacts-dedupe/contacts/:id
router.delete('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await contactsDedupeService.removeContact(id);
    res.json({ success: true, message: 'Contact removed successfully' });
  } catch (error) {
    structuredLogger.error('Failed to remove contact', {
      error: (error as Error).message,
      contactId: req.params.id,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to remove contact' });
  }
});

// GET /api/contacts-dedupe/duplicates/:contactId
router.get('/duplicates/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const duplicates = await contactsDedupeService.getDuplicatesForContact(contactId);
    res.json({ success: true, data: duplicates });
  } catch (error) {
    structuredLogger.error('Failed to get duplicates for contact', {
      error: (error as Error).message,
      contactId: req.params.contactId,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get duplicates' });
  }
});

// GET /api/contacts-dedupe/merges
router.get('/merges', async (req, res) => {
  try {
    const merges = await contactsDedupeService.getAllMergeOperations();
    res.json({ success: true, data: merges });
  } catch (error) {
    structuredLogger.error('Failed to get merge operations', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get merge operations' });
  }
});

// GET /api/contacts-dedupe/merges/pending
router.get('/merges/pending', async (req, res) => {
  try {
    const pendingMerges = contactsDedupeService.getPendingMerges();
    res.json({ success: true, data: pendingMerges });
  } catch (error) {
    structuredLogger.error('Failed to get pending merges', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get pending merges' });
  }
});

// POST /api/contacts-dedupe/merges/:mergeId/approve
router.post('/merges/:mergeId/approve', async (req, res) => {
  try {
    const { mergeId } = req.params;
    const { approvedBy } = mergeOperationSchema.parse({ mergeId, ...req.body });

    await contactsDedupeService.approveMerge(mergeId, approvedBy);
    res.json({ success: true, message: 'Merge operation approved' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid request data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to approve merge', {
      error: (error as Error).message,
      mergeId: req.params.mergeId,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to approve merge' });
  }
});

// POST /api/contacts-dedupe/merges/:mergeId/execute
router.post('/merges/:mergeId/execute', async (req, res) => {
  try {
    const { mergeId } = req.params;
    const { approvedBy } = mergeOperationSchema.parse({ mergeId, ...req.body });

    await contactsDedupeService.executeMerge(mergeId, approvedBy);
    res.json({ success: true, message: 'Merge operation executed' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid request data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to execute merge', {
      error: (error as Error).message,
      mergeId: req.params.mergeId,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to execute merge' });
  }
});

// POST /api/contacts-dedupe/merges/:mergeId/revert
router.post('/merges/:mergeId/revert', async (req, res) => {
  try {
    const { mergeId } = req.params;
    const { approvedBy } = mergeOperationSchema.parse({ mergeId, ...req.body });

    await contactsDedupeService.revertMerge(mergeId, approvedBy);
    res.json({ success: true, message: 'Merge operation reverted' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid request data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to revert merge', {
      error: (error as Error).message,
      mergeId: req.params.mergeId,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to revert merge' });
  }
});

// PUT /api/contacts-dedupe/config
router.put('/config', async (req, res) => {
  try {
    const config = dedupeConfigSchema.parse(req.body);
    contactsDedupeService.updateConfig(config);
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid configuration data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to update configuration', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// GET /api/contacts-dedupe/health
router.get('/health', async (req, res) => {
  try {
    const health = await contactsDedupeService.getHealthStatus();
    res.json({ success: true, data: health });
  } catch (error) {
    structuredLogger.error('Failed to get health status', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to get health status' });
  }
});

// POST /api/contacts-dedupe/import
router.post('/import', async (req, res) => {
  try {
    const contacts = z.array(contactSchema).parse(req.body);
    await contactsDedupeService.importContacts(contacts);
    res.json({ success: true, message: `${contacts.length} contacts imported successfully` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid contacts data', details: error.errors });
      return;
    }

    structuredLogger.error('Failed to import contacts', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to import contacts' });
  }
});

// GET /api/contacts-dedupe/export
router.get('/export', async (req, res) => {
  try {
    const duplicates = await contactsDedupeService.exportDuplicates();
    res.json({ success: true, data: duplicates });
  } catch (error) {
    structuredLogger.error('Failed to export duplicates', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to export duplicates' });
  }
});

// DELETE /api/contacts-dedupe/clear
router.delete('/clear', async (req, res) => {
  try {
    await contactsDedupeService.clearAllData();
    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    structuredLogger.error('Failed to clear data', {
      error: (error as Error).message,
      requestId: req.headers['x-request-id'] as string || ''
    });
    res.status(500).json({ success: false, error: 'Failed to clear data' });
  }
});

export { router as contactsDedupeRoutes };

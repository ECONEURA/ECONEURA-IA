import { Router } from 'express';
import { z } from 'zod';
import { contactsDedupeService } from '../lib/contacts-dedupe.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const contactsDedupeRouter = Router();

// Validation schemas
const GetContactsSchema = z.object({
  organizationId: z.string().min(1),
  search: z.string().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  leadSource: z.string().optional(),
  hasDuplicates: z.coerce.boolean().optional(),
  dataQualityMin: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const CreateContactSchema = z.object({
  organizationId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  socialMedia: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
  preferences: z.object({
    preferredContactMethod: z.enum(['email', 'phone', 'mobile', 'linkedin']).optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    marketingOptIn: z.boolean().optional(),
    communicationFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  }).optional(),
  businessInfo: z.object({
    industry: z.string().optional(),
    companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
    annualRevenue: z.coerce.number().nonnegative().optional(),
    employeeCount: z.coerce.number().int().nonnegative().optional(),
    leadSource: z.string().optional(),
    leadScore: z.coerce.number().int().min(0).max(100).optional(),
  }).optional(),
  relationships: z.object({
    accountId: z.string().optional(),
    opportunityId: z.string().optional(),
    dealId: z.string().optional(),
    campaignId: z.string().optional(),
    referralSource: z.string().optional(),
    lastInteractionDate: z.string().datetime().optional(),
    interactionCount: z.coerce.number().int().nonnegative().optional(),
  }).optional(),
  dataQuality: z.object({
    completeness: z.coerce.number().int().min(0).max(100).optional(),
    accuracy: z.coerce.number().int().min(0).max(100).optional(),
    lastVerified: z.string().datetime().optional(),
    verificationSource: z.string().optional(),
    confidence: z.coerce.number().int().min(0).max(100).optional(),
  }).optional(),
  metadata: z.object({
    source: z.string().min(1),
    importedAt: z.string().datetime().optional(),
    lastUpdated: z.string().datetime().optional(),
    customFields: z.record(z.any()).optional(),
  }),
});

const CheckDuplicatesSchema = z.object({
  contactId: z.string().min(1),
});

const RunDedupeScanSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum(['full_scan', 'incremental', 'manual']).optional(),
  rules: z.array(z.string()).optional(),
  dryRun: z.boolean().optional(),
  createdBy: z.string().min(1),
});

const GetDedupeJobsSchema = z.object({
  organizationId: z.string().min(1),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  type: z.enum(['full_scan', 'incremental', 'manual', 'scheduled']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
});

const GetStatsSchema = z.object({
  organizationId: z.string().min(1),
});

// Routes

// Contact Management
contactsDedupeRouter.get('/contacts', async (req, res) => {
  try {
    const filters = GetContactsSchema.parse(req.query);
    const contacts = await contactsDedupeService.getContacts(filters.organizationId, filters);
    
    res.json({
      success: true,
      data: {
        contacts,
        total: contacts.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting contacts', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

contactsDedupeRouter.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const contact = await contactsDedupeService.getContact(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      data: contact,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting contact', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

contactsDedupeRouter.post('/contacts', async (req, res) => {
  try {
    const contactData = CreateContactSchema.parse(req.body);
    const contact = await contactsDedupeService.createContact(contactData);
    
    res.status(201).json({
      success: true,
      data: contact,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error creating contact', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Duplicate Detection
contactsDedupeRouter.post('/contacts/:id/check-duplicates', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const duplicates = await contactsDedupeService.checkForDuplicates(id);
    
    res.json({
      success: true,
      data: {
        contactId: id,
        duplicates,
        total: duplicates.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking duplicates', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Dedupe Jobs
contactsDedupeRouter.post('/dedupe/scan', async (req, res) => {
  try {
    const scanData = RunDedupeScanSchema.parse(req.body);
    const job = await contactsDedupeService.runDedupeScan(scanData.organizationId, scanData);
    
    res.status(201).json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error running dedupe scan', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

contactsDedupeRouter.get('/dedupe/jobs', async (req, res) => {
  try {
    const filters = GetDedupeJobsSchema.parse(req.query);
    const jobs = Array.from(contactsDedupeService['dedupeJobs'].values())
      .filter(j => j.organizationId === filters.organizationId);
    
    let filteredJobs = jobs;
    
    if (filters.status) {
      filteredJobs = filteredJobs.filter(j => j.status === filters.status);
    }
    
    if (filters.type) {
      filteredJobs = filteredJobs.filter(j => j.type === filters.type);
    }
    
    if (filters.limit) {
      filteredJobs = filteredJobs.slice(0, filters.limit);
    }
    
    res.json({
      success: true,
      data: {
        jobs: filteredJobs,
        total: filteredJobs.length,
        filters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting dedupe jobs', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

contactsDedupeRouter.get('/dedupe/jobs/:id', async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const job = contactsDedupeService['dedupeJobs'].get(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Dedupe job not found'
      });
    }
    
    res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting dedupe job', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Statistics
contactsDedupeRouter.get('/stats', async (req, res) => {
  try {
    const { organizationId } = GetStatsSchema.parse(req.query);
    const stats = await contactsDedupeService.getDedupeStats(organizationId);
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error getting dedupe stats', { error });
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: error.errors
    });
  }
});

// Health Check
contactsDedupeRouter.get('/health', async (req, res) => {
  try {
    const stats = await contactsDedupeService.getDedupeStats('demo-org-1');
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        totalContacts: stats.totalContacts,
        contactsWithDuplicates: stats.contactsWithDuplicates,
        totalDuplicates: stats.totalDuplicates,
        autoMerged: stats.autoMerged,
        manualReview: stats.manualReview,
        averageDataQuality: stats.averageDataQuality,
        activeRules: stats.activeRules,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    structuredLogger.error('Error checking contacts dedupe health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

export { contactsDedupeRouter };

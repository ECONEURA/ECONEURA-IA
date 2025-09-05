import { Router } from 'express';
import { z } from 'zod';
import { advancedSecurity } from '../lib/advanced-security-simple.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// Validation schemas
const ThreatDetectionSchema = z.object({
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  endpoint: z.string(),
  method: z.string(),
  userId: z.string().optional(),
  orgId: z.string().min(1),
  body: z.any().optional()
});

const SecurityEventSchema = z.object({
  type: z.enum(['threat', 'anomaly', 'compliance', 'audit']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string().min(1),
  description: z.string().min(1),
  metadata: z.record(z.any()).default({}),
  userId: z.string().optional(),
  orgId: z.string().min(1),
  ipAddress: z.string().ip().optional()
});

// Detect threats
router.post('/threats/detect', async (req, res) => {
  try {
    const requestData = ThreatDetectionSchema.parse(req.body);
    const threat = await advancedSecurity.detectThreat(requestData);
    
    if (threat) {
      structuredLogger.warn('Threat detected via API', {
        threatId: threat.id,
        threatType: threat.threatType,
        confidence: threat.confidence,
        blocked: threat.blocked
      });
      
      res.status(200).json({
        success: true,
        threat,
        message: 'Threat detected and handled'
      });
    } else {
      res.status(200).json({
        success: true,
        threat: null,
        message: 'No threats detected'
      });
    }
  } catch (error) {
    structuredLogger.error('Failed to detect threats', error as Error);
    res.status(400).json({
      success: false,
      error: 'Invalid request data',
      details: (error as Error).message
    });
  }
});

// Log security event
router.post('/events', async (req, res) => {
  try {
    const eventData = SecurityEventSchema.parse(req.body);
    const eventId = await advancedSecurity.logSecurityEvent(eventData);
    
    structuredLogger.info('Security event logged via API', {
      eventId,
      type: eventData.type,
      severity: eventData.severity,
      orgId: eventData.orgId
    });
    
    res.status(201).json({
      success: true,
      eventId,
      message: 'Security event logged successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to log security event', error as Error);
    res.status(400).json({
      success: false,
      error: 'Invalid event data',
      details: (error as Error).message
    });
  }
});

// Get security metrics
router.get('/metrics', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const metrics = await advancedSecurity.getSecurityMetrics(orgId);
    
    res.json({
      success: true,
      data: metrics,
      meta: {
        orgId,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get security metrics', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate security metrics'
    });
  }
});

// Get security events
router.get('/events', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] as string || 'demo-org';
    const events = await advancedSecurity.getSecurityEvents(orgId);
    
    res.json({
      success: true,
      data: events,
      meta: {
        orgId,
        count: events.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get security events', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security events'
    });
  }
});

// Check if IP is blocked
router.get('/ip/:ipAddress/status', async (req, res) => {
  try {
    const { ipAddress } = req.params;
    const isBlocked = advancedSecurity.isIPBlocked(ipAddress);
    
    res.json({
      success: true,
      data: {
        ipAddress,
        isBlocked,
        status: isBlocked ? 'blocked' : 'allowed'
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to check IP status', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to check IP status'
    });
  }
});

// Get security stats
router.get('/stats', async (req, res) => {
  try {
    const stats = advancedSecurity.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get security stats', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

// Security health check
router.get('/health', async (req, res) => {
  try {
    const stats = advancedSecurity.getStats();
    const isHealthy = stats.totalThreats < 100 && stats.blockedIPs < 50;
    
    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        threats: stats.totalThreats,
        blockedIPs: stats.blockedIPs,
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (error) {
    structuredLogger.error('Failed to get security health', error as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security health'
    });
  }
});

export default router;

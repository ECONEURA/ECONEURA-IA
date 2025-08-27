import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '@econeura/shared/logging';

export function verifyHmac(secret: string, skewSec: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timestamp = req.header('X-Timestamp');
    const signature = req.header('X-Signature');
    
    if (!timestamp || !signature) {
      logger.logSecurityEvent('Missing HMAC headers', {
        event_type: 'invalid_signature',
        ip_address: req.ip,
        x_request_id: res.locals.corr_id,
      });
      
      res.status(401).json({ 
        error: 'missing_hmac_headers',
        type: 'https://econeura.dev/errors/missing_hmac_headers',
        title: 'Missing HMAC Headers',
        status: 401,
        detail: 'X-Timestamp and X-Signature headers are required',
        instance: `corr:${res.locals.corr_id || 'n/a'}`,
      });
      return;
    }

    // Check timestamp skew
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    const age = Math.abs(now - requestTime);
    
    if (age > skewSec) {
      logger.logSecurityEvent('Timestamp skew exceeded', {
        event_type: 'invalid_signature',
        ip_address: req.ip,
        x_request_id: res.locals.corr_id,
        details: { age_seconds: age, max_skew: skewSec },
      });
      
      res.status(401).json({ 
        error: 'timestamp_skew',
        type: 'https://econeura.dev/errors/timestamp_skew',
        title: 'Timestamp Skew',
        status: 401,
        detail: `Request timestamp is ${age}s old, maximum allowed is ${skewSec}s`,
        instance: `corr:${res.locals.corr_id || 'n/a'}`,
      });
      return;
    }

    // Get raw body (should be set by raw-body middleware before this)
    const rawBody = (req as any).rawBody || '';
    
    // Calculate expected signature
    const payload = `${timestamp}.${rawBody}`;
    const expectedMac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expectedSignature = `sha256=${expectedMac}`;
    
    // Verify signature with timing-safe comparison
    const providedSignature = signature.startsWith('sha256=') ? signature : `sha256=${signature}`;
    
    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(providedSignature, 'utf8')
      );
      
      if (!isValid) {
        logger.logSecurityEvent('Invalid HMAC signature', {
          event_type: 'invalid_signature',
          ip_address: req.ip,
          x_request_id: res.locals.corr_id,
        });
        
        res.status(401).json({ 
          error: 'bad_signature',
          type: 'https://econeura.dev/errors/bad_signature',
          title: 'Invalid Signature',
          status: 401,
          detail: 'HMAC signature verification failed',
          instance: `corr:${res.locals.corr_id || 'n/a'}`,
        });
        return;
      }
      
      // Store verification result
      res.locals.hmac_verified = true;
      res.locals.webhook_timestamp = requestTime;
      
      next();
      
    } catch (error) {
      logger.error('HMAC verification error', error as Error, {
        x_request_id: res.locals.corr_id,
      });
      
      res.status(500).json({ 
        error: 'hmac_verification_error',
        type: 'https://econeura.dev/errors/internal_error',
        title: 'Internal Server Error',
        status: 500,
        detail: 'Failed to verify HMAC signature',
        instance: `corr:${res.locals.corr_id || 'n/a'}`,
      });
    }
  };
}
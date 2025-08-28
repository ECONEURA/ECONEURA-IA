import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '@econeura/shared/logging';

export function verifyHmac(providerOrSecret: string, skewSec: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const provider = ['stripe', 'github', 'slack'].includes(providerOrSecret) ? providerOrSecret : 'generic';
    const secret = provider === 'generic' ? providerOrSecret : getSecret(provider);
    
    // Provider-specific verification
    if (provider === 'stripe') {
      return verifyStripeSignature(req, res, next, secret);
    } else if (provider === 'github') {
      return verifyGithubSignature(req, res, next, secret);
    } else if (provider === 'slack') {
      return verifySlackSignature(req, res, next, secret);
    }
    
    // Generic HMAC verification (existing logic)
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

function getSecret(provider: string): string {
  const secrets = {
    stripe: process.env.STRIPE_WEBHOOK_SECRET || 'dev-secret',
    github: process.env.GITHUB_WEBHOOK_SECRET || 'dev-secret',
    slack: process.env.SLACK_SIGNING_SECRET || 'dev-secret',
  };
  return secrets[provider as keyof typeof secrets] || 'dev-secret';
}

function verifyStripeSignature(req: Request, res: Response, next: NextFunction, secret: string): void {
  const signature = req.header('stripe-signature');
  const rawBody = (req as any).rawBody || '';
  
  if (!signature) {
    return respondUnauthorized(res, 'missing_stripe_signature', 'Missing Stripe signature');
  }
  
  try {
    // Stripe webhook signature format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const sig = elements.find(e => e.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !sig) {
      return respondUnauthorized(res, 'invalid_stripe_signature', 'Invalid Stripe signature format');
    }
    
    const expectedSig = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return respondUnauthorized(res, 'stripe_signature_mismatch', 'Stripe signature verification failed');
    }
    
    res.locals.hmac_verified = true;
    res.locals.webhook_timestamp = parseInt(timestamp);
    next();
    
  } catch (error) {
    logger.error('Stripe signature verification error', error as Error);
    return respondUnauthorized(res, 'stripe_verification_error', 'Failed to verify Stripe signature');
  }
}

function verifyGithubSignature(req: Request, res: Response, next: NextFunction, secret: string): void {
  const signature = req.header('x-hub-signature-256');
  const rawBody = (req as any).rawBody || '';
  
  if (!signature) {
    return respondUnauthorized(res, 'missing_github_signature', 'Missing GitHub signature');
  }
  
  try {
    const expectedSig = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return respondUnauthorized(res, 'github_signature_mismatch', 'GitHub signature verification failed');
    }
    
    res.locals.hmac_verified = true;
    res.locals.webhook_timestamp = Math.floor(Date.now() / 1000);
    next();
    
  } catch (error) {
    logger.error('GitHub signature verification error', error as Error);
    return respondUnauthorized(res, 'github_verification_error', 'Failed to verify GitHub signature');
  }
}

function verifySlackSignature(req: Request, res: Response, next: NextFunction, secret: string): void {
  const signature = req.header('x-slack-signature');
  const timestamp = req.header('x-slack-request-timestamp');
  const rawBody = (req as any).rawBody || '';
  
  if (!signature || !timestamp) {
    return respondUnauthorized(res, 'missing_slack_signature', 'Missing Slack signature or timestamp');
  }
  
  try {
    // Check timestamp skew (Slack recommends 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (Math.abs(now - requestTime) > 300) {
      return respondUnauthorized(res, 'slack_timestamp_skew', 'Slack timestamp too old');
    }
    
    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const expectedSig = `v0=${crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex')}`;
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return respondUnauthorized(res, 'slack_signature_mismatch', 'Slack signature verification failed');
    }
    
    res.locals.hmac_verified = true;
    res.locals.webhook_timestamp = requestTime;
    next();
    
  } catch (error) {
    logger.error('Slack signature verification error', error as Error);
    return respondUnauthorized(res, 'slack_verification_error', 'Failed to verify Slack signature');
  }
}

function respondUnauthorized(res: Response, error: string, detail: string): void {
  res.status(401).json({ 
    error,
    type: 'https://econeura.dev/errors/unauthorized',
    title: 'Unauthorized',
    status: 401,
    detail,
    instance: `corr:${res.locals.corr_id || 'n/a'}`,
  });
}
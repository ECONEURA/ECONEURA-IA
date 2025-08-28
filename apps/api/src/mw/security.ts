import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import helmet from 'helmet'
import crypto from 'crypto'

// CSP Headers
export const cspHeaders = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
})

// Rate limiting by IP
export const ipRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting for authentication
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true
})

// Speed limiter
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Start slowing down after 50 requests
  delayMs: 500 // Add 500ms delay per request above limit
})

// GDPR compliance headers
export function gdprHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Data-Retention', '90-days')
  res.setHeader('X-Privacy-Policy', 'https://econeura.com/privacy')
  res.setHeader('X-Data-Processing', 'eu-west-1')
  next()
}

// Request ID generation
export function requestId(req: Request, res: Response, next: NextFunction) {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}

// Input sanitization
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cleaned[key] = sanitize(obj[key])
        }
      }
      return cleaned
    }
    return obj
  }

  req.body = sanitize(req.body)
  req.query = sanitize(req.query)
  req.params = sanitize(req.params)
  next()
}

// Security audit logging
export async function auditLog(
  action: string,
  resource: string,
  userId: string,
  orgId: string,
  metadata?: any
) {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()
  
  try {
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action,
        resource,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        metadata: metadata?.details
      }
    })
  } catch (error) {
    console.error('Audit log error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Data encryption helpers
export function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'utf-8').slice(0, 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

export function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-gcm'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'utf-8').slice(0, 32)
  
  const parts = encryptedText.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// PII data masking
export function maskPII(data: any): any {
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@')
    return local.charAt(0) + '***' + '@' + domain
  }
  
  const maskPhone = (phone: string) => {
    return phone.slice(0, 3) + '****' + phone.slice(-2)
  }
  
  const maskTaxId = (taxId: string) => {
    return '***' + taxId.slice(-4)
  }
  
  if (typeof data === 'object' && data !== null) {
    const masked = { ...data }
    
    if (masked.email) masked.email = maskEmail(masked.email)
    if (masked.phone) masked.phone = maskPhone(masked.phone)
    if (masked.taxId) masked.taxId = maskTaxId(masked.taxId)
    if (masked.password) masked.password = '********'
    
    return masked
  }
  
  return data
}
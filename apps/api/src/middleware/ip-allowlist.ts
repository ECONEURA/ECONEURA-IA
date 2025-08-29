import { Request, Response, NextFunction } from 'express'
import { env } from '@econeura/shared'
import { Problems } from './problem-json.js'
import { logger } from '@econeura/shared'

export interface IPAllowlistOptions {
  allowedIPs?: string[]
  allowPrivate?: boolean
  allowLocalhost?: boolean
}

/**
 * IP Allowlist middleware for webhook security
 */
export function ipAllowlist(options: IPAllowlistOptions = {}) {
  const {
    allowedIPs = [],
    allowPrivate = false,
    allowLocalhost = false,
  } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const forwardedIP = req.headers['x-forwarded-for'] as string
    const realIP = req.headers['x-real-ip'] as string
    
    // Get the actual client IP (considering proxies)
    const actualIP = realIP || forwardedIP?.split(',')[0] || clientIP

    if (!actualIP) {
      logger.warn('No client IP detected', {
        headers: req.headers,
        corr_id: res.locals.corr_id,
      })
      throw Problems.FORBIDDEN('Client IP not detected')
    }

    // Check if IP is allowed
    const isAllowed = checkIPAllowed(actualIP, {
      allowedIPs,
      allowPrivate,
      allowLocalhost,
    })

    if (!isAllowed) {
      logger.warn('IP not in allowlist', {
        ip: actualIP,
        allowed_ips: allowedIPs,
        corr_id: res.locals.corr_id,
      })
      throw Problems.FORBIDDEN(`IP ${actualIP} not in allowlist`)
    }

    // Store IP info for logging
    res.locals.client_ip = actualIP
    res.locals.ip_allowed = true

    next()
  }
}

/**
 * Check if IP is allowed based on configuration
 */
function checkIPAllowed(ip: string, options: IPAllowlistOptions): boolean {
  const { allowedIPs, allowPrivate, allowLocalhost } = options

  // Parse IP
  const ipParts = ip.split('.')
  if (ipParts.length !== 4) {
    return false // Invalid IP format
  }

  const [a, b, c, d] = ipParts.map(Number)

  // Check localhost
  if (allowLocalhost && ip === '127.0.0.1') {
    return true
  }

  // Check private ranges
  if (allowPrivate) {
    // 10.0.0.0/8
    if (a === 10) return true
    
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true
    
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true
  }

  // Check specific allowed IPs
  if (allowedIPs.length > 0) {
    return allowedIPs.some(allowedIP => {
      // Support CIDR notation
      if (allowedIP.includes('/')) {
        return isIPInCIDR(ip, allowedIP)
      }
      return ip === allowedIP
    })
  }

  return false
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, bits] = cidr.split('/')
    const mask = parseInt(bits)
    
    if (mask < 0 || mask > 32) return false
    
    const ipNum = ipToNumber(ip)
    const networkNum = ipToNumber(network)
    const maskNum = (0xFFFFFFFF << (32 - mask)) >>> 0
    
    return (ipNum & maskNum) === (networkNum & maskNum)
  } catch {
    return false
  }
}

/**
 * Convert IP string to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number)
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
}

/**
 * Create IP allowlist middleware for Make webhooks
 */
export function makeWebhookIPAllowlist() {
  const allowedIPs = env().MAKE_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || []
  
  return ipAllowlist({
    allowedIPs,
    allowPrivate: false,
    allowLocalhost: env().NODE_ENV === 'development',
  })
}

/**
 * Create IP allowlist middleware for general webhooks
 */
export function webhookIPAllowlist() {
  const allowedIPs = env().WEBHOOK_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || []
  
  return ipAllowlist({
    allowedIPs,
    allowPrivate: env().NODE_ENV === 'development',
    allowLocalhost: env().NODE_ENV === 'development',
  })
}

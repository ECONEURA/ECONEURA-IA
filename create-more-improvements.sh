#!/bin/bash

echo "🚀 CREANDO MÁS MEJORAS ROBUSTAS..."

# 4. Rate Limiting Service
echo "🚦 Creando Rate Limiting Service..."
cat > apps/api/src/lib/rate-limiting.service.ts << 'RATE_EOF'
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export class RateLimitingService {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }

    if (limit.count >= config.maxRequests) {
      // Rate limit exceeded
      prometheus.register.getSingleMetric('rate_limit_exceeded_total')?.inc({
        key: key.substring(0, 50) // Truncate for metrics
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime
      };
    }

    // Increment count
    limit.count++;
    this.limits.set(key, limit);

    return {
      allowed: true,
      remaining: config.maxRequests - limit.count,
      resetTime: limit.resetTime
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimitingService = new RateLimitingService();
RATE_EOF

# 5. Data Encryption Service
echo "🔐 Creando Data Encryption Service..."
cat > apps/api/src/lib/data-encryption.service.ts << 'ENCRYPT_EOF'
import crypto from 'crypto';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export class DataEncryptionService {
  private config: EncryptionConfig;
  private masterKey: Buffer;

  constructor(config: EncryptionConfig) {
    this.config = config;
    this.masterKey = this.generateKey();
  }

  private generateKey(): Buffer {
    return crypto.randomBytes(this.config.keyLength);
  }

  encrypt(data: string, password?: string): { encrypted: string; iv: string; salt: string } {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(this.config.ivLength);
    
    const key = password ? 
      crypto.pbkdf2Sync(password, salt, 100000, this.config.keyLength, 'sha512') :
      this.masterKey;

    const cipher = crypto.createCipher(this.config.algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex')
    };
  }

  decrypt(encryptedData: string, iv: string, salt: string, password?: string): string {
    const key = password ? 
      crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, this.config.keyLength, 'sha512') :
      this.masterKey;

    const decipher = crypto.createDecipher(this.config.algorithm, key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export const dataEncryptionService = new DataEncryptionService({
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16
});
ENCRYPT_EOF

# 6. API Versioning Service
echo "📚 Creando API Versioning Service..."
cat > apps/api/src/lib/api-versioning.service.ts << 'VERSION_EOF'
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface APIVersion {
  version: string;
  deprecated: boolean;
  sunsetDate?: string;
  changelog: string[];
  breakingChanges: string[];
}

export class APIVersioningService {
  private versions: Map<string, APIVersion> = new Map();
  private currentVersion = 'v1';

  registerVersion(version: string, config: APIVersion): void {
    this.versions.set(version, config);
  }

  getVersion(version: string): APIVersion | null {
    return this.versions.get(version) || null;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  setCurrentVersion(version: string): void {
    this.currentVersion = version;
  }

  isDeprecated(version: string): boolean {
    const versionConfig = this.versions.get(version);
    return versionConfig?.deprecated || false;
  }

  getSupportedVersions(): string[] {
    return Array.from(this.versions.keys());
  }

  validateVersion(version: string): { valid: boolean; message?: string } {
    if (!this.versions.has(version)) {
      return { valid: false, message: `Version ${version} not supported` };
    }

    const versionConfig = this.versions.get(version);
    if (versionConfig?.deprecated) {
      return { valid: false, message: `Version ${version} is deprecated` };
    }

    return { valid: true };
  }
}

export const apiVersioningService = new APIVersioningService();
VERSION_EOF

echo "✅ MÁS MEJORAS ROBUSTAS CREADAS!"

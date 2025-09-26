import crypto from 'crypto';


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

import crypto from 'crypto';
export class DataEncryptionService {
    config;
    masterKey;
    constructor(config) {
        this.config = config;
        this.masterKey = this.generateKey();
    }
    generateKey() {
        return crypto.randomBytes(this.config.keyLength);
    }
    encrypt(data, password) {
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
    decrypt(encryptedData, iv, salt, password) {
        const key = password ?
            crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, this.config.keyLength, 'sha512') :
            this.masterKey;
        const decipher = crypto.createDecipher(this.config.algorithm, key);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    hash(data, algorithm = 'sha256') {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}
export const dataEncryptionService = new DataEncryptionService({
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16
});
//# sourceMappingURL=data-encryption.service.js.map
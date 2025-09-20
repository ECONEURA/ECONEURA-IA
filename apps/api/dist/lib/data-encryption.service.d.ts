export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
}
export declare class DataEncryptionService {
    private config;
    private masterKey;
    constructor(config: EncryptionConfig);
    private generateKey;
    encrypt(data: string, password?: string): {
        encrypted: string;
        iv: string;
        salt: string;
    };
    decrypt(encryptedData: string, iv: string, salt: string, password?: string): string;
    hash(data: string, algorithm?: string): string;
    generateSecureToken(length?: number): string;
}
export declare const dataEncryptionService: DataEncryptionService;
//# sourceMappingURL=data-encryption.service.d.ts.map
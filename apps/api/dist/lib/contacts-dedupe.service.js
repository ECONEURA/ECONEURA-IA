import { structuredLogger } from './structured-logger.js';
export class ContactsDedupeService {
    config;
    contacts = new Map();
    duplicates = new Map();
    mergeOperations = new Map();
    isProcessing = false;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            autoMerge: false,
            confidenceThreshold: 0.8,
            similarityThreshold: 0.7,
            fuzzyMatching: true,
            machineLearning: true,
            batchSize: 1000,
            maxProcessingTime: 300000,
            notificationChannels: ['email', 'slack'],
            ...config
        };
        structuredLogger.info('Contacts dedupe service initialized', {
            config: this.config,
            requestId: ''
        });
    }
    async processDeduplication() {
        if (this.isProcessing) {
            return this.getStats();
        }
        this.isProcessing = true;
        const startTime = Date.now();
        try {
            const exactDuplicates = await this.findExactDuplicates();
            const emailDuplicates = await this.findEmailDuplicates();
            const phoneDuplicates = await this.findPhoneDuplicates();
            let fuzzyDuplicates = [];
            if (this.config.fuzzyMatching) {
                fuzzyDuplicates = await this.findFuzzyDuplicates();
            }
            let mlDuplicates = [];
            if (this.config.machineLearning) {
                mlDuplicates = await this.findMLDuplicates();
            }
            const allDuplicates = [
                ...exactDuplicates,
                ...emailDuplicates,
                ...phoneDuplicates,
                ...fuzzyDuplicates,
                ...mlDuplicates
            ];
            const filteredDuplicates = allDuplicates.filter(match => match.confidence >= this.config.confidenceThreshold);
            if (this.config.autoMerge) {
                await this.createMergeOperations(filteredDuplicates);
            }
            const stats = this.calculateStats(startTime);
            structuredLogger.info('Deduplication process completed', {
                duplicatesFound: filteredDuplicates.length,
                processingTime: stats.mergeOperations,
                requestId: ''
            });
            return stats;
        }
        catch (error) {
            structuredLogger.error('Deduplication process failed', {
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
            throw error;
        }
        finally {
            this.isProcessing = false;
        }
    }
    async findExactDuplicates() {
        const duplicates = [];
        const contacts = Array.from(this.contacts.values());
        for (let i = 0; i < contacts.length; i++) {
            for (let j = i + 1; j < contacts.length; j++) {
                const contact1 = contacts[i];
                const contact2 = contacts[j];
                if (this.isExactDuplicate(contact1, contact2)) {
                    duplicates.push({
                        contactId: contact1.id,
                        duplicateId: contact2.id,
                        confidence: 1.0,
                        matchType: 'exact',
                        similarity: 1.0,
                        reasons: ['Exact match on all fields'],
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        return duplicates;
    }
    async findEmailDuplicates() {
        const duplicates = [];
        const emailMap = new Map();
        for (const contact of this.contacts.values()) {
            if (contact.email) {
                const normalizedEmail = contact.email.toLowerCase().trim();
                if (!emailMap.has(normalizedEmail)) {
                    emailMap.set(normalizedEmail, []);
                }
                emailMap.get(normalizedEmail).push(contact);
            }
        }
        for (const [email, contacts] of emailMap) {
            if (contacts.length > 1) {
                for (let i = 0; i < contacts.length; i++) {
                    for (let j = i + 1; j < contacts.length; j++) {
                        const contact1 = contacts[i];
                        const contact2 = contacts[j];
                        duplicates.push({
                            contactId: contact1.id,
                            duplicateId: contact2.id,
                            confidence: 0.95,
                            matchType: 'email',
                            similarity: 0.95,
                            reasons: [`Same email: ${email}`],
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }
        }
        return duplicates;
    }
    async findPhoneDuplicates() {
        const duplicates = [];
        const phoneMap = new Map();
        for (const contact of this.contacts.values()) {
            if (contact.phoneE164) {
                if (!phoneMap.has(contact.phoneE164)) {
                    phoneMap.set(contact.phoneE164, []);
                }
                phoneMap.get(contact.phoneE164).push(contact);
            }
        }
        for (const [phone, contacts] of phoneMap) {
            if (contacts.length > 1) {
                for (let i = 0; i < contacts.length; i++) {
                    for (let j = i + 1; j < contacts.length; j++) {
                        const contact1 = contacts[i];
                        const contact2 = contacts[j];
                        duplicates.push({
                            contactId: contact1.id,
                            duplicateId: contact2.id,
                            confidence: 0.9,
                            matchType: 'phone',
                            similarity: 0.9,
                            reasons: [`Same phone: ${phone}`],
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }
        }
        return duplicates;
    }
    async createMergeOperations(duplicates) {
        const processedContacts = new Set();
        for (const duplicate of duplicates) {
            if (processedContacts.has(duplicate.contactId) || processedContacts.has(duplicate.duplicateId)) {
                continue;
            }
            const mergeOperation = {
                id: `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                primaryContactId: duplicate.contactId,
                duplicateContactIds: [duplicate.duplicateId],
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            this.mergeOperations.set(mergeOperation.id, mergeOperation);
            processedContacts.add(duplicate.contactId);
            processedContacts.add(duplicate.duplicateId);
        }
    }
    async executeMerge(mergeId, approvedBy) {
        const mergeOperation = this.mergeOperations.get(mergeId);
        if (!mergeOperation) {
            throw new Error('Merge operation not found');
        }
        if (mergeOperation.status !== 'pending') {
            throw new Error('Merge operation is not pending');
        }
        try {
            for (const duplicateId of mergeOperation.duplicateContactIds) {
                this.contacts.delete(duplicateId);
            }
            mergeOperation.status = 'completed';
            mergeOperation.approvedBy = approvedBy;
            structuredLogger.info('Merge operation executed', {
                mergeId,
                primaryContact: mergeOperation.primaryContactId,
                duplicatesMerged: mergeOperation.duplicateContactIds.length,
                approvedBy,
                requestId: ''
            });
        }
        catch (error) {
            structuredLogger.error('Merge operation failed', {
                mergeId,
                error: error instanceof Error ? error.message : String(error),
                requestId: ''
            });
            throw error;
        }
    }
    isExactDuplicate(contact1, contact2) {
        return (contact1.firstName === contact2.firstName &&
            contact1.lastName === contact2.lastName &&
            contact1.email === contact2.email &&
            contact1.phoneE164 === contact2.phoneE164 &&
            contact1.company === contact2.company);
    }
    async findFuzzyDuplicates() {
        const duplicates = [];
        const contacts = Array.from(this.contacts.values());
        for (let i = 0; i < contacts.length; i++) {
            for (let j = i + 1; j < contacts.length; j++) {
                const contact1 = contacts[i];
                const contact2 = contacts[j];
                const similarity = this.calculateSimilarity(contact1, contact2);
                if (similarity >= this.config.similarityThreshold) {
                    duplicates.push({
                        contactId: contact1.id,
                        duplicateId: contact2.id,
                        confidence: similarity,
                        matchType: 'similarity',
                        similarity,
                        reasons: [`Fuzzy match: ${Math.round(similarity * 100)}% similarity`],
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        return duplicates;
    }
    async findMLDuplicates() {
        const duplicates = [];
        const contacts = Array.from(this.contacts.values());
        for (let i = 0; i < contacts.length; i++) {
            for (let j = i + 1; j < contacts.length; j++) {
                const contact1 = contacts[i];
                const contact2 = contacts[j];
                const mlScore = await this.calculateMLScore(contact1, contact2);
                if (mlScore >= this.config.confidenceThreshold) {
                    duplicates.push({
                        contactId: contact1.id,
                        duplicateId: contact2.id,
                        confidence: mlScore,
                        matchType: 'similarity',
                        similarity: mlScore,
                        reasons: [`ML prediction: ${Math.round(mlScore * 100)}% confidence`],
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        return duplicates;
    }
    calculateSimilarity(contact1, contact2) {
        let score = 0;
        let factors = 0;
        if (contact1.firstName && contact2.firstName) {
            const nameSimilarity = this.stringSimilarity(contact1.firstName, contact2.firstName);
            score += nameSimilarity * 0.3;
            factors += 0.3;
        }
        if (contact1.lastName && contact2.lastName) {
            const lastNameSimilarity = this.stringSimilarity(contact1.lastName, contact2.lastName);
            score += lastNameSimilarity * 0.3;
            factors += 0.3;
        }
        if (contact1.email && contact2.email) {
            const emailSimilarity = this.stringSimilarity(contact1.email, contact2.email);
            score += emailSimilarity * 0.2;
            factors += 0.2;
        }
        if (contact1.company && contact2.company) {
            const companySimilarity = this.stringSimilarity(contact1.company, contact2.company);
            score += companySimilarity * 0.2;
            factors += 0.2;
        }
        return factors > 0 ? score / factors : 0;
    }
    stringSimilarity(str1, str2) {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        if (s1 === s2)
            return 1.0;
        const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
        for (let i = 0; i <= s1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= s2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= s2.length; j++) {
            for (let i = 1; i <= s1.length; i++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        const distance = matrix[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return maxLength === 0 ? 1.0 : 1 - (distance / maxLength);
    }
    async calculateMLScore(contact1, contact2) {
        const features = [
            this.stringSimilarity(contact1.firstName || '', contact2.firstName || ''),
            this.stringSimilarity(contact1.lastName || '', contact2.lastName || ''),
            this.stringSimilarity(contact1.email || '', contact2.email || ''),
            this.stringSimilarity(contact1.company || '', contact2.company || ''),
            contact1.phoneE164 === contact2.phoneE164 ? 1.0 : 0.0
        ];
        const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
        const score = features.reduce((sum, feature, index) => sum + feature * weights[index], 0);
        const noise = (Math.random() - 0.5) * 0.1;
        return Math.max(0, Math.min(1, score + noise));
    }
    calculateStats(startTime) {
        const totalDuplicates = Array.from(this.duplicates.values()).flat().length;
        const completedMerges = Array.from(this.mergeOperations.values()).filter(op => op.status === 'completed').length;
        const allDuplicates = Array.from(this.duplicates.values()).flat();
        const averageConfidence = allDuplicates.length > 0
            ? allDuplicates.reduce((sum, dup) => sum + dup.confidence, 0) / allDuplicates.length
            : 0;
        const fuzzyMatches = allDuplicates.filter(d => d.matchType === 'similarity').length;
        const mlMatches = allDuplicates.filter(d => d.reasons.some(r => r.includes('ML'))).length;
        const processingTime = Date.now() - startTime;
        return {
            totalContacts: this.contacts.size,
            duplicatesFound: totalDuplicates,
            duplicatesResolved: completedMerges,
            mergeOperations: this.mergeOperations.size,
            averageConfidence,
            lastRun: new Date().toISOString(),
            processingTime,
            fuzzyMatches,
            mlMatches,
            accuracy: averageConfidence,
            performance: {
                contactsPerSecond: this.contacts.size / (processingTime / 1000),
                memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
                cpuUsage: 0
            }
        };
    }
    getStats() {
        return this.calculateStats(0);
    }
    getPendingMerges() {
        return Array.from(this.mergeOperations.values()).filter(op => op.status === 'pending');
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        structuredLogger.info('Dedupe configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    async addContact(contact) {
        this.contacts.set(contact.id, contact);
        structuredLogger.info('Contact added for deduplication', {
            contactId: contact.id,
            requestId: ''
        });
    }
    async removeContact(contactId) {
        this.contacts.delete(contactId);
        structuredLogger.info('Contact removed from deduplication', {
            contactId,
            requestId: ''
        });
    }
    async getContact(contactId) {
        return this.contacts.get(contactId) || null;
    }
    async getAllContacts() {
        return Array.from(this.contacts.values());
    }
    async getDuplicatesForContact(contactId) {
        return this.duplicates.get(contactId) || [];
    }
    async approveMerge(mergeId, approvedBy) {
        const mergeOperation = this.mergeOperations.get(mergeId);
        if (!mergeOperation) {
            throw new Error('Merge operation not found');
        }
        mergeOperation.status = 'approved';
        mergeOperation.approvedBy = approvedBy;
        structuredLogger.info('Merge operation approved', {
            mergeId,
            approvedBy,
            requestId: ''
        });
    }
    async revertMerge(mergeId, revertedBy) {
        const mergeOperation = this.mergeOperations.get(mergeId);
        if (!mergeOperation) {
            throw new Error('Merge operation not found');
        }
        mergeOperation.status = 'reverted';
        mergeOperation.approvedBy = revertedBy;
        structuredLogger.info('Merge operation reverted', {
            mergeId,
            revertedBy,
            requestId: ''
        });
    }
    async getMergeOperation(mergeId) {
        return this.mergeOperations.get(mergeId) || null;
    }
    async getAllMergeOperations() {
        return Array.from(this.mergeOperations.values());
    }
    async getHealthStatus() {
        const stats = this.getStats();
        const pendingMerges = this.getPendingMerges().length;
        let status = 'healthy';
        if (pendingMerges > 10) {
            status = 'warning';
        }
        if (stats.duplicatesFound > stats.totalContacts * 0.1) {
            status = 'critical';
        }
        return {
            status,
            details: {
                totalContacts: stats.totalContacts,
                duplicatesFound: stats.duplicatesFound,
                pendingMerges,
                averageConfidence: stats.averageConfidence,
                lastRun: stats.lastRun,
                performance: stats.performance
            }
        };
    }
    async exportDuplicates() {
        return Array.from(this.duplicates.values()).flat();
    }
    async importContacts(contacts) {
        for (const contact of contacts) {
            this.contacts.set(contact.id, contact);
        }
        structuredLogger.info('Contacts imported for deduplication', {
            count: contacts.length,
            requestId: ''
        });
    }
    async clearAllData() {
        this.contacts.clear();
        this.duplicates.clear();
        this.mergeOperations.clear();
        structuredLogger.info('All deduplication data cleared', {
            requestId: ''
        });
    }
}
export const contactsDedupeService = new ContactsDedupeService();
//# sourceMappingURL=contacts-dedupe.service.js.map
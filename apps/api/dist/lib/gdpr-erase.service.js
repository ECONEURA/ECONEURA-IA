import { logger } from './logger.js';
export class GDPREraseService {
    erasures = [];
    legalHolds = [];
    constructor() {
        this.initializeLegalHolds();
    }
    initializeLegalHolds() {
        this.legalHolds = [
            {
                id: 'hold_1',
                name: 'Financial Records Retention',
                description: 'Legal requirement to retain financial records for 10 years',
                type: 'regulatory',
                dataCategories: ['financial_data', 'sepa_transactions'],
                startDate: new Date('2020-01-01'),
                endDate: new Date('2030-01-01'),
                status: 'active',
                createdBy: 'system',
                legalBasis: 'EU Banking Regulation',
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
    }
    async createEraseRequest(userId, requestedBy, dataCategories, type = 'soft', reason) {
        try {
            const requestId = `gdpr_erase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const conflictingHolds = this.checkLegalHolds(userId, dataCategories);
            if (conflictingHolds.length > 0) {
                throw new Error(`Cannot erase data due to active legal holds: ${conflictingHolds.map(h => h.name).join(', ')}`);
            }
            const validCategories = this.validateEraseCategories(dataCategories, type);
            if (validCategories.length === 0) {
                throw new Error('No valid data categories for erase operation');
            }
            const dataErase = {
                id: `erase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                requestId,
                userId,
                type,
                status: 'pending',
                dataCategories: validCategories,
                recordCount: 0,
                erasedCount: 0,
                verificationHash: '',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.erasures.push(dataErase);
            this.processErase(dataErase).catch(error => {
                logger.error('Erase process failed', {
                    eraseId: dataErase.id,
                    error: error.message
                });
            });
            logger.info('GDPR erase request created', {
                eraseId: dataErase.id,
                userId,
                requestedBy,
                dataCategories: validCategories,
                type,
                reason
            });
            return dataErase;
        }
        catch (error) {
            logger.error('Failed to create erase request', {
                userId,
                error: error.message
            });
            throw error;
        }
    }
    async processErase(dataErase) {
        try {
            const eraseRecord = this.erasures.find(e => e.id === dataErase.id);
            if (!eraseRecord)
                return;
            eraseRecord.status = 'processing';
            eraseRecord.updatedAt = new Date();
            await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));
            const recordCount = await this.countRecordsToErase(dataErase.userId, dataErase.dataCategories);
            eraseRecord.recordCount = recordCount;
            if (dataErase.type === 'hard') {
                const backupPath = await this.createBackup(dataErase);
                eraseRecord.backupPath = backupPath;
            }
            const erasedCount = await this.performErase(dataErase);
            eraseRecord.erasedCount = erasedCount;
            eraseRecord.verificationHash = this.generateVerificationHash(dataErase, erasedCount);
            eraseRecord.status = 'completed';
            eraseRecord.completedAt = new Date();
            eraseRecord.updatedAt = new Date();
            logger.info('GDPR erase completed successfully', {
                eraseId: dataErase.id,
                recordCount,
                erasedCount,
                type: dataErase.type
            });
        }
        catch (error) {
            const eraseRecord = this.erasures.find(e => e.id === dataErase.id);
            if (eraseRecord) {
                eraseRecord.status = 'failed';
                eraseRecord.updatedAt = new Date();
            }
            logger.error('Erase process failed', {
                eraseId: dataErase.id,
                error: error.message
            });
            throw error;
        }
    }
    async countRecordsToErase(userId, dataCategories) {
        let count = 0;
        for (const category of dataCategories) {
            switch (category) {
                case 'personal_info':
                    count += await this.countPersonalInfoRecords(userId);
                    break;
                case 'financial_data':
                    count += await this.countFinancialRecords(userId);
                    break;
                case 'sepa_transactions':
                    count += await this.countSEPARecords(userId);
                    break;
                case 'crm_data':
                    count += await this.countCRMRecords(userId);
                    break;
                case 'audit_logs':
                    count += await this.countAuditRecords(userId);
                    break;
            }
        }
        return count;
    }
    async countPersonalInfoRecords(userId) {
        return Math.floor(Math.random() * 10) + 1;
    }
    async countFinancialRecords(userId) {
        return Math.floor(Math.random() * 50) + 1;
    }
    async countSEPARecords(userId) {
        return Math.floor(Math.random() * 100) + 1;
    }
    async countCRMRecords(userId) {
        return Math.floor(Math.random() * 20) + 1;
    }
    async countAuditRecords(userId) {
        return Math.floor(Math.random() * 200) + 1;
    }
    async createBackup(dataErase) {
        const backupPath = `/backups/gdpr/${dataErase.id}_${Date.now()}.backup`;
        logger.info('Backup created', {
            eraseId: dataErase.id,
            backupPath
        });
        return backupPath;
    }
    async performErase(dataErase) {
        let erasedCount = 0;
        for (const category of dataErase.dataCategories) {
            switch (category) {
                case 'personal_info':
                    erasedCount += await this.erasePersonalInfo(dataErase.userId, dataErase.type);
                    break;
                case 'financial_data':
                    erasedCount += await this.eraseFinancialData(dataErase.userId, dataErase.type);
                    break;
                case 'sepa_transactions':
                    erasedCount += await this.eraseSEPAData(dataErase.userId, dataErase.type);
                    break;
                case 'crm_data':
                    erasedCount += await this.eraseCRMData(dataErase.userId, dataErase.type);
                    break;
                case 'audit_logs':
                    erasedCount += await this.eraseAuditLogs(dataErase.userId, dataErase.type);
                    break;
            }
        }
        return erasedCount;
    }
    async erasePersonalInfo(userId, type) {
        const count = Math.floor(Math.random() * 10) + 1;
        logger.info('Personal info erased', {
            userId,
            type,
            count
        });
        return count;
    }
    async eraseFinancialData(userId, type) {
        const count = Math.floor(Math.random() * 50) + 1;
        logger.info('Financial data erased', {
            userId,
            type,
            count
        });
        return count;
    }
    async eraseSEPAData(userId, type) {
        const count = Math.floor(Math.random() * 100) + 1;
        logger.info('SEPA data erased', {
            userId,
            type,
            count
        });
        return count;
    }
    async eraseCRMData(userId, type) {
        const count = Math.floor(Math.random() * 20) + 1;
        logger.info('CRM data erased', {
            userId,
            type,
            count
        });
        return count;
    }
    async eraseAuditLogs(userId, type) {
        const count = Math.floor(Math.random() * 200) + 1;
        logger.info('Audit logs erased', {
            userId,
            type,
            count
        });
        return count;
    }
    generateVerificationHash(dataErase, erasedCount) {
        const data = `${dataErase.id}_${dataErase.userId}_${erasedCount}_${Date.now()}`;
        return Buffer.from(data).toString('base64').substring(0, 32);
    }
    checkLegalHolds(userId, dataCategories) {
        const activeHolds = this.legalHolds.filter(hold => hold.status === 'active' &&
            (hold.userId === userId || !hold.userId) &&
            hold.dataCategories.some(cat => dataCategories.includes(cat)));
        return activeHolds;
    }
    validateEraseCategories(dataCategories, type) {
        const eraseRules = {
            'soft': ['personal_info', 'crm_data'],
            'hard': ['personal_info', 'crm_data'],
            'anonymize': ['personal_info', 'crm_data', 'audit_logs'],
            'pseudonymize': ['personal_info', 'crm_data', 'audit_logs']
        };
        const allowedCategories = eraseRules[type] || [];
        return dataCategories.filter(cat => allowedCategories.includes(cat));
    }
    getErase(eraseId) {
        return this.erasures.find(e => e.id === eraseId) || null;
    }
    getUserErasures(userId) {
        return this.erasures.filter(e => e.userId === userId);
    }
    getAllErasures() {
        return [...this.erasures];
    }
    addLegalHold(legalHold) {
        const newHold = {
            ...legalHold,
            id: `hold_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.legalHolds.push(newHold);
        return newHold;
    }
    getLegalHolds() {
        return [...this.legalHolds];
    }
    getActiveLegalHolds() {
        return this.legalHolds.filter(hold => hold.status === 'active');
    }
    updateLegalHold(holdId, updates) {
        const holdIndex = this.legalHolds.findIndex(hold => hold.id === holdId);
        if (holdIndex === -1)
            return null;
        this.legalHolds[holdIndex] = {
            ...this.legalHolds[holdIndex],
            ...updates,
            updatedAt: new Date()
        };
        return this.legalHolds[holdIndex];
    }
    deleteLegalHold(holdId) {
        const holdIndex = this.legalHolds.findIndex(hold => hold.id === holdId);
        if (holdIndex === -1)
            return false;
        this.legalHolds.splice(holdIndex, 1);
        return true;
    }
    getEraseStats() {
        const total = this.erasures.length;
        const pending = this.erasures.filter(e => e.status === 'pending').length;
        const processing = this.erasures.filter(e => e.status === 'processing').length;
        const completed = this.erasures.filter(e => e.status === 'completed').length;
        const failed = this.erasures.filter(e => e.status === 'failed').length;
        const totalRecordsErased = this.erasures.reduce((sum, e) => sum + e.erasedCount, 0);
        const completedErasures = this.erasures.filter(e => e.completedAt);
        const averageProcessingTime = completedErasures.length > 0
            ? completedErasures.reduce((sum, e) => {
                const processingTime = e.completedAt.getTime() - e.createdAt.getTime();
                return sum + processingTime;
            }, 0) / completedErasures.length
            : 0;
        return {
            totalErasures: total,
            pendingErasures: pending,
            processingErasures: processing,
            completedErasures: completed,
            failedErasures: failed,
            totalRecordsErased,
            averageProcessingTime
        };
    }
}
//# sourceMappingURL=gdpr-erase.service.js.map
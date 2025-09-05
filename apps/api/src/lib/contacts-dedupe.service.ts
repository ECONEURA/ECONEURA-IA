/**
 * PR-52: Contacts Dedupe Proactivo Service
 * 
 * Sistema avanzado de deduplicación proactiva de contactos
 */

import { structuredLogger } from './structured-logger.js';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  phoneE164?: string;
  company?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateMatch {
  contactId: string;
  duplicateId: string;
  confidence: number;
  matchType: 'exact' | 'email' | 'phone' | 'similarity';
  similarity: number;
  reasons: string[];
  createdAt: string;
}

export interface MergeOperation {
  id: string;
  primaryContactId: string;
  duplicateContactIds: string[];
  status: 'pending' | 'approved' | 'completed' | 'reverted';
  approvedBy?: string;
  createdAt: string;
}

export interface DedupeConfig {
  enabled: boolean;
  autoMerge: boolean;
  confidenceThreshold: number;
  similarityThreshold: number;
}

export interface DedupeStats {
  totalContacts: number;
  duplicatesFound: number;
  duplicatesResolved: number;
  mergeOperations: number;
  averageConfidence: number;
  lastRun: string;
}

export class ContactsDedupeService {
  private config: DedupeConfig;
  private contacts: Map<string, Contact> = new Map();
  private duplicates: Map<string, DuplicateMatch[]> = new Map();
  private mergeOperations: Map<string, MergeOperation> = new Map();
  private isProcessing = false;

  constructor(config: Partial<DedupeConfig> = {}) {
    this.config = {
      enabled: true,
      autoMerge: false,
      confidenceThreshold: 0.8,
      similarityThreshold: 0.7,
      ...config
    };

    structuredLogger.info('Contacts dedupe service initialized', {
      config: this.config,
      requestId: ''
    });
  }

  async processDeduplication(): Promise<DedupeStats> {
    if (this.isProcessing) {
      return this.getStats();
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Detectar duplicados exactos
      const exactDuplicates = await this.findExactDuplicates();
      
      // Detectar duplicados por email
      const emailDuplicates = await this.findEmailDuplicates();
      
      // Detectar duplicados por teléfono
      const phoneDuplicates = await this.findPhoneDuplicates();

      // Consolidar resultados
      const allDuplicates = [
        ...exactDuplicates,
        ...emailDuplicates,
        ...phoneDuplicates
      ];

      // Filtrar por umbral de confianza
      const filteredDuplicates = allDuplicates.filter(
        match => match.confidence >= this.config.confidenceThreshold
      );

      // Crear operaciones de merge si está habilitado
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

    } catch (error) {
      structuredLogger.error('Deduplication process failed', {
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private async findExactDuplicates(): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];
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

  private async findEmailDuplicates(): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];
    const emailMap = new Map<string, Contact[]>();

    // Agrupar por email
    for (const contact of this.contacts.values()) {
      if (contact.email) {
        const normalizedEmail = contact.email.toLowerCase().trim();
        if (!emailMap.has(normalizedEmail)) {
          emailMap.set(normalizedEmail, []);
        }
        emailMap.get(normalizedEmail)!.push(contact);
      }
    }

    // Encontrar grupos con múltiples contactos
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

  private async findPhoneDuplicates(): Promise<DuplicateMatch[]> {
    const duplicates: DuplicateMatch[] = [];
    const phoneMap = new Map<string, Contact[]>();

    // Agrupar por teléfono E.164
    for (const contact of this.contacts.values()) {
      if (contact.phoneE164) {
        if (!phoneMap.has(contact.phoneE164)) {
          phoneMap.set(contact.phoneE164, []);
        }
        phoneMap.get(contact.phoneE164)!.push(contact);
      }
    }

    // Encontrar grupos con múltiples contactos
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

  private async createMergeOperations(duplicates: DuplicateMatch[]): Promise<void> {
    const processedContacts = new Set<string>();

    for (const duplicate of duplicates) {
      if (processedContacts.has(duplicate.contactId) || processedContacts.has(duplicate.duplicateId)) {
        continue;
      }

      const mergeOperation: MergeOperation = {
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

  async executeMerge(mergeId: string, approvedBy: string): Promise<void> {
    const mergeOperation = this.mergeOperations.get(mergeId);
    if (!mergeOperation) {
      throw new Error('Merge operation not found');
    }

    if (mergeOperation.status !== 'pending') {
      throw new Error('Merge operation is not pending');
    }

    try {
      // Marcar contactos duplicados como eliminados
      for (const duplicateId of mergeOperation.duplicateContactIds) {
        this.contacts.delete(duplicateId);
      }

      // Actualizar estado de la operación
      mergeOperation.status = 'completed';
      mergeOperation.approvedBy = approvedBy;

      structuredLogger.info('Merge operation executed', {
        mergeId,
        primaryContact: mergeOperation.primaryContactId,
        duplicatesMerged: mergeOperation.duplicateContactIds.length,
        approvedBy,
        requestId: ''
      });

    } catch (error) {
      structuredLogger.error('Merge operation failed', {
        mergeId,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });
      throw error;
    }
  }

  private isExactDuplicate(contact1: Contact, contact2: Contact): boolean {
    return (
      contact1.firstName === contact2.firstName &&
      contact1.lastName === contact2.lastName &&
      contact1.email === contact2.email &&
      contact1.phoneE164 === contact2.phoneE164 &&
      contact1.company === contact2.company
    );
  }

  private calculateStats(startTime: number): DedupeStats {
    const totalDuplicates = Array.from(this.duplicates.values()).flat().length;
    const completedMerges = Array.from(this.mergeOperations.values()).filter(
      op => op.status === 'completed'
    ).length;

    const allDuplicates = Array.from(this.duplicates.values()).flat();
    const averageConfidence = allDuplicates.length > 0 
      ? allDuplicates.reduce((sum, dup) => sum + dup.confidence, 0) / allDuplicates.length 
      : 0;

    return {
      totalContacts: this.contacts.size,
      duplicatesFound: totalDuplicates,
      duplicatesResolved: completedMerges,
      mergeOperations: this.mergeOperations.size,
      averageConfidence,
      lastRun: new Date().toISOString()
    };
  }

  getStats(): DedupeStats {
    return this.calculateStats(0);
  }

  getPendingMerges(): MergeOperation[] {
    return Array.from(this.mergeOperations.values()).filter(
      op => op.status === 'pending'
    );
  }

  updateConfig(newConfig: Partial<DedupeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    structuredLogger.info('Dedupe configuration updated', {
      config: this.config,
      requestId: ''
    });
  }
}

export const contactsDedupeService = new ContactsDedupeService();

import { structuredLogger } from './structured-logger.js';

// Contacts Dedupe Proactive Service - PR-38
// Sistema inteligente de deduplicación proactiva de contactos

interface Contact {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  jobTitle?: string;
  department?: string;
  
  // Address Information
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  
  // Social Media & Online Presence
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
  
  // Contact Preferences
  preferences?: {
    preferredContactMethod: 'email' | 'phone' | 'mobile' | 'linkedin';
    timezone?: string;
    language?: string;
    marketingOptIn?: boolean;
    communicationFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  
  // Business Information
  businessInfo?: {
    industry?: string;
    companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    annualRevenue?: number;
    employeeCount?: number;
    leadSource?: string;
    leadScore?: number;
  };
  
  // Relationship Information
  relationships?: {
    accountId?: string;
    opportunityId?: string;
    dealId?: string;
    campaignId?: string;
    referralSource?: string;
    lastInteractionDate?: string;
    interactionCount?: number;
  };
  
  // Data Quality
  dataQuality?: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    lastVerified?: string;
    verificationSource?: string;
    confidence: number; // 0-100
  };
  
  // Metadata
  metadata?: {
    source: string;
    importedAt?: string;
    lastUpdated: string;
    customFields?: Record<string, any>;
  };
  
  createdAt: string;
  updatedAt: string;
}

interface DuplicateCandidate {
  contactId: string;
  similarityScore: number; // 0-100
  matchType: 'exact' | 'high' | 'medium' | 'low';
  matchFields: string[];
  matchReasons: string[];
  confidence: number; // 0-100
  suggestedAction: 'merge' | 'keep_separate' | 'manual_review';
  mergeStrategy?: {
    primaryContact: string;
    fieldMappings: Record<string, string>;
    conflictResolution: Record<string, 'keep_primary' | 'keep_secondary' | 'merge' | 'manual'>;
  };
}

interface DedupeRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number; // 1-10, higher = more important
  
  // Matching Criteria
  criteria: {
    fields: string[];
    algorithms: ('exact' | 'fuzzy' | 'phonetic' | 'semantic')[];
    thresholds: {
      exact: number; // 100
      fuzzy: number; // 85
      phonetic: number; // 80
      semantic: number; // 75
    };
    weights: Record<string, number>; // field weights
  };
  
  // Actions
  actions: {
    autoMerge: boolean;
    autoMergeThreshold: number; // 95+
    requireApproval: boolean;
    approvalThreshold: number; // 85-94
    notificationEnabled: boolean;
    notificationRecipients: string[];
  };
  
  // Exclusions
  exclusions?: {
    domains?: string[];
    companies?: string[];
    tags?: string[];
    customConditions?: string[];
  };
  
  createdAt: string;
  updatedAt: string;
}

interface DedupeJob {
  id: string;
  organizationId: string;
  type: 'full_scan' | 'incremental' | 'manual' | 'scheduled';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  
  // Configuration
  configuration: {
    rules: string[]; // rule IDs
    batchSize: number;
    maxConcurrency: number;
    dryRun: boolean;
    includeInactive: boolean;
  };
  
  // Progress
  progress: {
    totalContacts: number;
    processedContacts: number;
    duplicatesFound: number;
    duplicatesMerged: number;
    errors: number;
    startTime?: string;
    endTime?: string;
    estimatedCompletion?: string;
  };
  
  // Results
  results?: {
    duplicates: DuplicateCandidate[];
    mergedContacts: string[];
    errors: Array<{
      contactId: string;
      error: string;
      timestamp: string;
    }>;
    statistics: {
      totalDuplicates: number;
      autoMerged: number;
      manualReview: number;
      keptSeparate: number;
      dataQualityImprovement: number;
    };
  };
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface MergeStrategy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  
  // Field Merging Rules
  fieldRules: Record<string, {
    strategy: 'keep_primary' | 'keep_secondary' | 'merge' | 'keep_most_recent' | 'keep_most_complete' | 'custom';
    customLogic?: string;
    conflictResolution: 'automatic' | 'manual' | 'prompt';
  }>;
  
  // Data Quality Rules
  qualityRules: {
    preferVerifiedData: boolean;
    preferCompleteData: boolean;
    preferRecentData: boolean;
    minimumConfidence: number;
  };
  
  // Validation Rules
  validationRules: {
    requireEmail: boolean;
    requirePhone: boolean;
    requireCompany: boolean;
    allowIncompleteMerges: boolean;
  };
  
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class ContactsDedupeService {
  private contacts: Map<string, Contact> = new Map();
  private duplicateCandidates: Map<string, DuplicateCandidate[]> = new Map();
  private dedupeRules: Map<string, DedupeRule> = new Map();
  private dedupeJobs: Map<string, DedupeJob> = new Map();
  private mergeStrategies: Map<string, MergeStrategy> = new Map();

  constructor() {
    this.init();
  }

  init() {
    this.createDemoData();
    structuredLogger.info('Contacts Dedupe Proactive Service initialized');
  }

  private createDemoData() {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Demo contacts with potential duplicates
    const contact1: Contact = {
      id: 'contact_1',
      organizationId: 'demo-org-1',
      firstName: 'Juan',
      lastName: 'Pérez',
      fullName: 'Juan Pérez',
      email: 'juan.perez@techcorp.com',
      phone: '+34 91 123 4567',
      mobile: '+34 600 123 456',
      company: 'TechCorp Solutions',
      jobTitle: 'CEO',
      department: 'Executive',
      address: {
        street: 'Calle Tecnología 123',
        city: 'Madrid',
        state: 'Madrid',
        country: 'Spain',
        postalCode: '28001'
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/in/juan-perez-ceo',
        twitter: 'https://twitter.com/juanperezceo'
      },
      preferences: {
        preferredContactMethod: 'email',
        timezone: 'Europe/Madrid',
        language: 'es',
        marketingOptIn: true,
        communicationFrequency: 'weekly'
      },
      businessInfo: {
        industry: 'Technology',
        companySize: 'medium',
        annualRevenue: 5000000,
        employeeCount: 150,
        leadSource: 'Website',
        leadScore: 95
      },
      relationships: {
        accountId: 'account_1',
        lastInteractionDate: oneMonthAgo.toISOString(),
        interactionCount: 15
      },
      dataQuality: {
        completeness: 95,
        accuracy: 98,
        lastVerified: oneMonthAgo.toISOString(),
        verificationSource: 'CRM',
        confidence: 95
      },
      metadata: {
        source: 'CRM',
        lastUpdated: oneMonthAgo.toISOString()
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    const contact2: Contact = {
      id: 'contact_2',
      organizationId: 'demo-org-1',
      firstName: 'Juan',
      lastName: 'Perez',
      fullName: 'Juan Perez',
      email: 'juan.perez@techcorp.com',
      phone: '+34 91 123 4567',
      mobile: '+34 600 123 456',
      company: 'TechCorp Solutions',
      jobTitle: 'Chief Executive Officer',
      department: 'Executive',
      address: {
        street: 'Calle Tecnología 123',
        city: 'Madrid',
        state: 'Madrid',
        country: 'Spain',
        postalCode: '28001'
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/in/juan-perez-ceo'
      },
      preferences: {
        preferredContactMethod: 'email',
        timezone: 'Europe/Madrid',
        language: 'es',
        marketingOptIn: true,
        communicationFrequency: 'weekly'
      },
      businessInfo: {
        industry: 'Technology',
        companySize: 'medium',
        annualRevenue: 5000000,
        employeeCount: 150,
        leadSource: 'LinkedIn',
        leadScore: 90
      },
      relationships: {
        accountId: 'account_1',
        lastInteractionDate: oneMonthAgo.toISOString(),
        interactionCount: 12
      },
      dataQuality: {
        completeness: 90,
        accuracy: 95,
        lastVerified: oneMonthAgo.toISOString(),
        verificationSource: 'LinkedIn',
        confidence: 90
      },
      metadata: {
        source: 'LinkedIn',
        lastUpdated: oneMonthAgo.toISOString()
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    const contact3: Contact = {
      id: 'contact_3',
      organizationId: 'demo-org-1',
      firstName: 'María',
      lastName: 'García',
      fullName: 'María García',
      email: 'maria.garcia@greentech.com',
      phone: '+34 93 987 6543',
      mobile: '+34 600 987 654',
      company: 'GreenTech Innovations',
      jobTitle: 'Founder & CEO',
      department: 'Executive',
      address: {
        street: 'Avenida Verde 456',
        city: 'Barcelona',
        state: 'Cataluña',
        country: 'Spain',
        postalCode: '08001'
      },
      socialMedia: {
        linkedin: 'https://linkedin.com/in/maria-garcia-founder',
        twitter: 'https://twitter.com/mariagarcia'
      },
      preferences: {
        preferredContactMethod: 'email',
        timezone: 'Europe/Madrid',
        language: 'es',
        marketingOptIn: false,
        communicationFrequency: 'monthly'
      },
      businessInfo: {
        industry: 'Clean Technology',
        companySize: 'startup',
        annualRevenue: 1200000,
        employeeCount: 45,
        leadSource: 'Website',
        leadScore: 85
      },
      relationships: {
        accountId: 'account_2',
        lastInteractionDate: oneMonthAgo.toISOString(),
        interactionCount: 8
      },
      dataQuality: {
        completeness: 88,
        accuracy: 92,
        lastVerified: oneMonthAgo.toISOString(),
        verificationSource: 'Website',
        confidence: 88
      },
      metadata: {
        source: 'Website',
        lastUpdated: oneMonthAgo.toISOString()
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.contacts.set(contact1.id, contact1);
    this.contacts.set(contact2.id, contact2);
    this.contacts.set(contact3.id, contact3);

    // Demo dedupe rules
    const rule1: DedupeRule = {
      id: 'rule_1',
      organizationId: 'demo-org-1',
      name: 'Email + Phone Matching',
      description: 'Detecta duplicados basados en email y teléfono',
      isActive: true,
      priority: 10,
      criteria: {
        fields: ['email', 'phone', 'mobile', 'firstName', 'lastName'],
        algorithms: ['exact', 'fuzzy', 'phonetic'],
        thresholds: {
          exact: 100,
          fuzzy: 85,
          phonetic: 80,
          semantic: 75
        },
        weights: {
          email: 0.4,
          phone: 0.3,
          mobile: 0.2,
          firstName: 0.05,
          lastName: 0.05
        }
      },
      actions: {
        autoMerge: true,
        autoMergeThreshold: 95,
        requireApproval: true,
        approvalThreshold: 85,
        notificationEnabled: true,
        notificationRecipients: ['admin@demo.com']
      },
      exclusions: {
        domains: ['test.com', 'example.com'],
        companies: ['Test Company']
      },
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.dedupeRules.set(rule1.id, rule1);

    // Demo merge strategy
    const strategy1: MergeStrategy = {
      id: 'strategy_1',
      organizationId: 'demo-org-1',
      name: 'Default Merge Strategy',
      description: 'Estrategia por defecto para fusionar contactos',
      fieldRules: {
        email: { strategy: 'keep_primary', conflictResolution: 'automatic' },
        phone: { strategy: 'keep_most_complete', conflictResolution: 'automatic' },
        mobile: { strategy: 'keep_most_complete', conflictResolution: 'automatic' },
        company: { strategy: 'keep_primary', conflictResolution: 'automatic' },
        jobTitle: { strategy: 'keep_most_recent', conflictResolution: 'automatic' },
        address: { strategy: 'keep_most_complete', conflictResolution: 'automatic' },
        socialMedia: { strategy: 'merge', conflictResolution: 'automatic' }
      },
      qualityRules: {
        preferVerifiedData: true,
        preferCompleteData: true,
        preferRecentData: true,
        minimumConfidence: 80
      },
      validationRules: {
        requireEmail: true,
        requirePhone: false,
        requireCompany: false,
        allowIncompleteMerges: true
      },
      isDefault: true,
      isActive: true,
      createdAt: oneMonthAgo.toISOString(),
      updatedAt: oneMonthAgo.toISOString()
    };

    this.mergeStrategies.set(strategy1.id, strategy1);

    // Run initial dedupe scan
    this.runDedupeScan('demo-org-1');
  }

  // Contact Management
  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const now = new Date().toISOString();
    const newContact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...contactData,
      createdAt: now,
      updatedAt: now
    };

    this.contacts.set(newContact.id, newContact);
    
    // Run proactive dedupe check
    await this.checkForDuplicates(newContact.id);
    
    structuredLogger.info('Contact created', { 
      contactId: newContact.id, 
      organizationId: newContact.organizationId,
      email: newContact.email,
      company: newContact.company
    });

    return newContact;
  }

  async getContact(contactId: string): Promise<Contact | undefined> {
    return this.contacts.get(contactId);
  }

  async getContacts(organizationId: string, filters: {
    search?: string;
    company?: string;
    department?: string;
    leadSource?: string;
    hasDuplicates?: boolean;
    dataQualityMin?: number;
    limit?: number;
  } = {}): Promise<Contact[]> {
    let contacts = Array.from(this.contacts.values())
      .filter(c => c.organizationId === organizationId);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      contacts = contacts.filter(c => 
        c.fullName.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.company?.toLowerCase().includes(searchLower) ||
        c.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.company) {
      contacts = contacts.filter(c => c.company === filters.company);
    }

    if (filters.department) {
      contacts = contacts.filter(c => c.department === filters.department);
    }

    if (filters.leadSource) {
      contacts = contacts.filter(c => c.businessInfo?.leadSource === filters.leadSource);
    }

    if (filters.hasDuplicates !== undefined) {
      contacts = contacts.filter(c => {
        const duplicates = this.duplicateCandidates.get(c.id) || [];
        return filters.hasDuplicates ? duplicates.length > 0 : duplicates.length === 0;
      });
    }

    if (filters.dataQualityMin !== undefined) {
      contacts = contacts.filter(c => 
        (c.dataQuality?.completeness || 0) >= filters.dataQualityMin!
      );
    }

    if (filters.limit) {
      contacts = contacts.slice(0, filters.limit);
    }

    return contacts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  // Duplicate Detection
  async checkForDuplicates(contactId: string): Promise<DuplicateCandidate[]> {
    const contact = this.contacts.get(contactId);
    if (!contact) return [];

    const candidates: DuplicateCandidate[] = [];
    const rules = Array.from(this.dedupeRules.values())
      .filter(r => r.organizationId === contact.organizationId && r.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of rules) {
      const matches = await this.findMatches(contact, rule);
      candidates.push(...matches);
    }

    // Remove duplicates and sort by similarity score
    const uniqueCandidates = this.removeDuplicateCandidates(candidates);
    this.duplicateCandidates.set(contactId, uniqueCandidates);

    return uniqueCandidates;
  }

  private async findMatches(contact: Contact, rule: DedupeRule): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    const contacts = Array.from(this.contacts.values())
      .filter(c => c.organizationId === contact.organizationId && c.id !== contact.id);

    for (const candidate of contacts) {
      const similarity = await this.calculateSimilarity(contact, candidate, rule);
      
      if (similarity.score >= rule.criteria.thresholds.fuzzy) {
        candidates.push({
          contactId: candidate.id,
          similarityScore: similarity.score,
          matchType: this.getMatchType(similarity.score),
          matchFields: similarity.matchingFields,
          matchReasons: similarity.reasons,
          confidence: similarity.confidence,
          suggestedAction: this.getSuggestedAction(similarity.score, rule),
          mergeStrategy: similarity.score >= rule.actions.autoMergeThreshold ? 
            await this.generateMergeStrategy(contact, candidate) : undefined
        });
      }
    }

    return candidates;
  }

  private async calculateSimilarity(contact1: Contact, contact2: Contact, rule: DedupeRule): Promise<{
    score: number;
    matchingFields: string[];
    reasons: string[];
    confidence: number;
  }> {
    let totalScore = 0;
    let totalWeight = 0;
    const matchingFields: string[] = [];
    const reasons: string[] = [];

    for (const field of rule.criteria.fields) {
      const weight = rule.criteria.weights[field] || 0.1;
      const value1 = this.getFieldValue(contact1, field);
      const value2 = this.getFieldValue(contact2, field);

      if (value1 && value2) {
        const fieldScore = this.calculateFieldSimilarity(value1, value2, field);
        totalScore += fieldScore * weight;
        totalWeight += weight;

        if (fieldScore >= 80) {
          matchingFields.push(field);
          reasons.push(`${field}: ${fieldScore}% match`);
        }
      }
    }

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    const confidence = this.calculateConfidence(contact1, contact2, matchingFields);

    return {
      score: Math.round(finalScore),
      matchingFields,
      reasons,
      confidence
    };
  }

  private calculateFieldSimilarity(value1: string, value2: string, field: string): number {
    // Normalize values
    const norm1 = this.normalizeValue(value1, field);
    const norm2 = this.normalizeValue(value2, field);

    // Exact match
    if (norm1 === norm2) return 100;

    // Email similarity
    if (field === 'email') {
      const [user1, domain1] = norm1.split('@');
      const [user2, domain2] = norm2.split('@');
      
      if (domain1 === domain2) {
        const userSimilarity = this.calculateStringSimilarity(user1, user2);
        return Math.round(50 + (userSimilarity * 0.5));
      }
      return 0;
    }

    // Phone similarity
    if (field === 'phone' || field === 'mobile') {
      const phone1 = this.normalizePhone(norm1);
      const phone2 = this.normalizePhone(norm2);
      
      if (phone1 === phone2) return 100;
      
      // Check if one is extension of the other
      if (phone1.includes(phone2) || phone2.includes(phone1)) {
        return 85;
      }
      
      return this.calculateStringSimilarity(phone1, phone2);
    }

    // Name similarity
    if (field === 'firstName' || field === 'lastName') {
      return this.calculateStringSimilarity(norm1, norm2);
    }

    // Company similarity
    if (field === 'company') {
      return this.calculateStringSimilarity(norm1, norm2);
    }

    // Default string similarity
    return this.calculateStringSimilarity(norm1, norm2);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return Math.round(((longer.length - distance) / longer.length) * 100);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private normalizeValue(value: string, field: string): string {
    let normalized = value.toLowerCase().trim();
    
    // Remove special characters for certain fields
    if (field === 'phone' || field === 'mobile') {
      normalized = normalized.replace(/[^\d+]/g, '');
    }
    
    // Remove common prefixes/suffixes
    if (field === 'email') {
      normalized = normalized.replace(/\+.*@/, '@');
    }
    
    return normalized;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '').replace(/^\+34/, '').replace(/^34/, '');
  }

  private getFieldValue(contact: Contact, field: string): string | undefined {
    switch (field) {
      case 'email': return contact.email;
      case 'phone': return contact.phone;
      case 'mobile': return contact.mobile;
      case 'firstName': return contact.firstName;
      case 'lastName': return contact.lastName;
      case 'company': return contact.company;
      case 'jobTitle': return contact.jobTitle;
      case 'department': return contact.department;
      default: return undefined;
    }
  }

  private getMatchType(score: number): 'exact' | 'high' | 'medium' | 'low' {
    if (score >= 95) return 'exact';
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  private getSuggestedAction(score: number, rule: DedupeRule): 'merge' | 'keep_separate' | 'manual_review' {
    if (score >= rule.actions.autoMergeThreshold) return 'merge';
    if (score >= rule.actions.approvalThreshold) return 'manual_review';
    return 'keep_separate';
  }

  private calculateConfidence(contact1: Contact, contact2: Contact, matchingFields: string[]): number {
    let confidence = 0;
    
    // Base confidence on data quality
    const quality1 = contact1.dataQuality?.accuracy || 50;
    const quality2 = contact2.dataQuality?.accuracy || 50;
    confidence += (quality1 + quality2) / 2 * 0.3;
    
    // Boost confidence for critical fields
    if (matchingFields.includes('email')) confidence += 30;
    if (matchingFields.includes('phone') || matchingFields.includes('mobile')) confidence += 20;
    if (matchingFields.includes('firstName') && matchingFields.includes('lastName')) confidence += 15;
    if (matchingFields.includes('company')) confidence += 5;
    
    return Math.min(100, Math.round(confidence));
  }

  private async generateMergeStrategy(primary: Contact, secondary: Contact): Promise<{
    primaryContact: string;
    fieldMappings: Record<string, string>;
    conflictResolution: Record<string, 'keep_primary' | 'keep_secondary' | 'merge' | 'manual'>;
  }> {
    const strategy = this.mergeStrategies.get('strategy_1');
    if (!strategy) {
      throw new Error('Default merge strategy not found');
    }

    const fieldMappings: Record<string, string> = {};
    const conflictResolution: Record<string, 'keep_primary' | 'keep_secondary' | 'merge' | 'manual'> = {};

    for (const [field, rule] of Object.entries(strategy.fieldRules)) {
      fieldMappings[field] = rule.strategy;
      conflictResolution[field] = rule.conflictResolution;
    }

    return {
      primaryContact: primary.id,
      fieldMappings,
      conflictResolution
    };
  }

  private removeDuplicateCandidates(candidates: DuplicateCandidate[]): DuplicateCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      if (seen.has(candidate.contactId)) return false;
      seen.add(candidate.contactId);
      return true;
    }).sort((a, b) => b.similarityScore - a.similarityScore);
  }

  // Dedupe Jobs
  async runDedupeScan(organizationId: string, options: {
    type?: 'full_scan' | 'incremental' | 'manual';
    rules?: string[];
    dryRun?: boolean;
    createdBy?: string;
  } = {}): Promise<DedupeJob> {
    const now = new Date().toISOString();
    const job: DedupeJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      organizationId,
      type: options.type || 'incremental',
      status: 'running',
      configuration: {
        rules: options.rules || Array.from(this.dedupeRules.values())
          .filter(r => r.organizationId === organizationId && r.isActive)
          .map(r => r.id),
        batchSize: 100,
        maxConcurrency: 5,
        dryRun: options.dryRun || false,
        includeInactive: false
      },
      progress: {
        totalContacts: 0,
        processedContacts: 0,
        duplicatesFound: 0,
        duplicatesMerged: 0,
        errors: 0,
        startTime: now
      },
      createdBy: options.createdBy || 'system',
      createdAt: now,
      updatedAt: now
    };

    this.dedupeJobs.set(job.id, job);

    // Run dedupe scan asynchronously
    this.executeDedupeJob(job).catch(error => {
      structuredLogger.error('Dedupe job failed', { jobId: job.id, error });
      job.status = 'failed';
      job.updatedAt = new Date().toISOString();
    });

    return job;
  }

  private async executeDedupeJob(job: DedupeJob): Promise<void> {
    const contacts = Array.from(this.contacts.values())
      .filter(c => c.organizationId === job.organizationId);
    
    job.progress.totalContacts = contacts.length;
    job.progress.startTime = new Date().toISOString();

    const duplicates: DuplicateCandidate[] = [];
    const errors: Array<{ contactId: string; error: string; timestamp: string }> = [];

    for (const contact of contacts) {
      try {
        const candidates = await this.checkForDuplicates(contact.id);
        duplicates.push(...candidates);
        job.progress.processedContacts++;
        job.progress.duplicatesFound += candidates.length;
      } catch (error) {
        errors.push({
          contactId: contact.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        job.progress.errors++;
      }
    }

    // Process duplicates
    if (!job.configuration.dryRun) {
      for (const duplicate of duplicates) {
        if (duplicate.suggestedAction === 'merge' && duplicate.mergeStrategy) {
          try {
            await this.mergeContacts(duplicate.contactId, duplicate.mergeStrategy.primaryContact, duplicate.mergeStrategy);
            job.progress.duplicatesMerged++;
          } catch (error) {
            errors.push({
              contactId: duplicate.contactId,
              error: error instanceof Error ? error.message : 'Merge failed',
              timestamp: new Date().toISOString()
            });
            job.progress.errors++;
          }
        }
      }
    }

    // Complete job
    job.status = 'completed';
    job.progress.endTime = new Date().toISOString();
    job.results = {
      duplicates,
      mergedContacts: duplicates
        .filter(d => d.suggestedAction === 'merge')
        .map(d => d.contactId),
      errors,
      statistics: {
        totalDuplicates: duplicates.length,
        autoMerged: job.progress.duplicatesMerged,
        manualReview: duplicates.filter(d => d.suggestedAction === 'manual_review').length,
        keptSeparate: duplicates.filter(d => d.suggestedAction === 'keep_separate').length,
        dataQualityImprovement: this.calculateDataQualityImprovement(duplicates)
      }
    };
    job.updatedAt = new Date().toISOString();

    structuredLogger.info('Dedupe job completed', { 
      jobId: job.id, 
      organizationId: job.organizationId,
      totalDuplicates: duplicates.length,
      merged: job.progress.duplicatesMerged,
      errors: job.progress.errors
    });
  }

  private async mergeContacts(secondaryId: string, primaryId: string, strategy: any): Promise<void> {
    const primary = this.contacts.get(primaryId);
    const secondary = this.contacts.get(secondaryId);
    
    if (!primary || !secondary) {
      throw new Error('One or both contacts not found');
    }

    // Apply merge strategy
    const mergedContact = { ...primary };
    
    for (const [field, rule] of Object.entries(strategy.fieldMappings)) {
      const secondaryValue = this.getFieldValue(secondary, field);
      const primaryValue = this.getFieldValue(primary, field);
      
      if (secondaryValue && !primaryValue) {
        // Use secondary value if primary is empty
        this.setFieldValue(mergedContact, field, secondaryValue);
      } else if (secondaryValue && primaryValue && rule === 'keep_secondary') {
        // Use secondary value
        this.setFieldValue(mergedContact, field, secondaryValue);
      } else if (secondaryValue && primaryValue && rule === 'merge') {
        // Merge values (for arrays or complex fields)
        this.mergeFieldValues(mergedContact, field, primaryValue, secondaryValue);
      }
    }

    // Update data quality
    mergedContact.dataQuality = {
      completeness: Math.max(primary.dataQuality?.completeness || 0, secondary.dataQuality?.completeness || 0),
      accuracy: Math.max(primary.dataQuality?.accuracy || 0, secondary.dataQuality?.accuracy || 0),
      lastVerified: new Date().toISOString(),
      verificationSource: 'Merged',
      confidence: Math.max(primary.dataQuality?.confidence || 0, secondary.dataQuality?.confidence || 0)
    };

    mergedContact.updatedAt = new Date().toISOString();

    // Update primary contact
    this.contacts.set(primaryId, mergedContact);
    
    // Remove secondary contact
    this.contacts.delete(secondaryId);
    
    // Clean up duplicate candidates
    this.duplicateCandidates.delete(secondaryId);
    this.duplicateCandidates.delete(primaryId);

    structuredLogger.info('Contacts merged', { 
      primaryId, 
      secondaryId, 
      organizationId: primary.organizationId
    });
  }

  private setFieldValue(contact: Contact, field: string, value: string): void {
    switch (field) {
      case 'email': contact.email = value; break;
      case 'phone': contact.phone = value; break;
      case 'mobile': contact.mobile = value; break;
      case 'firstName': contact.firstName = value; break;
      case 'lastName': contact.lastName = value; break;
      case 'company': contact.company = value; break;
      case 'jobTitle': contact.jobTitle = value; break;
      case 'department': contact.department = value; break;
    }
  }

  private mergeFieldValues(contact: Contact, field: string, primaryValue: string, secondaryValue: string): void {
    // Simple merge logic - in real implementation, this would be more sophisticated
    if (field === 'socialMedia') {
      // Merge social media profiles
      const primarySocial = contact.socialMedia || {};
      const secondarySocial = JSON.parse(secondaryValue);
      contact.socialMedia = { ...primarySocial, ...secondarySocial };
    }
  }

  private calculateDataQualityImprovement(duplicates: DuplicateCandidate[]): number {
    // Calculate average data quality improvement from merging
    let totalImprovement = 0;
    let count = 0;

    for (const duplicate of duplicates) {
      if (duplicate.suggestedAction === 'merge') {
        const primary = this.contacts.get(duplicate.mergeStrategy?.primaryContact || '');
        const secondary = this.contacts.get(duplicate.contactId);
        
        if (primary && secondary) {
          const primaryQuality = primary.dataQuality?.completeness || 0;
          const secondaryQuality = secondary.dataQuality?.completeness || 0;
          const improvement = Math.max(primaryQuality, secondaryQuality) - Math.min(primaryQuality, secondaryQuality);
          totalImprovement += improvement;
          count++;
        }
      }
    }

    return count > 0 ? Math.round(totalImprovement / count) : 0;
  }

  // Statistics
  async getDedupeStats(organizationId: string) {
    const contacts = Array.from(this.contacts.values()).filter(c => c.organizationId === organizationId);
    const duplicates = Array.from(this.duplicateCandidates.values()).flat();
    const jobs = Array.from(this.dedupeJobs.values()).filter(j => j.organizationId === organizationId);

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentJobs = jobs.filter(j => new Date(j.createdAt) >= last30Days);

    return {
      totalContacts: contacts.length,
      contactsWithDuplicates: contacts.filter(c => {
        const candidates = this.duplicateCandidates.get(c.id) || [];
        return candidates.length > 0;
      }).length,
      totalDuplicates: duplicates.length,
      autoMerged: duplicates.filter(d => d.suggestedAction === 'merge').length,
      manualReview: duplicates.filter(d => d.suggestedAction === 'manual_review').length,
      keptSeparate: duplicates.filter(d => d.suggestedAction === 'keep_separate').length,
      averageDataQuality: contacts.reduce((sum, c) => sum + (c.dataQuality?.completeness || 0), 0) / contacts.length,
      activeRules: Array.from(this.dedupeRules.values()).filter(r => r.organizationId === organizationId && r.isActive).length,
      last30Days: {
        newContacts: contacts.filter(c => new Date(c.createdAt) >= last30Days).length,
        completedJobs: recentJobs.filter(j => j.status === 'completed').length,
        duplicatesFound: recentJobs.reduce((sum, j) => sum + (j.results?.statistics.totalDuplicates || 0), 0),
        contactsMerged: recentJobs.reduce((sum, j) => sum + (j.results?.statistics.autoMerged || 0), 0)
      },
      byMatchType: {
        exact: duplicates.filter(d => d.matchType === 'exact').length,
        high: duplicates.filter(d => d.matchType === 'high').length,
        medium: duplicates.filter(d => d.matchType === 'medium').length,
        low: duplicates.filter(d => d.matchType === 'low').length
      },
      byDataQuality: {
        high: contacts.filter(c => (c.dataQuality?.completeness || 0) >= 90).length,
        medium: contacts.filter(c => (c.dataQuality?.completeness || 0) >= 70 && (c.dataQuality?.completeness || 0) < 90).length,
        low: contacts.filter(c => (c.dataQuality?.completeness || 0) < 70).length
      }
    };
  }
}

export const contactsDedupeService = new ContactsDedupeService();

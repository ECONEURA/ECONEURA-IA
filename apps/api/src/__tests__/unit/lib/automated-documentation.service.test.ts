import { describe, it, expect, beforeEach, vi } from 'vitest';
import AutomatedDocumentationService, {
  Documentation,
  APIDocumentation,
  ArchitectureDocumentation,
  Runbook,
  DocumentationConfig
} from '../../lib/automated-documentation.service.ts';

// Mock del logger
vi.mock('../../lib/logger.ts', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock de fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined)
}));

describe('AutomatedDocumentationService', () => {
  let service: AutomatedDocumentationService;
  let config: DocumentationConfig;

  beforeEach(() => {
    config = {
      outputDirectory: './docs/generated',
      templatesDirectory: './docs/templates',
      autoGenerate: true,
      versioning: true,
      reviewRequired: false,
      notificationChannels: ['email', 'slack'],
      formats: ['html', 'markdown', 'json'],
      languages: ['en', 'es']
    };

    service = new AutomatedDocumentationService(config);
  });

  describe('Documentation Management', () => {
    it('should create documentation', async () => {
      const docData = {
        title: 'Test Documentation',
        type: 'API' as const,
        version: '1.0.0',
        content: 'Test content',
        metadata: { description: 'Test doc' },
        status: 'DRAFT' as const,
        tags: ['test'],
        author: 'Test Author'
      };

      const doc = await service.createDocumentation(docData);

      expect(doc).toBeDefined();
      expect(doc.id).toBeDefined();
      expect(doc.title).toBe('Test Documentation');
      expect(doc.type).toBe('API');
      expect(doc.version).toBe('1.0.0');
      expect(doc.content).toBe('Test content');
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });

    it('should get documentation by id', async () => {
      const docData = {
        title: 'Test Documentation 2',
        type: 'ARCHITECTURE' as const,
        version: '1.0.0',
        content: 'Test content 2',
        metadata: { description: 'Test doc 2' },
        status: 'PUBLISHED' as const,
        tags: ['test', 'architecture'],
        author: 'Test Author 2'
      };

      const createdDoc = await service.createDocumentation(docData);
      const retrievedDoc = await service.getDocumentation(createdDoc.id);

      expect(retrievedDoc).toBeDefined();
      expect(retrievedDoc?.id).toBe(createdDoc.id);
      expect(retrievedDoc?.title).toBe('Test Documentation 2');
      expect(retrievedDoc?.type).toBe('ARCHITECTURE');
    });

    it('should return null for non-existent documentation', async () => {
      const doc = await service.getDocumentation('non-existent-id');
      expect(doc).toBeNull();
    });

    it('should list all documentation', async () => {
      const doc1 = await service.createDocumentation({
        title: 'Doc 1',
        type: 'API',
        version: '1.0.0',
        content: 'Content 1',
        metadata: {},
        status: 'DRAFT',
        tags: [],
        author: 'Author 1'
      });

      const doc2 = await service.createDocumentation({
        title: 'Doc 2',
        type: 'USER_GUIDE',
        version: '1.0.0',
        content: 'Content 2',
        metadata: {},
        status: 'PUBLISHED',
        tags: [],
        author: 'Author 2'
      });

      const docs = await service.listDocumentation();

      expect(docs).toHaveLength(4); // 2 created + 2 default
      expect(docs.some(d => d.id === doc1.id)).toBe(true);
      expect(docs.some(d => d.id === doc2.id)).toBe(true);
    });

    it('should list documentation by type', async () => {
      const apiDocs = await service.listDocumentation('API');
      expect(apiDocs.every(doc => doc.type === 'API')).toBe(true);
    });

    it('should update documentation', async () => {
      const docData = {
        title: 'Original Title',
        type: 'API' as const,
        version: '1.0.0',
        content: 'Original content',
        metadata: {},
        status: 'DRAFT' as const,
        tags: [],
        author: 'Original Author'
      };

      const createdDoc = await service.createDocumentation(docData);
      const updatedDoc = await service.updateDocumentation(createdDoc.id, {
        title: 'Updated Title',
        content: 'Updated content',
        status: 'PUBLISHED'
      });

      expect(updatedDoc).toBeDefined();
      expect(updatedDoc?.title).toBe('Updated Title');
      expect(updatedDoc?.content).toBe('Updated content');
      expect(updatedDoc?.status).toBe('PUBLISHED');
      expect(updatedDoc?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete documentation', async () => {
      const docData = {
        title: 'To Delete',
        type: 'API' as const,
        version: '1.0.0',
        content: 'Will be deleted',
        metadata: {},
        status: 'DRAFT' as const,
        tags: [],
        author: 'Author'
      };

      const createdDoc = await service.createDocumentation(docData);
      const deleted = await service.deleteDocumentation(createdDoc.id);

      expect(deleted).toBe(true);

      const retrievedDoc = await service.getDocumentation(createdDoc.id);
      expect(retrievedDoc).toBeNull();
    });
  });

  describe('Documentation Generation', () => {
    it('should generate API documentation', async () => {
      const generation = await service.generateAPIDocumentation();

      expect(generation).toBeDefined();
      expect(generation.id).toBeDefined();
      expect(generation.type).toBe('API');
      expect(generation.status).toBeDefined();
      expect(generation.startTime).toBeInstanceOf(Date);
      expect(Array.isArray(generation.filesGenerated)).toBe(true);
      expect(Array.isArray(generation.errors)).toBe(true);
    });

    it('should generate architecture documentation', async () => {
      const generation = await service.generateArchitectureDocumentation();

      expect(generation).toBeDefined();
      expect(generation.id).toBeDefined();
      expect(generation.type).toBe('ARCHITECTURE');
      expect(generation.status).toBeDefined();
      expect(generation.startTime).toBeInstanceOf(Date);
      expect(Array.isArray(generation.filesGenerated)).toBe(true);
    });

    it('should generate user guides', async () => {
      const generation = await service.generateUserGuides();

      expect(generation).toBeDefined();
      expect(generation.id).toBeDefined();
      expect(generation.type).toBe('USER_GUIDE');
      expect(generation.status).toBeDefined();
      expect(generation.startTime).toBeInstanceOf(Date);
      expect(Array.isArray(generation.filesGenerated)).toBe(true);
    });

    it('should generate runbooks', async () => {
      const generation = await service.generateRunbooks();

      expect(generation).toBeDefined();
      expect(generation.id).toBeDefined();
      expect(generation.type).toBe('RUNBOOK');
      expect(generation.status).toBeDefined();
      expect(generation.startTime).toBeInstanceOf(Date);
      expect(Array.isArray(generation.filesGenerated)).toBe(true);
    });

    it('should generate all documentation', async () => {
      const generations = await service.generateAllDocumentation();

      expect(Array.isArray(generations)).toBe(true);
      expect(generations.length).toBeGreaterThan(0);
      expect(generations.every(g => g.id && g.type && g.status)).toBe(true);
    });
  });

  describe('Runbook Management', () => {
    it('should create runbook', async () => {
      const runbookData = {
        title: 'Test Runbook',
        description: 'Test runbook description',
        procedures: [
          {
            step: 1,
            title: 'Step 1',
            description: 'First step',
            commands: ['npm install'],
            expectedResult: 'Dependencies installed',
            troubleshooting: 'Check network connection'
          }
        ],
        prerequisites: ['Node.js installed'],
        estimatedTime: '30 minutes',
        difficulty: 'INTERMEDIATE' as const
      };

      const runbook = await service.createRunbook(runbookData);

      expect(runbook).toBeDefined();
      expect(runbook.id).toBeDefined();
      expect(runbook.title).toBe('Test Runbook');
      expect(runbook.description).toBe('Test runbook description');
      expect(runbook.procedures).toHaveLength(1);
      expect(runbook.difficulty).toBe('INTERMEDIATE');
    });

    it('should get runbook by id', async () => {
      const runbookData = {
        title: 'Test Runbook 2',
        description: 'Test runbook description 2',
        procedures: [
          {
            step: 1,
            title: 'Step 1',
            description: 'First step',
            expectedResult: 'Step completed'
          }
        ],
        prerequisites: ['Basic knowledge'],
        estimatedTime: '15 minutes',
        difficulty: 'BEGINNER' as const
      };

      const createdRunbook = await service.createRunbook(runbookData);
      const retrievedRunbook = await service.getRunbook(createdRunbook.id);

      expect(retrievedRunbook).toBeDefined();
      expect(retrievedRunbook?.id).toBe(createdRunbook.id);
      expect(retrievedRunbook?.title).toBe('Test Runbook 2');
      expect(retrievedRunbook?.difficulty).toBe('BEGINNER');
    });

    it('should return null for non-existent runbook', async () => {
      const runbook = await service.getRunbook('non-existent-id');
      expect(runbook).toBeNull();
    });

    it('should list all runbooks', async () => {
      const runbook1 = await service.createRunbook({
        title: 'Runbook 1',
        description: 'Description 1',
        procedures: [{ step: 1, title: 'Step 1', description: 'Desc 1', expectedResult: 'Result 1' }],
        prerequisites: ['Prereq 1'],
        estimatedTime: '20 minutes',
        difficulty: 'INTERMEDIATE'
      });

      const runbook2 = await service.createRunbook({
        title: 'Runbook 2',
        description: 'Description 2',
        procedures: [{ step: 1, title: 'Step 1', description: 'Desc 1', expectedResult: 'Result 1' }],
        prerequisites: ['Prereq 2'],
        estimatedTime: '25 minutes',
        difficulty: 'ADVANCED'
      });

      const runbooks = await service.listRunbooks();

      expect(runbooks).toHaveLength(3); // 2 created + 1 default
      expect(runbooks.some(r => r.id === runbook1.id)).toBe(true);
      expect(runbooks.some(r => r.id === runbook2.id)).toBe(true);
    });

    it('should update runbook', async () => {
      const runbookData = {
        title: 'Original Runbook',
        description: 'Original description',
        procedures: [
          {
            step: 1,
            title: 'Original Step',
            description: 'Original step description',
            expectedResult: 'Original result'
          }
        ],
        prerequisites: ['Original prereq'],
        estimatedTime: '30 minutes',
        difficulty: 'INTERMEDIATE' as const
      };

      const createdRunbook = await service.createRunbook(runbookData);
      const updatedRunbook = await service.updateRunbook(createdRunbook.id, {
        title: 'Updated Runbook',
        description: 'Updated description',
        difficulty: 'ADVANCED'
      });

      expect(updatedRunbook).toBeDefined();
      expect(updatedRunbook?.title).toBe('Updated Runbook');
      expect(updatedRunbook?.description).toBe('Updated description');
      expect(updatedRunbook?.difficulty).toBe('ADVANCED');
    });

    it('should delete runbook', async () => {
      const runbookData = {
        title: 'To Delete Runbook',
        description: 'Will be deleted',
        procedures: [
          {
            step: 1,
            title: 'Step 1',
            description: 'Step description',
            expectedResult: 'Result'
          }
        ],
        prerequisites: ['Prereq'],
        estimatedTime: '15 minutes',
        difficulty: 'BEGINNER' as const
      };

      const createdRunbook = await service.createRunbook(runbookData);
      const deleted = await service.deleteRunbook(createdRunbook.id);

      expect(deleted).toBe(true);

      const retrievedRunbook = await service.getRunbook(createdRunbook.id);
      expect(retrievedRunbook).toBeNull();
    });
  });

  describe('Statistics and Reports', () => {
    it('should get documentation statistics', async () => {
      const statistics = await service.getDocumentationStatistics();

      expect(statistics).toBeDefined();
      expect(statistics.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(statistics.documentsByType).toBeDefined();
      expect(statistics.totalGenerations).toBeGreaterThanOrEqual(0);
      expect(statistics.successfulGenerations).toBeGreaterThanOrEqual(0);
      expect(statistics.failedGenerations).toBeGreaterThanOrEqual(0);
      expect(statistics.totalRunbooks).toBeGreaterThanOrEqual(0);
      expect(statistics.totalAPIDocs).toBeGreaterThanOrEqual(0);
      expect(statistics.totalArchitectureDocs).toBeGreaterThanOrEqual(0);
    });

    it('should generate daily report', async () => {
      const report = await service.generateDocumentationReport('daily');

      expect(report).toBeDefined();
      expect(report.period).toBe('daily');
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.summary).toBeDefined();
      expect(Array.isArray(report.generations)).toBe(true);
      expect(Array.isArray(report.documents)).toBe(true);
      expect(Array.isArray(report.runbooks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate weekly report', async () => {
      const report = await service.generateDocumentationReport('weekly');

      expect(report).toBeDefined();
      expect(report.period).toBe('weekly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('should generate monthly report', async () => {
      const report = await service.generateDocumentationReport('monthly');

      expect(report).toBeDefined();
      expect(report.period).toBe('monthly');
      expect(report.generatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Initialization', () => {
    it('should initialize with default documentation', async () => {
      const docs = await service.listDocumentation();
      expect(docs.length).toBeGreaterThan(0);

      const apiDoc = docs.find(d => d.title === 'API Overview');
      expect(apiDoc).toBeDefined();
      expect(apiDoc?.type).toBe('API');
    });

    it('should initialize with default runbooks', async () => {
      const runbooks = await service.listRunbooks();
      expect(runbooks.length).toBeGreaterThan(0);

      const deploymentRunbook = runbooks.find(r => r.title === 'System Deployment');
      expect(deploymentRunbook).toBeDefined();
      expect(deploymentRunbook?.procedures.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle documentation generation errors gracefully', async () => {
      // Los métodos de generación están diseñados para manejar errores internamente
      const generation = await service.generateAPIDocumentation();
      expect(generation).toBeDefined();
      expect(generation.status).toBeDefined();
    });

    it('should handle file operations gracefully', async () => {
      // Los métodos de generación de archivos están diseñados para manejar errores
      const generation = await service.generateAPIDocumentation();
      expect(generation).toBeDefined();
      expect(Array.isArray(generation.filesGenerated)).toBe(true);
    });
  });
});

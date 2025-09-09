import { logger } from './logger.js';
import { z } from 'zod';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';

// Schemas de validación
const DocumentationSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['API', 'ARCHITECTURE', 'USER_GUIDE', 'RUNBOOK', 'CHANGELOG', 'README']),
  version: z.string(),
  content: z.string(),
  metadata: z.record(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']),
  tags: z.array(z.string()),
  author: z.string(),
  reviewers: z.array(z.string()).optional()
});

const APIDocumentationSchema = z.object({
  id: z.string(),
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  description: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
    example: z.any().optional()
  })),
  responses: z.array(z.object({
    status: z.number(),
    description: z.string(),
    schema: z.any().optional()
  })),
  examples: z.array(z.object({
    request: z.any(),
    response: z.any(),
    description: z.string()
  })).optional()
});

const ArchitectureDocumentationSchema = z.object({
  id: z.string(),
  component: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()),
  interfaces: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string()
  })),
  diagrams: z.array(z.object({
    type: z.enum(['FLOWCHART', 'SEQUENCE', 'COMPONENT', 'DEPLOYMENT']),
    content: z.string(),
    format: z.enum(['Mermaid', 'PlantUML', 'SVG'])
  })).optional()
});

const RunbookSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  procedures: z.array(z.object({
    step: z.number(),
    title: z.string(),
    description: z.string(),
    commands: z.array(z.string()).optional(),
    expectedResult: z.string().optional(),
    troubleshooting: z.string().optional()
  })),
  prerequisites: z.array(z.string()),
  estimatedTime: z.string(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
});

// Tipos TypeScript
export type Documentation = z.infer<typeof DocumentationSchema>;
export type APIDocumentation = z.infer<typeof APIDocumentationSchema>;
export type ArchitectureDocumentation = z.infer<typeof ArchitectureDocumentationSchema>;
export type Runbook = z.infer<typeof RunbookSchema>;

export interface DocumentationConfig {
  outputDirectory: string;
  templatesDirectory: string;
  autoGenerate: boolean;
  versioning: boolean;
  reviewRequired: boolean;
  notificationChannels: string[];
  formats: string[];
  languages: string[];
}

export interface DocumentationGeneration {
  id: string;
  type: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  filesGenerated: string[];
  errors: string[];
  metadata: Record<string, any>;
}

export class AutomatedDocumentationService {
  private config: DocumentationConfig;
  private documentation: Map<string, Documentation> = new Map();
  private apiDocs: Map<string, APIDocumentation> = new Map();
  private architectureDocs: Map<string, ArchitectureDocumentation> = new Map();
  private runbooks: Map<string, Runbook> = new Map();
  private generations: Map<string, DocumentationGeneration> = new Map();

  constructor(config: DocumentationConfig) {
    this.config = config;
    this.initializeDefaultDocumentation();
  }

  // ===== GESTIÓN DE DOCUMENTACIÓN GENERAL =====

  async createDocumentation(doc: Omit<Documentation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Documentation> {
    const newDoc: Documentation = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.documentation.set(newDoc.id, newDoc);
    logger.info(`Documentation created: ${newDoc.id}`);

    return newDoc;
  }

  async getDocumentation(docId: string): Promise<Documentation | null> {
    return this.documentation.get(docId) || null;
  }

  async listDocumentation(type?: string): Promise<Documentation[]> {
    const docs = Array.from(this.documentation.values());
    return type ? docs.filter(doc => doc.type === type) : docs;
  }

  async updateDocumentation(docId: string, updates: Partial<Documentation>): Promise<Documentation | null> {
    const doc = this.documentation.get(docId);
    if (!doc) return null;

    const updatedDoc = {
      ...doc,
      ...updates,
      updatedAt: new Date()
    };
    this.documentation.set(docId, updatedDoc);
    logger.info(`Documentation updated: ${docId}`);

    return updatedDoc;
  }

  async deleteDocumentation(docId: string): Promise<boolean> {
    const deleted = this.documentation.delete(docId);
    if (deleted) {
      logger.info(`Documentation deleted: ${docId}`);
    }
    return deleted;
  }

  // ===== GENERACIÓN AUTOMÁTICA DE DOCUMENTACIÓN =====

  async generateAPIDocumentation(): Promise<DocumentationGeneration> {
    const generation: DocumentationGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'API',
      status: 'RUNNING',
      startTime: new Date(),
      filesGenerated: [],
      errors: [],
      metadata: {}
    };

    this.generations.set(generation.id, generation);

    try {
      logger.info(`Starting API documentation generation: ${generation.id}`);

      // Simular generación de documentación de API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar documentación para endpoints principales
      const apiEndpoints = await this.scanAPIEndpoints();

      for (const endpoint of apiEndpoints) {
        const apiDoc = await this.generateEndpointDocumentation(endpoint);
        this.apiDocs.set(apiDoc.id, apiDoc);
      }

      // Generar archivos de documentación
      const files = await this.generateAPIFiles();
      generation.filesGenerated = files;
      generation.status = 'COMPLETED';
      generation.endTime = new Date();

      logger.info(`API documentation generation completed: ${generation.id}`);

    } catch (error) {
      generation.status = 'FAILED';
      generation.endTime = new Date();
      generation.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error(`API documentation generation failed: ${generation.id}`, { error });
    }

    return generation;
  }

  async generateArchitectureDocumentation(): Promise<DocumentationGeneration> {
    const generation: DocumentationGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ARCHITECTURE',
      status: 'RUNNING',
      startTime: new Date(),
      filesGenerated: [],
      errors: [],
      metadata: {}
    };

    this.generations.set(generation.id, generation);

    try {
      logger.info(`Starting architecture documentation generation: ${generation.id}`);

      // Simular generación de documentación de arquitectura
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generar documentación de componentes
      const components = await this.scanArchitectureComponents();

      for (const component of components) {
        const archDoc = await this.generateComponentDocumentation(component);
        this.architectureDocs.set(archDoc.id, archDoc);
      }

      // Generar diagramas
      const diagrams = await this.generateArchitectureDiagrams();
      generation.metadata.diagrams = diagrams;

      // Generar archivos de documentación
      const files = await this.generateArchitectureFiles();
      generation.filesGenerated = files;
      generation.status = 'COMPLETED';
      generation.endTime = new Date();

      logger.info(`Architecture documentation generation completed: ${generation.id}`);

    } catch (error) {
      generation.status = 'FAILED';
      generation.endTime = new Date();
      generation.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error(`Architecture documentation generation failed: ${generation.id}`, { error });
    }

    return generation;
  }

  async generateUserGuides(): Promise<DocumentationGeneration> {
    const generation: DocumentationGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'USER_GUIDE',
      status: 'RUNNING',
      startTime: new Date(),
      filesGenerated: [],
      errors: [],
      metadata: {}
    };

    this.generations.set(generation.id, generation);

    try {
      logger.info(`Starting user guides generation: ${generation.id}`);

      // Simular generación de guías de usuario
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Generar guías para diferentes módulos
      const modules = await this.scanUserModules();

      for (const module of modules) {
        const userGuide = await this.generateModuleUserGuide(module);
        await this.createDocumentation({
          title: userGuide.title,
          type: 'USER_GUIDE',
          version: '1.0.0',
          content: userGuide.content,
          metadata: userGuide.metadata,
          status: 'DRAFT',
          tags: userGuide.tags,
          author: 'Automated Documentation System'
        });
      }

      // Generar archivos de documentación
      const files = await this.generateUserGuideFiles();
      generation.filesGenerated = files;
      generation.status = 'COMPLETED';
      generation.endTime = new Date();

      logger.info(`User guides generation completed: ${generation.id}`);

    } catch (error) {
      generation.status = 'FAILED';
      generation.endTime = new Date();
      generation.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error(`User guides generation failed: ${generation.id}`, { error });
    }

    return generation;
  }

  async generateRunbooks(): Promise<DocumentationGeneration> {
    const generation: DocumentationGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'RUNBOOK',
      status: 'RUNNING',
      startTime: new Date(),
      filesGenerated: [],
      errors: [],
      metadata: {}
    };

    this.generations.set(generation.id, generation);

    try {
      logger.info(`Starting runbooks generation: ${generation.id}`);

      // Simular generación de runbooks
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generar runbooks para diferentes procedimientos
      const procedures = await this.scanSystemProcedures();

      for (const procedure of procedures) {
        const runbook = await this.generateProcedureRunbook(procedure);
        this.runbooks.set(runbook.id, runbook);
      }

      // Generar archivos de documentación
      const files = await this.generateRunbookFiles();
      generation.filesGenerated = files;
      generation.status = 'COMPLETED';
      generation.endTime = new Date();

      logger.info(`Runbooks generation completed: ${generation.id}`);

    } catch (error) {
      generation.status = 'FAILED';
      generation.endTime = new Date();
      generation.errors.push(error instanceof Error ? error.message : 'Unknown error');
      logger.error(`Runbooks generation failed: ${generation.id}`, { error });
    }

    return generation;
  }

  async generateAllDocumentation(): Promise<DocumentationGeneration[]> {
    logger.info('Starting complete documentation generation');

    const generations = await Promise.allSettled([
      this.generateAPIDocumentation(),
      this.generateArchitectureDocumentation(),
      this.generateUserGuides(),
      this.generateRunbooks();
    ]);

    const results: DocumentationGeneration[] = [];

    for (const result of generations) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        logger.error('Documentation generation failed', { error: result.reason });
      }
    }

    logger.info(`Complete documentation generation finished: ${results.length} generations completed`);
    return results;
  }

  // ===== GESTIÓN DE RUNBOOKS =====

  async createRunbook(runbook: Omit<Runbook, 'id'>): Promise<Runbook> {
    const newRunbook: Runbook = {
      ...runbook,
      id: `runbook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.runbooks.set(newRunbook.id, newRunbook);
    logger.info(`Runbook created: ${newRunbook.id}`);

    return newRunbook;
  }

  async getRunbook(runbookId: string): Promise<Runbook | null> {
    return this.runbooks.get(runbookId) || null;
  }

  async listRunbooks(): Promise<Runbook[]> {
    return Array.from(this.runbooks.values());
  }

  async updateRunbook(runbookId: string, updates: Partial<Runbook>): Promise<Runbook | null> {
    const runbook = this.runbooks.get(runbookId);
    if (!runbook) return null;

    const updatedRunbook = { ...runbook, ...updates };
    this.runbooks.set(runbookId, updatedRunbook);
    logger.info(`Runbook updated: ${runbookId}`);

    return updatedRunbook;
  }

  async deleteRunbook(runbookId: string): Promise<boolean> {
    const deleted = this.runbooks.delete(runbookId);
    if (deleted) {
      logger.info(`Runbook deleted: ${runbookId}`);
    }
    return deleted;
  }

  // ===== GENERACIÓN DE ARCHIVOS =====

  async generateAPIFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      // Generar OpenAPI/Swagger spec
      const openAPISpec = await this.generateOpenAPISpec();
      const openAPIFile = path.join(this.config.outputDirectory, 'api', 'openapi.json');
      await this.writeFile(openAPIFile, JSON.stringify(openAPISpec, null, 2));
      files.push(openAPIFile);

      // Generar documentación HTML
      const htmlDoc = await this.generateAPIDocumentationHTML();
      const htmlFile = path.join(this.config.outputDirectory, 'api', 'index.html');
      await this.writeFile(htmlFile, htmlDoc);
      files.push(htmlFile);

      // Generar documentación Markdown
      const markdownDoc = await this.generateAPIDocumentationMarkdown();
      const markdownFile = path.join(this.config.outputDirectory, 'api', 'README.md');
      await this.writeFile(markdownFile, markdownDoc);
      files.push(markdownFile);

    } catch (error) {
      logger.error('Error generating API files', { error });
    }

    return files;
  }

  async generateArchitectureFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      // Generar documentación de arquitectura
      const archDoc = await this.generateArchitectureDocumentationHTML();
      const archFile = path.join(this.config.outputDirectory, 'architecture', 'index.html');
      await this.writeFile(archFile, archDoc);
      files.push(archFile);

      // Generar diagramas
      const diagrams = await this.generateArchitectureDiagrams();
      for (const diagram of diagrams) {
        const diagramFile = path.join(this.config.outputDirectory, 'architecture', 'diagrams', `${diagram.name}.${diagram.format.toLowerCase()}`);
        await this.writeFile(diagramFile, diagram.content);
        files.push(diagramFile);
      }

    } catch (error) {
      logger.error('Error generating architecture files', { error });
    }

    return files;
  }

  async generateUserGuideFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      // Generar guías de usuario
      const userGuides = await this.listDocumentation('USER_GUIDE');

      for (const guide of userGuides) {
        const guideFile = path.join(this.config.outputDirectory, 'user-guides', `${guide.id}.md`);
        await this.writeFile(guideFile, guide.content);
        files.push(guideFile);
      }

      // Generar índice de guías
      const indexContent = await this.generateUserGuideIndex();
      const indexFile = path.join(this.config.outputDirectory, 'user-guides', 'README.md');
      await this.writeFile(indexFile, indexContent);
      files.push(indexFile);

    } catch (error) {
      logger.error('Error generating user guide files', { error });
    }

    return files;
  }

  async generateRunbookFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
      // Generar runbooks
      const runbooks = await this.listRunbooks();

      for (const runbook of runbooks) {
        const runbookFile = path.join(this.config.outputDirectory, 'runbooks', `${runbook.id}.md`);
        const content = await this.generateRunbookContent(runbook);
        await this.writeFile(runbookFile, content);
        files.push(runbookFile);
      }

      // Generar índice de runbooks
      const indexContent = await this.generateRunbookIndex();
      const indexFile = path.join(this.config.outputDirectory, 'runbooks', 'README.md');
      await this.writeFile(indexFile, indexContent);
      files.push(indexFile);

    } catch (error) {
      logger.error('Error generating runbook files', { error });
    }

    return files;
  }

  // ===== MÉTODOS AUXILIARES =====

  private async scanAPIEndpoints(): Promise<any[]> {
    // Simular escaneo de endpoints de API
    return [;
      { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
      { path: '/api/users', method: 'GET', description: 'Get all users' },
      { path: '/api/users', method: 'POST', description: 'Create new user' },
      { path: '/api/users/:id', method: 'GET', description: 'Get user by ID' },
      { path: '/api/users/:id', method: 'PUT', description: 'Update user' },
      { path: '/api/users/:id', method: 'DELETE', description: 'Delete user' }
    ];
  }

  private async generateEndpointDocumentation(endpoint: any): Promise<APIDocumentation> {
    return {
      id: `api-${endpoint.path.replace(/[^a-zA-Z0-9]/g, '-')}-${endpoint.method.toLowerCase()}`,
      endpoint: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      parameters: [
        {
          name: 'id',
          type: 'string',
          required: endpoint.path.includes(':id'),
          description: 'User identifier',
          example: 'user-123'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Success',
          schema: { type: 'object' }
        },
        {
          status: 404,
          description: 'Not found'
        }
      ],
      examples: [
        {
          request: { id: 'user-123' },
          response: { id: 'user-123', name: 'John Doe' },
          description: 'Example request and response'
        }
      ]
    };
  }

  private async scanArchitectureComponents(): Promise<any[]> {
    // Simular escaneo de componentes de arquitectura
    return [;
      { name: 'API Gateway', description: 'Main API gateway component' },
      { name: 'User Service', description: 'User management service' },
      { name: 'Database', description: 'Main database component' },
      { name: 'Cache Layer', description: 'Redis cache layer' }
    ];
  }

  private async generateComponentDocumentation(component: any): Promise<ArchitectureDocumentation> {
    return {
      id: `arch-${component.name.toLowerCase().replace(/\s+/g, '-')}`,
      component: component.name,
      description: component.description,
      dependencies: ['Database', 'Cache Layer'],
      interfaces: [
        {
          name: 'REST API',
          type: 'HTTP',
          description: 'RESTful API interface'
        }
      ],
      diagrams: [
        {
          type: 'COMPONENT',
          content: `graph TD\n    A[${component.name}] --> B[Database]\n    A --> C[Cache Layer]`,
          format: 'Mermaid'
        }
      ]
    };
  }

  private async scanUserModules(): Promise<any[]> {
    // Simular escaneo de módulos de usuario
    return [;
      { name: 'User Management', description: 'User management module' },
      { name: 'Inventory', description: 'Inventory management module' },
      { name: 'Reports', description: 'Reporting module' }
    ];
  }

  private async generateModuleUserGuide(module: any): Promise<any> {
    return {
      title: `${module.name} User Guide`,
      content: `# ${module.name} User Guide\n\n${module.description}\n\n## Getting Started\n\nThis guide will help you get started with ${module.name}.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Usage\n\nDetailed usage instructions...`,
      metadata: { module: module.name },
      tags: ['user-guide', module.name.toLowerCase()]
    };
  }

  private async scanSystemProcedures(): Promise<any[]> {
    // Simular escaneo de procedimientos del sistema
    return [;
      { name: 'Deployment', description: 'System deployment procedure' },
      { name: 'Backup', description: 'System backup procedure' },
      { name: 'Monitoring', description: 'System monitoring setup' }
    ];
  }

  private async generateProcedureRunbook(procedure: any): Promise<Runbook> {
    return {
      id: `runbook-${procedure.name.toLowerCase().replace(/\s+/g, '-')}`,
      title: `${procedure.name} Runbook`,
      description: procedure.description,
      procedures: [
        {
          step: 1,
          title: 'Preparation',
          description: 'Prepare the system for the procedure',
          commands: ['npm install', 'npm run build'],
          expectedResult: 'System is ready',
          troubleshooting: 'Check logs if errors occur'
        },
        {
          step: 2,
          title: 'Execution',
          description: 'Execute the main procedure',
          commands: ['npm run deploy'],
          expectedResult: 'Procedure completed successfully',
          troubleshooting: 'Rollback if deployment fails'
        }
      ],
      prerequisites: ['Node.js installed', 'Database configured'],
      estimatedTime: '30 minutes',
      difficulty: 'INTERMEDIATE'
    };
  }

  private async generateOpenAPISpec(): Promise<any> {
    const apiDocs = Array.from(this.apiDocs.values());

    return {
      openapi: '3.0.0',
      info: {
        title: 'ECONEURA API',
        version: '1.0.0',
        description: 'Automated API documentation'
      },
      paths: apiDocs.reduce((paths, doc) => {
        if (!paths[doc.endpoint]) {
          paths[doc.endpoint] = {};
        }
        paths[doc.endpoint][doc.method.toLowerCase()] = {
          summary: doc.description,
          parameters: doc.parameters,
          responses: doc.responses.reduce((responses, response) => {
            responses[response.status] = {
              description: response.description,
              content: response.schema ? {
                'application/json': {
                  schema: response.schema
                }
              } : undefined
            };
            return responses;
          }, {} as any)
        };
        return paths;
      }, {} as any)
    };
  }

  private async generateAPIDocumentationHTML(): Promise<string> {
    const apiDocs = Array.from(this.apiDocs.values());

    return `;
<!DOCTYPE html>
<html>
<head>
    <title>ECONEURA API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .endpoint { border: 1px solid #ddd; margin: 20px 0; padding: 20px; }
        .method { font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <h1>ECONEURA API Documentation</h1>
    <p>Automatically generated API documentation</p>

    ${apiDocs.map(doc => `
        <div class="endpoint">
            <h2><span class="method">${doc.method}</span> ${doc.endpoint}</h2>
            <p>${doc.description}</p>
            <h3>Parameters</h3>
            <ul>
                ${doc.parameters.map(param => `
                    <li><strong>${param.name}</strong> (${param.type}) - ${param.description} ${param.required ? '(required)' : '(optional)'}</li>
                `).join('')}
            </ul>
            <h3>Responses</h3>
            <ul>
                ${doc.responses.map(response => `
                    <li><strong>${response.status}</strong> - ${response.description}</li>
                `).join('')}
            </ul>
        </div>
    `).join('')}
</body>
</html>`;
  }

  private async generateAPIDocumentationMarkdown(): Promise<string> {
    const apiDocs = Array.from(this.apiDocs.values());

    return `# ECONEURA API Documentation;

Automatically generated API documentation

${apiDocs.map(doc => `
## ${doc.method} ${doc.endpoint}

${doc.description}

### Parameters

${doc.parameters.map(param => `- **${param.name}** (${param.type}) - ${param.description} ${param.required ? '(required)' : '(optional)'}`).join('\n')}

### Responses

${doc.responses.map(response => `- **${response.status}** - ${response.description}`).join('\n')}

---
`).join('')}`;
  }

  private async generateArchitectureDocumentationHTML(): Promise<string> {
    const archDocs = Array.from(this.architectureDocs.values());

    return `;
<!DOCTYPE html>
<html>
<head>
    <title>ECONEURA Architecture Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .component { border: 1px solid #ddd; margin: 20px 0; padding: 20px; }
    </style>
</head>
<body>
    <h1>ECONEURA Architecture Documentation</h1>
    <p>Automatically generated architecture documentation</p>

    ${archDocs.map(doc => `
        <div class="component">
            <h2>${doc.component}</h2>
            <p>${doc.description}</p>
            <h3>Dependencies</h3>
            <ul>
                ${doc.dependencies.map(dep => `<li>${dep}</li>`).join('')}
            </ul>
            <h3>Interfaces</h3>
            <ul>
                ${doc.interfaces.map(iface => `<li><strong>${iface.name}</strong> (${iface.type}) - ${iface.description}</li>`).join('')}
            </ul>
        </div>
    `).join('')}
</body>
</html>`;
  }

  private async generateArchitectureDiagrams(): Promise<any[]> {
    return [;
      {
        name: 'system-overview',
        content: `graph TD\n    A[API Gateway] --> B[User Service]\n    A --> C[Inventory Service]\n    B --> D[Database]\n    C --> D\n    B --> E[Cache Layer]\n    C --> E`,
        format: 'Mermaid'
      },
      {
        name: 'deployment',
        content: `graph LR\n    A[Load Balancer] --> B[App Server 1]\n    A --> C[App Server 2]\n    B --> D[Database]\n    C --> D`,
        format: 'Mermaid'
      }
    ];
  }

  private async generateUserGuideIndex(): Promise<string> {
    const userGuides = await this.listDocumentation('USER_GUIDE');

    return `# User Guides;

This directory contains user guides for different modules of the ECONEURA system.

## Available Guides

${userGuides.map(guide => `- [${guide.title}](./${guide.id}.md) - ${guide.metadata.description || 'User guide'}`).join('\n')}

## Getting Started

1. Choose the guide for the module you want to learn about
2. Follow the step-by-step instructions
3. Contact support if you need help

## Support

For additional help, please contact the support team.`;
  }

  private async generateRunbookIndex(): Promise<string> {
    const runbooks = await this.listRunbooks();

    return `# Runbooks;

This directory contains operational runbooks for the ECONEURA system.

## Available Runbooks

${runbooks.map(runbook => `- [${runbook.title}](./${runbook.id}.md) - ${runbook.description} (${runbook.difficulty})`).join('\n')}

## Usage

1. Select the appropriate runbook for your task
2. Review prerequisites and estimated time
3. Follow the step-by-step procedures
4. Contact the operations team if issues arise

## Emergency Procedures

For emergency situations, follow the emergency runbooks and contact the on-call engineer.`;
  }

  private async generateRunbookContent(runbook: Runbook): Promise<string> {
    return `# ${runbook.title}

${runbook.description}

## Prerequisites

${runbook.prerequisites.map(prereq => `- ${prereq}`).join('\n')}

## Estimated Time

${runbook.estimatedTime}

## Difficulty Level

${runbook.difficulty}

## Procedures

${runbook.procedures.map(proc => `
### Step ${proc.step}: ${proc.title}

${proc.description}

${proc.commands ? `
**Commands:**
\`\`\`bash
${proc.commands.join('\n')}
\`\`\`
` : ''}

**Expected Result:** ${proc.expectedResult || 'Procedure completed successfully'}

${proc.troubleshooting ? `
**Troubleshooting:** ${proc.troubleshooting}
` : ''}
`).join('')}

## Support

If you encounter issues during this procedure, contact the operations team.`;
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(filePath);
      await mkdir(dir, { recursive: true });

      // Escribir archivo
      await writeFile(filePath, content, 'utf8');
      logger.info(`File written: ${filePath}`);
    } catch (error) {
      logger.error(`Error writing file: ${filePath}`, { error });
      throw error;
    }
  }

  // ===== ESTADÍSTICAS Y REPORTES =====

  async getDocumentationStatistics(): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    totalGenerations: number;
    successfulGenerations: number;
    failedGenerations: number;
    lastGeneration: Date | null;
    totalRunbooks: number;
    totalAPIDocs: number;
    totalArchitectureDocs: number;
  }> {
    const documents = Array.from(this.documentation.values());
    const generations = Array.from(this.generations.values());
    const runbooks = Array.from(this.runbooks.values());
    const apiDocs = Array.from(this.apiDocs.values());
    const archDocs = Array.from(this.architectureDocs.values());

    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const successfulGenerations = generations.filter(g => g.status === 'COMPLETED').length;
    const failedGenerations = generations.filter(g => g.status === 'FAILED').length;

    const lastGeneration = generations.length > 0
      ? new Date(Math.max(...generations.map(g => g.startTime.getTime())))
      : null;

    return {
      totalDocuments: documents.length,
      documentsByType,
      totalGenerations: generations.length,
      successfulGenerations,
      failedGenerations,
      lastGeneration,
      totalRunbooks: runbooks.length,
      totalAPIDocs: apiDocs.length,
      totalArchitectureDocs: archDocs.length
    };
  }

  async generateDocumentationReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    generatedAt: Date;
    summary: any;
    generations: DocumentationGeneration[];
    documents: Documentation[];
    runbooks: Runbook[];
    recommendations: string[];
  }> {
    const now = new Date();
    const periodMs = this.getPeriodMs(period);
    const cutoffDate = new Date(now.getTime() - periodMs);

    const periodGenerations = Array.from(this.generations.values())
      .filter(g => g.startTime >= cutoffDate);

    const periodDocuments = Array.from(this.documentation.values())
      .filter(d => d.createdAt >= cutoffDate);

    const allRunbooks = Array.from(this.runbooks.values());

    const summary = {
      totalGenerations: periodGenerations.length,
      successfulGenerations: periodGenerations.filter(g => g.status === 'COMPLETED').length,
      failedGenerations: periodGenerations.filter(g => g.status === 'FAILED').length,
      totalDocuments: periodDocuments.length,
      totalRunbooks: allRunbooks.length,
      successRate: periodGenerations.length > 0
        ? (periodGenerations.filter(g => g.status === 'COMPLETED').length / periodGenerations.length) * 100
        : 0
    };

    const recommendations = this.generateDocumentationRecommendations(summary, periodGenerations);

    return {
      period,
      generatedAt: now,
      summary,
      generations: periodGenerations,
      documents: periodDocuments,
      runbooks: allRunbooks,
      recommendations
    };
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private generateDocumentationRecommendations(summary: any, generations: DocumentationGeneration[]): string[] {
    const recommendations: string[] = [];

    if (summary.successRate < 90) {
      recommendations.push('Documentation generation success rate is below 90%. Review failed generations and improve reliability.');
    }

    const failedGenerations = generations.filter(g => g.status === 'FAILED');
    if (failedGenerations.length > 0) {
      recommendations.push(`${failedGenerations.length} documentation generations failed. Review error logs and fix issues.`);
    }

    if (summary.totalDocuments === 0) {
      recommendations.push('No new documents were created in this period. Consider scheduling regular documentation updates.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Documentation system is performing well. Continue regular maintenance.');
    }

    return recommendations;
  }

  // ===== INICIALIZACIÓN =====

  private initializeDefaultDocumentation(): void {
    // Crear documentación por defecto
    const defaultDocs: Documentation[] = [
      {
        id: 'doc-1',
        title: 'API Overview',
        type: 'API',
        version: '1.0.0',
        content: '# API Overview\n\nThis document provides an overview of the ECONEURA API.',
        metadata: { description: 'API overview documentation' },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PUBLISHED',
        tags: ['api', 'overview'],
        author: 'System'
      },
      {
        id: 'doc-2',
        title: 'System Architecture',
        type: 'ARCHITECTURE',
        version: '1.0.0',
        content: '# System Architecture\n\nThis document describes the system architecture.',
        metadata: { description: 'System architecture documentation' },
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PUBLISHED',
        tags: ['architecture', 'system'],
        author: 'System'
      }
    ];

    defaultDocs.forEach(doc => {
      this.documentation.set(doc.id, doc);
    });

    // Crear runbooks por defecto
    const defaultRunbooks: Runbook[] = [
      {
        id: 'runbook-1',
        title: 'System Deployment',
        description: 'Complete system deployment procedure',
        procedures: [
          {
            step: 1,
            title: 'Pre-deployment checks',
            description: 'Verify system requirements and dependencies',
            commands: ['npm install', 'npm run test'],
            expectedResult: 'All tests pass',
            troubleshooting: 'Fix failing tests before proceeding'
          },
          {
            step: 2,
            title: 'Deploy application',
            description: 'Deploy the application to production',
            commands: ['npm run build', 'npm run deploy'],
            expectedResult: 'Application deployed successfully',
            troubleshooting: 'Check deployment logs for errors'
          }
        ],
        prerequisites: ['Node.js 18+', 'Database configured', 'Environment variables set'],
        estimatedTime: '45 minutes',
        difficulty: 'INTERMEDIATE'
      }
    ];

    defaultRunbooks.forEach(runbook => {
      this.runbooks.set(runbook.id, runbook);
    });
  }
}

export default AutomatedDocumentationService;

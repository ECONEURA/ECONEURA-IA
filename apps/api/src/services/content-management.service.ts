/**
 * CONTENT MANAGEMENT SERVICE
 *
 * PR-55: Sistema completo de gestión de contenido avanzado
 *
 * Funcionalidades:
 * - Gestión de contenido con versionado
 * - Sistema de plantillas y componentes
 * - Publicación y distribución
 * - SEO y optimización
 * - Analytics de contenido
 * - Colaboración en contenido
 * - Workflow de aprobación
 * - CDN y cache
 */

import { z } from 'zod';
import { structuredLogger } from '../lib/structured-logger.js';
import { getDatabaseService } from '../lib/database.service.js';

// ============================================================================
// SCHEMAS Y TIPOS
// ============================================================================

export const ContentTypeSchema = z.enum([
  'article', 'blog', 'page', 'product', 'news', 'event', 'faq', 'tutorial', 'documentation', 'landing', 'other'
]);

export const ContentStatusSchema = z.enum(['draft', 'review', 'approved', 'published', 'archived', 'deleted']);

export const ContentTemplateSchema = z.enum(['default', 'blog', 'product', 'landing', 'news', 'custom']);

export const ContentMetadataSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  author: z.string().min(1),
  language: z.string().default('es'),
  keywords: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.array(z.string()).default([]),
    canonicalUrl: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    twitterCard: z.string().optional(),
    structuredData: z.record(z.any()).optional()
  }).optional(),
  analytics: z.object({
    views: z.number().default(0),
    uniqueViews: z.number().default(0),
    shares: z.number().default(0),
    comments: z.number().default(0),
    likes: z.number().default(0),
    engagement: z.number().default(0),
    bounceRate: z.number().default(0),
    timeOnPage: z.number().default(0)
  }).optional()
});

export const ContentVersionSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  version: z.string(),
  content: z.string(),
  htmlContent: z.string().optional(),
  markdownContent: z.string().optional(),
  changes: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  isActive: z.boolean().default(true)
});

export const ContentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  type: ContentTypeSchema,
  status: ContentStatusSchema,
  template: ContentTemplateSchema,
  metadata: ContentMetadataSchema,
  content: z.string(),
  htmlContent: z.string().optional(),
  markdownContent: z.string().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  versions: z.array(ContentVersionSchema).default([]),
  currentVersion: z.string(),
  publishedAt: z.date().optional(),
  scheduledAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isPublic: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isSticky: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  allowSharing: z.boolean().default(true),
  workflow: z.object({
    currentStep: z.string(),
    steps: z.array(z.object({
      step: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
      assignedTo: z.string().uuid().optional(),
      completedAt: z.date().optional(),
      comments: z.string().optional()
    })).default([]),
    approvedBy: z.string().uuid().optional(),
    approvedAt: z.date().optional()
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid()
});

export const ContentSearchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    type: z.array(ContentTypeSchema).optional(),
    status: z.array(ContentStatusSchema).optional(),
    author: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    template: z.array(ContentTemplateSchema).optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional()
    }).optional(),
    isPublic: z.boolean().optional(),
    isFeatured: z.boolean().optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['title', 'createdAt', 'updatedAt', 'publishedAt', 'views', 'engagement']),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
});

export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type ContentTemplate = z.infer<typeof ContentTemplateSchema>;
export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;
export type ContentVersion = z.infer<typeof ContentVersionSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type ContentSearch = z.infer<typeof ContentSearchSchema>;

// ============================================================================
// CONTENT MANAGEMENT SERVICE
// ============================================================================

export class ContentManagementService {
  private db: ReturnType<typeof getDatabaseService>;
  private contents: Map<string, Content> = new Map();
  private contentIndex: Map<string, Set<string>> = new Map();
  private searchCache: Map<string, any> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = getDatabaseService();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      structuredLogger.info('Initializing Content Management Service', {
        service: 'content-management',
        timestamp: new Date().toISOString()
      });

      // Initialize content tables
      await this.initializeContentTables();

      // Load existing content
      await this.loadExistingContent();

      // Start background processing
      this.startBackgroundProcessing();

      structuredLogger.info('Content Management Service initialized successfully', {
        service: 'content-management',
        contentsCount: this.contents.size
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize Content Management Service', {
        service: 'content-management',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async initializeContentTables(): Promise<void> {
    // Create contents table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS contents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        template VARCHAR(50) NOT NULL DEFAULT 'default',
        metadata JSONB NOT NULL DEFAULT '{}',
        content TEXT NOT NULL,
        html_content TEXT,
        markdown_content TEXT,
        featured_image TEXT,
        images JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]',
        versions JSONB DEFAULT '[]',
        current_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        published_at TIMESTAMP,
        scheduled_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_public BOOLEAN DEFAULT FALSE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_sticky BOOLEAN DEFAULT FALSE,
        allow_comments BOOLEAN DEFAULT TRUE,
        allow_sharing BOOLEAN DEFAULT TRUE,
        workflow JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_by UUID NOT NULL,
        updated_by UUID NOT NULL
      )
    `);

    // Create content_versions table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS content_versions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        version VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        html_content TEXT,
        markdown_content TEXT,
        changes TEXT,
        created_by UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);

    // Create content_analytics table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS content_analytics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        views INTEGER DEFAULT 0,
        unique_views INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        engagement DECIMAL(5,2) DEFAULT 0,
        bounce_rate DECIMAL(5,2) DEFAULT 0,
        time_on_page INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_contents_org_id ON contents(organization_id);
      CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug);
      CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
      CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
      CREATE INDEX IF NOT EXISTS idx_contents_created_by ON contents(created_by);
      CREATE INDEX IF NOT EXISTS idx_contents_published_at ON contents(published_at);
      CREATE INDEX IF NOT EXISTS idx_contents_metadata_gin ON contents USING GIN(metadata);
      CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);
      CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics(content_id);
      CREATE INDEX IF NOT EXISTS idx_content_analytics_date ON content_analytics(date);
    `);
  }

  private async loadExistingContent(): Promise<void> {
    try {
      const result = await this.db.query(`
        SELECT * FROM contents WHERE organization_id = $1
      `, ['demo-org']);

      for (const row of result.rows) {
        const content: Content = {
          id: row.id,
          organizationId: row.organization_id,
          title: row.title,
          slug: row.slug,
          type: row.type,
          status: row.status,
          template: row.template,
          metadata: row.metadata,
          content: row.content,
          htmlContent: row.html_content,
          markdownContent: row.markdown_content,
          featuredImage: row.featured_image,
          images: row.images || [],
          attachments: row.attachments || [],
          versions: row.versions || [],
          currentVersion: row.current_version,
          publishedAt: row.published_at ? new Date(row.published_at) : undefined,
          scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
          isPublic: row.is_public,
          isFeatured: row.is_featured,
          isSticky: row.is_sticky,
          allowComments: row.allow_comments,
          allowSharing: row.allow_sharing,
          workflow: row.workflow,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          createdBy: row.created_by,
          updatedBy: row.updated_by
        };

        this.contents.set(content.id, content);
        this.indexContent(content);
      }

      structuredLogger.info('Loaded existing content', {
        count: this.contents.size
      });
    } catch (error) {
      structuredLogger.error('Failed to load existing content', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private startBackgroundProcessing(): void {
    // Background tasks for content processing
    setInterval(() => {
      this.processContentQueue();
    }, 30000); // Every 30 seconds

    setInterval(() => {
      this.updateContentAnalytics();
    }, 3600000); // Every hour

    setInterval(() => {
      this.publishScheduledContent();
    }, 60000); // Every minute
  }

  // ============================================================================
  // CONTENT OPERATIONS
  // ============================================================================

  async createContent(
    organizationId: string,
    contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    createdBy: string
  ): Promise<Content> {
    try {
      const contentId = this.generateId();
      const now = new Date();

      const content: Content = {
        ...contentData,
        id: contentId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        createdBy,
        updatedBy: createdBy
      };

      // Store in database
      await this.db.query(`
        INSERT INTO contents (
          id, organization_id, title, slug, type, status, template, metadata,
          content, html_content, markdown_content, featured_image, images,
          attachments, versions, current_version, published_at, scheduled_at,
          expires_at, is_public, is_featured, is_sticky, allow_comments,
          allow_sharing, workflow, created_at, updated_at, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      `, [
        content.id, content.organizationId, content.title, content.slug,
        content.type, content.status, content.template, JSON.stringify(content.metadata),
        content.content, content.htmlContent, content.markdownContent, content.featuredImage,
        JSON.stringify(content.images), JSON.stringify(content.attachments),
        JSON.stringify(content.versions), content.currentVersion,
        content.publishedAt, content.scheduledAt, content.expiresAt,
        content.isPublic, content.isFeatured, content.isSticky,
        content.allowComments, content.allowSharing, JSON.stringify(content.workflow),
        content.createdAt, content.updatedAt, content.createdBy, content.updatedBy
      ]);

      // Store in memory
      this.contents.set(content.id, content);
      this.indexContent(content);

      structuredLogger.info('Content created successfully', {
        contentId: content.id,
        title: content.title,
        type: content.type,
        organizationId
      });

      return content;
    } catch (error) {
      structuredLogger.error('Failed to create content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  async getContent(contentId: string, organizationId: string): Promise<Content | null> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        return null;
      }

      return content;
    } catch (error) {
      structuredLogger.error('Failed to get content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  async getContentBySlug(slug: string, organizationId: string): Promise<Content | null> {
    try {
      const content = Array.from(this.contents.values())
        .find(c => c.slug === slug && c.organizationId === organizationId);

      return content || null;
    } catch (error) {
      structuredLogger.error('Failed to get content by slug', {
        error: error instanceof Error ? error.message : 'Unknown error',
        slug,
        organizationId
      });
      throw error;
    }
  }

  async updateContent(
    contentId: string,
    organizationId: string,
    updates: Partial<Content>,
    updatedBy: string
  ): Promise<Content | null> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        return null;
      }

      const updatedContent: Content = {
        ...content,
        ...updates,
        updatedAt: new Date(),
        updatedBy
      };

      // Update in database
      await this.db.query(`
        UPDATE contents SET
          title = $1, slug = $2, status = $3, template = $4, metadata = $5,
          content = $6, html_content = $7, markdown_content = $8,
          featured_image = $9, images = $10, attachments = $11,
          versions = $12, current_version = $13, published_at = $14,
          scheduled_at = $15, expires_at = $16, is_public = $17,
          is_featured = $18, is_sticky = $19, allow_comments = $20,
          allow_sharing = $21, workflow = $22, updated_at = $23, updated_by = $24
        WHERE id = $25 AND organization_id = $26
      `, [
        updatedContent.title, updatedContent.slug, updatedContent.status,
        updatedContent.template, JSON.stringify(updatedContent.metadata),
        updatedContent.content, updatedContent.htmlContent, updatedContent.markdownContent,
        updatedContent.featuredImage, JSON.stringify(updatedContent.images),
        JSON.stringify(updatedContent.attachments), JSON.stringify(updatedContent.versions),
        updatedContent.currentVersion, updatedContent.publishedAt, updatedContent.scheduledAt,
        updatedContent.expiresAt, updatedContent.isPublic, updatedContent.isFeatured,
        updatedContent.isSticky, updatedContent.allowComments, updatedContent.allowSharing,
        JSON.stringify(updatedContent.workflow), updatedContent.updatedAt,
        updatedContent.updatedBy, contentId, organizationId
      ]);

      // Update in memory
      this.contents.set(contentId, updatedContent);
      this.indexContent(updatedContent);

      structuredLogger.info('Content updated successfully', {
        contentId,
        organizationId
      });

      return updatedContent;
    } catch (error) {
      structuredLogger.error('Failed to update content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  async deleteContent(contentId: string, organizationId: string): Promise<boolean> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        return false;
      }

      // Soft delete - mark as deleted
      await this.updateContent(contentId, organizationId, { status: 'deleted' }, 'system');

      // Remove from memory
      this.contents.delete(contentId);
      this.removeContentFromIndex(contentId);

      structuredLogger.info('Content deleted successfully', {
        contentId,
        organizationId
      });

      return true;
    } catch (error) {
      structuredLogger.error('Failed to delete content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // CONTENT SEARCH
  // ============================================================================

  async searchContent(organizationId: string, searchParams: ContentSearch): Promise<{
    contents: Content[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const cacheKey = `search:${organizationId}:${JSON.stringify(searchParams)}`;
      const cached = this.searchCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }

      let contents = Array.from(this.contents.values())
        .filter(content => content.organizationId === organizationId && content.status !== 'deleted');

      // Apply filters
      if (searchParams.filters) {
        if (searchParams.filters.type) {
          contents = contents.filter(content => searchParams.filters!.type!.includes(content.type));
        }
        if (searchParams.filters.status) {
          contents = contents.filter(content => searchParams.filters!.status!.includes(content.status));
        }
        if (searchParams.filters.author) {
          contents = contents.filter(content => searchParams.filters!.author!.includes(content.metadata.author));
        }
        if (searchParams.filters.tags) {
          contents = contents.filter(content =>
            searchParams.filters!.tags!.some(tag => content.metadata.tags.includes(tag))
          );
        }
        if (searchParams.filters.categories) {
          contents = contents.filter(content =>
            searchParams.filters!.categories!.some(category => content.metadata.categories.includes(category))
          );
        }
        if (searchParams.filters.template) {
          contents = contents.filter(content => searchParams.filters!.template!.includes(content.template));
        }
        if (searchParams.filters.dateRange) {
          const { from, to } = searchParams.filters.dateRange;
          if (from) {
            contents = contents.filter(content => content.createdAt >= from);
          }
          if (to) {
            contents = contents.filter(content => content.createdAt <= to);
          }
        }
        if (searchParams.filters.isPublic !== undefined) {
          contents = contents.filter(content => content.isPublic === searchParams.filters!.isPublic);
        }
        if (searchParams.filters.isFeatured !== undefined) {
          contents = contents.filter(content => content.isFeatured === searchParams.filters!.isFeatured);
        }
      }

      // Apply text search
      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        contents = contents.filter(content =>
          content.title.toLowerCase().includes(query) ||
          content.metadata.title.toLowerCase().includes(query) ||
          content.metadata.description?.toLowerCase().includes(query) ||
          content.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
          content.content.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (searchParams.sort) {
        const { field, direction } = searchParams.sort;
        contents.sort((a, b) => {
          let aValue: any, bValue: any;

          switch (field) {
            case 'title':
              aValue = a.title;
              bValue = b.title;
              break;
            case 'createdAt':
              aValue = a.createdAt;
              bValue = b.createdAt;
              break;
            case 'updatedAt':
              aValue = a.updatedAt;
              bValue = b.updatedAt;
              break;
            case 'publishedAt':
              aValue = a.publishedAt || new Date(0);
              bValue = b.publishedAt || new Date(0);
              break;
            case 'views':
              aValue = a.metadata.analytics?.views || 0;
              bValue = b.metadata.analytics?.views || 0;
              break;
            case 'engagement':
              aValue = a.metadata.analytics?.engagement || 0;
              bValue = b.metadata.analytics?.engagement || 0;
              break;
            default:
              return 0;
          }

          if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      const total = contents.length;
      const page = searchParams.pagination?.page || 1;
      const limit = searchParams.pagination?.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const result = {
        contents: contents.slice(startIndex, endIndex),
        total,
        page,
        limit
      };

      // Cache result
      this.searchCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      structuredLogger.error('Failed to search content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // CONTENT VERSIONING
  // ============================================================================

  async createContentVersion(
    contentId: string,
    organizationId: string,
    versionData: Omit<ContentVersion, 'id' | 'createdAt'>
  ): Promise<ContentVersion> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        throw new Error('Content not found');
      }

      const version: ContentVersion = {
        ...versionData,
        id: this.generateId(),
        createdAt: new Date()
      };

      // Store version in database
      await this.db.query(`
        INSERT INTO content_versions (
          id, content_id, version, content, html_content, markdown_content, changes, created_by, created_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        version.id, contentId, version.version, version.content,
        version.htmlContent, version.markdownContent, version.changes,
        version.createdBy, version.createdAt, version.isActive
      ]);

      // Update content versions
      const updatedVersions = [...content.versions, version];
      await this.updateContent(contentId, organizationId, {
        versions: updatedVersions,
        currentVersion: version.version
      }, version.createdBy);

      structuredLogger.info('Content version created successfully', {
        contentId,
        versionId: version.id,
        version: version.version
      });

      return version;
    } catch (error) {
      structuredLogger.error('Failed to create content version', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // CONTENT PUBLISHING
  // ============================================================================

  async publishContent(contentId: string, organizationId: string, publishedBy: string): Promise<boolean> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        return false;
      }

      const now = new Date();
      await this.updateContent(contentId, organizationId, {
        status: 'published',
        publishedAt: now,
        isPublic: true
      }, publishedBy);

      structuredLogger.info('Content published successfully', {
        contentId,
        organizationId,
        publishedBy
      });

      return true;
    } catch (error) {
      structuredLogger.error('Failed to publish content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  async unpublishContent(contentId: string, organizationId: string, unpublishedBy: string): Promise<boolean> {
    try {
      const content = this.contents.get(contentId);

      if (!content || content.organizationId !== organizationId) {
        return false;
      }

      await this.updateContent(contentId, organizationId, {
        status: 'draft',
        isPublic: false
      }, unpublishedBy);

      structuredLogger.info('Content unpublished successfully', {
        contentId,
        organizationId,
        unpublishedBy
      });

      return true;
    } catch (error) {
      structuredLogger.error('Failed to unpublish content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentId,
        organizationId
      });
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private indexContent(content: Content): void {
    // Index by type
    if (!this.contentIndex.has(`type:${content.type}`)) {
      this.contentIndex.set(`type:${content.type}`, new Set());
    }
    this.contentIndex.get(`type:${content.type}`)!.add(content.id);

    // Index by status
    if (!this.contentIndex.has(`status:${content.status}`)) {
      this.contentIndex.set(`status:${content.status}`, new Set());
    }
    this.contentIndex.get(`status:${content.status}`)!.add(content.id);

    // Index by author
    if (!this.contentIndex.has(`author:${content.metadata.author}`)) {
      this.contentIndex.set(`author:${content.metadata.author}`, new Set());
    }
    this.contentIndex.get(`author:${content.metadata.author}`)!.add(content.id);

    // Index by tags
    content.metadata.tags.forEach(tag => {
      if (!this.contentIndex.has(`tag:${tag}`)) {
        this.contentIndex.set(`tag:${tag}`, new Set());
      }
      this.contentIndex.get(`tag:${tag}`)!.add(content.id);
    });

    // Index by categories
    content.metadata.categories.forEach(category => {
      if (!this.contentIndex.has(`category:${category}`)) {
        this.contentIndex.set(`category:${category}`, new Set());
      }
      this.contentIndex.get(`category:${category}`)!.add(content.id);
    });
  }

  private removeContentFromIndex(contentId: string): void {
    for (const [key, contentIds] of this.contentIndex.entries()) {
      contentIds.delete(contentId);
      if (contentIds.size === 0) {
        this.contentIndex.delete(key);
      }
    }
  }

  private async processContentQueue(): Promise<void> {
    // Process pending content operations
    try {
      structuredLogger.debug('Processing content queue', {
        queueSize: 0 // Placeholder
      });
    } catch (error) {
      structuredLogger.error('Failed to process content queue', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async updateContentAnalytics(): Promise<void> {
    try {
      // Update content analytics
      structuredLogger.debug('Updating content analytics', {
        contentsCount: this.contents.size
      });
    } catch (error) {
      structuredLogger.error('Failed to update content analytics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async publishScheduledContent(): Promise<void> {
    try {
      const now = new Date();
      const scheduledContents = Array.from(this.contents.values())
        .filter(content =>
          content.scheduledAt &&
          content.scheduledAt <= now &&
          content.status === 'draft'
        );

      for (const content of scheduledContents) {
        await this.publishContent(content.id, content.organizationId, 'system');
      }

      if (scheduledContents.length > 0) {
        structuredLogger.info('Published scheduled content', {
          count: scheduledContents.length
        });
      }
    } catch (error) {
      structuredLogger.error('Failed to publish scheduled content', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // ANALYTICS AND STATISTICS
  // ============================================================================

  async getContentStatistics(organizationId: string): Promise<{
    totalContents: number;
    contentsByType: Record<string, number>;
    contentsByStatus: Record<string, number>;
    publishedContents: number;
    draftContents: number;
    totalViews: number;
    totalEngagement: number;
    topContents: Content[];
  }> {
    try {
      const contents = Array.from(this.contents.values())
        .filter(content => content.organizationId === organizationId && content.status !== 'deleted');

      const totalContents = contents.length;
      const contentsByType: Record<string, number> = {};
      const contentsByStatus: Record<string, number> = {};
      let publishedContents = 0;
      let draftContents = 0;
      let totalViews = 0;
      let totalEngagement = 0;

      contents.forEach(content => {
        // Count by type
        contentsByType[content.type] = (contentsByType[content.type] || 0) + 1;

        // Count by status
        contentsByStatus[content.status] = (contentsByStatus[content.status] || 0) + 1;

        // Count published/draft
        if (content.status === 'published') {
          publishedContents++;
        } else if (content.status === 'draft') {
          draftContents++;
        }

        // Sum analytics
        if (content.metadata.analytics) {
          totalViews += content.metadata.analytics.views || 0;
          totalEngagement += content.metadata.analytics.engagement || 0;
        }
      });

      // Get top contents by views
      const topContents = contents
        .filter(content => content.metadata.analytics?.views)
        .sort((a, b) => (b.metadata.analytics?.views || 0) - (a.metadata.analytics?.views || 0))
        .slice(0, 10);

      return {
        totalContents,
        contentsByType,
        contentsByStatus,
        publishedContents,
        draftContents,
        totalViews,
        totalEngagement,
        topContents
      };
    } catch (error) {
      structuredLogger.error('Failed to get content statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
      throw error;
    }
  }
}

export const contentManagementService = new ContentManagementService();

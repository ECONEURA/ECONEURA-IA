/**
 * CONTENT MANAGEMENT SERVICE TESTS
 *
 * PR-55: Tests unitarios para el servicio de gestión de contenido
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ContentManagementService } from '../../../services/content-management.service.js';

// Mock del servicio de base de datos
const mockDb = {
  query: vi.fn(),
};

// Mock del structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock del servicio de base de datos
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: () => mockDb,
}));

describe('ContentManagementService', () => {
  let service: ContentManagementService;
  const mockOrganizationId = 'test-org';
  const mockUserId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContentManagementService();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('createContent', () => {
    it('should create content successfully', async () => {
      const contentData = {
        title: 'Test Content',
        slug: 'test-content',
        type: 'article' as const,
        status: 'draft' as const,
        template: 'default' as const,
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test', 'content'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg', '/images/test2.jpg'],
        attachments: ['/files/test.pdf'],
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createContent(
        mockOrganizationId,
        contentData,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result.title).toBe(contentData.title);
      expect(result.type).toBe(contentData.type);
      expect(result.organizationId).toBe(mockOrganizationId);
      expect(result.createdBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const contentData = {
        title: 'Test Content',
        slug: 'test-content',
        type: 'article' as const,
        status: 'draft' as const,
        template: 'default' as const,
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createContent(mockOrganizationId, contentData, mockUserId);
      ).rejects.toThrow('Database error');
    });
  });

  describe('getContent', () => {
    it('should return content if found', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      // Simular que el contenido existe en memoria
      (service as any).contents.set(contentId, mockContent);

      const result = await service.getContent(contentId, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(contentId);
      expect(result?.title).toBe('Test Content');
    });

    it('should return null if content not found', async () => {
      const contentId = 'non-existent-content';

      const result = await service.getContent(contentId, mockOrganizationId);

      expect(result).toBeNull();
    });

    it('should return null if content belongs to different organization', async () => {
      const contentId = 'test-content-id';
      const differentOrgId = 'different-org';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);

      const result = await service.getContent(contentId, differentOrgId);

      expect(result).toBeNull();
    });
  });

  describe('getContentBySlug', () => {
    it('should return content by slug if found', async () => {
      const slug = 'test-content';
      const mockContent = {
        id: 'test-content-id',
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set('test-content-id', mockContent);

      const result = await service.getContentBySlug(slug, mockOrganizationId);

      expect(result).toBeDefined();
      expect(result?.slug).toBe(slug);
      expect(result?.title).toBe('Test Content');
    });

    it('should return null if content not found by slug', async () => {
      const slug = 'non-existent-slug';

      const result = await service.getContentBySlug(slug, mockOrganizationId);

      expect(result).toBeNull();
    });
  });

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);
      mockDb.query.mockResolvedValue({ rows: [] });

      const updates = {
        title: 'Updated Content',
        status: 'published' as const,
      };

      const result = await service.updateContent(
        contentId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeDefined();
      expect(result?.title).toBe('Updated Content');
      expect(result?.status).toBe('published');
      expect(result?.updatedBy).toBe(mockUserId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return null if content not found', async () => {
      const contentId = 'non-existent-content';
      const updates = { title: 'Updated Content' };

      const result = await service.updateContent(
        contentId,
        mockOrganizationId,
        updates,
        mockUserId
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.deleteContent(contentId, mockOrganizationId);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if content not found', async () => {
      const contentId = 'non-existent-content';

      const result = await service.deleteContent(contentId, mockOrganizationId);

      expect(result).toBe(false);
    });
  });

  describe('searchContent', () => {
    it('should search content with filters', async () => {
      const mockContents = [
        {
          id: 'content1',
          organizationId: mockOrganizationId,
          title: 'Content 1',
          slug: 'content-1',
          type: 'article',
          status: 'draft',
          template: 'default',
          metadata: {
            title: 'Content 1',
            description: 'First content',
            tags: ['test'],
            categories: ['test'],
            author: 'Author 1',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          content: 'This is content 1',
          htmlContent: '<p>This is content 1</p>',
          markdownContent: 'This is content 1',
          featuredImage: '/images/content1.jpg',
          images: ['/images/content1-1.jpg'],
          attachments: ['/files/content1.pdf'],
          versions: [],
          currentVersion: '1.0.0',
          publishedAt: undefined,
          scheduledAt: undefined,
          expiresAt: undefined,
          isPublic: false,
          isFeatured: false,
          isSticky: false,
          allowComments: true,
          allowSharing: true,
          workflow: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'content2',
          organizationId: mockOrganizationId,
          title: 'Content 2',
          slug: 'content-2',
          type: 'blog',
          status: 'published',
          template: 'blog',
          metadata: {
            title: 'Content 2',
            description: 'Second content',
            tags: ['test', 'published'],
            categories: ['test'],
            author: 'Author 2',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          content: 'This is content 2',
          htmlContent: '<p>This is content 2</p>',
          markdownContent: 'This is content 2',
          featuredImage: '/images/content2.jpg',
          images: ['/images/content2-1.jpg'],
          attachments: ['/files/content2.pdf'],
          versions: [],
          currentVersion: '1.0.0',
          publishedAt: new Date(),
          scheduledAt: undefined,
          expiresAt: undefined,
          isPublic: true,
          isFeatured: false,
          isSticky: false,
          allowComments: true,
          allowSharing: true,
          workflow: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).contents.set('content1', mockContents[0]);
      (service as any).contents.set('content2', mockContents[1]);

      const searchParams = {
        filters: {
          type: ['article'],
          status: ['draft'],
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchContent(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].type).toBe('article');
      expect(result.contents[0].status).toBe('draft');
      expect(result.total).toBe(1);
    });

    it('should search content by text query', async () => {
      const mockContents = [
        {
          id: 'content1',
          organizationId: mockOrganizationId,
          title: 'Test Content',
          slug: 'test-content',
          type: 'article',
          status: 'draft',
          template: 'default',
          metadata: {
            title: 'Test Content',
            description: 'A test content',
            tags: ['test'],
            categories: ['test'],
            author: 'Test Author',
            language: 'es',
            keywords: ['test'],
            customFields: {},
          },
          content: 'This is a test content with specific keywords',
          htmlContent: '<p>This is a test content with specific keywords</p>',
          markdownContent: 'This is a test content with specific keywords',
          featuredImage: '/images/test.jpg',
          images: ['/images/test1.jpg'],
          attachments: ['/files/test.pdf'],
          versions: [],
          currentVersion: '1.0.0',
          publishedAt: undefined,
          scheduledAt: undefined,
          expiresAt: undefined,
          isPublic: false,
          isFeatured: false,
          isSticky: false,
          allowComments: true,
          allowSharing: true,
          workflow: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).contents.set('content1', mockContents[0]);

      const searchParams = {
        query: 'test',
        pagination: {
          page: 1,
          limit: 10,
        },
      };

      const result = await service.searchContent(mockOrganizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].title).toBe('Test Content');
    });
  });

  describe('createContentVersion', () => {
    it('should create content version successfully', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);
      mockDb.query.mockResolvedValue({ rows: [] });

      const versionData = {
        contentId,
        version: '2.0.0',
        content: 'Updated content',
        htmlContent: '<p>Updated content</p>',
        markdownContent: 'Updated content',
        changes: 'Updated content with new information',
        createdBy: mockUserId,
      };

      const result = await service.createContentVersion(
        contentId,
        mockOrganizationId,
        versionData
      );

      expect(result).toBeDefined();
      expect(result.version).toBe('2.0.0');
      expect(result.contentId).toBe(contentId);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should throw error if content not found', async () => {
      const contentId = 'non-existent-content';
      const versionData = {
        contentId,
        version: '2.0.0',
        content: 'Updated content',
        htmlContent: '<p>Updated content</p>',
        markdownContent: 'Updated content',
        changes: 'Updated content with new information',
        createdBy: mockUserId,
      };

      await expect(
        service.createContentVersion(contentId, mockOrganizationId, versionData);
      ).rejects.toThrow('Content not found');
    });
  });

  describe('publishContent', () => {
    it('should publish content successfully', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'draft',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: undefined,
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: false,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.publishContent(contentId, mockOrganizationId, mockUserId);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if content not found', async () => {
      const contentId = 'non-existent-content';

      const result = await service.publishContent(contentId, mockOrganizationId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('unpublishContent', () => {
    it('should unpublish content successfully', async () => {
      const contentId = 'test-content-id';
      const mockContent = {
        id: contentId,
        organizationId: mockOrganizationId,
        title: 'Test Content',
        slug: 'test-content',
        type: 'article',
        status: 'published',
        template: 'default',
        metadata: {
          title: 'Test Content',
          description: 'A test content',
          tags: ['test'],
          categories: ['test'],
          author: 'Test Author',
          language: 'es',
          keywords: ['test'],
          customFields: {},
        },
        content: 'This is test content',
        htmlContent: '<p>This is test content</p>',
        markdownContent: 'This is test content',
        featuredImage: '/images/test.jpg',
        images: ['/images/test1.jpg'],
        attachments: ['/files/test.pdf'],
        versions: [],
        currentVersion: '1.0.0',
        publishedAt: new Date(),
        scheduledAt: undefined,
        expiresAt: undefined,
        isPublic: true,
        isFeatured: false,
        isSticky: false,
        allowComments: true,
        allowSharing: true,
        workflow: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
      };

      (service as any).contents.set(contentId, mockContent);
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.unpublishContent(contentId, mockOrganizationId, mockUserId);

      expect(result).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should return false if content not found', async () => {
      const contentId = 'non-existent-content';

      const result = await service.unpublishContent(contentId, mockOrganizationId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('getContentStatistics', () => {
    it('should return content statistics', async () => {
      const mockContents = [
        {
          id: 'content1',
          organizationId: mockOrganizationId,
          title: 'Content 1',
          slug: 'content-1',
          type: 'article',
          status: 'draft',
          template: 'default',
          metadata: {
            title: 'Content 1',
            description: 'First content',
            tags: ['test'],
            categories: ['test'],
            author: 'Author 1',
            language: 'es',
            keywords: ['test'],
            customFields: {},
            analytics: {
              views: 100,
              uniqueViews: 80,
              shares: 10,
              comments: 5,
              likes: 20,
              engagement: 0.8,
              bounceRate: 0.2,
              timeOnPage: 120,
            },
          },
          content: 'This is content 1',
          htmlContent: '<p>This is content 1</p>',
          markdownContent: 'This is content 1',
          featuredImage: '/images/content1.jpg',
          images: ['/images/content1-1.jpg'],
          attachments: ['/files/content1.pdf'],
          versions: [],
          currentVersion: '1.0.0',
          publishedAt: undefined,
          scheduledAt: undefined,
          expiresAt: undefined,
          isPublic: false,
          isFeatured: false,
          isSticky: false,
          allowComments: true,
          allowSharing: true,
          workflow: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
        {
          id: 'content2',
          organizationId: mockOrganizationId,
          title: 'Content 2',
          slug: 'content-2',
          type: 'blog',
          status: 'published',
          template: 'blog',
          metadata: {
            title: 'Content 2',
            description: 'Second content',
            tags: ['test'],
            categories: ['test'],
            author: 'Author 2',
            language: 'es',
            keywords: ['test'],
            customFields: {},
            analytics: {
              views: 200,
              uniqueViews: 150,
              shares: 20,
              comments: 10,
              likes: 40,
              engagement: 0.9,
              bounceRate: 0.1,
              timeOnPage: 180,
            },
          },
          content: 'This is content 2',
          htmlContent: '<p>This is content 2</p>',
          markdownContent: 'This is content 2',
          featuredImage: '/images/content2.jpg',
          images: ['/images/content2-1.jpg'],
          attachments: ['/files/content2.pdf'],
          versions: [],
          currentVersion: '1.0.0',
          publishedAt: new Date(),
          scheduledAt: undefined,
          expiresAt: undefined,
          isPublic: true,
          isFeatured: false,
          isSticky: false,
          allowComments: true,
          allowSharing: true,
          workflow: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
        },
      ];

      (service as any).contents.set('content1', mockContents[0]);
      (service as any).contents.set('content2', mockContents[1]);

      const result = await service.getContentStatistics(mockOrganizationId);

      expect(result).toBeDefined();
      expect(result.totalContents).toBe(2);
      expect(result.contentsByType.article).toBe(1);
      expect(result.contentsByType.blog).toBe(1);
      expect(result.contentsByStatus.draft).toBe(1);
      expect(result.contentsByStatus.published).toBe(1);
      expect(result.publishedContents).toBe(1);
      expect(result.draftContents).toBe(1);
      expect(result.totalViews).toBe(300);
      expect(result.totalEngagement).toBe(1.7);
      expect(result.topContents).toHaveLength(2);
    });
  });
});

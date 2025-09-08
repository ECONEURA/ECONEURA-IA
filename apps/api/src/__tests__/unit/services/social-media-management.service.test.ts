/**
 * SOCIAL MEDIA MANAGEMENT SERVICE TESTS
 * 
 * PR-57: Pruebas unitarias para el servicio de gestión de redes sociales
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocialMediaManagementService } from '../../../services/social-media-management.service.js';

// Mock the database service
vi.mock('../../../lib/database.service.js', () => ({
  getDatabaseService: vi.fn(() => ({
    query: vi.fn()
  }))
}));

// Mock the structured logger
vi.mock('../../../lib/structured-logger.js', () => ({
  structuredLogger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('SocialMediaManagementService', () => {
  let service: SocialMediaManagementService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      query: vi.fn()
    };
    
    // Mock the database service to return our mock
    vi.mocked(require('../../../lib/database.service.js').getDatabaseService).mockReturnValue(mockDb);
    
    service = new SocialMediaManagementService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createAccount', () => {
    it('should create a new social account successfully', async () => {
      const organizationId = 'test-org';
      const accountData = {
        platform: 'twitter' as const,
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        followersCount: 1000,
        followingCount: 500,
        postsCount: 50,
        isVerified: false,
        isActive: true,
        accessToken: 'test-token',
        refreshToken: 'test-refresh-token',
        tokenExpiresAt: new Date('2024-12-31'),
        permissions: ['read', 'write'],
        metadata: { test: 'data' }
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createAccount(organizationId, accountData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.platform).toBe(accountData.platform);
      expect(result.username).toBe(accountData.username);
      expect(result.displayName).toBe(accountData.displayName);
      expect(result.profileUrl).toBe(accountData.profileUrl);
      expect(result.avatarUrl).toBe(accountData.avatarUrl);
      expect(result.bio).toBe(accountData.bio);
      expect(result.followersCount).toBe(accountData.followersCount);
      expect(result.followingCount).toBe(accountData.followingCount);
      expect(result.postsCount).toBe(accountData.postsCount);
      expect(result.isVerified).toBe(accountData.isVerified);
      expect(result.isActive).toBe(accountData.isActive);
      expect(result.accessToken).toBe(accountData.accessToken);
      expect(result.refreshToken).toBe(accountData.refreshToken);
      expect(result.tokenExpiresAt).toEqual(accountData.tokenExpiresAt);
      expect(result.permissions).toEqual(accountData.permissions);
      expect(result.metadata).toEqual(accountData.metadata);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO social_accounts'),
        expect.arrayContaining([
          result.id,
          organizationId,
          accountData.platform,
          accountData.username,
          accountData.displayName,
          accountData.profileUrl,
          accountData.avatarUrl,
          accountData.bio,
          accountData.followersCount,
          accountData.followingCount,
          accountData.postsCount,
          accountData.isVerified,
          accountData.isActive,
          accountData.accessToken,
          accountData.refreshToken,
          accountData.tokenExpiresAt,
          JSON.stringify(accountData.permissions),
          JSON.stringify(accountData.metadata),
          undefined,
          result.createdAt,
          result.updatedAt
        ])
      );
    });

    it('should handle database errors when creating account', async () => {
      const organizationId = 'test-org';
      const accountData = {
        platform: 'twitter' as const,
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser'
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.createAccount(organizationId, accountData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getAccount', () => {
    it('should return account when found', async () => {
      const accountId = 'test-account-id';
      const organizationId = 'test-org';
      
      const mockAccount = {
        id: accountId,
        organizationId,
        platform: 'twitter',
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser',
        followersCount: 1000,
        followingCount: 500,
        postsCount: 50,
        isVerified: false,
        isActive: true,
        permissions: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the accounts Map
      (service as any).accounts.set(accountId, mockAccount);

      const result = await service.getAccount(accountId, organizationId);

      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      const accountId = 'non-existent-id';
      const organizationId = 'test-org';

      const result = await service.getAccount(accountId, organizationId);

      expect(result).toBeNull();
    });

    it('should return null when account belongs to different organization', async () => {
      const accountId = 'test-account-id';
      const organizationId = 'test-org';
      const differentOrgId = 'different-org';
      
      const mockAccount = {
        id: accountId,
        organizationId: differentOrgId,
        platform: 'twitter',
        username: 'testuser',
        displayName: 'Test User',
        profileUrl: 'https://twitter.com/testuser',
        followersCount: 1000,
        followingCount: 500,
        postsCount: 50,
        isVerified: false,
        isActive: true,
        permissions: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the accounts Map
      (service as any).accounts.set(accountId, mockAccount);

      const result = await service.getAccount(accountId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('createPost', () => {
    it('should create a new social post successfully', async () => {
      const organizationId = 'test-org';
      const createdBy = 'test-user';
      const postData = {
        accountId: 'test-account-id',
        platform: 'twitter' as const,
        type: 'text' as const,
        status: 'draft' as const,
        content: 'Test post content',
        mediaUrls: ['https://example.com/image.jpg'],
        hashtags: ['#test', '#social'],
        mentions: ['@user1', '@user2'],
        scheduledAt: new Date('2024-12-31'),
        aiGenerated: true,
        aiPrompt: 'Generate a test post',
        tags: ['test', 'social'],
        campaignId: 'test-campaign-id'
      };

      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await service.createPost(organizationId, postData, createdBy);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.organizationId).toBe(organizationId);
      expect(result.accountId).toBe(postData.accountId);
      expect(result.platform).toBe(postData.platform);
      expect(result.type).toBe(postData.type);
      expect(result.status).toBe(postData.status);
      expect(result.content).toBe(postData.content);
      expect(result.mediaUrls).toEqual(postData.mediaUrls);
      expect(result.hashtags).toEqual(postData.hashtags);
      expect(result.mentions).toEqual(postData.mentions);
      expect(result.scheduledAt).toEqual(postData.scheduledAt);
      expect(result.aiGenerated).toBe(postData.aiGenerated);
      expect(result.aiPrompt).toBe(postData.aiPrompt);
      expect(result.tags).toEqual(postData.tags);
      expect(result.campaignId).toBe(postData.campaignId);
      expect(result.createdBy).toBe(createdBy);
      expect(result.updatedBy).toBe(createdBy);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO social_posts'),
        expect.arrayContaining([
          result.id,
          organizationId,
          postData.accountId,
          postData.platform,
          postData.type,
          postData.status,
          postData.content,
          JSON.stringify(postData.mediaUrls),
          JSON.stringify(postData.hashtags),
          JSON.stringify(postData.mentions),
          postData.scheduledAt,
          undefined,
          undefined,
          undefined,
          JSON.stringify({}),
          JSON.stringify({}),
          postData.aiGenerated,
          postData.aiPrompt,
          JSON.stringify(postData.tags),
          postData.campaignId,
          result.createdAt,
          result.updatedAt,
          createdBy,
          createdBy
        ])
      );
    });

    it('should handle database errors when creating post', async () => {
      const organizationId = 'test-org';
      const createdBy = 'test-user';
      const postData = {
        accountId: 'test-account-id',
        platform: 'twitter' as const,
        type: 'text' as const,
        status: 'draft' as const,
        content: 'Test post content'
      };

      mockDb.query.mockRejectedValue(new Error('Database error'));

      await expect(service.createPost(organizationId, postData, createdBy))
        .rejects.toThrow('Database error');
    });
  });

  describe('getPost', () => {
    it('should return post when found', async () => {
      const postId = 'test-post-id';
      const organizationId = 'test-org';
      
      const mockPost = {
        id: postId,
        organizationId,
        accountId: 'test-account-id',
        platform: 'twitter',
        type: 'text',
        status: 'draft',
        content: 'Test post content',
        mediaUrls: [],
        hashtags: [],
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user'
      };

      // Mock the posts Map
      (service as any).posts.set(postId, mockPost);

      const result = await service.getPost(postId, organizationId);

      expect(result).toEqual(mockPost);
    });

    it('should return null when post not found', async () => {
      const postId = 'non-existent-id';
      const organizationId = 'test-org';

      const result = await service.getPost(postId, organizationId);

      expect(result).toBeNull();
    });

    it('should return null when post belongs to different organization', async () => {
      const postId = 'test-post-id';
      const organizationId = 'test-org';
      const differentOrgId = 'different-org';
      
      const mockPost = {
        id: postId,
        organizationId: differentOrgId,
        accountId: 'test-account-id',
        platform: 'twitter',
        type: 'text',
        status: 'draft',
        content: 'Test post content',
        mediaUrls: [],
        hashtags: [],
        mentions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user',
        updatedBy: 'test-user'
      };

      // Mock the posts Map
      (service as any).posts.set(postId, mockPost);

      const result = await service.getPost(postId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('searchPosts', () => {
    it('should search posts with filters', async () => {
      const organizationId = 'test-org';
      const searchParams = {
        query: 'test',
        filters: {
          platforms: ['twitter', 'facebook'],
          types: ['text', 'image'],
          status: ['published'],
          dateRange: {
            from: new Date('2024-01-01'),
            to: new Date('2024-12-31')
          },
          tags: ['test', 'social'],
          accounts: ['account1', 'account2']
        },
        sort: {
          field: 'createdAt' as const,
          direction: 'desc' as const
        },
        pagination: {
          page: 1,
          limit: 20
        }
      };

      const mockPosts = [
        {
          id: 'post1',
          organizationId,
          accountId: 'account1',
          platform: 'twitter',
          type: 'text',
          status: 'published',
          content: 'Test post content',
          mediaUrls: [],
          hashtags: ['#test'],
          mentions: [],
          tags: ['test', 'social'],
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        },
        {
          id: 'post2',
          organizationId,
          accountId: 'account2',
          platform: 'facebook',
          type: 'image',
          status: 'published',
          content: 'Another test post',
          mediaUrls: ['https://example.com/image.jpg'],
          hashtags: ['#social'],
          mentions: [],
          tags: ['social'],
          createdAt: new Date('2024-06-02'),
          updatedAt: new Date('2024-06-02'),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        }
      ];

      // Mock the posts Map
      (service as any).posts.set('post1', mockPosts[0]);
      (service as any).posts.set('post2', mockPosts[1]);

      const result = await service.searchPosts(organizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.posts[0].id).toBe('post2'); // Sorted by createdAt desc
      expect(result.posts[1].id).toBe('post1');
    });

    it('should return cached results when available', async () => {
      const organizationId = 'test-org';
      const searchParams = {
        query: 'test',
        pagination: { page: 1, limit: 20 }
      };

      const cachedResult = {
        posts: [],
        total: 0,
        page: 1,
        limit: 20
      };

      // Mock the search cache
      (service as any).searchCache.set(
        `search:${organizationId}:${JSON.stringify(searchParams)}`,
        {
          result: cachedResult,
          timestamp: Date.now()
        }
      );

      const result = await service.searchPosts(organizationId, searchParams);

      expect(result).toEqual(cachedResult);
    });

    it('should handle empty search results', async () => {
      const organizationId = 'test-org';
      const searchParams = {
        query: 'nonexistent',
        pagination: { page: 1, limit: 20 }
      };

      const result = await service.searchPosts(organizationId, searchParams);

      expect(result).toBeDefined();
      expect(result.posts).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getSocialMediaStatistics', () => {
    it('should return comprehensive statistics', async () => {
      const organizationId = 'test-org';

      const mockAccounts = [
        {
          id: 'account1',
          organizationId,
          platform: 'twitter',
          username: 'user1',
          displayName: 'User 1',
          profileUrl: 'https://twitter.com/user1',
          followersCount: 1000,
          followingCount: 500,
          postsCount: 50,
          isVerified: false,
          isActive: true,
          permissions: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'account2',
          organizationId,
          platform: 'facebook',
          username: 'user2',
          displayName: 'User 2',
          profileUrl: 'https://facebook.com/user2',
          followersCount: 2000,
          followingCount: 1000,
          postsCount: 100,
          isVerified: true,
          isActive: true,
          permissions: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockPosts = [
        {
          id: 'post1',
          organizationId,
          accountId: 'account1',
          platform: 'twitter',
          type: 'text',
          status: 'published',
          content: 'Test post 1',
          mediaUrls: [],
          hashtags: [],
          mentions: [],
          engagement: { engagementRate: 5.5 },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        },
        {
          id: 'post2',
          organizationId,
          accountId: 'account2',
          platform: 'facebook',
          type: 'image',
          status: 'published',
          content: 'Test post 2',
          mediaUrls: [],
          hashtags: [],
          mentions: [],
          engagement: { engagementRate: 8.2 },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        }
      ];

      const mockMentions = [
        {
          id: 'mention1',
          organizationId,
          platform: 'twitter',
          authorId: 'author1',
          authorUsername: 'author1',
          authorDisplayName: 'Author 1',
          content: 'Mention content',
          url: 'https://twitter.com/mention1',
          publishedAt: new Date(),
          priority: 'medium',
          category: 'other',
          tags: [],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockCampaigns = [
        {
          id: 'campaign1',
          organizationId,
          name: 'Test Campaign',
          platforms: ['twitter', 'facebook'],
          startDate: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'test-user',
          updatedBy: 'test-user'
        }
      ];

      // Mock the data Maps
      (service as any).accounts.set('account1', mockAccounts[0]);
      (service as any).accounts.set('account2', mockAccounts[1]);
      (service as any).posts.set('post1', mockPosts[0]);
      (service as any).posts.set('post2', mockPosts[1]);
      (service as any).mentions.set('mention1', mockMentions[0]);
      (service as any).campaigns.set('campaign1', mockCampaigns[0]);

      const result = await service.getSocialMediaStatistics(organizationId);

      expect(result).toBeDefined();
      expect(result.totalAccounts).toBe(2);
      expect(result.accountsByPlatform).toEqual({
        twitter: 1,
        facebook: 1
      });
      expect(result.totalPosts).toBe(2);
      expect(result.postsByPlatform).toEqual({
        twitter: 1,
        facebook: 1
      });
      expect(result.postsByStatus).toEqual({
        published: 2
      });
      expect(result.totalMentions).toBe(1);
      expect(result.mentionsByPlatform).toEqual({
        twitter: 1
      });
      expect(result.totalCampaigns).toBe(1);
      expect(result.campaignsByStatus).toEqual({
        active: 1
      });
      expect(result.averageEngagementRate).toBe(6.85); // (5.5 + 8.2) / 2
      expect(result.topPerformingPosts).toHaveLength(2);
      expect(result.topPerformingPosts[0].id).toBe('post2'); // Higher engagement rate
      expect(result.topPerformingPosts[1].id).toBe('post1');
    });

    it('should handle empty data gracefully', async () => {
      const organizationId = 'test-org';

      const result = await service.getSocialMediaStatistics(organizationId);

      expect(result).toBeDefined();
      expect(result.totalAccounts).toBe(0);
      expect(result.accountsByPlatform).toEqual({});
      expect(result.totalPosts).toBe(0);
      expect(result.postsByPlatform).toEqual({});
      expect(result.postsByStatus).toEqual({});
      expect(result.totalMentions).toBe(0);
      expect(result.mentionsByPlatform).toEqual({});
      expect(result.totalCampaigns).toBe(0);
      expect(result.campaignsByStatus).toEqual({});
      expect(result.averageEngagementRate).toBe(0);
      expect(result.topPerformingPosts).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('should generate unique IDs', () => {
      const id1 = (service as any).generateId();
      const id2 = (service as any).generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^social_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^social_\d+_[a-z0-9]+$/);
    });
  });
});

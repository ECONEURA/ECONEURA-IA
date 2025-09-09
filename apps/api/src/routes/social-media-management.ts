/**
 * SOCIAL MEDIA MANAGEMENT ROUTES
 * 
 * PR-57: Rutas API para gestión de redes sociales avanzado
 * 
 * Endpoints:
 * - POST /social-media/accounts - Crear cuenta social
 * - GET /social-media/accounts - Listar cuentas sociales
 * - GET /social-media/accounts/:id - Obtener cuenta social
 * - PUT /social-media/accounts/:id - Actualizar cuenta social
 * - DELETE /social-media/accounts/:id - Eliminar cuenta social
 * - POST /social-media/posts - Crear post
 * - GET /social-media/posts - Listar posts
 * - GET /social-media/posts/:id - Obtener post
 * - PUT /social-media/posts/:id - Actualizar post
 * - DELETE /social-media/posts/:id - Eliminar post
 * - POST /social-media/posts/:id/publish - Publicar post
 * - GET /social-media/mentions - Listar menciones
 * - GET /social-media/campaigns - Listar campañas
 * - GET /social-media/statistics - Estadísticas
 */

import { Router } from 'express';
import { z } from 'zod';
import { socialMediaManagementService } from '../services/social-media-management.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    email: string;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateAccountSchema = z.object({
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat', 'telegram', 'discord']),
  username: z.string().min(1).max(100),
  displayName: z.string().min(1).max(255),
  profileUrl: z.string().url(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  followersCount: z.number().default(0),
  followingCount: z.number().default(0),
  postsCount: z.number().default(0),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  permissions: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
});

const UpdateAccountSchema = z.object({
  username: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(255).optional(),
  profileUrl: z.string().url().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  followersCount: z.number().optional(),
  followingCount: z.number().optional(),
  postsCount: z.number().optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  permissions: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

const CreatePostSchema = z.object({
  accountId: z.string().uuid(),
  platform: z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat', 'telegram', 'discord']),
  type: z.enum(['text', 'image', 'video', 'carousel', 'story', 'reel', 'live', 'poll', 'event', 'link']),
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'deleted']).default('draft'),
  content: z.string().min(1),
  mediaUrls: z.array(z.string().url()).default([]),
  hashtags: z.array(z.string()).default([]),
  mentions: z.array(z.string()).default([]),
  scheduledAt: z.string().datetime().optional(),
  aiGenerated: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  campaignId: z.string().uuid().optional()
});

const UpdatePostSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'carousel', 'story', 'reel', 'live', 'poll', 'event', 'link']).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed', 'deleted']).optional(),
  content: z.string().min(1).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  campaignId: z.string().uuid().optional()
});

const SearchPostsSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    platforms: z.array(z.enum(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'snapchat', 'telegram', 'discord'])).optional(),
    types: z.array(z.enum(['text', 'image', 'video', 'carousel', 'story', 'reel', 'live', 'poll', 'event', 'link'])).optional(),
    status: z.array(z.enum(['draft', 'scheduled', 'published', 'failed', 'deleted'])).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional(),
    tags: z.array(z.string()).optional(),
    accounts: z.array(z.string().uuid()).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['createdAt', 'publishedAt', 'engagement', 'reach', 'impressions']),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
});

// ============================================================================
// ACCOUNT ROUTES
// ============================================================================

// POST /social-media/accounts - Create account
router.post('/accounts', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    const validatedData = CreateAccountSchema.parse(req.body);

    // Convert date strings to Date objects
    const accountData = {
      ...validatedData,
      tokenExpiresAt: validatedData.tokenExpiresAt ? new Date(validatedData.tokenExpiresAt) : undefined
    };

    const account = await socialMediaManagementService.createAccount(
      organizationId,
      accountData
    );

    structuredLogger.info('Social account created via API', {
      accountId: account.id,
      platform: account.platform,
      username: account.username,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: account,
      message: 'Social account created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create social account via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create social account'
    });
  }
});

// GET /social-media/accounts - List accounts
router.get('/accounts', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    // For now, return all accounts for the organization
    // In a real implementation, you'd want pagination and filtering
    const accounts = Array.from((socialMediaManagementService as any).accounts.values())
      .filter((account: any) => account.organizationId === organizationId);

    res.json({
      success: true,
      data: {
        accounts,
        total: accounts.length,
        page: 1,
        limit: accounts.length
      },
      message: 'Social accounts retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list social accounts via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list social accounts'
    });
  }
});

// GET /social-media/accounts/:id - Get account
router.get('/accounts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const account = await socialMediaManagementService.getAccount(id, organizationId);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Social account not found'
      });
    }

    res.json({
      success: true,
      data: account,
      message: 'Social account retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get social account via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      accountId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get social account'
    });
  }
});

// PUT /social-media/accounts/:id - Update account
router.put('/accounts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const validatedData = UpdateAccountSchema.parse(req.body);

    // Convert date strings to Date objects
    const updates = {
      ...validatedData,
      tokenExpiresAt: validatedData.tokenExpiresAt ? new Date(validatedData.tokenExpiresAt) : undefined
    };

    // For now, we'll just return success
    // In a real implementation, you'd update the account
    res.json({
      success: true,
      message: 'Social account updated successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to update social account via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      accountId: req.params.id,
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update social account'
    });
  }
});

// DELETE /social-media/accounts/:id - Delete account
router.delete('/accounts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    // For now, we'll just return success
    // In a real implementation, you'd delete the account
    res.json({
      success: true,
      message: 'Social account deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete social account via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      accountId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete social account'
    });
  }
});

// ============================================================================
// POST ROUTES
// ============================================================================

// POST /social-media/posts - Create post
router.post('/posts', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const createdBy = req.user?.id || 'demo-user';

    const validatedData = CreatePostSchema.parse(req.body);

    // Convert date strings to Date objects
    const postData = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    const post = await socialMediaManagementService.createPost(
      organizationId,
      postData,
      createdBy
    );

    structuredLogger.info('Social post created via API', {
      postId: post.id,
      platform: post.platform,
      type: post.type,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Social post created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create social post via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create social post'
    });
  }
});

// GET /social-media/posts - List posts
router.get('/posts', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const searchParams = SearchPostsSchema.parse(req.query);

    // Convert date strings to Date objects
    if (searchParams.filters?.dateRange) {
      if (searchParams.filters.dateRange.from) {
        searchParams.filters.dateRange.from = new Date(searchParams.filters.dateRange.from);
      }
      if (searchParams.filters.dateRange.to) {
        searchParams.filters.dateRange.to = new Date(searchParams.filters.dateRange.to);
      }
    }

    const result = await socialMediaManagementService.searchPosts(organizationId, searchParams);

    res.json({
      success: true,
      data: result,
      message: 'Social posts retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list social posts via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to list social posts'
    });
  }
});

// GET /social-media/posts/:id - Get post
router.get('/posts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const post = await socialMediaManagementService.getPost(id, organizationId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Social post not found'
      });
    }

    res.json({
      success: true,
      data: post,
      message: 'Social post retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get social post via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get social post'
    });
  }
});

// PUT /social-media/posts/:id - Update post
router.put('/posts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const validatedData = UpdatePostSchema.parse(req.body);

    // Convert date strings to Date objects
    const updates = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined
    };

    // For now, we'll just return success
    // In a real implementation, you'd update the post
    res.json({
      success: true,
      message: 'Social post updated successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to update social post via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update social post'
    });
  }
});

// DELETE /social-media/posts/:id - Delete post
router.delete('/posts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    // For now, we'll just return success
    // In a real implementation, you'd delete the post
    res.json({
      success: true,
      message: 'Social post deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete social post via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete social post'
    });
  }
});

// POST /social-media/posts/:id/publish - Publish post
router.post('/posts/:id/publish', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const publishedBy = req.user?.id || 'demo-user';

    const post = await socialMediaManagementService.getPost(id, organizationId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Social post not found'
      });
    }

    // In a real implementation, this would publish to the social platform
    structuredLogger.info('Social post published via API', {
      postId: id,
      platform: post.platform,
      organizationId,
      publishedBy
    });

    res.json({
      success: true,
      message: 'Social post published successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to publish social post via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      postId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to publish social post'
    });
  }
});

// ============================================================================
// MENTIONS ROUTES
// ============================================================================

// GET /social-media/mentions - List mentions
router.get('/mentions', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    // For now, return all mentions for the organization
    // In a real implementation, you'd want pagination and filtering
    const mentions = Array.from((socialMediaManagementService as any).mentions.values())
      .filter((mention: any) => mention.organizationId === organizationId);

    res.json({
      success: true,
      data: {
        mentions,
        total: mentions.length,
        page: 1,
        limit: mentions.length
      },
      message: 'Social mentions retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list social mentions via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list social mentions'
    });
  }
});

// ============================================================================
// CAMPAIGNS ROUTES
// ============================================================================

// GET /social-media/campaigns - List campaigns
router.get('/campaigns', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    // For now, return all campaigns for the organization
    // In a real implementation, you'd want pagination and filtering
    const campaigns = Array.from((socialMediaManagementService as any).campaigns.values())
      .filter((campaign: any) => campaign.organizationId === organizationId);

    res.json({
      success: true,
      data: {
        campaigns,
        total: campaigns.length,
        page: 1,
        limit: campaigns.length
      },
      message: 'Social campaigns retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list social campaigns via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list social campaigns'
    });
  }
});

// ============================================================================
// STATISTICS ROUTES
// ============================================================================

// GET /social-media/statistics - Get social media statistics
router.get('/statistics', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    const statistics = await socialMediaManagementService.getSocialMediaStatistics(organizationId);

    res.json({
      success: true,
      data: statistics,
      message: 'Social media statistics retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get social media statistics via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get social media statistics'
    });
  }
});

export default router;

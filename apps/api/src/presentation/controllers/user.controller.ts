import { Request, Response, NextFunction } from 'express';

import { UserApplicationService } from '../../application/services/user.application.service.js';
import {
  UserResponse,
  UserListResponse,
  UserStatsResponse,
  ApiResponse,
  validateCreateUserRequest,
  validateUpdateUserRequest,
  validateDeleteUserRequest,
  validateGetUserRequest,
  validateSearchUsersRequest,
  validateBulkUpdateUsersRequest,
  validateBulkDeleteUsersRequest,
  transformUserToResponse,
  transformUserListToResponse,
  transformUserStatsToResponse
} from '../dto/user.dto.js';

// ============================================================================
// USER CONTROLLER
// ============================================================================

export class UserController {
  constructor(private userApplicationService: UserApplicationService) {}

  // ========================================================================
  // USER MANAGEMENT
  // ========================================================================

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateCreateUserRequest(req.body);
      const createdBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!createdBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.userApplicationService.createUser({
        ...requestData,
        createdBy
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<UserResponse> = {
        success: true,
        data: transformUserToResponse(result.user!),
        message: 'User created successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId;
      const requestData = validateUpdateUserRequest(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.userApplicationService.updateUser({
        userId,
        ...requestData,
        updatedBy
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<UserResponse> = {
        success: true,
        data: transformUserToResponse(result.user!),
        message: 'User updated successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateDeleteUserRequest({ userId: req.params.userId });
      const deletedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!deletedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.userApplicationService.deleteUser({
        ...requestData,
        deletedBy
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // USER QUERIES
  // ========================================================================

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateGetUserRequest({ userId: req.params.userId });
      const user = await this.userApplicationService.getUserById(requestData.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<UserResponse> = {
        success: true,
        data: transformUserToResponse(user),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getUserByEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.query.email as string;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email parameter is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const user = await this.userApplicationService.getUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse<UserResponse> = {
        success: true,
        data: transformUserToResponse(user),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getUsersByOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const users = await this.userApplicationService.getUsersByOrganization(organizationId);

      const response: ApiResponse<UserResponse[]> = {
        success: true,
        data: users.map(transformUserToResponse),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateSearchUsersRequest({
        ...req.query,
        organizationId: req.params.organizationId
      });

      const result = await this.userApplicationService.searchUsers(requestData);

      const response: ApiResponse<UserListResponse> = {
        success: true,
        data: transformUserListToResponse(result),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // USER STATISTICS
  // ========================================================================

  async getUserStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const stats = await this.userApplicationService.getUserStats(organizationId);

      const response: ApiResponse<UserStatsResponse> = {
        success: true,
        data: transformUserStatsToResponse(stats),
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateBulkUpdateUsersRequest(req.body);
      const updatedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!updatedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.userApplicationService.bulkUpdateUsers(
        requestData.userIds,
        requestData.updates,
        updatedBy
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          total: result.results.length,
          successful: result.results.filter(r => r.success).length,
          failed: result.results.filter(r => !r.success).length,
          results: result.results
        },
        message: 'Bulk update completed',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestData = validateBulkDeleteUsersRequest(req.body);
      const deletedBy = req.user?.id || req.headers['x-user-id'] as string;

      if (!deletedBy) {
        res.status(401).json({
          success: false,
          error: 'User ID is required',
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const result = await this.userApplicationService.bulkDeleteUsers(
        requestData.userIds,
        deletedBy
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          total: result.results.length,
          successful: result.results.filter(r => r.success).length,
          failed: result.results.filter(r => !r.success).length,
          results: result.results
        },
        message: 'Bulk delete completed',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // ORGANIZATION LIMITS
  // ========================================================================

  async getOrganizationUserCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const count = await this.userApplicationService.getOrganizationUserCount(organizationId);

      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count },
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getOrganizationUserLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const limit = await this.userApplicationService.getOrganizationUserLimit(organizationId);

      const response: ApiResponse<{ limit: number }> = {
        success: true,
        data: { limit },
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async canOrganizationAddUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.params.organizationId;
      const canAdd = await this.userApplicationService.canOrganizationAddUser(organizationId);

      const response: ApiResponse<{ canAdd: boolean }> = {
        success: true,
        data: { canAdd },
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ========================================================================
  // USER ACTIVITY
  // ========================================================================

  async recordUserLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId;
      const success = await this.userApplicationService.recordUserLogin(userId);

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success },
        message: success ? 'Login recorded successfully' : 'Failed to record login',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateUserLastActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId;
      const success = await this.userApplicationService.updateUserLastActivity(userId);

      const response: ApiResponse<{ success: boolean }> = {
        success: true,
        data: { success },
        message: success ? 'Activity updated successfully' : 'Failed to update activity',
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

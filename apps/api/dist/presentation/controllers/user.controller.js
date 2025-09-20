import { validateCreateUserRequest, validateUpdateUserRequest, validateDeleteUserRequest, validateGetUserRequest, validateSearchUsersRequest, validateBulkUpdateUsersRequest, validateBulkDeleteUsersRequest, transformUserToResponse, transformUserListToResponse, transformUserStatsToResponse } from '../dto/user.dto.js';
export class UserController {
    userApplicationService;
    constructor(userApplicationService) {
        this.userApplicationService = userApplicationService;
    }
    async createUser(req, res, next) {
        try {
            const requestData = validateCreateUserRequest(req.body);
            const createdBy = req.user?.id || req.headers['x-user-id'];
            if (!createdBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                });
                return;
            }
            const response = {
                success: true,
                data: transformUserToResponse(result.user),
                message: 'User created successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(201).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async updateUser(req, res, next) {
        try {
            const userId = req.params.userId;
            const requestData = validateUpdateUserRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                });
                return;
            }
            const response = {
                success: true,
                data: transformUserToResponse(result.user),
                message: 'User updated successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const requestData = validateDeleteUserRequest({ userId: req.params.userId });
            const deletedBy = req.user?.id || req.headers['x-user-id'];
            if (!deletedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
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
                });
                return;
            }
            const response = {
                success: true,
                message: 'User deleted successfully',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserById(req, res, next) {
        try {
            const requestData = validateGetUserRequest({ userId: req.params.userId });
            const user = await this.userApplicationService.getUserById(requestData.userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformUserToResponse(user),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserByEmail(req, res, next) {
        try {
            const email = req.query.email;
            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email parameter is required',
                    timestamp: new Date()
                });
                return;
            }
            const user = await this.userApplicationService.getUserByEmail(email);
            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: transformUserToResponse(user),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getUsersByOrganization(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const users = await this.userApplicationService.getUsersByOrganization(organizationId);
            const response = {
                success: true,
                data: users.map(transformUserToResponse),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async searchUsers(req, res, next) {
        try {
            const requestData = validateSearchUsersRequest({
                ...req.query,
                organizationId: req.params.organizationId
            });
            const result = await this.userApplicationService.searchUsers(requestData);
            const response = {
                success: true,
                data: transformUserListToResponse(result),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserStats(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const stats = await this.userApplicationService.getUserStats(organizationId);
            const response = {
                success: true,
                data: transformUserStatsToResponse(stats),
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkUpdateUsers(req, res, next) {
        try {
            const requestData = validateBulkUpdateUsersRequest(req.body);
            const updatedBy = req.user?.id || req.headers['x-user-id'];
            if (!updatedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
                return;
            }
            const result = await this.userApplicationService.bulkUpdateUsers(requestData.userIds, requestData.updates, updatedBy);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: {
                    total: result.results.length,
                    successful: result.results.filter(r => r.success).length,
                    failed: result.results.filter(r => !r.success).length,
                    results: result.results
                },
                message: 'Bulk update completed',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async bulkDeleteUsers(req, res, next) {
        try {
            const requestData = validateBulkDeleteUsersRequest(req.body);
            const deletedBy = req.user?.id || req.headers['x-user-id'];
            if (!deletedBy) {
                res.status(401).json({
                    success: false,
                    error: 'User ID is required',
                    timestamp: new Date()
                });
                return;
            }
            const result = await this.userApplicationService.bulkDeleteUsers(requestData.userIds, deletedBy);
            if (!result.success) {
                res.status(400).json({
                    success: false,
                    error: result.error,
                    timestamp: new Date()
                });
                return;
            }
            const response = {
                success: true,
                data: {
                    total: result.results.length,
                    successful: result.results.filter(r => r.success).length,
                    failed: result.results.filter(r => !r.success).length,
                    results: result.results
                },
                message: 'Bulk delete completed',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getOrganizationUserCount(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const count = await this.userApplicationService.getOrganizationUserCount(organizationId);
            const response = {
                success: true,
                data: { count },
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getOrganizationUserLimit(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const limit = await this.userApplicationService.getOrganizationUserLimit(organizationId);
            const response = {
                success: true,
                data: { limit },
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async canOrganizationAddUser(req, res, next) {
        try {
            const organizationId = req.params.organizationId;
            const canAdd = await this.userApplicationService.canOrganizationAddUser(organizationId);
            const response = {
                success: true,
                data: { canAdd },
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async recordUserLogin(req, res, next) {
        try {
            const userId = req.params.userId;
            const success = await this.userApplicationService.recordUserLogin(userId);
            const response = {
                success: true,
                data: { success },
                message: success ? 'Login recorded successfully' : 'Failed to record login',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async updateUserLastActivity(req, res, next) {
        try {
            const userId = req.params.userId;
            const success = await this.userApplicationService.updateUserLastActivity(userId);
            const response = {
                success: true,
                data: { success },
                message: success ? 'Activity updated successfully' : 'Failed to update activity',
                timestamp: new Date(),
                requestId: req.headers['x-request-id']
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=user.controller.js.map
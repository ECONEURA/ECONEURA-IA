export class BaseController {
    sendSuccessResponse(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            data,
            message
        };
        res.status(statusCode).json(response);
    }
    sendListResponse(res, data, pagination, message) {
        const response = {
            data,
            pagination
        };
        this.sendSuccessResponse(res, response, message);
    }
    sendErrorResponse(res, message, statusCode = 400, details) {
        const response = {
            success: false,
            data: null,
            message,
            ...(details && { details })
        };
        res.status(statusCode).json(response);
    }
    sendNotFoundResponse(res, resource = 'Resource') {
        this.sendErrorResponse(res, `${resource} not found`, 404);
    }
    sendValidationErrorResponse(res, message, details) {
        this.sendErrorResponse(res, message, 400, details);
    }
    sendUnauthorizedResponse(res, message = 'Unauthorized') {
        this.sendErrorResponse(res, message, 401);
    }
    sendForbiddenResponse(res, message = 'Forbidden') {
        this.sendErrorResponse(res, message, 403);
    }
    sendInternalErrorResponse(res, message = 'Internal server error') {
        this.sendErrorResponse(res, message, 500);
    }
    getUserId(req) {
        return req.user?.id || req.headers['x-user-id'];
    }
    getOrganizationId(req) {
        return req.params.organizationId || req.body.organizationId || req.headers['x-organization-id'];
    }
    validateRequiredFields(data, requiredFields) {
        const missingFields = [];
        for (const field of requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
                missingFields.push(field);
            }
        }
        return {
            isValid: missingFields.length === 0,
            missingFields
        };
    }
    sanitizeString(value) {
        return value.trim();
    }
    generatePagination(page, limit, total) {
        const totalPages = Math.ceil(total / limit);
        return {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }
    async handleAsync(fn, res, next) {
        try {
            const result = await fn();
            return result;
        }
        catch (error) {
            next(error);
        }
    }
    validateId(id, fieldName = 'ID') {
        if (!id || id.trim().length === 0) {
            throw new Error(`${fieldName} is required`);
        }
    }
    validateOrganizationId(organizationId) {
        this.validateId(organizationId, 'Organization ID');
    }
    validatePaginationParams(page, limit) {
        if (page < 1) {
            throw new Error('Page must be at least 1');
        }
        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
    }
    transformEntityToResponse(entity) {
        return {
            id: entity.id.value,
            organizationId: entity.organizationId.value,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            ...entity
        };
    }
    transformEntityListToResponse(entities) {
        return entities.map(entity => this.transformEntityToResponse(entity));
    }
}
//# sourceMappingURL=base.controller.js.map
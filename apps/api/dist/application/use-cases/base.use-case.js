export class BaseUseCase {
    validateBaseRequest(request) {
        if (!request.organizationId || request.organizationId.trim().length === 0) {
            throw new Error('Organization ID is required');
        }
    }
    validateId(id, fieldName = 'ID') {
        if (!id || id.trim().length === 0) {
            throw new Error(`${fieldName} is required`);
        }
    }
    validateString(value, fieldName, minLength = 1, maxLength) {
        if (!value || value.trim().length === 0) {
            throw new Error(`${fieldName} is required`);
        }
        if (value.trim().length < minLength) {
            throw new Error(`${fieldName} must be at least ${minLength} characters long`);
        }
        if (maxLength && value.trim().length > maxLength) {
            throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
        }
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }
    }
    validateUrl(url, fieldName = 'URL') {
        try {
            new URL(url);
        }
        catch {
            throw new Error(`Invalid ${fieldName} format`);
        }
    }
    validateUuid(uuid, fieldName = 'ID') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(uuid)) {
            throw new Error(`Invalid ${fieldName} format`);
        }
    }
    generateId() {
        return crypto.randomUUID();
    }
    getCurrentTimestamp() {
        return new Date();
    }
    sanitizeString(value) {
        return value.trim();
    }
    createSuccessResponse(data, message) {
        return {
            success: true,
            data,
            message
        };
    }
    createErrorResponse(code, message, details) {
        return {
            success: false,
            error: {
                code,
                message,
                details
            }
        };
    }
}
//# sourceMappingURL=base.use-case.js.map
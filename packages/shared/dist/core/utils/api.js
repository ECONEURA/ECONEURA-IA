export function createSuccessResponse(data, meta) {
    return {
        success: true,
        data,
        meta
    };
}
export function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: {
            code,
            message,
            details
        }
    };
}
export function createPaginatedResponse(data, page, perPage, total, took) {
    return {
        success: true,
        data,
        meta: {
            page,
            perPage,
            total,
            took
        }
    };
}
//# sourceMappingURL=api.js.map
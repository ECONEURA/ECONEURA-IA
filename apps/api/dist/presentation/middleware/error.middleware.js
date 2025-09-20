import { ZodError } from 'zod';
export const errorHandler = (error, req, res, next) => {
    console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        timestamp: new Date()
    });
    if (error instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
            })),
            timestamp: new Date(),
            requestId: req.headers['x-request-id']
        });
        return;
    }
    if (error.statusCode) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            timestamp: new Date(),
            requestId: req.headers['x-request-id']
        });
        return;
    }
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
        requestId: req.headers['x-request-id']
    });
};
export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date(),
        requestId: req.headers['x-request-id']
    });
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=error.middleware.js.map
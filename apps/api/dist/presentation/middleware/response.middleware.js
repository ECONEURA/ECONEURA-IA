export const responseHandler = (req, res, next) => {
    res.success = (data, message, statusCode = 200) => {
        const response = {
            success: true,
            data,
            message,
            timestamp: new Date(),
            requestId: req.headers['x-request-id']
        };
        res.status(statusCode).json(response);
    };
    res.error = (error, statusCode = 400) => {
        const response = {
            success: false,
            error,
            timestamp: new Date(),
            requestId: req.headers['x-request-id']
        };
        res.status(statusCode).json(response);
    };
    res.created = (data, message) => {
        res.success(data, message, 201);
    };
    res.notFound = (message = 'Resource not found') => {
        res.error(message, 404);
    };
    res.unauthorized = (message = 'Unauthorized') => {
        res.error(message, 401);
    };
    res.forbidden = (message = 'Forbidden') => {
        res.error(message, 403);
    };
    res.conflict = (message = 'Conflict') => {
        res.error(message, 409);
    };
    res.unprocessableEntity = (message = 'Unprocessable entity') => {
        res.error(message, 422);
    };
    res.tooManyRequests = (message = 'Too many requests') => {
        res.error(message, 429);
    };
    res.internalServerError = (message = 'Internal server error') => {
        res.error(message, 500);
    };
    next();
};
//# sourceMappingURL=response.middleware.js.map
import compression from 'compression';
export const compressionMiddleware = compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
});
export const responseTimeMiddleware = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        res.setHeader('X-Response-Time', `${duration}ms`);
    });
    next();
};
export const cacheControlMiddleware = (maxAge = 300) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
        }
        next();
    };
};
//# sourceMappingURL=optimization.js.map
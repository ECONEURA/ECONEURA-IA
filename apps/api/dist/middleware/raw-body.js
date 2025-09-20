export const rawJsonBody = (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => data += chunk);
    req.on('end', () => {
        req._rawBody = data || '{}';
        try {
            req.body = data ? JSON.parse(data) : {};
        }
        catch {
            req.body = {};
        }
        next();
    });
};
//# sourceMappingURL=raw-body.js.map
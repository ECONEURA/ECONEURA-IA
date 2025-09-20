export const attachOrg = (req, _res, next) => {
    const aadRequired = (process.env.AAD_REQUIRED ?? 'false') === 'true';
    let id;
    const source = 'none';
    id = req.user?.org_id || req.user?.tid || req.user?.tid?.toString();
    if (id) {
        req.org = { id, source: 'aad' };
        return next();
    }
    if (!aadRequired) {
        const header = req.headers['x-org-id'] || undefined;
        const bodyId = (req.body && req.body.org_id) ? String(req.body.org_id) : undefined;
        if (header) {
            req.org = { id: header, source: 'header' };
            return next();
        }
        if (bodyId) {
            req.org = { id: bodyId, source: 'untrusted' };
            return next();
        }
    }
    req.org = { id: undefined, source: 'none' };
    return next();
};
//# sourceMappingURL=org.js.map
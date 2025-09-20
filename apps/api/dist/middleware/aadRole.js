export function requireAADRole(role) {
    return (req, res, next) => {
        const user = req.user;
        const roles = user?.roles ?? [];
        if (!Array.isArray(roles) || !roles.includes(role)) {
            return res.status(403).json({ type: "about:blank", title: "Forbidden", status: 403, detail: `Requires role: ${role}`, instance: req.originalUrl });
        }
        next();
    };
}
//# sourceMappingURL=aadRole.js.map
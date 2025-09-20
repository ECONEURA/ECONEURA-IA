import { createRemoteJWKSet, jwtVerify } from 'jose';
let jwks = null;
async function verifyBearer(token) {
    const jwksUri = process.env.JWKS_URI;
    if (!jwksUri)
        throw new Error('JWKS_URI not configured');
    if (!jwks)
        jwks = createRemoteJWKSet(new URL(jwksUri));
    const audience = process.env.AAD_AUDIENCE || 'econeura';
    const issuer = process.env.AAD_ISSUER || 'test-issuer';
    return await jwtVerify(token, jwks, { audience, issuer });
}
export const requireAAD = async (req, res, next) => {
    const required = (process.env.AUTH_REQUIRED ?? process.env.AAD_REQUIRED ?? 'false') === 'true';
    const header = (req.headers.authorization || '').toString();
    if (!required)
        return next();
    if (!header.startsWith('Bearer '))
        return res.status(401).json({ code: 'unauthorized', message: 'AAD token missing' });
    const token = header.slice('Bearer '.length);
    try {
        await verifyBearer(token);
        return next();
    }
    catch (e) {
        const name = e?.name || '';
        if (name === 'JWTExpired' || name === 'TokenExpiredError')
            return res.status(401).json({ code: 'token_expired' });
        return res.status(403).json({ code: 'invalid_token' });
    }
};
//# sourceMappingURL=aad.js.map
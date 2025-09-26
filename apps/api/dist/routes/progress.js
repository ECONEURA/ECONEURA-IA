import fs from 'fs';
import path from 'path';

import { Router } from 'express';
const router = Router();
router.get('/v1/progress', (req, res) => {
    const p = path.join(process.cwd(), 'dist', 'progress.json');
    if (!fs.existsSync(p))
        return res.status(404).json({ error: 'progress not generated' });
    const stat = fs.statSync(p);
    const body = fs.readFileSync(p, 'utf8');
    const checksum = require('crypto').createHash('sha256').update(body).digest('hex');
    const etag = `W/"${checksum.slice(0, 16)}-${stat.size}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', stat.mtime.toUTCString());
    res.setHeader('X-Progress-Checksum', checksum.slice(0, 12));
    res.setHeader('X-Progress-Date', stat.mtime.toISOString());
    res.setHeader('Cache-Control', 'no-cache');
    if (req.headers['if-none-match'] === etag)
        return res.status(304).end();
    const ageMs = Date.now() - stat.mtime.getTime();
    const twelveHours = 12 * 60 * 60 * 1000;
    if (ageMs > twelveHours) {
        res.setHeader('Retry-After', '600');
        return res.status(503).json({ error: 'progress stale', ageMinutes: Math.round(ageMs / 60000) });
    }
    return res.type('application/json').send(body);
});
export default router;
//# sourceMappingURL=progress.js.map
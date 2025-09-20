import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { importAndReconcile } from '../services/sepa/index.js';
import { logger } from '../lib/logger.js';
const router = Router();
router.post('/import', asyncHandler(async (req, res) => {
    const maybeBody = req.body;
    const maybeFile = req.file;
    const content = (typeof maybeBody === 'string') ? maybeBody : (maybeFile?.buffer?.toString?.() || '');
    const type = req.headers['content-type']?.includes('xml') ? 'camt' : 'mt940';
    if (!content)
        return res.status(400).json({ error: 'No content provided' });
    try {
        const summary = await importAndReconcile(content, type);
        res.json({ ok: true, summary });
    }
    catch (err) {
        const e = err;
        logger.error('SEPA import failed', { error: e.message });
        res.status(500).json({ error: e.message });
    }
}));
export default router;
//# sourceMappingURL=sepa.js.map
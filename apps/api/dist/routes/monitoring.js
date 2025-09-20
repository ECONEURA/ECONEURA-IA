import path from 'path';
import { fileURLToPath } from 'node:url';
const realPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'monitoring');
let exported;
try {
    exported = await import(`./monitoring`);
}
catch (err) {
    try {
        exported = await import(`./monitoring/index`);
    }
    catch (err2) {
        const express = await import('express');
        const router = express.Router();
        router.get('/health', (req, res) => res.json({ ok: true }));
        exported = { default: router };
    }
}
export default exported.default ?? exported;
//# sourceMappingURL=monitoring.js.map
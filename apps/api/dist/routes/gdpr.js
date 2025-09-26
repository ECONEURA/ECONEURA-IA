import { Readable } from 'stream';

import { Router } from 'express';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, ContainerSASPermissions, SASProtocol } from '@azure/storage-blob';
import archiver from 'archiver';

import { logger } from '../lib/logger.js';
import { asyncHandler } from '../lib/errors.js';
const router = Router();
function bufferToStream(buffer) {
    const readable = new Readable();
    readable._read = () => { };
    readable.push(buffer);
    readable.push(null);
    return readable;
}
router.post('/export', asyncHandler(async (req, res) => {
    const orgId = req.headers['x-org-id'] || 'default';
    const payload = { orgId, exportedAt: new Date().toISOString(), data: { message: 'sample export' } };
    const archive = archiver('zip');
    const chunks = [];
    archive.append(JSON.stringify(payload, null, 2), { name: 'export.json' });
    archive.finalize();
    const stream = archive;
    try {
        const asyncIter = stream;
        for await (const chunk of asyncIter) {
            const c = chunk;
            if (typeof c === 'string')
                chunks.push(Buffer.from(c));
            else if (Buffer.isBuffer(c))
                chunks.push(c);
            else if (Array.isArray(c))
                chunks.push(Buffer.from(c));
            else
                chunks.push(Buffer.from(String(c)));
        }
    }
    catch (e) {
    }
    const zipBuffer = Buffer.concat(chunks);
    try {
        const account = process.env.AZURE_STORAGE_ACCOUNT;
        const key = process.env.AZURE_STORAGE_KEY;
        if (!account || !key)
            return res.status(500).json({ error: 'Storage not configured' });
        const credential = new StorageSharedKeyCredential(account, key);
        const blobService = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
        const containerName = `gdpr-exports`;
        const container = blobService.getContainerClient(containerName);
        await container.createIfNotExists();
        const blobName = `${orgId}/export-${Date.now()}.zip`;
        const block = container.getBlockBlobClient(blobName);
        await block.uploadData(zipBuffer, { blobHTTPHeaders: { blobContentType: 'application/zip' } });
        const expiresOn = new Date(Date.now() + 1000 * 60 * 60);
        const sas = generateBlobSASQueryParameters({
            containerName,
            blobName,
            permissions: ContainerSASPermissions.parse('r'),
            startsOn: new Date(),
            expiresOn,
            protocol: SASProtocol.Https
        }, credential);
        const url = `${block.url}?${sas.toString()}`;
        res.json({ url });
    }
    catch (err) {
        logger.error('GDPR export failed', { error: err.message });
        res.status(500).json({ error: 'Export failed' });
    }
}));
router.delete('/purge', asyncHandler(async (req, res) => {
    const blobName = req.query.blob;
    if (!blobName)
        return res.status(400).json({ error: 'blob query required' });
    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const key = process.env.AZURE_STORAGE_KEY;
    if (!account || !key)
        return res.status(500).json({ error: 'Storage not configured' });
    const credential = new StorageSharedKeyCredential(account, key);
    const blobService = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
    const container = blobService.getContainerClient('gdpr-exports');
    const block = container.getBlockBlobClient(blobName);
    try {
        await block.deleteIfExists();
        res.json({ ok: true });
    }
    catch (err) {
        logger.error('Purge failed', { error: err.message });
        res.status(500).json({ error: 'Purge failed' });
    }
}));
export default router;
//# sourceMappingURL=gdpr.js.map
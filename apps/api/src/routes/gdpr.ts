import { Readable } from 'stream';

import { Router, type Router as ExpressRouter, type Request, type Response } from 'express';
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, ContainerSASPermissions, SASProtocol } from '@azure/storage-blob';
import archiver from 'archiver';

import { logger } from '../lib/logger.js';
import { asyncHandler } from '../lib/errors.js';

const router: ExpressRouter = Router();

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable._read = () => {}; // noop
  readable.push(buffer);
  readable.push(null);
  return readable;
}

router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.headers['x-org-id'] as string || 'default';
  // For demo: build a small JSON export
  const payload = { orgId, exportedAt: new Date().toISOString(), data: { message: 'sample export' } };

  // Zip in memory
  const archive = archiver('zip');
  const chunks: Buffer[] = [];
  archive.append(JSON.stringify(payload, null, 2), { name: 'export.json' });
  archive.finalize();

  const stream = archive as unknown as NodeJS.ReadableStream;
  try {
    const asyncIter = stream as AsyncIterable<unknown>;
    for await (const chunk of asyncIter) {
      const c = chunk as unknown;
      if (typeof c === 'string') chunks.push(Buffer.from(c));
      else if (Buffer.isBuffer(c)) chunks.push(c as Buffer);
      else if (Array.isArray(c)) chunks.push(Buffer.from(c as number[]));
      else chunks.push(Buffer.from(String(c)));
    }
  } catch (e) {
    // best-effort: if stream iteration fails, continue with what we have
  }
  const zipBuffer = Buffer.concat(chunks);

  try {
    const account = process.env.AZURE_STORAGE_ACCOUNT as string;
    const key = process.env.AZURE_STORAGE_KEY as string;
    if (!account || !key) return res.status(500).json({ error: 'Storage not configured' });

  const credential = new StorageSharedKeyCredential(account, key as string);
    const blobService = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
    const containerName = `gdpr-exports`;
    const container = blobService.getContainerClient(containerName);
    await container.createIfNotExists();

    const blobName = `${orgId}/export-${Date.now()}.zip`;
    const block = container.getBlockBlobClient(blobName);
    await block.uploadData(zipBuffer, { blobHTTPHeaders: { blobContentType: 'application/zip' } });

    // Generate SAS (short lived)
    const expiresOn = new Date(Date.now() + 1000 * 60 * 60); // 1h
  const sas = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: ContainerSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn,
      protocol: SASProtocol.Https
    }, credential as unknown as StorageSharedKeyCredential);

    const url = `${block.url}?${sas.toString()}`;
    res.json({ url });
  } catch (err) {
    logger.error('GDPR export failed', { error: (err as Error).message });
    res.status(500).json({ error: 'Export failed' });
  }
}));

router.delete('/purge', asyncHandler(async (req: Request, res: Response) => {
  const blobName = req.query.blob as string;
  if (!blobName) return res.status(400).json({ error: 'blob query required' });
  const account = process.env.AZURE_STORAGE_ACCOUNT as string;
  const key = process.env.AZURE_STORAGE_KEY as string;
  if (!account || !key) return res.status(500).json({ error: 'Storage not configured' });

  const credential = new StorageSharedKeyCredential(account, key);
  const blobService = new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
  const container = blobService.getContainerClient('gdpr-exports');
  const block = container.getBlockBlobClient(blobName);
  try {
    await block.deleteIfExists();
    res.json({ ok: true });
  } catch (err) {
    logger.error('Purge failed', { error: (err as Error).message });
    res.status(500).json({ error: 'Purge failed' });
  }
}));

export default router;

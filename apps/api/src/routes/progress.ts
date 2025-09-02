import { Router, type Router as ExpressRouter } from 'express';
import fs from 'fs';
import path from 'path';

const router: ExpressRouter = Router();

router.get('/v1/progress', (req, res) => {
  const p = path.join(process.cwd(), 'dist', 'progress.json');
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'progress not generated' });
  const body = fs.readFileSync(p, 'utf8');
  const checksum = require('crypto').createHash('sha256').update(body).digest('hex');
  res.setHeader('X-Progress-Checksum', checksum.slice(0,12));
  res.setHeader('Cache-Control', 'no-cache');
  return res.type('application/json').send(body);
});

export default router;

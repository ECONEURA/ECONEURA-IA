// Shim para resolver import runtime de 'routes/monitoring'
// Intenta reexportar desde el módulo real si existe, sino exporta un router vacío.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const realPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'monitoring');
let exported: any;
try {
  // require the compiled JS if present (common case in dev with ts-node/tsx)
  exported = await import(`./monitoring`);
} catch (err) {
  try {
    exported = await import(`./monitoring/index`);
  } catch (err2) {
    // fallback: export a minimal router-like object
    const express = await import('express');
    const router = express.Router();
    router.get('/health', (req: any, res: any) => res.json({ ok: true }));
    exported = { default: router };
  }
}

export default exported.default ?? exported;

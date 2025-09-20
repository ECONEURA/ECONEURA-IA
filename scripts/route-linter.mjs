#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Linter de rutas: verifica que las rutas definidas en apps/api/src/routes usen prefijo /v1
// Reglas:
// - Strings literales como '/health', '/ready' permitidos SOLO si file es health.ts y ruta NO es pública (no bajo app.use('/v1', ...))
// - Todas las rutas de negocio deben comenzar por '/v1/'

const root = process.cwd();
const routesDir = path.join(root, 'apps/api/src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
const offenders = [];

// Map of symbol -> file for routes/index.ts
function parseRoutesIndexV1Mounted() {
  const idxPath = path.join(routesDir, 'index.ts');
  const mounted = new Set();
  if (!fs.existsSync(idxPath)) return mounted;
  const src = fs.readFileSync(idxPath, 'utf8');
  const importMap = new Map(); // symbol -> file
  const importRe = /import\s*\{\s*([\w,\s]+)\s*\}\s*from\s*['\"]\.\/(.*?)['\"]/g;
  let m;
  while ((m = importRe.exec(src))) {
    const symbols = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const rel = m[2];
    for (const s of symbols) importMap.set(s, rel.endsWith('.ts') ? rel : rel + '.ts');
  }
  const useRe = /router\.use\(\s*['\"]\/v1['\"][^\)]*\[([\s\S]*?)\]\s*\)/m;
  const useM = useRe.exec(src);
  if (useM) {
    const list = useM[1];
    const names = list.split(',').map(s => s.trim()).filter(Boolean);
    for (const n of names) {
      const f = importMap.get(n);
      if (f) mounted.add(f + (f.endsWith('.ts') ? '' : ''));
    }
  }
  return mounted;
}

// Map symbol -> file for apps/api/src/index.ts
function parseAppIndexV1Mounted() {
  const idxPath = path.join(root, 'apps/api/src/index.ts');
  const mounted = new Set();
  if (!fs.existsSync(idxPath)) return mounted;
  const src = fs.readFileSync(idxPath, 'utf8');
  const importMap = new Map(); // symbol -> file
  const importDefaultRe = /import\s+([\w$]+)\s+from\s*['\"]\.\/routes\/([^'\"]+)['\"]/g;
  let m;
  while ((m = importDefaultRe.exec(src))) {
    const sym = m[1];
    const rel = m[2].endsWith('.ts') ? m[2] : m[2] + '.ts';
    importMap.set(sym, rel);
  }
  const useRe = /app\.use\(\s*['\"]\/v1[^'\"]*['\"]\s*,\s*([\w$]+)/g;
  while ((m = useRe.exec(src))) {
    const sym = m[1];
    const f = importMap.get(sym);
    if (f) mounted.add(f);
  }
  return mounted;
}

const v1MountedFiles = new Set([...parseRoutesIndexV1Mounted(), ...parseAppIndexV1Mounted()]);

function parseAppIndexMountedAll() {
  const idxPath = path.join(root, 'apps/api/src/index.ts');
  const mounted = new Set();
  if (!fs.existsSync(idxPath)) return mounted;
  const src = fs.readFileSync(idxPath, 'utf8');
  const importMap = new Map(); // symbol -> file
  const importDefaultRe = /import\s+([\w$]+)\s+from\s*['\"]\.\/routes\/([^'\"]+)['\"]/g;
  let m;
  while ((m = importDefaultRe.exec(src))) {
    const sym = m[1];
    const rel = m[2].endsWith('.ts') ? m[2] : m[2] + '.ts';
    importMap.set(sym, rel);
  }
  const useRe = /app\.use\(\s*[^,]+,\s*([\w$]+)/g;
  while ((m = useRe.exec(src))) {
    const sym = m[1];
    const f = importMap.get(sym);
    if (f) mounted.add(f);
  }
  return mounted;
}

const mountedAllFiles = parseAppIndexMountedAll();

for (const f of files) {
  const fp = path.join(routesDir, f);
  const src = fs.readFileSync(fp, 'utf8');
  if (!mountedAllFiles.has(f) && !v1MountedFiles.has(f)) {
    // Not mounted anywhere: skip file
    continue;
  }
  // Detectar nombres de routers locales
  const routerNames = new Set();
  const decls = [
    /(?:export\s+)?const\s+(\w+)\s*:?\s*[\w<>\s]*=\s*Router\s*\(/g,
    /(?:export\s+)?const\s+(\w+)\s*=\s*express\.Router\s*\(/g
  ];
  for (const re of decls) {
    let dm;
    while ((dm = re.exec(src))) routerNames.add(dm[1]);
  }
  if (routerNames.size === 0) continue;
  // Buscar patrones <router>.METHOD('/...') en routers locales
  const method = '(get|post|put|patch|delete)';
  const str = "['\"]([^'\"]+)['\"]";
  const patterns = [...routerNames].map((n) => new RegExp(`${n}\\s*\\.\\s*${method}\\s*\\(\\s*${str}`, 'g'));
  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(src))) {
      const route = m[2];
    const isHealthFile = /health\.ts$/.test(f) || /integrations\.make\.health\.ts$/.test(f) || /index\.ts$/.test(f);
    const allowedBare = isHealthFile && (route === '/live' || route === '/ready' || route === '/metrics' || route === '/status' || route === '/health' || route === '/v1/integrations/make/health');
    if (allowedBare) continue;
    // If file is mounted under /v1, allow relative routes like '/' '/:id'
    if (v1MountedFiles.has(f)) continue;
    if (!route.startsWith('/v1/')) {
      offenders.push(`${f}:${route}`);
    }
    }
  }
}


if (offenders.length) {
  console.error('Rutas fuera de /v1 detectadas en código:\n' + offenders.join('\n'));
  process.exit(1);
}
console.log('route-linter OK (/v1-only)');

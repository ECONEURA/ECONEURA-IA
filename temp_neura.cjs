const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let FAIL = 0;

function ok(msg) { console.log(`OK  ${msg}`); }
function ko(msg) { console.log(`ERR ${msg}`); FAIL = 1; }

function search(pattern, paths, isCount = false) {
  try {
    const include = '*.ts,*.js,*.json';
    const pathStr = paths.map(p => `"${p}"`).join(',');
    const escapedPattern = pattern.replace(/"/g, '""');
    let cmd;
    if (isCount) {
      cmd = "Get-ChildItem -Recurse -Path " + pathStr + " -Include " + include + " -Exclude \"node_modules\",\".ignored_node_modules\",\"venv\" -ErrorAction SilentlyContinue | Select-String -Pattern \"" + escapedPattern + "\" | Measure-Object | Select-Object -ExpandProperty Count";
      return parseInt(execSync(cmd, { encoding: 'utf8', shell: 'powershell.exe' }).trim()) || 0;
    } else {
      cmd = "Get-ChildItem -Recurse -Path " + pathStr + " -Include " + include + " -Exclude \"node_modules\",\".ignored_node_modules\",\"venv\" -ErrorAction SilentlyContinue | Select-String -Pattern \"" + escapedPattern + "\" | Select-Object -First 1";
      execSync(cmd, { encoding: 'utf8', shell: 'powershell.exe' });
      return true;
    }
  } catch {
    return isCount ? 0 : false;
  }
}

function searchWorkflow(pattern, wfDir) {
  try {
    const escapedPattern = pattern.replace(/"/g, '""');
    const cmd = "Get-ChildItem -Path \"" + wfDir + "\\*.yml\",\"" + wfDir + "\\*.yaml\" -ErrorAction SilentlyContinue | Select-String -Pattern \"" + escapedPattern + "\" | Measure-Object | Select-Object -ExpandProperty Count";
    return parseInt(execSync(cmd, { encoding: 'utf8', shell: 'powershell.exe' }).trim()) || 0;
  } catch {
    return 0;
  }
}

function getRunWithoutFlag(wfDir) {
  try {
    const cmd = "Get-ChildItem -Path \"" + wfDir + "\\*.yml\",\"" + wfDir + "\\*.yaml\" -ErrorAction SilentlyContinue | ForEach-Object { $file = $_.FullName; if (!(Select-String -Path $file -Pattern \"DEPLOY_ENABLED\")) { $file } }";
    const result = execSync(cmd, { encoding: 'utf8', shell: 'powershell.exe' }).trim();
    return result ? result.split('\n').filter(line => line.trim()) : [];
  } catch {
    return [];
  }
}

async function main() {
  const apps = 'apps';
  const web = 'apps/web';
  const packages = 'packages';
  const wfDir = '.github/workflows';

  // 1) UI / Login / Bearer
  if (search("INICIAR SESIÓN", [apps, web])) ok("Botón INICIAR SESIÓN presente"); else ko("Botón INICIAR SESIÓN ausente");
  if (search("auth:login", [apps, web])) ok("Evento auth:login"); else ko("Evento auth:login");
  if (search("__ECONEURA_BEARER", [apps, web])) ok("Setter de bearer"); else ko("No se setea bearer");
  if (search("msal|PublicClientApplication", [apps, web])) ok("MSAL detectado"); else ko("MSAL no detectado");

  // 2) Cliente invokeAgent + headers requeridos
  if (search("invokeAgent\\(", [apps, web])) ok("invokeAgent encontrado"); else ko("invokeAgent no encontrado");
  if (search("Authorization:\\s*Bearer", [apps, web])) ok("Header Authorization presente"); else ko("Header Authorization faltante");
  if (search("X-Route.*(azure|local)", [apps, web])) ok("Header X-Route presente"); else ko("Header X-Route faltante");
  if (search("X-Correlation-Id", [apps, web])) ok("Header X-Correlation-Id presente"); else ko("Header X-Correlation-Id faltante");
  if (search("VITE_NEURA_GW_URL.*/api|/api/invoke/", [apps, web])) ok("UI usa proxy /api"); else ko("UI no usa /api");

  // 3) Secretos en cliente (prohibido)
  if (search("VITE_.*(SECRET|KEY|TOKEN|PASSWORD)=", [apps, web])) ko("Posibles secretos VITE_* en cliente"); else ok("Sin secretos VITE_*");

  // 4) Proxy/API endpoints + forward de auth
  if (search("/api/health", [apps, packages])) ok("GET /api/health localizado"); else ko("GET /api/health no localizado");
  if (search("/api/invoke/\\\\:id", [apps, packages])) ok("POST /api/invoke/:id localizado"); else ko("POST /api/invoke/:id no localizado");
  if (search("forward|proxy|fetch.+invoke", [apps, packages])) ok("Proxy de invocación localizado"); else ko("Proxy de invocación no localizado");
  if (search("Authorization.*(forward|headers)", [apps, packages])) ok("Proxy reenvía Authorization"); else ko("Proxy no reenvía Authorization");

  // 5) Ruteo NEURA/Make
  const routes = search('"route"\\s*:\\s*"(azure|local)"', ['.'], true);
  if (routes > 0) ok(`Rutas azure/local: ${routes}`); else ko("Ruteo de agentes no encontrado");

  // 6) Workflows NO_DEPLOY estricto
  if (fs.existsSync(wfDir)) {
    const flags = searchWorkflow("DEPLOY_ENABLED\\s*:\\s*['\"]false['\"]", wfDir);
    const dang = searchWorkflow("\\b(az|azd|terraform|kubectl|helm|docker\\s+(build|push))\\b", wfDir);
    let runNoFlag = [];
    if (process.env.STRICT_NO_DEPLOY === '1') {
      runNoFlag = getRunWithoutFlag(wfDir);
    }
    if (flags > 0) ok(`NO_DEPLOY flags=${flags}`); else ko("NO_DEPLOY flag ausente");
    if (dang === 0) ok("Sin comandos peligrosos"); else ko("Workflows peligrosos");
    if (runNoFlag.length === 0) ok("STRICT ok"); else {
      fs.writeFileSync('reports/WF_STRICT_VIOLATIONS.txt', runNoFlag.join('\n'));
      ko("run: sin flag NO_DEPLOY");
    }
  } else {
    ko("Sin .github/workflows");
  }

  // 7) Smoke real opcional (rápido, sin esperar)
  const smokeUrl = process.env.SMOKE_URL;
  const smokeBearer = process.env.SMOKE_BEARER;
  if (smokeUrl && smokeBearer) {
    try {
      // Health check
      execSync(`curl -fsS --max-time ${process.env.TIMEOUT || 3} "${smokeUrl}/api/health"`, { stdio: 'pipe' });
      ok("health 200");
    } catch {
      ko("health falla");
    }
    for (const r of ['azure', 'local']) {
      try {
        execSync(`curl -fsS --max-time ${process.env.TIMEOUT || 3} -X POST "${smokeUrl}/api/invoke/ping" -H "Authorization: Bearer ${smokeBearer}" -H "X-Route: ${r}" -H "X-Correlation-Id: ci-${r}-${Date.now()}" -H "Content-Type: application/json" -d '{"input":"ping"}'`, { stdio: 'pipe' });
        ok(`invoke:${r} 200`);
      } catch {
        ko(`invoke:${r} falla`);
      }
    }
  }

  // 8) JSON + exit code
  const result = {
    checks: "neura_make_fast",
    routes: routes,
    strict: process.env.STRICT_NO_DEPLOY || '0',
    fail: FAIL
  };
  fs.writeFileSync('reports/NEURA_FAST.json', JSON.stringify(result));
  if (FAIL === 0) {
    console.log("OK: wiring y login válidos (estático)");
  } else {
    console.log("FALLOS: revisa líneas ERR");
  }
  process.exit(FAIL);
}

main().catch(console.error);
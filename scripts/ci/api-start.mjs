import {spawn} from 'node:child_process';
import {existsSync, mkdirSync} from 'node:fs';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root = process.cwd();
mkdirSync('.artifacts', {recursive:true});

function readPkg(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

const apiDir = existsSync('apps/api') ? 'apps/api' : '.';
const pkg = readPkg(resolve(apiDir, 'package.json'));
const scripts = pkg.scripts || {};

const candidate =
  scripts['start:ci'] ? ['pnpm',['--filter',"./apps/api","start:ci"]] :
  scripts['start']    ? ['pnpm',['--filter',"./apps/api","start"]] :
  scripts['dev']      ? ['pnpm',['--filter',"./apps/api","dev"]] :
  existsSync(resolve(apiDir,'dist/index.js')) ? ['node',[resolve(apiDir,'dist/index.js')]] :
  null;

if (!candidate) {
  console.error('No start script or dist entry found for API');
  process.exit(1);
}

const [cmd, args] = candidate;
const child = spawn(cmd, args, {stdio:['ignore','pipe','pipe'], env:process.env, cwd:root});
const fs = await import('node:fs');
const log = fs.createWriteStream('.artifacts/api.log', {flags:'a'});
child.stdout.pipe(log); child.stderr.pipe(log);
child.on('exit', (code)=>{ console.log('API exited with', code); });
console.log('API start invoked:', cmd, args.join(' '));

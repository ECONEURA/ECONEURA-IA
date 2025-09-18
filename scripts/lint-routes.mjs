import { globby } from "globby";
import fs from "node:fs";

const files = await globby(["apps/api/src/**/*.ts", "!**/*.test.ts"]);
const bad = [];

for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const hits = [...s.matchAll(/router\.(get|post|put|delete|patch)\(\s*['"`]\/(?!v1\/)/g)];
  if (hits.length) {
    bad.push({ f, n: hits.length });
  }
}

if (bad.length) {
  console.error(JSON.stringify(bad, null, 2));
  process.exit(2);
}

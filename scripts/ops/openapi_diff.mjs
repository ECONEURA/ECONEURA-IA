#!/usr/bin/env node
import fs from "fs"; import path from "path"; 
const live = JSON.parse(fs.readFileSync(".artifacts/openapi.live.json","utf8"));
const snap = JSON.parse(fs.readFileSync("snapshots/openapi.runtime.json","utf8"));
const onlyV1 = o => Object.fromEntries(Object.entries(o.paths||{}).filter(([k])=>k.startsWith("/v1/")));
const a = onlyV1(live), b = onlyV1(snap);
const diff = []; const set = new Set([...Object.keys(a),...Object.keys(b)]);
for (const p of set){ if(!a[p]||!b[p]||JSON.stringify(a[p])!==JSON.stringify(b[p])) diff.push(p); }
fs.mkdirSync("reports",{recursive:true});
fs.writeFileSync("reports/openapi-diff.json", JSON.stringify({diff},null,2));
if(diff.length){ console.error("OPENAPI DIFF on /v1:", diff.length); process.exit(1); }

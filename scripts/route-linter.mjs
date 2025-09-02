#!/usr/bin/env node
import fs from "node:fs";

const path = "apps/api/openapi/openapi.json";
if (!fs.existsSync(path)) {
  console.error("OpenAPI file not found:", path);
  process.exit(1);
}
const openapi = JSON.parse(fs.readFileSync(path,"utf8"));
const apiPaths = Object.keys(openapi.paths || {});
const nonV1 = apiPaths.filter(p=>!p.startsWith("/v1/"));
if (nonV1.length) {
  console.error("Rutas fuera de /v1:", nonV1.join(", "));
  process.exit(1);
}
console.log("route-linter OK (/v1-only)");

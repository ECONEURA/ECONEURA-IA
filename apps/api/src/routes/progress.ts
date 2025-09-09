import { Router } from "express";
import { execSync } from "node:child_process";

export const progressRouter = Router();

progressRouter.get("/v1/progress", (_req, res) => {
  let pct = 0;
  let areas = {};

  try {
    const out = execSync("node tools/progress/audit.js", {
      stdio: ["ignore", "pipe", "ignore"]
    }).toString();
    const j = JSON.parse(out);
    pct = j.pct;
    areas = j.areas;
  } catch {
    // Fallback values
    pct = 0;
    areas = {};
  }

  res.json({
    ok: true,
    pct,
    areas,
    ts: Date.now()
  });
});

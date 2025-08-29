import type { Request, Response, NextFunction } from "express";
import { aiCost } from "../lib/observe.js";

const BUDGET = Number(process.env.ORG_MONTHLY_BUDGET_EUR || 50);
// TODO DB: persistir; por ahora memoria
const bucket = new Map<string, { month:string; eur:number }>();

export function reserveBudget(mode:"text"|"image"|"tts"){
  return (req: Request, res: Response, next: NextFunction) => {
    const org = getOrg(req);
    const month = new Date().toISOString().slice(0,7);
    const key = `${org}:${month}`;
    const rec = bucket.get(key) || { month, eur: 0 };
    (req as any).__budget = { key, reserved: 0, mode };
    bucket.set(key, rec);
    next();
  };
}
export function finalizeBudget(req: Request, ok: boolean, model:string, costEur:number){
  const { key, mode } = (req as any).__budget || {};
  if (!key) return;
  const rec = bucket.get(key) || { month:"", eur:0 };
  if (ok) {
    rec.eur += costEur;
    aiCost.inc({ mode, provider: providerOf(req), model }, costEur);
  }
  bucket.set(key, rec);
  if (rec.eur > BUDGET) (req as any).__overBudget = true;
}
export function assertWithinBudget(req: Request, res: Response){
  if ((req as any).__overBudget) res.setHeader("X-Budget-Exceeded","true");
}

function getOrg(req: Request){ return (req.headers["x-org-id"] as string) || (req as any).__org || "demo-org"; }
function providerOf(req: Request){ return process.env.AZURE_OPENAI_API_KEY ? "azure" : "demo"; }

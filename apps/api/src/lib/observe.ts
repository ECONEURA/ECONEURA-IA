import prom from "prom-client";
export const registry = new prom.Registry();
prom.collectDefaultMetrics({ register: registry });
export const aiLatencyMs = new prom.Histogram({ name:"ai_latency_ms", help:"Latency", buckets:[50,100,200,400,800,1600,3200], labelNames:["mode","provider","model"] as const });
export const aiReq = new prom.Counter({ name:"ai_requests_total", help:"Requests", labelNames:["mode","provider","model","status"] as const });
export const aiTokens = new prom.Counter({ name:"ai_tokens_total", help:"Tokens", labelNames:["kind","provider","model"] as const });
export const aiCost = new prom.Counter({ name:"ai_cost_eur_total", help:"Cost EUR", labelNames:["mode","provider","model"] as const });

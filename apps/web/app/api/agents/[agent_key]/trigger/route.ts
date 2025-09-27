import crypto from "node:crypto";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function hmac(secret: string, body: string, ts: number) {
  // Contrato actual: sha256=HMAC( timestamp + "\n" + body )
  const mac = crypto.createHmac("sha256", secret).update(`${ts}\n${body}`).digest("hex");
  return `sha256=${mac}`;
}

export async function POST(req: Request, { params }: { params: { agent_key: string } }) {
  try {
    const agent_key = params.agent_key;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/,"") || "";
    if (!base) return NextResponse.json({ message: "API URL not configured" }, { status: 500 });

    const bodyText = await req.text();
    const ts = Math.floor(Date.now()/1000);
    const cid = req.headers.get("x-correlation-id") || crypto.randomUUID();
    const idem = req.headers.get("idempotency-key") || crypto.randomUUID();
    const org = req.headers.get("x-org-id") || "org_demo";
    const secret = process.env.API_HMAC_SECRET || process.env.MAKE_SIGNING_SECRET || "test";

    const sig = hmac(secret, bodyText, ts);
    const url = `${base}/v1/agents/${encodeURIComponent(agent_key)}/trigger`;
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.headers.get("authorization") || "Bearer transition",
        "X-Correlation-Id": cid,
        "Idempotency-Key": idem,
        "X-Timestamp": String(ts),
        "X-Signature": sig,
        "X-Org-Id": org
      },
      body: bodyText
    });
    const text = await upstream.text();
    const res = new NextResponse(text, { status: upstream.status });
    // Propaga headers FinOps/tracing útiles
    ["x-est-cost-eur","x-budget-pct","x-latency-ms","x-route","x-correlation-id"].forEach(h => {
      const v = upstream.headers.get(h); if (v) res.headers.set(h, v);
    });
    res.headers.set("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res;
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "proxy error" }, { status: 502 });
  }
}

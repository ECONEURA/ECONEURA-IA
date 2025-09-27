import { NextRequest } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL as string;

async function forward(body: any) {
  if (!API) throw new Error('NEXT_PUBLIC_API_URL not configured');
  const res = await fetch(`${API}/v1/admin/finops/killswitch`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await forward(body);
    const j = await r.text();
    return new Response(j, { status: r.status, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ title: 'Proxy error', detail: e?.message ?? 'unknown' }), { status: 502 });
  }
}

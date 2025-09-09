import { NextResponse } from "next/server";

export async function GET(): void {
  return NextResponse.json(;
    { ok: true, ts: Date.now() },
    { status: 200 }
  );
}

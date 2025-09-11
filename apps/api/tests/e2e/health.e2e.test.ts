import { describe, it, expect } from "vitest";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";
const HEALTH = process.env.HEALTH_PATH || "/health";

describe("API health", () => {
  it("returns 200 on /health", async () => {
    const res = await fetch(`${BASE}${HEALTH}`);
    expect(res.status).toBe(200);
    const json = await res.json().catch(() => ({}));
    expect(typeof json).toBe("object");
  });
});

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import crypto from "node:crypto";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import request from "supertest";

let server: http.Server;
let jwksUrl = "";
let privateKey: crypto.KeyObject;
let badPrivateKey: crypto.KeyObject;
const kid = "test-kid";

async function startJwks() {
  const { privateKey: pk, publicKey } = await generateKeyPair("RS256");
  const { privateKey: pkBad } = await generateKeyPair("RS256");
  privateKey = pk as any;
  badPrivateKey = pkBad as any;
  const pubJwk = await exportJWK(publicKey as any);
  (pubJwk as any).kid = kid;

  server = http.createServer((req, res) => {
    if (req.url === "/.well-known/jwks.json") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ keys: [pubJwk] }));
    } else {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((r) => server.listen(0, r));
  const { port } = server.address() as any;
  jwksUrl = `http://127.0.0.1:${port}/.well-known/jwks.json`;
}

async function jwt({ exp }: { exp: number }, bad = false) {
  const iat = Math.floor(Date.now() / 1000);
  const payload = { sub: "user@test", aud: "econeura", iss: "test-issuer", iat, exp };
  const key = bad ? badPrivateKey : privateKey;
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuedAt(iat)
    .setIssuer("test-issuer")
    .setAudience("econeura")
    .setExpirationTime(exp)
    .sign(key as any);
}

beforeAll(async () => {
  process.env.AUTH_REQUIRED = "true";
  process.env.MAKE_SIGNING_SECRET = "test";
  await startJwks();
  process.env.JWKS_URI = jwksUrl;
});

// Importa la app DESPUÉS de setear envs
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import app from '../../apps/api/src/index.js';

afterAll(async () => {
  await new Promise<void>((r) => server.close(() => r()));
});

const AGENT = "cfo_dunning";

function baseHeaders(body: any) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  const sig = crypto
    .createHmac("sha256", process.env.MAKE_SIGNING_SECRET!)
    .update(payload)
    .digest("hex");
  return {
    "X-Correlation-Id": crypto.randomUUID(),
    "Idempotency-Key": crypto.randomUUID(),
    "X-Timestamp": String(Math.floor(Date.now() / 1000)),
    "X-Signature": `sha256=${sig}`,
    "Content-Type": "application/json",
  };
}

describe("AAD JWT contract", () => {
  it("JWT válido → 200/202", async () => {
    const token = await jwt({ exp: Math.floor(Date.now() / 1000) + 60 });
    const body = { request_id: crypto.randomUUID(), org_id: "org_demo", actor: "cockpit", payload: {}, dryRun: true };
    const res = await request(app)
      .post(`/v1/agents/${AGENT}/trigger`)
      .set({ ...baseHeaders(body), Authorization: `Bearer ${token}` })
      .send(body);
    expect([200, 202]).toContain(res.status);
    expect(res.headers).toHaveProperty("x-est-cost-eur");
  });

  it("JWT expirado → 401", async () => {
    const token = await jwt({ exp: Math.floor(Date.now() / 1000) - 60 });
    const body = { request_id: crypto.randomUUID(), org_id: "org_demo", actor: "cockpit", payload: {}, dryRun: true };
    const res = await request(app)
      .post(`/v1/agents/${AGENT}/trigger`)
      .set({ ...baseHeaders(body), Authorization: `Bearer ${token}` })
      .send(body);
    expect(res.status).toBe(401);
  });

  it("JWT firma mala → 401/403", async () => {
    const token = await new SignJWT({ sub: "user@test" })
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuer("test-issuer")
      .setAudience("econeura")
      .setIssuedAt()
      .setExpirationTime("1m")
      .sign(badPrivateKey as any);
    const body = { request_id: crypto.randomUUID(), org_id: "org_demo", actor: "cockpit", payload: {}, dryRun: true };
    const res = await request(app)
      .post(`/v1/agents/${AGENT}/trigger`)
      .set({ ...baseHeaders(body), Authorization: `Bearer ${token}` })
      .send(body);
    expect([401, 403]).toContain(res.status);
  });
});

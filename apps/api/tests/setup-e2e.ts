import nock from "nock";

export function enableExternalMocks() {
  if (process.env.MOCK_EXTERNAL !== "1") return;
  nock.disableNetConnect();
  nock.enableNetConnect("127.0.0.1");
  const anyAI = /openai|azure|anthropic|microsoft|vertex|groq/i;
  nock(anyAI).persist().post(/.*/).reply(200, { id: "mock", data: {}, choices: [{ text: "ok" }] });
  nock(anyAI).persist().get(/.*/).reply(200, { ok: true });
}

enableExternalMocks();

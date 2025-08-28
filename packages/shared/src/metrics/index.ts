import { Registry, Gauge } from "prom-client";

export const metricsRegister = new Registry();

export const aiActiveRequests = new Gauge({
  name: "ai_active_requests",
  help: "Current active AI requests",
  registers: [metricsRegister],
});

export { metricsRegister as register };

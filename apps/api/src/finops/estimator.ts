type Provider = "azure" | "local";
type Input = { agent_key: string; provider?: Provider; tokens?: number };
const PRICE: Record<Provider, number> = { azure: 0.000002, local: 0.0000005 }; // €/token ejemplo

export function estimateCostEUR({ agent_key, provider = "azure", tokens = 5000 }: Input) {
  const mult = agent_key.includes("director") ? 1.5 : 1.0;
  const cost = PRICE[provider] * tokens * mult;
  return +cost.toFixed(4);
}

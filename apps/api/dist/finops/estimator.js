const PRICE = { azure: 0.000002, local: 0.0000005 };
export function estimateCostEUR({ agent_key, provider = "azure", tokens = 5000 }) {
    const mult = agent_key.includes("director") ? 1.5 : 1.0;
    const cost = PRICE[provider] * tokens * mult;
    return +cost.toFixed(4);
}
//# sourceMappingURL=estimator.js.map
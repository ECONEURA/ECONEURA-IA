type Provider = "azure" | "local";
type Input = {
    agent_key: string;
    provider?: Provider;
    tokens?: number;
};
export declare function estimateCostEUR({ agent_key, provider, tokens }: Input): number;
export {};
//# sourceMappingURL=estimator.d.ts.map
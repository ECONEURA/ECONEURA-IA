export function calculateCostEUR(tokens: number, pricePer1K: number): number {
  return (tokens * pricePer1K) / 1000;
}

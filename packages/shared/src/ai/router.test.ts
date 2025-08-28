import { preflightCostCheck, filterProviders, aiRequestSchema } from './router';
import { describe, it, expect } from 'vitest';

describe('preflightCostCheck', () => {
  it('permite requests bajo el límite', () => {
    const input = aiRequestSchema.parse({
      orgId: 'org1',
      tokensIn: 500,
      tokensOutEst: 500,
      pricePer1KIn: 1,
      pricePer1KOut: 1,
      limits: { perRequestEUR: 2, dailyEUR: 10, monthlyEUR: 100, emergencyStopEnabled: false, emergencyStopThresholdEUR: 1500 },
    });
    expect(() => preflightCostCheck(input)).not.toThrow();
  });
  it('bloquea requests sobre el límite', () => {
    const input = aiRequestSchema.parse({
      orgId: 'org1',
      tokensIn: 2000,
      tokensOutEst: 2000,
      pricePer1KIn: 1,
      pricePer1KOut: 1,
      limits: { perRequestEUR: 2, dailyEUR: 10, monthlyEUR: 100, emergencyStopEnabled: false, emergencyStopThresholdEUR: 1500 },
    });
    expect(() => preflightCostCheck(input)).toThrow();
  });
});

describe('filterProviders', () => {
  it('excluye el failedProviderId', () => {
    const providers = [{ id: 'a' }, { id: 'b' }];
    expect(filterProviders(providers, 'a')).toEqual([{ id: 'b' }]);
  });
  it('no filtra si no hay failedProviderId', () => {
    const providers = [{ id: 'a' }, { id: 'b' }];
    expect(filterProviders(providers)).toEqual(providers);
  });
});
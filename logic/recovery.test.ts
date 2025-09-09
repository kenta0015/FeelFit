/// <reference types="vitest/globals" />

import { shouldRecommendRecovery, RecoverySignals } from './recovery.js';

describe('shouldRecommendRecovery', () => {
  it('returns false when no triggers met', () => {
    const signals: RecoverySignals = {
      monotony7d: 1.0,
      strain7d: 1.0,
      acuteLoad3d: 1.0,
      lastHighGap: 3,
      earlyStopRate: 0.0,
      now: new Date().toISOString(),
      history: []
    };
    const result = shouldRecommendRecovery(signals);
    expect(result.show).toBe(false);
    expect(result.reason).toMatch(/No recovery triggers/);
  });

  it('returns true for monotony high', () => {
    const signals: RecoverySignals = {
      monotony7d: 2.5,
      now: new Date().toISOString(),
      history: []
    };
    const result = shouldRecommendRecovery(signals);
    expect(result.show).toBe(true);
    expect(result.reason).toMatch(/monotony high/);
    expect(result.type).toBe('active');
  });

  it('returns rest when acute spike + strain high', () => {
    const signals: RecoverySignals = {
      strain7d: 2.0,
      strainP75: 1.5,
      acuteLoad3d: 1.8,
      now: new Date().toISOString(),
      history: []
    };
    const result = shouldRecommendRecovery(signals);
    expect(result.show).toBe(true);
    expect(result.type).toBe('rest');
  });

  it('respects 48h gap cap', () => {
    const now = new Date();
    const signals: RecoverySignals = {
      monotony7d: 3.0,
      now,
      history: [
        { date: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(), accepted: true, type: 'active' }
      ]
    };
    const result = shouldRecommendRecovery(signals);
    expect(result.show).toBe(false);
    expect(result.reason).toMatch(/48 hours/);
  });

  it('respects weekly cap (≥2 in 7d)', () => {
    const now = new Date();
    const signals: RecoverySignals = {
      strain7d: 2.5,
      now,
      history: [
        { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), accepted: true, type: 'active' },
        { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), accepted: false, type: 'active' }
      ]
    };
    const result = shouldRecommendRecovery(signals);
    expect(result.show).toBe(false);
    expect(result.reason).toMatch(/≥2 times/);
  });
});

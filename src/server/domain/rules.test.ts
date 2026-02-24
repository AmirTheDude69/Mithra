import { describe, expect, it } from 'vitest';
import {
  applyAttemptPotIncrease,
  applyPostingPotSeed,
  getAttemptFeeBreakdown,
  getPostingFeeBreakdown,
  getScoreBreakdown,
  isSolveWindowActive,
} from './rules';
import { normalizeAnswer } from './normalize';
import { getUtcPeriodStart } from './leaderboard';

describe('fee breakdowns', () => {
  it('matches posting split of 100 cents into 20 platform and 80 pot', () => {
    const split = getPostingFeeBreakdown();
    expect(split.userDebitCents).toBe(100);
    expect(split.platformCreditCents).toBe(20);
    expect(split.potContributionCents).toBe(80);
  });

  it('matches attempt split of 10 cents into 2 platform and 8 pot', () => {
    const split = getAttemptFeeBreakdown();
    expect(split.userDebitCents).toBe(10);
    expect(split.platformCreditCents).toBe(2);
    expect(split.potContributionCents).toBe(8);
  });
});

describe('points', () => {
  it('returns correct score values', () => {
    const score = getScoreBreakdown();
    expect(score.posted).toBe(1);
    expect(score.solved).toBe(10);
    expect(score.expiredUnanswered).toBe(10);
  });
});

describe('pot math', () => {
  it('adds 80 cents on post seed', () => {
    expect(applyPostingPotSeed(0)).toBe(80);
  });

  it('adds 8 cents per attempt', () => {
    expect(applyAttemptPotIncrease(80)).toBe(88);
  });
});

describe('answer normalization', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeAnswer('  THIS   is\nA test  ')).toBe('this is a test');
  });
});

describe('solve window', () => {
  it('treats future end as active', () => {
    const now = new Date('2026-02-24T00:00:00.000Z');
    const end = new Date('2026-02-24T01:00:00.000Z');
    expect(isSolveWindowActive(end, now)).toBe(true);
  });

  it('treats exact end as inactive', () => {
    const now = new Date('2026-02-24T01:00:00.000Z');
    const end = new Date('2026-02-24T01:00:00.000Z');
    expect(isSolveWindowActive(end, now)).toBe(false);
  });
});

describe('UTC period boundaries', () => {
  it('computes daily start at UTC midnight', () => {
    const now = new Date('2026-02-24T13:45:10.000Z');
    expect(getUtcPeriodStart('daily', now)?.toISOString()).toBe('2026-02-24T00:00:00.000Z');
  });

  it('computes weekly start from Monday UTC', () => {
    const now = new Date('2026-02-26T13:45:10.000Z');
    expect(getUtcPeriodStart('weekly', now)?.toISOString()).toBe('2026-02-23T00:00:00.000Z');
  });

  it('computes monthly start at first of month UTC', () => {
    const now = new Date('2026-02-26T13:45:10.000Z');
    expect(getUtcPeriodStart('monthly', now)?.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });
});

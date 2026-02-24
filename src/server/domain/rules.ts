import {
  ATTEMPT_FEE_CENTS,
  PLATFORM_CUT_CENTS_FROM_ATTEMPT,
  PLATFORM_CUT_CENTS_FROM_POST,
  POINTS_POSTED,
  POINTS_SOLVED,
  POINTS_UNSOLVED_EXPIRED,
  POSTING_FEE_CENTS,
  POT_CONTRIBUTION_CENTS_FROM_ATTEMPT,
  POT_CONTRIBUTION_CENTS_FROM_POST,
} from './constants.js';

export function getPostingFeeBreakdown() {
  return {
    userDebitCents: POSTING_FEE_CENTS,
    platformCreditCents: PLATFORM_CUT_CENTS_FROM_POST,
    potContributionCents: POT_CONTRIBUTION_CENTS_FROM_POST,
  };
}

export function getAttemptFeeBreakdown() {
  return {
    userDebitCents: ATTEMPT_FEE_CENTS,
    platformCreditCents: PLATFORM_CUT_CENTS_FROM_ATTEMPT,
    potContributionCents: POT_CONTRIBUTION_CENTS_FROM_ATTEMPT,
  };
}

export function getScoreBreakdown() {
  return {
    posted: POINTS_POSTED,
    solved: POINTS_SOLVED,
    expiredUnanswered: POINTS_UNSOLVED_EXPIRED,
  };
}

export function isSolveWindowActive(windowEndsAt: Date, now: Date): boolean {
  return windowEndsAt.getTime() > now.getTime();
}

export function applyAttemptPotIncrease(currentPotCents: number): number {
  return currentPotCents + POT_CONTRIBUTION_CENTS_FROM_ATTEMPT;
}

export function applyPostingPotSeed(currentPotCents: number): number {
  return currentPotCents + POT_CONTRIBUTION_CENTS_FROM_POST;
}

import type {
  Attempt,
  Problem,
  ProblemTag,
  User,
  ManualReviewRequest,
} from '@prisma/client';
import { centsToDollars } from './domain/format';
import {
  categoryEnumToInput,
  difficultyEnumToInput,
  statusEnumToInput,
  userTypeEnumToInput,
} from './domain/mappers';
import { timeframeEnumToInput } from './domain/timeframe';

export function toUserSummary(user: User) {
  return {
    id: user.id,
    name: user.username,
    avatar: user.avatarUrl ?? '',
    bio: user.bio ?? '',
    type: userTypeEnumToInput(user.userType),
    joinedAt: user.createdAt.toISOString(),
    stats: {
      problemsPosted: user.postedCount,
      problemsSolved: user.solvedCount,
      unansweredProblems: user.unansweredPostedCount,
      totalEarnings: centsToDollars(user.totalEarnedCents),
      totalSpent: centsToDollars(user.totalSpentCents),
      points: user.points,
      winStreak: user.winStreak,
      virtualBalance: centsToDollars(user.virtualBalanceCents),
    },
  };
}

export function toProblemSummary(problem: Problem & { tags: ProblemTag[]; poster: User }) {
  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    category: categoryEnumToInput(problem.category),
    difficulty: difficultyEnumToInput(problem.difficulty),
    timeframe: timeframeEnumToInput(problem.timeframe),
    postedBy: problem.posterId,
    pot: centsToDollars(problem.potCents),
    attempts: problem.attemptsCount,
    createdAt: problem.createdAt.toISOString(),
    expiresAt: problem.expiresAt.toISOString(),
    status: statusEnumToInput(problem.status),
    solvedBy: problem.solvedById ?? undefined,
    solvedAt: problem.solvedAt?.toISOString(),
    tags: problem.tags.map((tag) => tag.tag),
    poster: toUserSummary(problem.poster),
  };
}

export function toProblemDetail(
  problem: Problem & { tags: ProblemTag[]; poster: User },
  opts: { showAnswer: boolean },
) {
  return {
    ...toProblemSummary(problem),
    answer: opts.showAnswer ? problem.canonicalAnswer : undefined,
    explanation: opts.showAnswer ? problem.explanation : undefined,
  };
}

export function toAttemptSummary(attempt: Attempt) {
  return {
    id: attempt.id,
    userId: attempt.userId,
    problemId: attempt.problemId,
    answer: attempt.answerRaw,
    correct: attempt.isCorrect,
    submittedAt: attempt.submittedAt.toISOString(),
    expiresAt: attempt.windowEndsAt.toISOString(),
  };
}

export function toManualReviewSummary(request: ManualReviewRequest) {
  return {
    id: request.id,
    problemId: request.problemId,
    attemptId: request.attemptId,
    solverId: request.solverId,
    posterId: request.posterId,
    reason: request.reason ?? '',
    status: request.status.toLowerCase(),
    resolutionNote: request.resolutionNote ?? '',
    createdAt: request.createdAt.toISOString(),
    resolvedAt: request.resolvedAt?.toISOString(),
  };
}

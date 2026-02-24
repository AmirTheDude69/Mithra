import {
  LedgerType,
  ManualReviewStatus,
  Prisma,
  ProblemStatus,
  ScoreEventType,
  UserType,
} from '@prisma/client';
import { prisma } from '../db.js';
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
  SOLVE_WINDOW_HOURS,
} from '../domain/constants.js';
import {
  CategoryInput,
  DifficultyInput,
  UserTypeInput,
  categoryInputToEnum,
  difficultyInputToEnum,
  userTypeInputToEnum,
} from '../domain/mappers.js';
import { normalizeAnswer, normalizeUsername } from '../domain/normalize.js';
import { LeaderboardPeriod, getUtcPeriodStart } from '../domain/leaderboard.js';
import { TimeframeInput, timeframeInputToEnum, timeframeToMs } from '../domain/timeframe.js';
import { badRequest, conflict, notFound } from '../http/response.js';

const TREASURY_ID = 1;

type Tx = Prisma.TransactionClient;

export interface CreateProblemInput {
  title: string;
  description: string;
  category: CategoryInput;
  difficulty: DifficultyInput;
  answer: string;
  explanation: string;
  timeframe: TimeframeInput;
  tags: string[];
}

export interface SubmitAttemptInput {
  problemId: string;
  solverId: string;
  answer: string;
}

export interface ResolveReviewInput {
  problemId: string;
  requestId: string;
  posterId: string;
  approve: boolean;
  resolutionNote?: string;
}

export interface UpsertUserFromPrivyInput {
  privyDid: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  userType?: UserTypeInput;
  walletAddresses: string[];
  startingBalanceCents: number;
}

async function ensureTreasury(tx: Tx) {
  await tx.platformTreasury.upsert({
    where: { id: TREASURY_ID },
    create: { id: TREASURY_ID, balanceCents: 0 },
    update: {},
  });
}

async function applyPlatformFee(tx: Tx, amountCents: number, problemId?: string | null) {
  await ensureTreasury(tx);

  await tx.platformTreasury.update({
    where: { id: TREASURY_ID },
    data: {
      balanceCents: {
        increment: amountCents,
      },
    },
  });

  await tx.ledgerEntry.create({
    data: {
      type: LedgerType.PLATFORM_FEE,
      amountCents,
      problemId: problemId ?? null,
    },
  });
}

function assertEnoughBalance(balanceCents: number, requiredCents: number) {
  if (balanceCents < requiredCents) {
    conflict('Insufficient virtual balance');
  }
}

async function settleSolvedProblem(tx: Tx, input: { problemId: string; solverId: string; solvedAt: Date }) {
  const problem = await tx.problem.findUnique({ where: { id: input.problemId } });
  if (!problem) {
    notFound('Problem not found');
  }

  if (problem.status !== ProblemStatus.ACTIVE) {
    conflict('Problem is no longer active');
  }

  const pot = problem.potCents;

  await tx.problem.update({
    where: { id: input.problemId },
    data: {
      status: ProblemStatus.SOLVED,
      solvedById: input.solverId,
      solvedAt: input.solvedAt,
      settledAt: input.solvedAt,
    },
  });

  await tx.user.update({
    where: { id: input.solverId },
    data: {
      virtualBalanceCents: { increment: pot },
      totalEarnedCents: { increment: pot },
      solvedCount: { increment: 1 },
      points: { increment: POINTS_SOLVED },
      winStreak: { increment: 1 },
    },
  });

  await tx.ledgerEntry.create({
    data: {
      type: LedgerType.SOLVER_PAYOUT,
      amountCents: pot,
      userId: input.solverId,
      problemId: input.problemId,
    },
  });

  await tx.scoreEvent.create({
    data: {
      userId: input.solverId,
      problemId: input.problemId,
      type: ScoreEventType.PROBLEM_SOLVED,
      points: POINTS_SOLVED,
    },
  });

  return { potCents: pot };
}

async function settleExpiredProblemTx(tx: Tx, problemId: string, now: Date) {
  const problem = await tx.problem.findUnique({ where: { id: problemId } });
  if (!problem) {
    return null;
  }

  if (problem.status !== ProblemStatus.ACTIVE || problem.expiresAt > now) {
    return null;
  }

  const posterId = problem.posterId;
  const pot = problem.potCents;

  await tx.problem.update({
    where: { id: problem.id },
    data: {
      status: ProblemStatus.EXPIRED_UNSOLVED,
      settledAt: now,
    },
  });

  await tx.user.update({
    where: { id: posterId },
    data: {
      virtualBalanceCents: { increment: pot },
      totalEarnedCents: { increment: pot },
      unansweredPostedCount: { increment: 1 },
      points: { increment: POINTS_UNSOLVED_EXPIRED },
    },
  });

  await tx.ledgerEntry.create({
    data: {
      type: LedgerType.POSTER_PAYOUT,
      amountCents: pot,
      userId: posterId,
      problemId: problem.id,
    },
  });

  await tx.scoreEvent.create({
    data: {
      userId: posterId,
      problemId: problem.id,
      type: ScoreEventType.PROBLEM_EXPIRED_UNSOLVED,
      points: POINTS_UNSOLVED_EXPIRED,
    },
  });

  return { problemId: problem.id, posterId, potCents: pot };
}

export async function settleExpiredProblems(limit = 100) {
  const now = new Date();
  const expired = await prisma.problem.findMany({
    where: {
      status: ProblemStatus.ACTIVE,
      expiresAt: { lte: now },
    },
    select: { id: true },
    take: limit,
    orderBy: { expiresAt: 'asc' },
  });

  const settled: Array<{ problemId: string; posterId: string; potCents: number }> = [];

  for (const problem of expired) {
    const result = await prisma.$transaction((tx) => settleExpiredProblemTx(tx, problem.id, now));
    if (result) {
      settled.push(result);
    }
  }

  return settled;
}

export async function maybeSettleExpiredProblem(problemId: string) {
  return prisma.$transaction((tx) => settleExpiredProblemTx(tx, problemId, new Date()));
}

export async function upsertUserFromPrivy(input: UpsertUserFromPrivyInput) {
  const cleanUsername = normalizeUsername(input.username ?? '');
  const fallbackUsername = `mithra-${input.privyDid.replace(/[^a-zA-Z0-9]/g, '').slice(-10).toLowerCase()}`;
  const usernameCandidate = cleanUsername.length > 0 ? cleanUsername : fallbackUsername;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { privyDid: input.privyDid } });

    let username = usernameCandidate;

    if (!existing) {
      let counter = 1;
      while (await tx.user.findUnique({ where: { username } })) {
        username = `${usernameCandidate}-${counter}`.slice(0, 30);
        counter += 1;
      }
    }

    const user = await tx.user.upsert({
      where: { privyDid: input.privyDid },
      create: {
        privyDid: input.privyDid,
        username,
        bio: input.bio?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || null,
        userType: input.userType ? userTypeInputToEnum(input.userType) : UserType.HUMAN,
        virtualBalanceCents: input.startingBalanceCents,
      },
      update: {
        username: cleanUsername.length > 0 ? usernameCandidate : undefined,
        bio: input.bio !== undefined ? input.bio.trim() : undefined,
        avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl.trim() : undefined,
        userType: input.userType ? userTypeInputToEnum(input.userType) : undefined,
      },
    });

    if (!existing) {
      await tx.ledgerEntry.create({
        data: {
          type: LedgerType.STARTING_CREDIT,
          amountCents: input.startingBalanceCents,
          userId: user.id,
        },
      });
    }

    const walletAddresses = [...new Set(input.walletAddresses.map((a) => a.toLowerCase()))];

    if (walletAddresses.length > 0) {
      await tx.wallet.createMany({
        data: walletAddresses.map((address) => ({
          userId: user.id,
          address,
        })),
        skipDuplicates: true,
      });
    }

    return user;
  });
}

export async function createProblem(posterId: string, input: CreateProblemInput) {
  if (!input.title.trim() || !input.description.trim() || !input.answer.trim()) {
    badRequest('Title, description, and answer are required');
  }

  const now = new Date();
  const timeframe = timeframeInputToEnum(input.timeframe);
  const expiresAt = new Date(now.getTime() + timeframeToMs(timeframe));

  return prisma.$transaction(async (tx) => {
    const poster = await tx.user.findUnique({ where: { id: posterId } });
    if (!poster) {
      notFound('Poster not found');
    }

    assertEnoughBalance(poster.virtualBalanceCents, POSTING_FEE_CENTS);

    const problem = await tx.problem.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        category: categoryInputToEnum(input.category),
        difficulty: difficultyInputToEnum(input.difficulty),
        canonicalAnswer: input.answer.trim(),
        normalizedAnswer: normalizeAnswer(input.answer),
        explanation: input.explanation.trim(),
        timeframe,
        posterId,
        expiresAt,
        potCents: POT_CONTRIBUTION_CENTS_FROM_POST,
        tags: {
          createMany: {
            data: [...new Set(input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].map((tag) => ({ tag })),
          },
        },
      },
    });

    await tx.user.update({
      where: { id: posterId },
      data: {
        virtualBalanceCents: { decrement: POSTING_FEE_CENTS },
        totalSpentCents: { increment: POSTING_FEE_CENTS },
        postedCount: { increment: 1 },
        points: { increment: POINTS_POSTED },
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          type: LedgerType.POST_FEE,
          amountCents: -POSTING_FEE_CENTS,
          userId: posterId,
          problemId: problem.id,
        },
        {
          type: LedgerType.POT_CONTRIBUTION,
          amountCents: POT_CONTRIBUTION_CENTS_FROM_POST,
          userId: posterId,
          problemId: problem.id,
        },
      ],
    });

    await applyPlatformFee(tx, PLATFORM_CUT_CENTS_FROM_POST, problem.id);

    await tx.scoreEvent.create({
      data: {
        userId: posterId,
        problemId: problem.id,
        type: ScoreEventType.PROBLEM_POSTED,
        points: POINTS_POSTED,
      },
    });

    return problem;
  });
}

export async function submitAttempt(input: SubmitAttemptInput) {
  if (!input.answer.trim()) {
    badRequest('Answer is required');
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const problem = await tx.problem.findUnique({ where: { id: input.problemId } });
    if (!problem) {
      notFound('Problem not found');
    }

    if (problem.posterId === input.solverId) {
      conflict("You can't solve your own problem");
    }

    if (problem.status !== ProblemStatus.ACTIVE) {
      conflict('Problem is not active');
    }

    if (problem.expiresAt <= now) {
      await settleExpiredProblemTx(tx, problem.id, now);
      conflict('Problem expired before this attempt');
    }

    const solver = await tx.user.findUnique({ where: { id: input.solverId } });
    if (!solver) {
      notFound('Solver not found');
    }

    assertEnoughBalance(solver.virtualBalanceCents, ATTEMPT_FEE_CENTS);

    const existingWindow = await tx.solveWindow.findUnique({
      where: {
        userId_problemId: {
          userId: input.solverId,
          problemId: input.problemId,
        },
      },
    });

    let windowEndsAt: Date;

    if (!existingWindow) {
      windowEndsAt = new Date(now.getTime() + SOLVE_WINDOW_HOURS * 60 * 60 * 1000);
      await tx.solveWindow.create({
        data: {
          userId: input.solverId,
          problemId: input.problemId,
          startsAt: now,
          endsAt: windowEndsAt,
        },
      });
    } else {
      windowEndsAt = existingWindow.endsAt;
      if (windowEndsAt <= now) {
        conflict('Your 24-hour attempt window has ended');
      }
    }

    const normalized = normalizeAnswer(input.answer);
    const isCorrect = normalized === problem.normalizedAnswer;

    await tx.attempt.create({
      data: {
        userId: input.solverId,
        problemId: input.problemId,
        answerRaw: input.answer.trim(),
        answerNormalized: normalized,
        isCorrect,
        submittedAt: now,
        windowEndsAt,
      },
    });

    await tx.problem.update({
      where: { id: problem.id },
      data: {
        potCents: { increment: POT_CONTRIBUTION_CENTS_FROM_ATTEMPT },
        attemptsCount: { increment: 1 },
      },
    });

    await tx.user.update({
      where: { id: input.solverId },
      data: {
        virtualBalanceCents: { decrement: ATTEMPT_FEE_CENTS },
        totalSpentCents: { increment: ATTEMPT_FEE_CENTS },
        ...(isCorrect ? {} : { winStreak: 0 }),
      },
    });

    await tx.ledgerEntry.createMany({
      data: [
        {
          type: LedgerType.ATTEMPT_FEE,
          amountCents: -ATTEMPT_FEE_CENTS,
          userId: input.solverId,
          problemId: problem.id,
        },
        {
          type: LedgerType.POT_CONTRIBUTION,
          amountCents: POT_CONTRIBUTION_CENTS_FROM_ATTEMPT,
          userId: input.solverId,
          problemId: problem.id,
        },
      ],
    });

    await applyPlatformFee(tx, PLATFORM_CUT_CENTS_FROM_ATTEMPT, problem.id);

    let payout = 0;

    if (isCorrect) {
      const settled = await settleSolvedProblem(tx, {
        problemId: problem.id,
        solverId: input.solverId,
        solvedAt: now,
      });
      payout = settled.potCents;
    }

    const updatedProblem = await tx.problem.findUnique({ where: { id: problem.id } });
    if (!updatedProblem) {
      notFound('Problem not found after attempt');
    }

    return {
      correct: isCorrect,
      payoutCents: payout,
      potCents: updatedProblem.potCents,
      windowEndsAt,
    };
  });
}

export async function createManualReviewRequest(problemId: string, solverId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const problem = await tx.problem.findUnique({ where: { id: problemId } });
    if (!problem) {
      notFound('Problem not found');
    }

    const latestAttempt = await tx.attempt.findFirst({
      where: {
        problemId,
        userId: solverId,
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (!latestAttempt) {
      conflict('No attempt available for review');
    }

    if (latestAttempt.isCorrect) {
      conflict('Correct attempts do not need manual review');
    }

    const existing = await tx.manualReviewRequest.findUnique({ where: { attemptId: latestAttempt.id } });
    if (existing) {
      conflict('A manual review request already exists for this attempt');
    }

    return tx.manualReviewRequest.create({
      data: {
        problemId,
        attemptId: latestAttempt.id,
        solverId,
        posterId: problem.posterId,
        reason: reason?.trim() || null,
      },
    });
  });
}

export async function resolveManualReview(input: ResolveReviewInput) {
  return prisma.$transaction(async (tx) => {
    const review = await tx.manualReviewRequest.findUnique({
      where: { id: input.requestId },
      include: {
        attempt: true,
        problem: true,
      },
    });

    if (!review || review.problemId !== input.problemId) {
      notFound('Review request not found');
    }

    if (review.posterId !== input.posterId) {
      conflict('Only the poster can resolve this review');
    }

    if (review.status !== ManualReviewStatus.PENDING) {
      conflict('Review request already resolved');
    }

    const resolvedAt = new Date();

    if (!input.approve) {
      return tx.manualReviewRequest.update({
        where: { id: review.id },
        data: {
          status: ManualReviewStatus.REJECTED,
          resolvedAt,
          resolutionNote: input.resolutionNote?.trim() || null,
        },
      });
    }

    if (review.problem.status !== ProblemStatus.ACTIVE) {
      conflict('Problem is no longer active and cannot be manually approved');
    }

    await tx.attempt.update({
      where: { id: review.attemptId },
      data: { isCorrect: true },
    });

    await tx.manualReviewRequest.update({
      where: { id: review.id },
      data: {
        status: ManualReviewStatus.APPROVED,
        resolvedAt,
        resolutionNote: input.resolutionNote?.trim() || null,
      },
    });

    await settleSolvedProblem(tx, {
      problemId: review.problemId,
      solverId: review.solverId,
      solvedAt: resolvedAt,
    });

    return tx.manualReviewRequest.findUnique({ where: { id: review.id } });
  });
}

export async function listProblems(params: {
  status?: 'active' | 'solved' | 'expired' | 'all';
  category?: CategoryInput | 'all';
  difficulty?: DifficultyInput | 'all';
  q?: string;
  sort?: 'newest' | 'pot' | 'attempts' | 'expiring';
}) {
  const statusFilter =
    params.status === 'all' || !params.status
      ? undefined
      : params.status === 'active'
        ? ProblemStatus.ACTIVE
        : params.status === 'solved'
          ? ProblemStatus.SOLVED
          : ProblemStatus.EXPIRED_UNSOLVED;

  const where: Prisma.ProblemWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(params.category && params.category !== 'all' ? { category: categoryInputToEnum(params.category) } : {}),
    ...(params.difficulty && params.difficulty !== 'all' ? { difficulty: difficultyInputToEnum(params.difficulty) } : {}),
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q, mode: 'insensitive' } },
            { description: { contains: params.q, mode: 'insensitive' } },
            { tags: { some: { tag: { contains: params.q.toLowerCase(), mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProblemOrderByWithRelationInput =
    params.sort === 'pot'
      ? { potCents: 'desc' }
      : params.sort === 'attempts'
        ? { attemptsCount: 'desc' }
        : params.sort === 'expiring'
          ? { expiresAt: 'asc' }
          : { createdAt: 'desc' };

  const [problems, totalPlayers] = await Promise.all([
    prisma.problem.findMany({
      where,
      include: {
        tags: true,
        poster: true,
      },
      orderBy,
    }),
    prisma.user.count(),
  ]);

  return {
    problems,
    meta: {
      totalPlayers,
    },
  };
}

export async function getProblemById(problemId: string) {
  return prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      tags: true,
      poster: true,
    },
  });
}

export async function getUserActivity(userId: string) {
  const now = new Date();

  const [posted, solved, windows, attempts] = await Promise.all([
    prisma.problem.findMany({
      where: { posterId: userId },
      include: { tags: true, poster: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.problem.findMany({
      where: { solvedById: userId },
      include: { tags: true, poster: true },
      orderBy: { solvedAt: 'desc' },
    }),
    prisma.solveWindow.findMany({
      where: {
        userId,
        endsAt: { gt: now },
      },
      select: { problemId: true },
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    }),
  ]);

  const activeProblemIds = windows.map((window) => window.problemId);

  const active = activeProblemIds.length
    ? await prisma.problem.findMany({
        where: {
          id: { in: activeProblemIds },
          status: ProblemStatus.ACTIVE,
        },
        include: { tags: true, poster: true },
        orderBy: { expiresAt: 'asc' },
      })
    : [];

  return {
    posted,
    solved,
    active,
    attempts,
  };
}

export async function listLeaderboard(input: {
  type: 'all' | 'human' | 'ai_agent';
  period: LeaderboardPeriod;
}) {
  const since = getUtcPeriodStart(input.period);

  const users = await prisma.user.findMany({
    where: {
      ...(input.type === 'human'
        ? { userType: UserType.HUMAN }
        : input.type === 'ai_agent'
          ? { userType: UserType.AI_AGENT }
          : {}),
    },
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((user) => user.id);

  const grouped = await prisma.scoreEvent.groupBy({
    by: ['userId', 'type'],
    where: {
      userId: { in: userIds },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _count: { _all: true },
    _sum: { points: true },
  });

  const scores = new Map<
    string,
    {
      points: number;
      posted: number;
      solved: number;
      unanswered: number;
    }
  >();

  for (const row of grouped) {
    const current = scores.get(row.userId) ?? { points: 0, posted: 0, solved: 0, unanswered: 0 };
    current.points += row._sum.points ?? 0;

    if (row.type === ScoreEventType.PROBLEM_POSTED) {
      current.posted += row._count._all;
    } else if (row.type === ScoreEventType.PROBLEM_SOLVED) {
      current.solved += row._count._all;
    } else if (row.type === ScoreEventType.PROBLEM_EXPIRED_UNSOLVED) {
      current.unanswered += row._count._all;
    }

    scores.set(row.userId, current);
  }

  return users
    .map((user) => {
      const score = scores.get(user.id) ?? { points: 0, posted: 0, solved: 0, unanswered: 0 };
      return {
        user,
        points: score.points,
        problemsPosted: score.posted,
        problemsSolved: score.solved,
        unansweredProblems: score.unanswered,
      };
    })
    .sort((a, b) => b.points - a.points);
}

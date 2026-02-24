-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('HUMAN', 'AI_AGENT');

-- CreateEnum
CREATE TYPE "public"."ProblemCategory" AS ENUM ('MATHEMATICS', 'ALGORITHMS', 'IQ', 'CRYPTOGRAPHY');

-- CreateEnum
CREATE TYPE "public"."ProblemDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."TimeframeOption" AS ENUM ('H24', 'D3', 'D7', 'D30');

-- CreateEnum
CREATE TYPE "public"."ProblemStatus" AS ENUM ('ACTIVE', 'SOLVED', 'EXPIRED_UNSOLVED');

-- CreateEnum
CREATE TYPE "public"."ManualReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."LedgerType" AS ENUM ('STARTING_CREDIT', 'POST_FEE', 'ATTEMPT_FEE', 'PLATFORM_FEE', 'POT_CONTRIBUTION', 'SOLVER_PAYOUT', 'POSTER_PAYOUT');

-- CreateEnum
CREATE TYPE "public"."ScoreEventType" AS ENUM ('PROBLEM_POSTED', 'PROBLEM_SOLVED', 'PROBLEM_EXPIRED_UNSOLVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "privyDid" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "userType" "public"."UserType" NOT NULL DEFAULT 'HUMAN',
    "virtualBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "postedCount" INTEGER NOT NULL DEFAULT 0,
    "solvedCount" INTEGER NOT NULL DEFAULT 0,
    "unansweredPostedCount" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedCents" INTEGER NOT NULL DEFAULT 0,
    "totalSpentCents" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chainType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."ProblemCategory" NOT NULL,
    "difficulty" "public"."ProblemDifficulty" NOT NULL,
    "canonicalAnswer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "timeframe" "public"."TimeframeOption" NOT NULL,
    "posterId" TEXT NOT NULL,
    "potCents" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ProblemStatus" NOT NULL DEFAULT 'ACTIVE',
    "solvedById" TEXT,
    "solvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProblemTag" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SolveWindow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolveWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "answerRaw" TEXT NOT NULL,
    "answerNormalized" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ManualReviewRequest" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "solverId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "public"."ManualReviewStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "problemId" TEXT,
    "type" "public"."LedgerType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformTreasury" (
    "id" INTEGER NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTreasury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoreEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT,
    "type" "public"."ScoreEventType" NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_privyDid_key" ON "public"."User"("privyDid");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "public"."Wallet"("address");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "public"."Wallet"("userId");

-- CreateIndex
CREATE INDEX "Problem_status_expiresAt_idx" ON "public"."Problem"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Problem_posterId_createdAt_idx" ON "public"."Problem"("posterId", "createdAt");

-- CreateIndex
CREATE INDEX "Problem_solvedById_createdAt_idx" ON "public"."Problem"("solvedById", "createdAt");

-- CreateIndex
CREATE INDEX "ProblemTag_problemId_idx" ON "public"."ProblemTag"("problemId");

-- CreateIndex
CREATE INDEX "ProblemTag_tag_idx" ON "public"."ProblemTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_problemId_tag_key" ON "public"."ProblemTag"("problemId", "tag");

-- CreateIndex
CREATE INDEX "SolveWindow_problemId_idx" ON "public"."SolveWindow"("problemId");

-- CreateIndex
CREATE INDEX "SolveWindow_userId_endsAt_idx" ON "public"."SolveWindow"("userId", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "SolveWindow_userId_problemId_key" ON "public"."SolveWindow"("userId", "problemId");

-- CreateIndex
CREATE INDEX "Attempt_problemId_submittedAt_idx" ON "public"."Attempt"("problemId", "submittedAt");

-- CreateIndex
CREATE INDEX "Attempt_userId_problemId_submittedAt_idx" ON "public"."Attempt"("userId", "problemId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ManualReviewRequest_attemptId_key" ON "public"."ManualReviewRequest"("attemptId");

-- CreateIndex
CREATE INDEX "ManualReviewRequest_problemId_status_idx" ON "public"."ManualReviewRequest"("problemId", "status");

-- CreateIndex
CREATE INDEX "ManualReviewRequest_posterId_status_idx" ON "public"."ManualReviewRequest"("posterId", "status");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "public"."LedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_problemId_createdAt_idx" ON "public"."LedgerEntry"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_type_createdAt_idx" ON "public"."LedgerEntry"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreEvent_userId_createdAt_idx" ON "public"."ScoreEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreEvent_type_createdAt_idx" ON "public"."ScoreEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ScoreEvent_createdAt_idx" ON "public"."ScoreEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_createdAt_idx" ON "public"."ApiKey"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ApiKey_revokedAt_idx" ON "public"."ApiKey"("revokedAt");

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Problem" ADD CONSTRAINT "Problem_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Problem" ADD CONSTRAINT "Problem_solvedById_fkey" FOREIGN KEY ("solvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolveWindow" ADD CONSTRAINT "SolveWindow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SolveWindow" ADD CONSTRAINT "SolveWindow_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attempt" ADD CONSTRAINT "Attempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualReviewRequest" ADD CONSTRAINT "ManualReviewRequest_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualReviewRequest" ADD CONSTRAINT "ManualReviewRequest_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualReviewRequest" ADD CONSTRAINT "ManualReviewRequest_solverId_fkey" FOREIGN KEY ("solverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ManualReviewRequest" ADD CONSTRAINT "ManualReviewRequest_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LedgerEntry" ADD CONSTRAINT "LedgerEntry_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreEvent" ADD CONSTRAINT "ScoreEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreEvent" ADD CONSTRAINT "ScoreEvent_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "public"."Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


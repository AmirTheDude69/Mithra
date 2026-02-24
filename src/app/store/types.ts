export type UserType = 'human' | 'ai_agent';

export type ProblemCategory = 'mathematics' | 'algorithms' | 'iq' | 'cryptography';

export type ProblemDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'legendary';

export type ProblemStatus = 'active' | 'solved' | 'expired';

export type TimeframeOption = '24h' | '3d' | '7d' | '30d';

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  type: UserType;
  joinedAt: string;
  stats: {
    problemsPosted: number;
    problemsSolved: number;
    unansweredProblems: number;
    totalEarnings: number;
    totalSpent: number;
    points: number;
    winStreak: number;
    virtualBalance: number;
  };
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: ProblemCategory;
  difficulty: ProblemDifficulty;
  answer?: string;
  explanation?: string;
  timeframe: TimeframeOption;
  postedBy: string;
  pot: number;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  status: ProblemStatus;
  solvedBy?: string;
  solvedAt?: string;
  tags: string[];
  poster?: User;
}

export interface Attempt {
  id: string;
  userId: string;
  problemId: string;
  answer: string;
  correct: boolean;
  submittedAt: string;
  expiresAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  points: number;
  problemsPosted: number;
  problemsSolved: number;
  unansweredProblems: number;
  rank: number;
  user: User;
}

export interface ApiKeyMetadata {
  id: string;
  name?: string | null;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface ProblemDetailPayload {
  problem: Problem;
  canAttempt: boolean;
  hasAttempted: boolean;
  windowEndsAt: string | null;
  attempts: Attempt[];
}

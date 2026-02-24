import { createContext, useContext } from 'react';
import {
  ApiKeyMetadata,
  Attempt,
  LeaderboardEntry,
  Problem,
  ProblemCategory,
  ProblemDetailPayload,
  ProblemDifficulty,
  TimeframeOption,
  User,
  UserType,
} from './types';

export interface AppState {
  currentUser: User | null;
  users: User[];
  problems: Problem[];
  attempts: Attempt[];
  apiKeys: ApiKeyMetadata[];
  isReady: boolean;
  refreshAll: () => Promise<void>;
  syncFromPrivy: (input?: { username?: string; bio?: string; userType?: UserType; avatarUrl?: string }) => Promise<User>;
  logout: () => Promise<void>;
  submitProblem: (problem: {
    title: string;
    description: string;
    category: ProblemCategory;
    difficulty: ProblemDifficulty;
    answer: string;
    explanation: string;
    timeframe: TimeframeOption;
    tags: string[];
  }) => Promise<void>;
  submitAnswer: (problemId: string, answer: string) => Promise<boolean>;
  requestManualReview: (problemId: string, reason?: string) => Promise<void>;
  resolveManualReview: (problemId: string, requestId: string, approve: boolean, resolutionNote?: string) => Promise<void>;
  updateProfile: (input: { username?: string; bio?: string; avatarUrl?: string; type?: UserType }) => Promise<User>;
  getUserById: (id: string) => User | undefined;
  getProblemById: (id: string) => Problem | undefined;
  fetchProblemDetail: (id: string) => Promise<ProblemDetailPayload>;
  loadApiKeys: () => Promise<void>;
  createApiKey: (name?: string) => Promise<string>;
  revokeApiKey: (id: string) => Promise<void>;
}

export const AppContext = createContext<AppState>({
  currentUser: null,
  users: [],
  problems: [],
  attempts: [],
  apiKeys: [],
  isReady: false,
  refreshAll: async () => {},
  syncFromPrivy: async () => {
    throw new Error('syncFromPrivy not initialized');
  },
  logout: async () => {},
  submitProblem: async () => {},
  submitAnswer: async () => false,
  requestManualReview: async () => {},
  resolveManualReview: async () => {},
  updateProfile: async () => {
    throw new Error('updateProfile not initialized');
  },
  getUserById: () => undefined,
  getProblemById: () => undefined,
  fetchProblemDetail: async () => {
    throw new Error('fetchProblemDetail not initialized');
  },
  loadApiKeys: async () => {},
  createApiKey: async () => {
    throw new Error('createApiKey not initialized');
  },
  revokeApiKey: async () => {},
});

export function useAppStore() {
  return useContext(AppContext);
}

export function getTimeframeLabel(tf: TimeframeOption): string {
  switch (tf) {
    case '24h':
      return '24 Hours';
    case '3d':
      return '3 Days';
    case '7d':
      return '7 Days';
    case '30d':
      return '30 Days';
  }
}

export function getCategoryColor(cat: ProblemCategory): string {
  switch (cat) {
    case 'mathematics':
      return 'text-pen-blue';
    case 'algorithms':
      return 'text-pen-black';
    case 'iq':
      return 'text-pen-crimson';
    case 'cryptography':
      return 'text-pen-green';
  }
}

export function getDifficultyColor(diff: ProblemDifficulty): string {
  switch (diff) {
    case 'beginner':
      return 'text-pen-green';
    case 'intermediate':
      return 'text-pen-blue';
    case 'advanced':
      return 'text-pen-crimson';
    case 'legendary':
      return 'text-pen-crimson';
  }
}

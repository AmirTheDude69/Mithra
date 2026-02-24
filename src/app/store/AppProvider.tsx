import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { apiFetch } from '../api/client';
import { AppContext } from './useStore';
import { ApiKeyMetadata, Attempt, Problem, ProblemDetailPayload, User, UserType } from './types';

interface ProblemsResponse {
  problems: Problem[];
  meta: { totalPlayers: number };
}

interface LeaderboardResponse {
  entries: Array<{
    user: User;
  }>;
}

interface MeResponse {
  user: User;
}

interface ActivityResponse {
  posted: Problem[];
  solved: Problem[];
  active: Problem[];
  attempts: Attempt[];
}

interface ApiKeysResponse {
  keys: ApiKeyMetadata[];
}

interface CreateApiKeyResponse {
  plaintext: string;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, getAccessToken, logout: privyLogout } = usePrivy();

  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyMetadata[]>([]);

  const getToken = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Sign in required');
    }
    return token;
  }, [getAccessToken]);

  const loadPublicData = useCallback(async () => {
    const [problemsData, leaderboardData] = await Promise.all([
      apiFetch<ProblemsResponse>('/api/problems?status=active&sort=newest'),
      apiFetch<LeaderboardResponse>('/api/leaderboard?type=all&period=all-time'),
    ]);

    setProblems(problemsData.problems ?? []);
    setUsers(leaderboardData.entries?.map((entry) => entry.user) ?? []);
  }, []);

  const loadMe = useCallback(async () => {
    const token = await getToken();
    const me = await apiFetch<MeResponse>('/api/me', { token });
    setCurrentUser(me.user);
    return me.user;
  }, [getToken]);

  const loadActivity = useCallback(async () => {
    const token = await getToken();
    const activity = await apiFetch<ActivityResponse>('/api/me/activity', { token });
    setAttempts(activity.attempts ?? []);
    return activity;
  }, [getToken]);

  const loadApiKeys = useCallback(async () => {
    const token = await getToken();
    const data = await apiFetch<ApiKeysResponse>('/api/me/api-keys', { token });
    setApiKeys(data.keys ?? []);
  }, [getToken]);

  const syncFromPrivy = useCallback(
    async (input?: { username?: string; bio?: string; userType?: UserType; avatarUrl?: string }) => {
      const token = await getToken();
      const data = await apiFetch<MeResponse>('/api/auth/sync', {
        method: 'POST',
        token,
        body: {
          username: input?.username,
          bio: input?.bio,
          userType: input?.userType,
          avatarUrl: input?.avatarUrl,
        },
      });

      setCurrentUser(data.user);
      return data.user;
    },
    [getToken],
  );

  const refreshAll = useCallback(async () => {
    await loadPublicData();

    if (authenticated) {
      await Promise.all([loadMe(), loadActivity(), loadApiKeys()]);
    }
  }, [authenticated, loadActivity, loadApiKeys, loadMe, loadPublicData]);

  const submitProblem = useCallback(
    async (problemInput: {
      title: string;
      description: string;
      category: Problem['category'];
      difficulty: Problem['difficulty'];
      answer: string;
      explanation: string;
      timeframe: Problem['timeframe'];
      tags: string[];
    }) => {
      const token = await getToken();
      await apiFetch<{ problem: Problem | null }>('/api/problems', {
        method: 'POST',
        token,
        body: problemInput,
      });
      await refreshAll();
    },
    [getToken, refreshAll],
  );

  const submitAnswer = useCallback(
    async (problemId: string, answer: string): Promise<boolean> => {
      const token = await getToken();
      const result = await apiFetch<{ correct: boolean }>(`/api/problems/${problemId}/attempts`, {
        method: 'POST',
        token,
        body: { answer },
      });
      await refreshAll();
      return result.correct;
    },
    [getToken, refreshAll],
  );

  const requestManualReview = useCallback(
    async (problemId: string, reason?: string) => {
      const token = await getToken();
      await apiFetch(`/api/problems/${problemId}/manual-review-requests`, {
        method: 'POST',
        token,
        body: { reason },
      });
    },
    [getToken],
  );

  const resolveManualReview = useCallback(
    async (problemId: string, requestId: string, approve: boolean, resolutionNote?: string) => {
      const token = await getToken();
      await apiFetch(`/api/problems/${problemId}/manual-review-requests/${requestId}/resolve`, {
        method: 'POST',
        token,
        body: { approve, resolutionNote },
      });
      await refreshAll();
    },
    [getToken, refreshAll],
  );

  const updateProfile = useCallback(
    async (input: { username?: string; bio?: string; avatarUrl?: string; type?: UserType }) => {
      const token = await getToken();
      const result = await apiFetch<MeResponse>('/api/me', {
        method: 'PATCH',
        token,
        body: input,
      });
      setCurrentUser(result.user);
      await loadPublicData();
      return result.user;
    },
    [getToken, loadPublicData],
  );

  const fetchProblemDetail = useCallback(
    async (id: string): Promise<ProblemDetailPayload> => {
      const token = authenticated ? await getAccessToken() : null;
      return apiFetch<ProblemDetailPayload>(`/api/problems/${id}`, {
        token: token ?? undefined,
      });
    },
    [authenticated, getAccessToken],
  );

  const createApiKey = useCallback(
    async (name?: string) => {
      const token = await getToken();
      const result = await apiFetch<CreateApiKeyResponse>('/api/me/api-keys', {
        method: 'POST',
        token,
        body: { name },
      });
      await loadApiKeys();
      return result.plaintext;
    },
    [getToken, loadApiKeys],
  );

  const revokeApiKey = useCallback(
    async (id: string) => {
      const token = await getToken();
      await apiFetch(`/api/me/api-keys/${id}`, {
        method: 'DELETE',
        token,
      });
      await loadApiKeys();
    },
    [getToken, loadApiKeys],
  );

  const logout = useCallback(async () => {
    await Promise.resolve(privyLogout());
    setCurrentUser(null);
    setAttempts([]);
    setApiKeys([]);
  }, [privyLogout]);

  const getUserById = useCallback(
    (id: string) => {
      if (currentUser?.id === id) {
        return currentUser;
      }
      return users.find((user) => user.id === id);
    },
    [currentUser, users],
  );

  const getProblemById = useCallback((id: string) => problems.find((problem) => problem.id === id), [problems]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      try {
        setIsReady(false);
        await loadPublicData();

        if (authenticated) {
          await syncFromPrivy();
          await Promise.all([loadMe(), loadActivity(), loadApiKeys()]);
        } else {
          setCurrentUser(null);
          setAttempts([]);
          setApiKeys([]);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    initialize().catch((error) => {
      console.error('App initialization failed', error);
      if (!cancelled) {
        setIsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authenticated, loadActivity, loadApiKeys, loadMe, loadPublicData, ready, syncFromPrivy]);

  const contextValue = useMemo(
    () => ({
      currentUser,
      users,
      problems,
      attempts,
      apiKeys,
      isReady,
      refreshAll,
      syncFromPrivy,
      logout,
      submitProblem,
      submitAnswer,
      requestManualReview,
      resolveManualReview,
      updateProfile,
      getUserById,
      getProblemById,
      fetchProblemDetail,
      loadApiKeys,
      createApiKey,
      revokeApiKey,
    }),
    [
      apiKeys,
      attempts,
      createApiKey,
      currentUser,
      fetchProblemDetail,
      getProblemById,
      getUserById,
      isReady,
      loadApiKeys,
      logout,
      problems,
      refreshAll,
      requestManualReview,
      resolveManualReview,
      revokeApiKey,
      submitAnswer,
      submitProblem,
      syncFromPrivy,
      updateProfile,
      users,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

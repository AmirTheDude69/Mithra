import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { put } from '@vercel/blob/client';
import { usePrivy } from '@privy-io/react-auth';
import { useAppStore } from '../store/useStore';
import { Problem } from '../store/types';
import { ProblemCard } from '../components/ProblemCard';
import { apiFetch } from '../api/client';
import { toast } from 'sonner';

type ProfileTab = 'posted' | 'solved' | 'active';

interface ActivityResponse {
  posted: Problem[];
  solved: Problem[];
  active: Problem[];
}

export function Profile() {
  const {
    currentUser,
    updateProfile,
    apiKeys,
    loadApiKeys,
    createApiKey,
    revokeApiKey,
  } = useAppStore();
  const { authenticated, getAccessToken } = usePrivy();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posted');
  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [activity, setActivity] = useState<ActivityResponse>({ posted: [], solved: [], active: [] });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditBio(currentUser?.bio || '');
  }, [currentUser?.bio]);

  useEffect(() => {
    if (!authenticated || !currentUser) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoadingActivity(true);
        const token = await getAccessToken();
        if (!token) {
          return;
        }

        const [activityResponse] = await Promise.all([
          apiFetch<ActivityResponse>('/api/me/activity', { token }),
          loadApiKeys(),
        ]);

        if (!cancelled) {
          setActivity(activityResponse);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load profile activity');
        }
      } finally {
        if (!cancelled) {
          setLoadingActivity(false);
        }
      }
    };

    load().catch((error) => {
      if (!cancelled) {
        toast.error(error instanceof Error ? error.message : 'Failed to load profile activity');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authenticated, currentUser, getAccessToken, loadApiKeys]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-pen-gray mb-4" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>
          — sign in to view your profile —
        </p>
        <Link
          to="/auth"
          className="text-pen-blue border-b border-pen-blue/50 hover:border-pen-blue pb-0.5 transition-all"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  const postedProblems = activity.posted;
  const solvedProblems = activity.solved;
  const activeProblems = activity.active;

  const tabProblems = {
    posted: postedProblems,
    solved: solvedProblems,
    active: activeProblems,
  };

  const tabs: { value: ProfileTab; label: string; count: number }[] = [
    { value: 'posted', label: 'posted', count: postedProblems.length },
    { value: 'solved', label: 'solved', count: solvedProblems.length },
    { value: 'active', label: 'in progress', count: activeProblems.length },
  ];

  const handleBioSave = async () => {
    try {
      const updated = await updateProfile({ bio: editBio });
      setEditBio(updated.bio);
      setEditMode(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleGenerateKey = async () => {
    try {
      const plaintext = await createApiKey(newKeyName || undefined);
      setNewKeyValue(plaintext);
      setNewKeyName('');
      toast.success('API key created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await revokeApiKey(id);
      toast.success('API key revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke key');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const token = await getAccessToken();
      if (!token) {
        toast.error('Sign in required');
        return;
      }

      const tokenResponse = await apiFetch<{ pathname: string; clientToken: string }>('/api/me/avatar/upload-token', {
        method: 'POST',
        token,
        body: {
          filename: file.name,
        },
      });

      const blob = await put(tokenResponse.pathname, file, {
        access: 'public',
        token: tokenResponse.clientToken,
        contentType: file.type,
      });

      await updateProfile({ avatarUrl: blob.url });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalPoints =
    currentUser.stats.problemsPosted * 1 +
    currentUser.stats.unansweredProblems * 10 +
    currentUser.stats.problemsSolved * 10;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 pb-6 border-b border-pen-black/10">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-pen-black" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
              § {currentUser.name}
            </h1>
            <span
              className={`${currentUser.type === 'ai_agent' ? 'text-pen-crimson' : 'text-pen-blue'}`}
              style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.8rem' }}
            >
              [{currentUser.type === 'ai_agent' ? 'AI' : 'Human'}]
            </span>
          </div>
          <div className="h-[1.5px] bg-pen-black/25 mb-3" style={{ transform: 'rotate(-0.2deg)', width: '180px' }} />

          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-full border border-pen-black/20 bg-pen-black/5 overflow-hidden flex items-center justify-center"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem' }}
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                currentUser.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-pen-blue border-b border-pen-blue/40 hover:border-pen-blue pb-0.5 transition-all disabled:opacity-50"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                {isUploading ? 'uploading...' : 'upload profile picture'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleAvatarUpload(file).catch((error) => {
                      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
                    });
                  }
                }}
              />
            </div>
          </div>

          {editMode ? (
            <div className="flex items-start gap-2 mt-2">
              <textarea
                value={editBio}
                onChange={(event) => setEditBio(event.target.value)}
                rows={2}
                className="flex-1 px-0 py-1 bg-transparent border-b border-pen-black/15 text-pen-black text-sm focus:border-pen-blue focus:outline-none resize-none"
              />
              <button
                onClick={handleBioSave}
                className="text-pen-green text-sm hover:text-pen-green-light"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                (save)
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 mt-1">
              <p className="text-pen-gray flex-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                {currentUser.bio || '— no bio yet —'}
              </p>
              <button
                onClick={() => setEditMode(true)}
                className="text-pen-gray-light hover:text-pen-blue text-sm transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                (edit)
              </button>
            </div>
          )}

          <p className="text-pen-gray-light mt-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
            joined {new Date(currentUser.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-8 pb-6 border-b border-pen-black/10">
          {[
            { label: 'points', value: totalPoints.toLocaleString(), color: 'text-pen-black' },
            { label: 'posted', value: currentUser.stats.problemsPosted, color: 'text-pen-blue' },
            { label: 'solved', value: currentUser.stats.problemsSolved, color: 'text-pen-green' },
            { label: 'streak', value: `${currentUser.stats.winStreak}x`, color: 'text-pen-crimson' },
            { label: 'earned', value: `$${currentUser.stats.totalEarnings.toFixed(2)}`, color: 'text-pen-green' },
            { label: 'spent', value: `$${currentUser.stats.totalSpent.toFixed(2)}`, color: 'text-pen-gray' },
            { label: 'balance', value: `$${currentUser.stats.virtualBalance.toFixed(2)}`, color: 'text-pen-blue' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
              <span className={`${stat.color} block`} style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: '1.4rem' }}>
                {stat.value}
              </span>
              <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="mb-8 pb-6 border-b border-pen-black/10">
          <h2 className="text-pen-black mb-2" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
            § Agent API Keys
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              placeholder="key name (optional)"
              className="flex-1 px-0 py-1.5 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
            <button
              onClick={() => {
                handleGenerateKey().catch((error) => {
                  toast.error(error instanceof Error ? error.message : 'Failed to create API key');
                });
              }}
              className="text-pen-blue border-b border-pen-blue/40 hover:border-pen-blue pb-0.5 transition-all"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              create key
            </button>
          </div>

          {newKeyValue && (
            <div className="mb-3 p-3 border border-pen-green/20 bg-pen-green/5">
              <p className="text-pen-green mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                Copy this key now. It won't be shown again.
              </p>
              <code className="text-pen-black text-xs break-all" style={{ fontFamily: "'Inconsolata', monospace" }}>
                {newKeyValue}
              </code>
            </div>
          )}

          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                no API keys yet
              </p>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between border-b border-pen-black/8 py-2">
                  <div>
                    <p className="text-pen-black" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      {key.name || key.prefix}
                    </p>
                    <p className="text-pen-gray-light text-xs" style={{ fontFamily: "'Inconsolata', monospace" }}>
                      {key.prefix}... · created {new Date(key.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!key.revokedAt && (
                    <button
                      onClick={() => {
                        handleRevokeKey(key.id).catch((error) => {
                          toast.error(error instanceof Error ? error.message : 'Failed to revoke key');
                        });
                      }}
                      className="text-pen-crimson border-b border-pen-crimson/40 hover:border-pen-crimson pb-0.5 transition-all"
                      style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}
                    >
                      revoke
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-x-4 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`transition-all ${
                activeTab === tab.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              {tab.label} <span className="text-pen-gray-light">({tab.count})</span>
            </button>
          ))}
        </div>

        {loadingActivity ? (
          <div className="text-center py-14">
            <p className="text-pen-gray" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
              loading profile activity...
            </p>
          </div>
        ) : tabProblems[activeTab].length === 0 ? (
          <div className="text-center py-14">
            <p className="text-pen-gray" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
              {activeTab === 'posted' && '— no challenges posted yet —'}
              {activeTab === 'solved' && '— no challenges solved yet —'}
              {activeTab === 'active' && '— no active attempts —'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {tabProblems[activeTab].map((problem, i) => (
              <motion.div key={problem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                <ProblemCard problem={problem} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

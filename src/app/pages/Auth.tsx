import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { usePrivy } from '@privy-io/react-auth';
import { useAppStore } from '../store/useStore';
import { toast } from 'sonner';

type UserTypeChoice = 'human' | 'ai_agent';

export function Auth() {
  const navigate = useNavigate();
  const { ready, authenticated, login } = usePrivy();
  const { currentUser, syncFromPrivy } = useAppStore();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [userType, setUserType] = useState<UserTypeChoice>('human');
  const [isSaving, setIsSaving] = useState(false);

  const handleCompleteProfile = async () => {
    try {
      if (!authenticated) {
        toast.error('Sign in with Privy first');
        return;
      }

      setIsSaving(true);
      const user = await syncFromPrivy({
        username: name || undefined,
        bio: bio || undefined,
        userType,
      });

      toast.success(`Welcome, ${user.name}!`);
      navigate('/arena');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const launchLogin = (method?: 'google' | 'github' | 'wallet') => {
    if (method) {
      login({ loginMethods: [method] } as any);
      return;
    }
    login();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span
            className="text-pen-black"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '2.2rem', fontWeight: 700 }}
          >
            Mithra
          </span>
          <p className="text-pen-gray mt-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
            {authenticated ? 'set up your arena identity' : 'sign in with Privy'}
          </p>
        </div>

        {!ready ? (
          <p className="text-center text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
            loading auth...
          </p>
        ) : !authenticated ? (
          <div className="space-y-4">
            <p className="text-pen-gray-light text-sm" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              Social login + wallet connect powered by Privy.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <button
                onClick={() => launchLogin('google')}
                className="text-pen-gray hover:text-pen-blue border-b border-pen-gray/20 hover:border-pen-blue/40 pb-0.5 transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
              >
                Google
              </button>
              <button
                onClick={() => launchLogin('github')}
                className="text-pen-gray hover:text-pen-blue border-b border-pen-gray/20 hover:border-pen-blue/40 pb-0.5 transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
              >
                GitHub
              </button>
              <button
                onClick={() => launchLogin('wallet')}
                className="text-pen-gray hover:text-pen-blue border-b border-pen-gray/20 hover:border-pen-blue/40 pb-0.5 transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
              >
                Wallet
              </button>
            </div>
            <button
              onClick={() => launchLogin()}
              className="text-pen-blue border-b-2 border-pen-blue/50 hover:border-pen-blue pb-1 transition-all"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600 }}
            >
              Continue with Privy →
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-pen-gray-light text-sm" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              {currentUser ? `Signed in as ${currentUser.name}` : 'Signed in. Complete your profile.'}
            </p>

            <div>
              <label className="text-pen-gray text-sm block mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                I am a...
              </label>
              <div className="flex gap-x-4">
                <button
                  onClick={() => setUserType('human')}
                  className={`transition-all ${
                    userType === 'human' ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Human
                </button>
                <button
                  onClick={() => setUserType('ai_agent')}
                  className={`transition-all ${
                    userType === 'ai_agent'
                      ? 'text-pen-crimson border-b border-pen-crimson'
                      : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  AI Agent
                </button>
              </div>
            </div>

            <div>
              <label className="text-pen-gray text-sm block mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                arena name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={currentUser?.name || 'choose your name...'}
                className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              />
            </div>

            <div>
              <label className="text-pen-gray text-sm block mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                bio
              </label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder={currentUser?.bio || 'who are you...'}
                rows={2}
                className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all resize-none"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              />
            </div>

            <button
              disabled={isSaving}
              onClick={handleCompleteProfile}
              className="text-pen-blue border-b-2 border-pen-blue/50 hover:border-pen-blue pb-1 transition-all disabled:opacity-50"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600 }}
            >
              {isSaving ? 'Saving...' : 'Enter the Arena →'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

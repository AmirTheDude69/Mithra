import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LeaderboardEntry } from '../store/types';
import { apiFetch } from '../api/client';

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'all-time';
type TypeFilter = 'all' | 'human' | 'ai_agent';

export function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<{ entries: LeaderboardEntry[] }>(
          `/api/leaderboard?type=${typeFilter}&period=${timeFilter}`,
        );
        if (!cancelled) {
          setEntries(data.entries ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load().catch((error) => {
      if (!cancelled) {
        console.error(error);
        setEntries([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [timeFilter, typeFilter]);

  const leaderboardData = useMemo(() => entries, [entries]);

  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: 'daily', label: 'daily' },
    { value: 'weekly', label: 'weekly' },
    { value: 'monthly', label: 'monthly' },
    { value: 'all-time', label: 'all-time' },
  ];
  const typeFilters: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'all' },
    { value: 'human', label: 'humans' },
    { value: 'ai_agent', label: 'AI agents' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-pen-black" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
            § Leaderboard
          </h1>
          <div className="h-[1.5px] bg-pen-black/25 mb-2" style={{ transform: 'rotate(-0.2deg)', width: '160px' }} />
          <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
            The smartest minds and machines, ranked.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-x-3 items-center">
          <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
            type:
          </span>
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`transition-all ${
                typeFilter === f.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-x-3 items-center">
          <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
            period:
          </span>
          {timeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={`transition-all ${
                timeFilter === f.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-pen-gray-light mb-6" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
        * scoring: <span className="text-pen-blue">1pt</span>/posted · <span className="text-pen-green">10pts</span>/solved ·{' '}
        <span className="text-pen-crimson">10pts</span>/unsolved(expired)
      </p>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-pen-gray" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
            loading rankings...
          </p>
        </div>
      ) : (
        <div>
          <div
            className="grid grid-cols-12 gap-3 px-0 py-2 text-pen-gray-light"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.82rem', borderBottom: '1.5px solid rgba(28,28,28,0.15)' }}
          >
            <div className="col-span-1">#</div>
            <div className="col-span-4 sm:col-span-3">Player</div>
            <div className="col-span-2 text-center hidden sm:block">Posted</div>
            <div className="col-span-2 text-center hidden sm:block">Solved</div>
            <div className="col-span-2 text-center hidden sm:block">Unsolved</div>
            <div className="col-span-7 sm:col-span-2 text-right">Points</div>
          </div>

          {leaderboardData.map((entry, i) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(0.03 * i, 0.35) }}
              className="grid grid-cols-12 gap-3 items-center px-0 py-2.5 transition-all hover:bg-pen-blue/[0.02]"
              style={{ borderBottom: '1px solid rgba(28,28,28,0.06)' }}
            >
              <div className="col-span-1">
                <span
                  className={entry.rank <= 3 ? 'text-pen-crimson' : 'text-pen-gray'}
                  style={{
                    fontFamily: entry.rank <= 3 ? "'Caveat', cursive" : "'Inconsolata', monospace",
                    fontWeight: entry.rank <= 3 ? 700 : 400,
                    fontSize: entry.rank === 1 ? '1.3rem' : entry.rank <= 3 ? '1.1rem' : '0.85rem',
                  }}
                >
                  {entry.rank}.
                </span>
              </div>

              <div className="col-span-4 sm:col-span-3 min-w-0">
                <span className={`block truncate ${entry.rank <= 3 ? 'text-pen-black' : 'text-pen-gray'}`} style={{ fontFamily: "'Patrick Hand', cursive" }}>
                  {entry.user.name}
                  {entry.user.type === 'ai_agent' && (
                    <span className="text-pen-crimson ml-1" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.68rem' }}>
                      [AI]
                    </span>
                  )}
                </span>
              </div>

              <div className="col-span-2 text-center hidden sm:block">
                <span className="text-pen-gray" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem' }}>
                  {entry.problemsPosted}
                </span>
              </div>
              <div className="col-span-2 text-center hidden sm:block">
                <span className="text-pen-green" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem' }}>
                  {entry.problemsSolved}
                </span>
              </div>
              <div className="col-span-2 text-center hidden sm:block">
                <span className="text-pen-crimson/70" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem' }}>
                  {entry.unansweredProblems}
                </span>
              </div>
              <div className="col-span-7 sm:col-span-2 text-right">
                <span
                  className={entry.rank <= 3 ? 'text-pen-black' : 'text-pen-gray'}
                  style={{ fontFamily: "'Inconsolata', monospace", fontWeight: entry.rank <= 3 ? 700 : 400 }}
                >
                  {entry.points.toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && leaderboardData.length === 0 && (
        <div className="text-center py-16">
          <p className="text-pen-gray" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
            — no players for this filter —
          </p>
        </div>
      )}
    </div>
  );
}

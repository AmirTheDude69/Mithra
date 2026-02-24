import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ProblemCategory, ProblemDifficulty } from '../store/types';
import { useAppStore } from '../store/useStore';
import { ProblemCard } from '../components/ProblemCard';

type SortOption = 'newest' | 'pot' | 'attempts' | 'expiring';

const categories: (ProblemCategory | 'all')[] = ['all', 'mathematics', 'algorithms', 'iq', 'cryptography'];
const difficulties: (ProblemDifficulty | 'all')[] = ['all', 'beginner', 'intermediate', 'advanced', 'legendary'];
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'newest' },
  { value: 'pot', label: 'highest pot' },
  { value: 'attempts', label: 'most attempts' },
  { value: 'expiring', label: 'expiring soon' },
];

export function Arena() {
  const { problems } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProblemDifficulty | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProblems = useMemo(() => {
    let filtered = problems.filter(p => p.status === 'active');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'all') filtered = filtered.filter(p => p.category === selectedCategory);
    if (selectedDifficulty !== 'all') filtered = filtered.filter(p => p.difficulty === selectedDifficulty);

    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'pot': filtered.sort((a, b) => b.pot - a.pot); break;
      case 'attempts': filtered.sort((a, b) => b.attempts - a.attempts); break;
      case 'expiring': filtered.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()); break;
    }
    return filtered;
  }, [problems, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const totalPot = filteredProblems.reduce((sum, p) => sum + p.pot, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Section heading */}
      <div className="mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-pen-black" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
            § The Arena
          </h1>
          <div className="h-[1.5px] bg-pen-black/25 mb-2" style={{ transform: 'rotate(-0.2deg)', width: '140px' }} />
          <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
            <span className="text-pen-blue">{filteredProblems.length}</span> active challenges ·{' '}
            <span className="text-pen-green">${totalPot.toFixed(2)}</span> total in pots
          </p>
        </motion.div>
      </div>

      {/* Search — like writing on a blank line */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="search challenges, tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-0 py-1.5 bg-transparent border-b border-pen-blue/20 text-pen-black placeholder-pen-gray-light focus:border-pen-blue/50 focus:outline-none transition-all"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`transition-all ${showFilters ? 'text-pen-blue' : 'text-pen-gray hover:text-pen-blue'}`}
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
          >
            {showFilters ? '(hide filters)' : '(filters)'}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pl-2"
          >
            <div>
              <span className="text-pen-gray-light text-sm mb-1.5 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>category:</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`transition-all ${
                      selectedCategory === cat ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
                    }`}
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
                  >
                    {cat === 'all' ? 'all' : cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-pen-gray-light text-sm mb-1.5 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>difficulty:</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {difficulties.map(diff => {
                  const colors: Record<string, string> = { beginner: 'text-pen-green', intermediate: 'text-pen-blue', advanced: 'text-pen-crimson', legendary: 'text-pen-crimson' };
                  return (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`transition-all ${
                        selectedDifficulty === diff
                          ? `${diff === 'all' ? 'text-pen-blue' : colors[diff]} border-b border-current`
                          : 'text-pen-gray hover:text-pen-black'
                      }`}
                      style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
                    >
                      {diff === 'all' ? 'all' : diff === 'legendary' ? '★ legendary' : diff}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sort */}
        <div className="flex gap-x-3 flex-wrap items-center">
          <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>sort by:</span>
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`transition-all ${
                sortBy === opt.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Problems — numbered like homework problems */}
      {filteredProblems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-pen-gray" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.2rem' }}>
            — no challenges match your filters —
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-1">
          {filteredProblems.map((problem, i) => (
            <motion.div
              key={problem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.03 * i, 0.25) }}
            >
              <ProblemCard problem={problem} index={i + 1} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
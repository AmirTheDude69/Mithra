import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ProblemCategory, ProblemDifficulty, TimeframeOption } from '../store/types';
import { useAppStore } from '../store/useStore';
import { toast } from 'sonner';

const categories: { value: ProblemCategory; label: string }[] = [
  { value: 'mathematics', label: 'math' },
  { value: 'algorithms', label: 'algorithms' },
  { value: 'iq', label: 'IQ' },
  { value: 'cryptography', label: 'cryptography' },
];

const difficulties: { value: ProblemDifficulty; label: string; color: string }[] = [
  { value: 'beginner', label: 'beginner', color: 'text-pen-green' },
  { value: 'intermediate', label: 'intermediate', color: 'text-pen-blue' },
  { value: 'advanced', label: 'advanced', color: 'text-pen-crimson' },
  { value: 'legendary', label: '★ legendary', color: 'text-pen-crimson' },
];

const timeframes: { value: TimeframeOption; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '3d', label: '3 days' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export function SubmitProblem() {
  const navigate = useNavigate();
  const { currentUser, submitProblem } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProblemCategory>('mathematics');
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>('intermediate');
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7d');
  const [tagsInput, setTagsInput] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-pen-gray mb-4" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>
          — sign in to post challenges —
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

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !answer.trim()) {
      toast.error('fill in all required fields');
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    try {
      await submitProblem({ title, description, category, difficulty, answer, explanation, timeframe, tags });
      toast.success('Challenge posted!');
      navigate('/arena');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit challenge');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header — black pen */}
        <h1 className="text-pen-black mb-1" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
          § Post a Challenge
        </h1>
        <div className="h-[1.5px] bg-pen-black/25 mb-1" style={{ transform: 'rotate(-0.2deg)', width: '200px' }} />
        <p className="text-pen-gray mb-8" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          Create a challenge that will stump the smartest humans and AIs.
        </p>

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-pen-gray text-sm mb-1 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              title <span className="text-pen-crimson">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="name your challenge..."
              className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
          </div>

          {/* Category — blue pen for active */}
          <div>
            <label className="text-pen-gray text-sm mb-2 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              category <span className="text-pen-crimson">*</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`transition-all ${
                    category === cat.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty — colored by level */}
          <div>
            <label className="text-pen-gray text-sm mb-2 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              difficulty <span className="text-pen-crimson">*</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {difficulties.map(diff => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value)}
                  className={`transition-all ${
                    difficulty === diff.value
                      ? `${diff.color} border-b border-current`
                      : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-pen-gray text-sm mb-1 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              description <span className="text-pen-crimson">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="describe the challenge in detail..."
              rows={8}
              className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all resize-none"
              style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.9rem' }}
            />
          </div>

          {/* Answer — green pen label */}
          <div>
            <label className="text-pen-green text-sm mb-1 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              answer / key <span className="text-pen-crimson">*</span> <span className="text-pen-gray-light">(hidden from solvers)</span>
            </label>
            <input
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="the correct answer..."
              className="w-full px-0 py-2 bg-transparent border-b border-pen-green/30 text-pen-black placeholder-pen-gray-light focus:border-pen-green focus:outline-none transition-all"
              style={{ fontFamily: "'Inconsolata', monospace" }}
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="text-pen-gray text-sm mb-1 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              explanation <span className="text-pen-gray-light">(shown after solve/expire)</span>
            </label>
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="explain the solution..."
              rows={4}
              className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all resize-none"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-pen-gray text-sm mb-2 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              timeframe <span className="text-pen-crimson">*</span>
            </label>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {timeframes.map(tf => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`transition-all ${
                    timeframe === tf.value ? 'text-pen-blue border-b border-pen-blue' : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-pen-gray text-sm mb-1 block" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              tags <span className="text-pen-gray-light">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="number-theory, primes, optimization"
              className="w-full px-0 py-2 bg-transparent border-b border-pen-black/15 text-pen-black placeholder-pen-gray-light focus:border-pen-blue focus:outline-none transition-all"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
          </div>

          {/* Fee notice — crimson */}
          <p className="text-pen-crimson/60" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
            * submission fee: $1.00 — payment via x402 protocol in Phase 2 (currently free)
          </p>

          {/* Submit Button — blue pen, prominent */}
          <button
            onClick={handleSubmit}
            className="text-pen-blue border-b-2 border-pen-blue/50 hover:border-pen-blue pb-1 transition-all"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600 }}
          >
            Post Challenge →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

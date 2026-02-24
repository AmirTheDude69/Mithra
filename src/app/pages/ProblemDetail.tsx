import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { useAppStore, getCategoryColor, getDifficultyColor, getTimeframeLabel } from '../store/useStore';
import { CountdownTimer } from '../components/CountdownTimer';
import { toast } from 'sonner';

export function ProblemDetail() {
  const { id } = useParams();
  const {
    getUserById,
    currentUser,
    submitAnswer,
    fetchProblemDetail,
    requestManualReview,
  } = useAppStore();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchProblemDetail>> | null>(null);

  const load = async () => {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchProblemDetail(id);
      setDetail(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load challenge');
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to load challenge');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const problem = detail?.problem;
  const poster = problem?.poster ?? (problem ? getUserById(problem.postedBy) : undefined);
  const userAttempts = detail?.attempts ?? [];
  const hasAttempted = detail?.hasAttempted ?? false;
  const lastAttempt = userAttempts[userAttempts.length - 1];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          loading challenge...
        </p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-pen-crimson mb-2" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem' }}>
          — Challenge Not Found —
        </p>
        <p className="text-pen-gray mb-6" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          This challenge doesn't exist or has been erased from the notebook.
        </p>
        <Link
          to="/arena"
          className="text-pen-blue border-b border-pen-blue/40 pb-0.5 transition-all hover:border-pen-blue"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          ← back to arena
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!answer.trim()) {
      return;
    }

    if (!currentUser) {
      toast.error('sign in to submit');
      return;
    }

    try {
      setIsSubmitting(true);
      const correct = await submitAnswer(problem.id, answer);
      setSubmitted(true);
      setIsCorrect(correct);
      correct ? toast.success('Correct! The pot is yours!') : toast.error('Wrong answer. Fee added to the pot.');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualReview = async () => {
    try {
      await requestManualReview(problem.id, 'Please review this answer manually.');
      toast.success('Manual review request sent to the problem poster');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request review');
    }
  };

  const isSolved = problem.status === 'solved';
  const isOwnProblem = currentUser?.id === problem.postedBy;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/arena"
        className="text-pen-blue/50 hover:text-pen-blue transition-colors mb-6 inline-block"
        style={{ fontFamily: "'Patrick Hand', cursive" }}
      >
        ← back to arena
      </Link>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.78rem' }}>
          <span className={getCategoryColor(problem.category)}>[{problem.category}]</span>
          <span className={getDifficultyColor(problem.difficulty)}>
            {problem.difficulty}
            {problem.difficulty === 'legendary' ? ' ★' : ''}
          </span>
          <span className="text-pen-gray">{getTimeframeLabel(problem.timeframe)}</span>
          {isSolved && <span className="text-pen-green">✓ solved</span>}
        </div>

        <h1 className="text-pen-black mb-1" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700 }}>
          {problem.title}
        </h1>
        <div className="mb-5" style={{ maxWidth: '300px' }}>
          <div className="h-[2px] bg-pen-black/30 mb-[3px]" style={{ transform: 'rotate(-0.3deg)' }} />
          <div className="h-[1px] bg-pen-black/15" style={{ transform: 'rotate(0.2deg)' }} />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 mb-5" style={{ fontSize: '0.9rem' }}>
          <span>
            <span className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              Pot:{' '}
            </span>
            <span className="text-pen-green" style={{ fontFamily: "'Inconsolata', monospace" }}>
              ${problem.pot.toFixed(2)}
            </span>
          </span>
          <span>
            <span className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              Attempts:{' '}
            </span>
            <span className="text-pen-black" style={{ fontFamily: "'Inconsolata', monospace" }}>
              {problem.attempts}
            </span>
          </span>
          <span className="text-pen-blue" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem' }}>
            <CountdownTimer expiresAt={problem.expiresAt} compact />
          </span>
        </div>

        {poster && (
          <p className="text-pen-gray mb-5" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.88rem' }}>
            Posted by <span className="text-pen-black">{poster.name}</span>
            {poster.type === 'ai_agent' && (
              <span className="text-pen-crimson ml-1" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem' }}>
                [AI]
              </span>
            )}
          </p>
        )}

        <div className="mb-5">
          <p className="text-pen-blue mb-1.5" style={{ fontFamily: "'Caveat', cursive", fontSize: '1rem', fontWeight: 600 }}>
            Challenge Statement:
          </p>
          <div
            className="whitespace-pre-wrap text-pen-black-soft pl-3"
            style={{
              fontFamily: "'Inconsolata', monospace",
              fontSize: '0.88rem',
              lineHeight: 1.75,
              borderLeft: '2px solid rgba(26, 58, 92, 0.15)',
            }}
          >
            {problem.description}
          </div>
        </div>

        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-8">
            <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
              tags:
            </span>
            {problem.tags.map((tag) => (
              <span key={tag} className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-5" style={{ borderTop: '1.5px solid rgba(28,28,28,0.1)' }}>
          {!currentUser ? (
            <div className="text-center py-6">
              <p className="text-pen-gray mb-3" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                Sign in to attempt this challenge.
              </p>
              <Link
                to="/auth"
                className="text-pen-blue border-b border-pen-blue/50 hover:border-pen-blue pb-0.5 transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Sign In
              </Link>
            </div>
          ) : isOwnProblem ? (
            <div className="text-center py-5">
              <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                — your challenge (can't solve your own) —
              </p>
              {(problem.answer || problem.explanation) && (
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="mt-2 text-pen-blue/60 hover:text-pen-blue border-b border-pen-blue/20 hover:border-pen-blue/40 pb-0.5 transition-all"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.88rem' }}
                >
                  {showExplanation ? 'hide answer' : 'view answer'}
                </button>
              )}
              {showExplanation && (
                <div className="mt-4 text-left">
                  {problem.answer && (
                    <>
                      <p className="text-pen-green mb-0.5" style={{ fontFamily: "'Caveat', cursive", fontSize: '0.95rem', fontWeight: 600 }}>
                        Answer:
                      </p>
                      <p className="text-pen-black mb-3 pl-3" style={{ fontFamily: "'Inconsolata', monospace", borderLeft: '2px solid rgba(45,90,61,0.2)' }}>
                        {problem.answer}
                      </p>
                    </>
                  )}
                  {problem.explanation && (
                    <>
                      <p className="text-pen-blue mb-0.5" style={{ fontFamily: "'Caveat', cursive", fontSize: '0.95rem', fontWeight: 600 }}>
                        Explanation:
                      </p>
                      <p className="text-pen-gray pl-3" style={{ fontFamily: "'Patrick Hand', cursive", borderLeft: '2px solid rgba(26,58,92,0.15)' }}>
                        {problem.explanation}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : isSolved ? (
            <div className="text-center py-5">
              <p className="text-pen-green mb-1" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600 }}>
                ✓ Solved
              </p>
              {problem.solvedBy && (
                <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                  by <span className="text-pen-black">{getUserById(problem.solvedBy)?.name || 'unknown'}</span>
                </p>
              )}
            </div>
          ) : submitted ? (
            <div className="text-center py-5">
              {isCorrect ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}>
                  <p className="text-pen-green mb-2" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: '2rem' }}>
                    Correct! ✓
                  </p>
                  <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Pot won:{' '}
                    <span className="text-pen-green" style={{ fontFamily: "'Inconsolata', monospace" }}>
                      ${problem.pot.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-pen-gray-light mt-1" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
                    (payout via x402 — Phase 2)
                  </p>
                </motion.div>
              ) : (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }}>
                  <p className="text-pen-crimson mb-2" style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: '1.5rem' }}>
                    <span className="line-through">Incorrect</span> ✗
                  </p>
                  <p className="text-pen-gray mb-4" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Fee added to pot. Try again?
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setAnswer('');
                      }}
                      className="text-pen-blue border-b border-pen-blue/40 hover:border-pen-blue pb-0.5 transition-all"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      try again
                    </button>
                    <button
                      onClick={handleManualReview}
                      className="text-pen-crimson border-b border-pen-crimson/40 hover:border-pen-crimson pb-0.5 transition-all"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      request manual review
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <p className="text-pen-blue mb-3" style={{ fontFamily: "'Caveat', cursive", fontWeight: 600, fontSize: '1.15rem' }}>
                Your Answer:
              </p>

              {hasAttempted && lastAttempt && !lastAttempt.correct && (
                <p className="text-pen-crimson/50 mb-2" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.82rem' }}>
                  prev. attempt: "{lastAttempt.answer}" — <span className="line-through">incorrect</span>
                </p>
              )}

              <div className="space-y-3">
                <p className="text-pen-gray" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.82rem' }}>
                  24-hr window from first attempt. Wrong = <span className="text-pen-green">$0.08</span> added to pot (Phase 2).
                </p>
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="write your answer..."
                  rows={3}
                  className="w-full px-0 py-1.5 bg-transparent border-b border-pen-blue/20 text-pen-black placeholder-pen-gray-light focus:border-pen-blue/50 focus:outline-none transition-all resize-none"
                  style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.88rem' }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
                    fee: <span className="text-pen-crimson">$0.10</span> (Phase 2)
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || isSubmitting || !detail?.canAttempt}
                    className="text-pen-blue border-b border-pen-blue/50 hover:border-pen-blue pb-0.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem', fontWeight: 600 }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit →'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

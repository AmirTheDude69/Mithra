import { Link } from 'react-router';
import { Problem } from '../store/types';
import { useAppStore, getCategoryColor, getDifficultyColor } from '../store/useStore';
import { CountdownTimer } from './CountdownTimer';

interface ProblemCardProps {
  problem: Problem;
  index?: number;
}

export function ProblemCard({ problem, index }: ProblemCardProps) {
  const { getUserById } = useAppStore();
  const poster = problem.poster ?? getUserById(problem.postedBy);

  return (
    <Link
      to={`/problem/${problem.id}`}
      className="group block relative pb-5 mb-2 transition-all"
      style={{ transform: `rotate(${-0.25 + Math.random() * 0.2}deg)` }}
    >
      <div className="relative">
        {/* Problem number (like "Problem 3.") if index given */}
        {index !== undefined && (
          <span
            className="text-pen-crimson/60 block mb-1"
            style={{ fontFamily: "'Caveat', cursive", fontSize: '0.9rem', fontWeight: 600 }}
          >
            Challenge {index}.
          </span>
        )}

        {/* Category + difficulty — like a classification tag */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={getCategoryColor(problem.category)}
            style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.78rem' }}
          >
            [{problem.category}]
          </span>
          <span
            className={getDifficultyColor(problem.difficulty)}
            style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.78rem' }}
          >
            {problem.difficulty === 'legendary' ? '★★★' : problem.difficulty}
          </span>
          {problem.status === 'solved' && (
            <span className="text-pen-green" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
              ✓ solved
            </span>
          )}
        </div>

        {/* Title — black pen, heavy hand */}
        <h3
          className="text-pen-black mb-0.5 group-hover:text-pen-blue transition-colors"
          style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.2 }}
        >
          {problem.title}
        </h3>

        {/* Description preview — gray pencil */}
        <p
          className="text-pen-gray mb-2 line-clamp-2"
          style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem', lineHeight: 1.4 }}
        >
          {problem.description}
        </p>

        {/* Tags — very light, like pencil marginalia */}
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mb-2">
            {problem.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-pen-gray-light"
                style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom info line — pot in green, timer in blue, poster in gray */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-pen-gray">
          <span className="text-pen-green" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.85rem' }}>
            ${problem.pot.toFixed(2)}
          </span>
          <span className="text-pen-gray-light" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.78rem' }}>
            {problem.attempts} att.
          </span>
          <CountdownTimer expiresAt={problem.expiresAt} compact />
          {poster && (
            <span className="text-pen-gray-light" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.8rem' }}>
              — {poster.name}{poster.type === 'ai_agent' ? ' [AI]' : ''}
            </span>
          )}
        </div>

        {/* Pen underline separator */}
        <svg className="w-full h-[3px] mt-4 opacity-10" viewBox="0 0 300 3" preserveAspectRatio="none">
          <path d="M0 1.5 Q15 0.5, 30 1.5 Q45 2.5, 60 1.5 Q75 0.5, 90 1.5 Q105 2.5, 120 1.5 Q135 0.5, 150 1.5 Q165 2.5, 180 1.5 Q195 0.5, 210 1.5 Q225 2.5, 240 1.5 Q255 0.5, 270 1.5 Q285 2.5, 300 1.5" stroke="var(--pen-black)" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </Link>
  );
}

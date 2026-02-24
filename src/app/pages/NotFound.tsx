import { Link } from 'react-router';
import { motion } from 'motion/react';

export function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {/* Big "404" like it was circled in red pen */}
        <div className="relative inline-block mb-4">
          <p
            className="text-pen-crimson"
            style={{ fontFamily: "'Caveat', cursive", fontWeight: 700, fontSize: '4.5rem', lineHeight: 1 }}
          >
            404
          </p>
          {/* Hand-drawn circle around it */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 80" fill="none" style={{ transform: 'scale(1.3) rotate(-2deg)' }}>
            <ellipse cx="60" cy="40" rx="55" ry="35" stroke="var(--pen-crimson)" strokeWidth="1.5" opacity="0.25" strokeDasharray="4 3" />
          </svg>
        </div>

        <p className="text-pen-black mb-1" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.3rem', fontWeight: 600 }}>
          Page Not Found
        </p>
        <p className="text-pen-gray mb-6" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          This page has been erased from the notebook.
        </p>

        {/* Decorative equation */}
        <p className="text-pen-blue/[0.12] mb-8" style={{ fontFamily: "'EB Garamond', serif", fontStyle: 'italic', fontSize: '1rem' }}>
          lim(page) = undefined, as page → ∞
        </p>

        <div className="flex items-center justify-center gap-6">
          <Link
            to="/"
            className="text-pen-gray hover:text-pen-black border-b border-pen-gray/30 hover:border-pen-black/40 pb-0.5 transition-all"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            home
          </Link>
          <Link
            to="/arena"
            className="text-pen-blue border-b border-pen-blue/50 hover:border-pen-blue pb-0.5 transition-all"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            arena →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

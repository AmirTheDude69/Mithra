import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAppStore } from '../store/useStore';

export function Navbar() {
  const { currentUser, logout } = useAppStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/arena', label: 'Arena' },
    { to: '/leaderboard', label: 'Rankings' },
    { to: '/submit', label: '+ Submit' },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-pen-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* Logo — black pen, heavy */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <span
              className="text-pen-black"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.6rem', fontWeight: 700 }}
            >
              Mithra
            </span>
          </Link>

          {/* Desktop Nav — blue pen for links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-3 py-1.5 transition-all ${
                  isActive(link.to) ? 'text-pen-blue' : 'text-pen-gray hover:text-pen-blue'
                }`}
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                {link.label}
                {isActive(link.to) && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-px bg-pen-blue"
                    style={{ transform: 'rotate(-0.5deg)' }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className={`transition-all ${
                    isActive('/profile') ? 'text-pen-black' : 'text-pen-gray hover:text-pen-black'
                  }`}
                  style={{
                    fontFamily: "'Patrick Hand', cursive",
                    textDecoration: isActive('/profile') ? 'underline' : 'none',
                    textUnderlineOffset: '4px',
                    textDecorationStyle: 'wavy' as const,
                    textDecorationColor: 'var(--pen-blue)',
                  }}
                >
                  {currentUser.name}
                  {currentUser.type === 'ai_agent' && (
                    <span className="text-pen-crimson ml-1" style={{ fontFamily: "'Inconsolata', monospace", fontSize: '0.7rem' }}>[AI]</span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="text-pen-gray-light hover:text-pen-crimson transition-all"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.9rem' }}
                >
                  (logout)
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-pen-blue border-b border-pen-blue/50 hover:border-pen-blue pb-0.5 transition-all"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-pen-black"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1.3rem' }}
          >
            {mobileOpen ? '✕' : '≡'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-pen-black/8">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 transition-all ${
                  isActive(link.to) ? 'text-pen-blue' : 'text-pen-gray hover:text-pen-blue'
                }`}
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  borderLeft: isActive(link.to) ? '2px solid var(--pen-blue)' : '2px solid transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-pen-gray hover:text-pen-black"
                >
                  Profile
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-pen-gray-light hover:text-pen-crimson"
                >
                  (logout)
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-pen-blue"
              >
                Sign In →
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

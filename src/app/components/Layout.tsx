import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import { FloatingEquations } from './FloatingEquations';

export function Layout() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <FloatingEquations />

      {/* ── Spiral binding holes (left edge) ── */}
      <div className="fixed left-0 top-0 bottom-0 w-8 z-20 pointer-events-none hidden lg:flex flex-col items-center pt-20 gap-[84px]">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full border-2 flex-shrink-0"
            style={{
              borderColor: 'rgba(28, 28, 28, 0.12)',
              background: 'rgba(236, 229, 216, 0.7)',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.06), inset -1px -1px 1px rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* ── Spiral wire hints ── */}
      <div className="fixed left-[14px] top-0 bottom-0 w-px z-20 pointer-events-none hidden lg:block"
        style={{ background: 'rgba(28, 28, 28, 0.06)' }}
      />
      <div className="fixed left-[18px] top-0 bottom-0 w-px z-20 pointer-events-none hidden lg:block"
        style={{ background: 'rgba(28, 28, 28, 0.04)' }}
      />

      {/* ── Red margin line ── already in body background, but add a stronger fixed overlay for clarity */}
      <div
        className="fixed top-0 bottom-0 z-[1] pointer-events-none hidden lg:block"
        style={{
          left: '72px',
          width: '2px',
          background: 'linear-gradient(to bottom, rgba(155, 27, 48, 0.22), rgba(155, 27, 48, 0.15), rgba(155, 27, 48, 0.22))',
        }}
      />

      {/* ── Paper edge shadow (left binding area) ── */}
      <div
        className="fixed left-0 top-0 bottom-0 w-10 z-[1] pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.03), transparent)',
        }}
      />

      {/* ── Navbar sits at top, overlaps the ruled paper ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main className="relative z-10 pt-14">
        <Outlet />
      </main>

      {/* ── Paper vignette (subtle darkening at edges) ── */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180, 165, 140, 0.12) 100%)',
        }}
      />
    </div>
  );
}

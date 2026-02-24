import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiresAt: string;
  compact?: boolean;
}

export function CountdownTimer({ expiresAt, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = timeLeft.total < 3600000;
  const isExpired = timeLeft.total <= 0;

  if (isExpired) {
    return (
      <span
        className="text-pen-gray-light line-through"
        style={{ fontFamily: "'Inconsolata', monospace", fontSize: compact ? '0.8rem' : '1rem' }}
      >
        expired
      </span>
    );
  }

  const timeStr = `${timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;

  if (compact) {
    return (
      <span
        className={`tabular-nums ${isUrgent ? 'text-pen-crimson' : 'text-pen-blue'}`}
        style={{
          fontFamily: "'Inconsolata', monospace",
          fontSize: '0.8rem',
          textDecoration: isUrgent ? 'underline' : 'none',
          textDecorationStyle: isUrgent ? ('wavy' as const) : undefined,
          textDecorationColor: isUrgent ? 'var(--pen-crimson)' : undefined,
        }}
      >
        {timeStr}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`tabular-nums ${isUrgent ? 'text-pen-crimson' : 'text-pen-blue'}`}
        style={{
          fontFamily: "'Inconsolata', monospace",
          fontSize: '1.2rem',
        }}
      >
        {timeStr}
      </span>
      {isUrgent && (
        <span className="text-pen-crimson" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.85rem' }}>
          ← hurry!
        </span>
      )}
    </div>
  );
}

function getTimeLeft(expiresAt: string) {
  const total = new Date(expiresAt).getTime() - Date.now();
  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

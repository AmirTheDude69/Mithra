export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export function getUtcPeriodStart(period: LeaderboardPeriod, now = new Date()): Date | null {
  if (period === 'all-time') {
    return null;
  }

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

  if (period === 'daily') {
    return start;
  }

  if (period === 'weekly') {
    const day = start.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    start.setUTCDate(start.getUTCDate() - diffToMonday);
    return start;
  }

  start.setUTCDate(1);
  return start;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(isoDate: string): Date | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return null;
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59);
}

export function getDaysUntilDeadline(isoDate: string): number | null {
  const target = parseLocalDate(isoDate);
  if (!target) return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const diffMs = target.getTime() - todayStart.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export type DeadlineBucket = 'overdue' | 'within-7' | 'within-30' | 'later' | 'unknown';

export function getDeadlineBucket(isoDate: string): DeadlineBucket {
  const days = getDaysUntilDeadline(isoDate);
  if (days === null) return 'unknown';
  if (days < 0) return 'overdue';
  if (days <= 7) return 'within-7';
  if (days <= 30) return 'within-30';
  return 'later';
}

export function formatReadableDate(isoDate?: string): string {
  if (!isoDate) return 'Not specified';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDeadlineCountdown(isoDate: string): string {
  const days = getDaysUntilDeadline(isoDate);
  if (days === null) return isoDate || 'Not specified';
  if (days < -1) return `Closed ${Math.abs(days)}d ago`;
  if (days === -1) return 'Closed yesterday';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days}d left`;
}

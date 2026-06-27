import type { LogEntry } from '../hooks/useLogs';

export interface MonthStat { month: string; short: string; count: number }

export interface WrappedData {
  year: number;
  total: number;
  byType: Record<string, number>;
  monthlyActivity: MonthStat[];
  peakMonth: string;
  avgRating: number | null;
  topCreators: { name: string; count: number }[];
  grandPick: LogEntry | null;
  bookOfYear: LogEntry | null;
  filmOfYear: LogEntry | null;
  albumOfYear: LogEntry | null;
  adventurousPick: LogEntry | null;
  longestStreak: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function topByRating(logs: LogEntry[], type?: string): LogEntry | null {
  const filtered = type ? logs.filter(l => l.media_type === type) : logs;
  const finished = filtered.filter(l => l.status === 'finished' && l.rating);
  if (!finished.length) return filtered[0] ?? null;
  return finished.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
}

function adventurousPick(logs: LogEntry[]): LogEntry | null {
  // Most "niche" = least common creator + has a review = most considered
  const withReview = logs.filter(l => l.review && l.review.length > 20);
  if (withReview.length) {
    const creatorCounts = new Map<string, number>();
    for (const l of logs) {
      if (l.creator) creatorCounts.set(l.creator, (creatorCounts.get(l.creator) ?? 0) + 1);
    }
    return withReview.sort((a, b) => {
      const ca = creatorCounts.get(a.creator ?? '') ?? 1;
      const cb = creatorCounts.get(b.creator ?? '') ?? 1;
      return ca - cb; // rarest creator first
    })[0];
  }
  // Fallback: oldest work logged (most "adventurous" in time)
  return logs.filter(l => l.year).sort((a, b) => (a.year ?? 0) - (b.year ?? 0))[0] ?? null;
}

export function computeWrapped(logs: LogEntry[], year: number): WrappedData {
  const yearLogs = logs.filter(l => new Date(l.logged_at).getFullYear() === year);

  // By type
  const byType: Record<string, number> = {};
  for (const l of yearLogs) byType[l.media_type] = (byType[l.media_type] ?? 0) + 1;

  // Monthly activity
  const monthlyCounts = Array(12).fill(0);
  for (const l of yearLogs) monthlyCounts[new Date(l.logged_at).getMonth()]++;
  const monthlyActivity: MonthStat[] = monthlyCounts.map((count, i) => ({
    month: MONTHS_FULL[i], short: MONTHS[i], count,
  }));
  const peakIdx = monthlyCounts.indexOf(Math.max(...monthlyCounts));
  const peakMonth = MONTHS_FULL[peakIdx];

  // Average rating
  const rated = yearLogs.filter(l => l.rating);
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length) * 10) / 10
    : null;

  // Top creators
  const creatorMap = new Map<string, number>();
  for (const l of yearLogs) {
    if (l.creator) creatorMap.set(l.creator, (creatorMap.get(l.creator) ?? 0) + 1);
  }
  const topCreators = Array.from(creatorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Streak — consecutive days with at least one log
  const days = new Set(yearLogs.map(l => l.logged_at.slice(0, 10)));
  let longest = 0, current = 0;
  const sorted = Array.from(days).sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) { current = 1; continue; }
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    current = diff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  return {
    year,
    total: yearLogs.length,
    byType,
    monthlyActivity,
    peakMonth,
    avgRating,
    topCreators,
    grandPick: topByRating(yearLogs),
    bookOfYear: topByRating(yearLogs, 'book'),
    filmOfYear: topByRating(yearLogs, 'film'),
    albumOfYear: topByRating(yearLogs, 'album'),
    adventurousPick: adventurousPick(yearLogs),
    longestStreak: longest,
  };
}

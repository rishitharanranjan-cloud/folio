export interface StreakResult {
  currentStreak: number;  // consecutive weeks (ending this week) with ≥1 log
  longestStreak: number;
  thisYearCount: number;
}

function isoWeekKey(date: Date): string {
  // Returns "YYYY-WW" using ISO week (Monday-start)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-${String(week).padStart(2, '0')}`;
}

export function computeStreaks(logDates: string[]): StreakResult {
  const year = new Date().getFullYear();
  const thisYearCount = logDates.filter((d) => new Date(d).getFullYear() === year).length;

  if (logDates.length === 0) return { currentStreak: 0, longestStreak: 0, thisYearCount: 0 };

  const weeks = new Set(logDates.map((d) => isoWeekKey(new Date(d))));

  // Walk backwards from current week
  const now = new Date();
  let currentStreak = 0;
  const d = new Date(now);
  while (true) {
    const key = isoWeekKey(d);
    if (!weeks.has(key)) break;
    currentStreak++;
    d.setDate(d.getDate() - 7);
    if (currentStreak > 500) break; // safety
  }

  // Longest streak across all logged weeks
  const allKeys = Array.from(weeks).sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;

  for (const key of allKeys) {
    if (!prev) {
      run = 1;
    } else {
      // Check if this key is exactly 1 week after prev
      const [py, pw] = prev.split('-').map(Number);
      const [cy, cw] = key.split('-').map(Number);
      // Approximate: same year consecutive or year boundary
      const consecutive = (cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1);
      run = consecutive ? run + 1 : 1;
    }
    if (run > longest) longest = run;
    prev = key;
  }

  return { currentStreak, longestStreak: longest, thisYearCount };
}

export const LOG_MILESTONES = [10, 25, 50, 100, 250, 500];
export const STREAK_MILESTONES = [4, 8, 12, 26, 52];

export function checkLogMilestone(prev: number, next: number): number | null {
  for (const m of LOG_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

export function checkStreakMilestone(prev: number, next: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

// Campus time is always IST (UTC+05:30, no daylight saving), whatever the
// device timezone is.

const IST = 'Asia/Kolkata';

/** Builds an ISO timestamp from IST date ("2026-11-05") and time ("17:30") text. Null if invalid. */
export function istToIso(date: string, time: string): string | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!d || !t) return null;
  const [year, month, day, hour, minute] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute) - 330 * 60 * 1000);
  // Reject dates that rolled over (e.g. 2026-02-31).
  const check = new Date(utc.getTime() + 330 * 60 * 1000);
  if (check.getUTCDate() !== day || check.getUTCMonth() !== month - 1) return null;
  return utc.toISOString();
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function formatEventTimeRange(startIso: string, endIso: string): string {
  const time = new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit' });
  return `${time.format(new Date(startIso))} – ${time.format(new Date(endIso))}`;
}

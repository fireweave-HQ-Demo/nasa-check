/** First APOD ever published. */
export const APOD_FIRST_DATE = '1995-06-16';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date (YYYY-MM-DD) in US Eastern time, which is when APOD rolls over. */
export function todayInEastern(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function toUtcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toUtcDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = toUtcDate(value);
  return !Number.isNaN(d.getTime()) && toIso(d) === value;
}

export function isApodDateInRange(iso: string, today: string = todayInEastern()): boolean {
  return isValidIsoDate(iso) && iso >= APOD_FIRST_DATE && iso <= today;
}

export function clampApodDate(iso: string, today: string = todayInEastern()): string {
  if (iso < APOD_FIRST_DATE) return APOD_FIRST_DATE;
  if (iso > today) return today;
  return iso;
}

export function randomApodDate(today: string = todayInEastern(), random = Math.random): string {
  const start = toUtcDate(APOD_FIRST_DATE).getTime();
  const end = toUtcDate(today).getTime();
  const dayMs = 86_400_000;
  const span = Math.floor((end - start) / dayMs);
  return toIso(new Date(start + Math.floor(random() * (span + 1)) * dayMs));
}

export function formatDisplayDate(iso: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(toUtcDate(iso));
}

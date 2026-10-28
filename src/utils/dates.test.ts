import { describe, expect, it } from 'vitest';
import {
  addDays,
  APOD_FIRST_DATE,
  clampApodDate,
  formatDisplayDate,
  isApodDateInRange,
  isValidIsoDate,
  randomApodDate,
  todayInEastern,
} from './dates';

describe('dates', () => {
  it('computes today in US Eastern', () => {
    // 03:00 UTC on Oct 28 is still Oct 27 in New York.
    expect(todayInEastern(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-27');
    expect(todayInEastern(new Date('2026-10-28T15:00:00Z'))).toBe('2026-10-28');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });

  it('validates ISO dates', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2023-02-29')).toBe(false);
    expect(isValidIsoDate('2024-1-1')).toBe(false);
  });

  it('checks and clamps the APOD range', () => {
    expect(isApodDateInRange('1995-06-15', '2026-10-28')).toBe(false);
    expect(isApodDateInRange('2026-10-29', '2026-10-28')).toBe(false);
    expect(isApodDateInRange('2000-01-01', '2026-10-28')).toBe(true);
    expect(clampApodDate('1990-01-01', '2026-10-28')).toBe(APOD_FIRST_DATE);
    expect(clampApodDate('2030-01-01', '2026-10-28')).toBe('2026-10-28');
  });

  it('picks random dates inside the range', () => {
    expect(randomApodDate('2026-10-28', () => 0)).toBe(APOD_FIRST_DATE);
    expect(randomApodDate('2026-10-28', () => 0.99999)).toBe('2026-10-28');
  });

  it('formats display dates without timezone drift', () => {
    expect(formatDisplayDate('2024-01-01', 'en-US')).toBe('January 1, 2024');
  });
});

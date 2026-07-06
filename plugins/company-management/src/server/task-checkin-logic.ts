/**
 * Pure logic for deciding whether a recurring `tasks` record needs a new
 * `task_checkins` record today. No NocoBase/DB imports here on purpose, so
 * this can be unit-tested with plain `node --test` without booting the app.
 *
 * The design doc's `recurrence_frequency` is documented as "số lần/tuần"
 * (times per week) regardless of `recurrence_unit`, which only really makes
 * an unambiguous rule for the `Tuần` case. For `Ngày`, this implementation
 * treats it as "exactly one checkin per calendar day" and does not yet use
 * `recurrence_frequency` (doing "N times per day" would need intraday
 * scheduling, not a once-daily 00:05 job).
 */

export type RecurrenceUnit = 'Ngày' | 'Tuần';

export interface RecurringTaskLike {
  id: number | string;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_frequency: number | null;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local (server-timezone) calendar date as `YYYY-MM-DD`, matching how `checkin_date` is stored. */
export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday..Sunday (ISO week) range containing `date`, as local calendar dates. */
export function isoWeekRangeOf(date: Date): { start: Date; end: Date } {
  const isoWeekday = ((date.getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - (isoWeekday - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

/**
 * `Ngày`: due today iff no checkin already exists for today.
 * `Tuần`: due today iff fewer than `recurrence_frequency` checkins exist for
 * the current ISO week (so checkins are created on consecutive days from
 * Monday until the weekly target is reached, then stop for the rest of the week).
 */
export function isCheckinDueToday(
  task: RecurringTaskLike,
  existingCheckinsTodayCount: number,
  existingCheckinsThisWeekCount: number,
): boolean {
  if (task.recurrence_unit === 'Ngày') {
    return existingCheckinsTodayCount === 0;
  }
  if (task.recurrence_unit === 'Tuần') {
    const frequency = task.recurrence_frequency ?? 0;
    return existingCheckinsThisWeekCount < frequency;
  }
  return false;
}

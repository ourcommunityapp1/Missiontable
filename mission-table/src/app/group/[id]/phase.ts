import type { MemberLoopData } from './loopTypes';

export type Phase = 'before' | 'day' | 'after';

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

/** Before the next gathering, the day of it, or the week after the last one. */
export function phaseOf(loop: Pick<MemberLoopData, 'today' | 'nextDate' | 'tableDate'>): Phase {
  if (loop.nextDate && loop.nextDate === loop.today) return 'day';
  if (loop.tableDate && loop.tableDate !== loop.today && daysBetween(loop.tableDate, loop.today) <= 7) return 'after';
  return 'before';
}

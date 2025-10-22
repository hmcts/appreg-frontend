/* 
Collect missing required fields

Used in applications-list-create & applications-list-detail
*/

import { Duration } from '../components/duration-input/duration-input.component';

import { has } from './has';

export type MissingItem = { id: string; text: string };

export function collectMissing(
  v: {
    date: unknown;
    time: Duration | string | null;
    description: string | null;
    status: unknown;
    court: string | null;
    location: string | null;
    cja: string | null;
  },
  errs: {
    dateInvalid?: boolean;
    dateErrorText?: string;
    durationErrorText?: string;
  },
): MissingItem[] {
  const out: MissingItem[] = [];
  const need = (ok: boolean, id: string, text: string) => {
    if (!ok) {
      out.push({ id, text });
    }
  };

  if (!errs.dateInvalid) {
    need(has(v.date), 'date-day', 'Enter day, month and year');
  } else {
    need(has(v.date), 'date-day', errs.dateErrorText ?? 'Enter a valid date');
  }

  if (!errs.durationErrorText) {
    need(has(v.time), 'time-hours', 'Enter hours and minutes');
  } else {
    need(false, 'time-hours', errs.durationErrorText);
  }

  need(has(v.description), 'description', 'Description is required');
  need(has(v.status), 'status', 'Status is required');

  const court = has(v.court),
    loc = has(v.location),
    cja = has(v.cja);
  if (!court) {
    need(loc, 'location', 'Other location is required');
    need(cja, 'cja', 'CJA is required');
  }
  if (!(loc || cja) && !court) {
    out.push({ id: 'court', text: 'Court is required' });
  }

  return out;
}

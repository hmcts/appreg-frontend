/* 
Helper function for applications-list.ts - loadApplicationsLists()
Ensures that time field conforms to OpenAPI model

Inputs: String/Duration/null/undefined
Process: conforms time inputs into strings
Outputs: string "HH:mm", "HH:mm:ss", "HH:mm:ss.sssZ"
*/

import { Duration } from '../components/duration-input/duration-input.component';

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function toTimeString(
  v: Duration | string | null | undefined,
): string | undefined {
  if (v === null) {
    return undefined;
  }

  if (typeof v === 'string') {
    const s = v.trim();
    return HH_MM.test(s) ? s : undefined;
  }

  // Guard bad shapes like {hours:null, minutes:null} or empty strings.
  const { hours, minutes } = v as { hours?: unknown; minutes?: unknown };
  if (typeof hours !== 'number' || typeof minutes !== 'number') {
    return undefined;
  }
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return undefined;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return undefined;
  }

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const out = `${hh}:${mm}`;
  return HH_MM.test(out) ? out : undefined;
}

export function normaliseTime(t: string | null | undefined): string {
  if (!t) {
    return '';
  }

  const m = new RegExp(/^(\d{2}):(\d{2})(?::(\d{2}))?/).exec(t);
  return m ? `${m[1]}:${m[2]}` : '';
}

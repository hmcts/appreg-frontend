/* 
Helper function for applications-list.ts - loadApplicationsLists()
Ensures that time field conforms to OpenAPI model

Inputs: String/Duration/null/undefined
Process: conforms time inputs into strings
Outputs: string "HH:mm", "HH:mm:ss", "HH:mm:ss.sssZ"
*/

import { Duration } from '../components/duration-input/duration-input.component';

export function toTimeString(
  v: Duration | null | undefined,
): string | undefined {
  if (!v) {
    return undefined;
  }
  const { hours, minutes } = v;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function normaliseTime(t: string | null | undefined): string {
  if (!t) {
    return '';
  }

  const m = t.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[1]}:${m[2]}` : '';
}

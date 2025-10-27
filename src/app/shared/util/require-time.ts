/*  
Hardened function that throws error if its null/undefined for time
*/

import { toTimeString } from './time-helpers';

export function requireTime(t: Parameters<typeof toTimeString>[0]): string {
  const v = toTimeString(t);
  if (!v) {
    throw new Error('time required');
  }
  return v.length === 5 ? `${v}:00` : v;
}

/* 
Ensures court location && (location || cja) is followed

Else return informative string to display
*/

import { has } from './has';
import type { FormRaw } from './types/application-list/types';

export const validateCourtVsLocOrCja = (
  v: Pick<FormRaw<unknown>, 'court' | 'location' | 'cja'>,
): string | null => {
  const court = has(v.court);
  const loc = has(v.location);
  const cja = has(v.cja);
  return court && (loc || cja)
    ? 'You can not have Court and Other Location or CJA filled in'
    : null;
};

/* 
Helper function for applications-list.ts - loadApplicationsLists()
Ensures that status field conforms to OpenAPI model

Input: string
Process: Trims string and returns ApplicationListStatus type
Output: ApplicationListStatus (OpenAPI generated model based on spec)
*/

import { ApplicationListStatus } from '@openapi';

export function toStatus(
  s: string | null | undefined,
): ApplicationListStatus | undefined {
  const v = s?.trim();
  if (!v || v.toLowerCase() === 'choose') {
    return undefined;
  }

  switch (v.toUpperCase()) {
    case 'OPEN':
      return ApplicationListStatus.OPEN;
    case 'CLOSED':
      return ApplicationListStatus.CLOSED;
    default:
      return undefined;
  }
}

/* 
Hardened function that throws error if its null/undefined for status
*/
export function requireStatus(
  s: string | ApplicationListStatus | null | undefined,
): ApplicationListStatus {
  if (s === null || s === undefined) {
    throw new Error('status missing');
  }

  if (typeof s !== 'string') {
    return s;
  }

  const coerced = toStatus(s);
  if (!coerced) {
    throw new Error('status invalid');
  }
  return coerced;
}

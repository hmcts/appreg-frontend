// /*
// Hardened function that throws error if its null/undefined for status
// */

// import { ApplicationListStatus } from '../../../generated/openapi';

// import { toStatus } from './to-status';

// export function requireStatus(
//   s: string | ApplicationListStatus | null | undefined,
// ): ApplicationListStatus {
//   if (s === null || s === undefined) {
//     throw new Error('status missing');
//   }

//   if (typeof s !== 'string') {
//     return s;
//   }

//   const coerced = toStatus(s);
//   if (!coerced) {
//     throw new Error('status invalid');
//   }
//   return coerced;
// }

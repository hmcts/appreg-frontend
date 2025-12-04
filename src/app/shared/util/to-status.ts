// /*
// Helper function for applications-list.ts - loadApplicationsLists()
// Ensures that status field conforms to OpenAPI model

// Input: string
// Process: Trims string and returns ApplicationListStatus type
// Output: ApplicationListStatus (OpenAPI generated model based on spec)
// */

// import { ApplicationListStatus } from '../../../generated/openapi';

// export function toStatus(
//   s: string | null | undefined,
// ): ApplicationListStatus | undefined {
//   const v = s?.trim();
//   if (!v || v.toLowerCase() === 'choose') {
//     return undefined;
//   }

//   switch (v.toUpperCase()) {
//     case 'OPEN':
//       return ApplicationListStatus.OPEN;
//     case 'CLOSED':
//       return ApplicationListStatus.CLOSED;
//     default:
//       return undefined;
//   }
// }

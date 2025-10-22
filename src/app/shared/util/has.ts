/* 
Helper function for applications-list.ts - loadApplicationsLists()

Input: Unknown
Process: Checks if given value is empty or is kept as default 
Output: Boolean
*/

export function has(x: unknown): boolean {
  return x !== null && x !== undefined && x !== '' && x !== 'choose';
}

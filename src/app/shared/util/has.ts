/* 
Helper function for applications-list.ts - loadApplicationsLists()

Input: Unknown
Process: Checks if given value is empty or is kept as default 
Output: Boolean
*/

export function has(value: unknown): boolean {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed !== 'choose';
  }

  return value !== null && value !== undefined;
}

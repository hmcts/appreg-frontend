/**
 * Table sort helpers for server side sorting
 */

export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; direction: SortDirection };

export function getNextSortState(current: SortState, key: string): SortState {
  let direction: SortDirection = 'asc';
  if (current.key === key) {
    direction = current.direction === 'asc' ? 'desc' : 'asc';
  }
  return { key, direction };
}

export function suppressSortEvent(event: Event | null): void {
  if (!event) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function isSortActivationKey(event: KeyboardEvent): boolean {
  return event.key === 'Enter' || event.key === ' ';
}

export function ariaSortFor(
  current: SortState,
  key: string,
  fallback: 'ascending' | 'descending' | 'none' = 'none',
): 'ascending' | 'descending' | 'none' {
  if (current.key !== key || !current.direction) {
    return fallback;
  }
  return current.direction === 'asc' ? 'ascending' : 'descending';
}

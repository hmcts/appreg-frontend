/**
 * Table sort helpers for server side sorting
 */

export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; direction: SortDirection };

export function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  sort: SortState,
): T[] {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = left[sort.key];
    const rightValue = right[sort.key];

    if (leftValue === rightValue) {
      return 0;
    }
    if (leftValue === null || leftValue === undefined) {
      return 1;
    }
    if (rightValue === null || rightValue === undefined) {
      return -1;
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction;
    }

    if (typeof leftValue !== 'string' || typeof rightValue !== 'string') {
      return 0;
    }

    return (
      leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * direction
    );
  });
}

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

import { Row } from '@core-types/table/row.types';

export type ServerPaginatedSelectionPatch = {
  rows: Row[];
  totalPages: number;
  totalEntries: number;
  selectedIds: Set<string>;
  selectedRows: Row[];
};

type PageSelectionPatchInput = {
  rows: Row[];
  totalPages: number;
  totalEntries: number;
  currentSelectedIds: Set<string>;
};

export function isAllMatchingSelected(
  selectedIds: Set<string>,
  totalEntries: number,
): boolean {
  return (
    selectedIds.size > 0 &&
    totalEntries > 0 &&
    selectedIds.size === totalEntries
  );
}

export function getVisibleSelectedRows(
  rows: Row[],
  selectedIds: Set<string>,
): Row[] {
  return rows.filter((row) => {
    const id = row['id'];

    return (
      (typeof id === 'string' || typeof id === 'number') &&
      selectedIds.has(String(id))
    );
  });
}

export function buildPageSelectionPatch({
  rows,
  totalPages,
  totalEntries,
  currentSelectedIds,
}: PageSelectionPatchInput): ServerPaginatedSelectionPatch {
  const selectedIds = new Set(currentSelectedIds);

  return {
    rows,
    totalPages,
    totalEntries,
    selectedIds,
    selectedRows: getVisibleSelectedRows(rows, selectedIds),
  };
}

export function buildSelectAllMatchingPatch(
  ids: string[],
  rows: Row[],
  totalEntries: number,
): Pick<ServerPaginatedSelectionPatch, 'selectedIds' | 'selectedRows'> & {
  allMatchingSelected: boolean;
} {
  const selectedIds = new Set(ids ?? []);

  return {
    selectedIds,
    selectedRows: getVisibleSelectedRows(rows, selectedIds),
    allMatchingSelected: isAllMatchingSelected(selectedIds, totalEntries),
  };
}

import { TableColumn } from '@components/sortable-table/sortable-table.component';

export function withDisabledColumnSort(
  columns: TableColumn[],
  fields: readonly string[],
): TableColumn[] {
  if (!fields.length) {
    return columns;
  }

  const disabledFields = new Set(fields);

  return columns.map((column) =>
    disabledFields.has(column.field) ? { ...column, sortable: false } : column,
  );
}

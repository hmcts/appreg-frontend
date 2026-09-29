import { TableColumn } from '@components/sortable-table/sortable-table.component';

export function withDisabledColumnSort(
  columns: TableColumn[],
  field: string,
  disabled: boolean,
): TableColumn[] {
  if (!disabled) {
    return columns;
  }

  return columns.map((column) =>
    column.field === field ? { ...column, sortable: false } : column,
  );
}

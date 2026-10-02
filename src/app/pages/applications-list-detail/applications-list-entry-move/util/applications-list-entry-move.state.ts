import { ApplicationEntriesMoveContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { ApplicationListGetFilterDto } from '@openapi';

export interface ApplicationsListEntryMoveState {
  listId: string;

  selectedEntries: ApplicationEntriesMoveContext[];

  searchErrors: ErrorItem[];
  isLoading: boolean;
  searchDone: boolean;

  sortField: { key: string; direction: 'desc' | 'asc' };
  appliedFilters: ApplicationListGetFilterDto;
}

export const initialApplicationsListEntryMoveState: ApplicationsListEntryMoveState =
  {
    listId: '',
    selectedEntries: [],
    searchErrors: [],
    sortField: {
      key: 'date',
      direction: 'desc',
    },
    appliedFilters: {},
    isLoading: false,
    searchDone: false,
  };

// Clear all error/success/notification states
export const entryMoveClearPatch = (): Pick<
  ApplicationsListEntryMoveState,
  'searchErrors' | 'isLoading' | 'searchDone' | 'sortField' | 'appliedFilters'
> => ({
  searchErrors: [],
  isLoading: false,
  searchDone: false,
  sortField: {
    key: 'date',
    direction: 'desc',
  },
  appliedFilters: {},
});

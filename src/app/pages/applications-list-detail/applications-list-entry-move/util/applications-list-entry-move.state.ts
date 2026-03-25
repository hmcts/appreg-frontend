import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface ApplicationsListEntryMoveState {
  listId: string;
  targetListId: string;

  selectedEntries: ApplicationEntriesResultContext[];

  searchErrors: ErrorItem[];
  isLoading: boolean;
  searchDone: boolean;

  sortField: { key: string; direction: 'desc' | 'asc' };
}

export const initialApplicationsListEntryMoveState: ApplicationsListEntryMoveState =
  {
    listId: '',
    targetListId: '',
    selectedEntries: [],
    searchErrors: [],
    sortField: {
      key: 'date',
      direction: 'desc',
    },
    isLoading: false,
    searchDone: false,
  };

// Clear all error/success/notification states
export const entryMoveClearPatch = (): Pick<
  ApplicationsListEntryMoveState,
  'searchErrors' | 'isLoading' | 'searchDone' | 'sortField'
> => ({
  searchErrors: [],
  isLoading: false,
  searchDone: false,
  sortField: {
    key: 'date',
    direction: 'desc',
  },
});

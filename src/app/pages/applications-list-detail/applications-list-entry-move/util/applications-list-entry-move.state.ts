import { ApplicationEntriesResultContext } from '@components/applications-list-entry-detail/util/routing-state-util';

export interface ApplicationsListEntryMoveState {
  listId: string;
  targetListId: string;

  selectedEntries: ApplicationEntriesResultContext[];
}

export const initialApplicationsListEntryMoveState: ApplicationsListEntryMoveState =
  {
    listId: '',
    targetListId: '',

    selectedEntries: [],
  };

// Clear all error/success/notification states
// export const entryMoveClearPatch = (): Pick<
//   ApplicationsListEntryMoveState,
//   |
// > => ({

// });

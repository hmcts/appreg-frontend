import {
  clearNotificationsPatch,
  initialApplicationsListState,
} from '@components/applications-list/util/applications-list.state';

describe('applications-list.state', () => {
  it('defines initial state values', () => {
    expect(initialApplicationsListState).toEqual({
      submitted: false,
      isSearch: false,
      deleteDone: false,
      deleteInvalid: false,
      isLoading: false,
      searchErrors: [],
      errorSummary: [],
      deletingId: null,
      currentPage: 1,
      totalPages: 5,
      pageSize: 10,
      rows: [],
      sortField: {
        direction: 'desc',
        key: 'date',
      },
    });
  });

  it('clearNotificationsPatch resets notification flags', () => {
    expect(clearNotificationsPatch()).toEqual({
      deleteDone: false,
      deleteInvalid: false,
      errorSummary: [],
      searchErrors: [],
      submitted: false,
    });
  });
});

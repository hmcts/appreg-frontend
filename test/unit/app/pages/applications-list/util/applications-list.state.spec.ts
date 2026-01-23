import {
  clearNotificationsPatch,
  initialApplicationsListState,
} from '@components/applications-list/util/applications-list.state';

describe('applications-list.state', () => {
  it('defines initial state values', () => {
    expect(initialApplicationsListState).toEqual({
      isSearch: false,
      deleteDone: false,
      deleteInvalid: false,
      isLoading: false,
      searchErrors: [],
      errorSummary: [],
      deletingId: null,
    });
  });

  it('clearNotificationsPatch resets notification flags', () => {
    expect(clearNotificationsPatch()).toEqual({
      deleteDone: false,
      deleteInvalid: false,
      errorSummary: [],
      searchErrors: [],
    });
  });
});

import { initialApplicationsState } from '@components/applications/util/applications.state';
import { ApplicationListStatus, EntryGetSummaryDto } from '@openapi';
import {
  ApplicationsSearchFormValue,
  ApplicationsSearchStateService,
  DEFAULT_APPLICATIONS_SEARCH_FORM,
} from '@services/applications/applications-search-state.service';
import { ApplicationRow } from '@shared-types/applications/applications.type';

const CHANGED_APPLICANT_ORG = 'Changed Org';
const CHANGED_ENTRY_ID = 'entry-2';
const CHANGED_ENTRY_TITLE = 'Changed title';
const SAVED_APPLICANT_ORG = 'Saved Org';
const SAVED_ENTRY_ID = 'entry-1';
const SAVED_ENTRY_TITLE = 'Saved title';
const SAVED_LIST_ID = 'list-1';

function makeEntry(id: string, applicationTitle: string): EntryGetSummaryDto {
  return {
    id,
    applicationTitle,
    isFeeRequired: false,
    isResulted: false,
    status: 'OPEN' as ApplicationListStatus,
  };
}

function makeSelectedRow(
  id: string,
  applicationListId: string,
): ApplicationRow {
  return {
    id,
    date: '',
    applicant: '',
    respondent: '',
    title: '',
    fee: '',
    resulted: '',
    status: '',
    applicationListId,
  };
}

describe('ApplicationsSearchStateService', () => {
  let service: ApplicationsSearchStateService;

  beforeEach(() => {
    service = new ApplicationsSearchStateService();
  });

  it('starts with the default search form and applications state', () => {
    expect(service.state()).toEqual({
      form: DEFAULT_APPLICATIONS_SEARCH_FORM,
      state: initialApplicationsState,
    });
  });

  it('saves a defensive copy of the form and applications state', () => {
    const form: ApplicationsSearchFormValue = {
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: SAVED_APPLICANT_ORG,
      status: 'open',
    };
    const selectedIds = new Set([SAVED_ENTRY_ID]);
    const state = {
      ...initialApplicationsState,
      isLoading: true,
      isSelectingAll: true,
      isSearch: true,
      rows: [makeEntry(SAVED_ENTRY_ID, SAVED_ENTRY_TITLE)],
      searchErrors: [{ id: 'applicantOrg', text: 'Invalid applicant' }],
      errorSummary: [{ text: 'Search failed' }],
      sortField: { key: 'title', direction: 'asc' as const },
      selectedIds,
      selectedRows: [makeSelectedRow(SAVED_ENTRY_ID, SAVED_LIST_ID)],
      getFilters: {
        applicantOrganisation: SAVED_APPLICANT_ORG,
      },
    };

    service.save(form, state);
    form.applicantOrg = CHANGED_APPLICANT_ORG;
    state.rows.push(makeEntry(CHANGED_ENTRY_ID, CHANGED_ENTRY_TITLE));
    state.searchErrors.push({ id: 'status', text: 'Invalid status' });
    state.errorSummary.push({ text: 'Changed error' });
    state.selectedRows.push(makeSelectedRow(CHANGED_ENTRY_ID, 'list-2'));
    selectedIds.add(CHANGED_ENTRY_ID);
    state.sortField.key = 'date';
    state.getFilters.applicantOrganisation = CHANGED_APPLICANT_ORG;

    const snapshot = service.state();

    expect(snapshot.form.applicantOrg).toBe(SAVED_APPLICANT_ORG);
    expect(snapshot.state.isLoading).toBe(false);
    expect(snapshot.state.isSelectingAll).toBe(false);
    expect(snapshot.state.rows).toEqual([
      makeEntry(SAVED_ENTRY_ID, SAVED_ENTRY_TITLE),
    ]);
    expect(snapshot.state.searchErrors).toEqual([
      { id: 'applicantOrg', text: 'Invalid applicant' },
    ]);
    expect(snapshot.state.errorSummary).toEqual([{ text: 'Search failed' }]);
    expect(snapshot.state.sortField).toEqual({
      key: 'title',
      direction: 'asc',
    });
    expect(snapshot.state.selectedIds).toEqual(new Set([SAVED_ENTRY_ID]));
    expect(snapshot.state.selectedRows).toEqual([
      makeSelectedRow(SAVED_ENTRY_ID, SAVED_LIST_ID),
    ]);
    expect(snapshot.state.getFilters).toEqual({
      applicantOrganisation: SAVED_APPLICANT_ORG,
    });
  });

  it('returns a defensive copy of the saved snapshot', () => {
    service.save(
      {
        ...DEFAULT_APPLICATIONS_SEARCH_FORM,
        applicantOrg: SAVED_APPLICANT_ORG,
      },
      {
        ...initialApplicationsState,
        rows: [makeEntry(SAVED_ENTRY_ID, SAVED_ENTRY_TITLE)],
        selectedIds: new Set([SAVED_ENTRY_ID]),
      },
    );

    const snapshot = service.state();
    snapshot.form.applicantOrg = CHANGED_APPLICANT_ORG;
    snapshot.state.rows.push(makeEntry(CHANGED_ENTRY_ID, CHANGED_ENTRY_TITLE));
    snapshot.state.selectedIds.add(CHANGED_ENTRY_ID);

    const freshSnapshot = service.state();

    expect(freshSnapshot.form.applicantOrg).toBe(SAVED_APPLICANT_ORG);
    expect(freshSnapshot.state.rows).toEqual([
      makeEntry(SAVED_ENTRY_ID, SAVED_ENTRY_TITLE),
    ]);
    expect(freshSnapshot.state.selectedIds).toEqual(new Set([SAVED_ENTRY_ID]));
  });

  it('keeps the form and state advanced-search flags in sync', () => {
    service.save(
      {
        ...DEFAULT_APPLICATIONS_SEARCH_FORM,
        applicantOrg: SAVED_APPLICANT_ORG,
      },
      {
        ...initialApplicationsState,
        isSearch: true,
      },
    );

    service.setAdvancedSearch(true);

    expect(service.state().form).toEqual({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: SAVED_APPLICANT_ORG,
      isAdvancedSearch: true,
    });
    expect(service.state().state).toEqual({
      ...initialApplicationsState,
      isSearch: true,
      isAdvancedSearch: true,
    });
  });

  it('resets to a fresh default snapshot', () => {
    service.save(
      {
        ...DEFAULT_APPLICATIONS_SEARCH_FORM,
        applicantOrg: SAVED_APPLICANT_ORG,
      },
      {
        ...initialApplicationsState,
        isSearch: true,
        rows: [makeEntry(SAVED_ENTRY_ID, SAVED_ENTRY_TITLE)],
      },
    );

    service.reset();

    expect(service.state()).toEqual({
      form: DEFAULT_APPLICATIONS_SEARCH_FORM,
      state: initialApplicationsState,
    });
  });
});

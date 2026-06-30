import { TestBed } from '@angular/core/testing';

import {
  ApplicationsSearchStateService,
  DEFAULT_APPLICATIONS_SEARCH_STATE,
} from '@services/applications/applications-search-state.service';

describe('ApplicationsSearchStateService', () => {
  let service: ApplicationsSearchStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationsSearchStateService);
    service.reset();
  });

  it('returns the default search state', () => {
    expect(service.state()).toEqual(DEFAULT_APPLICATIONS_SEARCH_STATE);
  });

  it('clones state on setState and read', () => {
    const state = {
      hasSearched: true,
      currentPage: 2,
      pageSize: 25,
      sortField: { key: 'title', direction: 'asc' as const },
      appliedFilters: {
        applicantOrganisation: 'Applicant Org',
      },
    };

    service.setState(state);

    state.sortField.key = 'date';
    state.appliedFilters.applicantOrganisation = 'Changed Org';

    const restored = service.state();

    expect(restored).toEqual({
      hasSearched: true,
      currentPage: 2,
      pageSize: 25,
      sortField: { key: 'title', direction: 'asc' },
      appliedFilters: {
        applicantOrganisation: 'Applicant Org',
      },
    });
  });

  it('patches state without mutating nested values', () => {
    service.patchState({
      hasSearched: true,
      sortField: { key: 'status', direction: 'desc' },
      appliedFilters: { respondentSurname: 'Smith' },
    });

    expect(service.state()).toEqual({
      ...DEFAULT_APPLICATIONS_SEARCH_STATE,
      hasSearched: true,
      sortField: { key: 'status', direction: 'desc' },
      appliedFilters: { respondentSurname: 'Smith' },
    });
  });

  it('resets to the default search state', () => {
    service.setState({
      hasSearched: true,
      currentPage: 3,
      pageSize: 50,
      sortField: { key: 'applicant', direction: 'asc' },
      appliedFilters: { applicantOrganisation: 'Applicant Org' },
    });

    service.reset();

    expect(service.state()).toEqual(DEFAULT_APPLICATIONS_SEARCH_STATE);
  });
});

import { TestBed } from '@angular/core/testing';

import { StandardApplicantsSearchStateService } from '@services/standard-applicants/standard-applicants-search-state.service';

describe('StandardApplicantsSearchStateServiceService', () => {
  let service: StandardApplicantsSearchStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StandardApplicantsSearchStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the default state', () => {
    expect(service.state()).toEqual({
      hasSearched: false,
      currentPage: 0,
      pageSize: 10,
      sortField: { key: 'code', direction: 'asc' },
      appliedFilters: {},
    });
  });

  it('clones state on setState and read', () => {
    const state = {
      hasSearched: true,
      currentPage: 2,
      pageSize: 10,
      sortField: { key: 'name', direction: 'desc' as const },
      appliedFilters: {
        code: 'SA01',
        name: 'Applicant Org',
      },
    };

    service.setState(state);

    state.sortField.key = 'code';
    state.appliedFilters.code = 'changed';

    const restored = service.state();

    expect(restored).toEqual({
      hasSearched: true,
      currentPage: 2,
      pageSize: 10,
      sortField: { key: 'name', direction: 'desc' },
      appliedFilters: {
        code: 'SA01',
        name: 'Applicant Org',
      },
    });
  });

  it('patches state without mutating nested values', () => {
    service.patchState({
      hasSearched: true,
      sortField: { key: 'name', direction: 'desc' },
      appliedFilters: { name: 'Applicant Org' },
    });

    expect(service.state()).toEqual({
      hasSearched: true,
      currentPage: 0,
      pageSize: 10,
      sortField: { key: 'name', direction: 'desc' },
      appliedFilters: { name: 'Applicant Org' },
    });
  });
});

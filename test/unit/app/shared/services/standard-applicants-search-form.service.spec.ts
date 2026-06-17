import { TestBed } from '@angular/core/testing';

import { StandardApplicantsSearchFormService } from '@services/standard-applicants/standard-applicants-search-form.service';

describe('StandardApplicantsSearchFormService', () => {
  let service: StandardApplicantsSearchFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StandardApplicantsSearchFormService);
  });

  it('returns the default form state', () => {
    expect(service.state()).toEqual({
      code: '',
      name: '',
    });
  });

  it('sets form state', () => {
    service.setState({
      code: 'SA01',
      name: 'Applicant Org',
    });

    expect(service.state()).toEqual({
      code: 'SA01',
      name: 'Applicant Org',
    });
  });

  it('patches form state', () => {
    service.patchState({
      name: 'Applicant Org',
    });

    expect(service.state()).toEqual({
      code: '',
      name: 'Applicant Org',
    });
  });
});

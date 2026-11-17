import { TestBed } from '@angular/core/testing';

import {
  ApplicationsSearchFormService,
  ApplicationsSearchFormValue,
  DEFAULT_APPLICATIONS_SEARCH_FORM,
} from '@services/applications/applications-search-form.service';

describe('ApplicationsSearchFormService', () => {
  let service: ApplicationsSearchFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationsSearchFormService);
    service.reset();
  });

  it('returns the default form state', () => {
    expect(service.state()).toEqual(DEFAULT_APPLICATIONS_SEARCH_FORM);
  });

  it('does not share the code lists with the value it was given', () => {
    const next: ApplicationsSearchFormValue = {
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicationCodes: ['AP99001'],
      resultCodes: ['RC9901'],
    };

    service.setState(next);
    next.applicationCodes.push('SW99002');
    next.resultCodes.push('RC9902');

    expect(service.state().applicationCodes).toEqual(['AP99001']);
    expect(service.state().resultCodes).toEqual(['RC9901']);
  });

  it('does not share the code lists with the value it returns', () => {
    service.patchState({
      applicationCodes: ['AP99001'],
      resultCodes: ['RC9901'],
    });

    const read = service.state();
    read.applicationCodes.push('SW99002');
    read.resultCodes.push('RC9902');

    expect(service.state().applicationCodes).toEqual(['AP99001']);
    expect(service.state().resultCodes).toEqual(['RC9901']);
  });

  it('never returns the default lists, so changing a value read cannot change the defaults', () => {
    const read = service.state();

    expect(read.applicationCodes).not.toBe(
      DEFAULT_APPLICATIONS_SEARCH_FORM.applicationCodes,
    );
    expect(read.resultCodes).not.toBe(
      DEFAULT_APPLICATIONS_SEARCH_FORM.resultCodes,
    );
  });

  it('sets form state', () => {
    const next: ApplicationsSearchFormValue = {
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: 'Applicant Org',
      status: 'open',
      isAdvancedSearch: true,
    };

    service.setState(next);

    expect(service.state()).toEqual(next);
  });

  it('patches form state without clearing other fields', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: 'Applicant Org',
      respondentSurname: 'Smith',
    });

    service.patchState({
      isAdvancedSearch: true,
    });

    expect(service.state()).toEqual({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: 'Applicant Org',
      respondentSurname: 'Smith',
      isAdvancedSearch: true,
    });
  });

  it('resets to the default form state', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantOrg: 'Applicant Org',
    });

    service.reset();

    expect(service.state()).toEqual(DEFAULT_APPLICATIONS_SEARCH_FORM);
  });
});

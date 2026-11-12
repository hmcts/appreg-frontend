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

  it('defaults the applicant and respondent names to empty strings', () => {
    expect(DEFAULT_APPLICATIONS_SEARCH_FORM).toEqual(
      expect.objectContaining({ applicantName: '', respondentName: '' }),
    );
    expect(service.state().applicantName).toBe('');
    expect(service.state().respondentName).toBe('');
  });

  it('resets applicant and respondent names to empty strings', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicantName: 'Synthetic Applicant Ltd',
      respondentName: 'Synthetic Respondent',
    });

    service.reset();

    expect(service.state().applicantName).toBe('');
    expect(service.state().respondentName).toBe('');
  });

  it('defaults the list date range to null', () => {
    expect(DEFAULT_APPLICATIONS_SEARCH_FORM).toEqual(
      expect.objectContaining({ dateFrom: null, dateTo: null }),
    );
    expect(service.state().dateFrom).toBeNull();
    expect(service.state().dateTo).toBeNull();
  });

  it('resets the list date range to null', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
    });

    service.reset();

    expect(service.state().dateFrom).toBeNull();
    expect(service.state().dateTo).toBeNull();
  });

  it('defaults the application codes and result codes to empty lists', () => {
    expect(DEFAULT_APPLICATIONS_SEARCH_FORM).toEqual(
      expect.objectContaining({ applicationCodes: [], resultCodes: [] }),
    );
    expect(service.state().applicationCodes).toEqual([]);
    expect(service.state().resultCodes).toEqual([]);
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

  it('resets the code lists to empty lists', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      applicationCodes: ['AP99001'],
      resultCodes: ['RC9901'],
    });

    service.reset();

    expect(service.state().applicationCodes).toEqual([]);
    expect(service.state().resultCodes).toEqual([]);
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

  it('defaults Other courts to an empty list', () => {
    expect(DEFAULT_APPLICATIONS_SEARCH_FORM).toEqual(
      expect.objectContaining({ court: '', courtCodes: [] }),
    );
    expect(service.state().courtCodes).toEqual([]);
    expect(service.state().courtCodes).not.toBe(
      DEFAULT_APPLICATIONS_SEARCH_FORM.courtCodes,
    );
  });

  it('does not share Other courts with the value it was given or returns', () => {
    const next: ApplicationsSearchFormValue = {
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      courtCodes: ['SYN001'],
    };

    service.setState(next);
    next.courtCodes.push('SYN002');
    service.state().courtCodes.push('SYN003');

    expect(service.state().courtCodes).toEqual(['SYN001']);
  });

  it('does not share Other courts with a patch', () => {
    const courtCodes = ['SYN001'];

    service.patchState({ courtCodes });
    courtCodes.push('SYN002');

    expect(service.state().courtCodes).toEqual(['SYN001']);
  });

  it('resets Other courts to an empty list', () => {
    service.setState({
      ...DEFAULT_APPLICATIONS_SEARCH_FORM,
      courtCodes: ['SYN001', 'SYN002'],
    });

    service.reset();

    expect(service.state().courtCodes).toEqual([]);
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

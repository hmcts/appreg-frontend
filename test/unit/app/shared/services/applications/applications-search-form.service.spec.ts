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

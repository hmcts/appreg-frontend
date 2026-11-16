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

  it('does not share Other courts with a patch', () => {
    const courtCodes = ['SYN001'];

    service.patchState({ courtCodes });
    courtCodes.push('SYN002');

    expect(service.state().courtCodes).toEqual(['SYN001']);
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

  describe('Other courts labels', () => {
    it('has no labels by default', () => {
      expect(service.courtChipLabels()).toEqual({});
    });

    it('saves the labels of the given Other courts codes only', () => {
      service.setCourtChipLabels(
        {
          SYN900: 'Synthetic Closed Court',
          SYN901: 'Synthetic Removed Court',
          SYN002: 'Synthetic Court Two',
        },
        ['SYN900', 'SYN002'],
      );

      expect(service.courtChipLabels()).toEqual({
        SYN900: 'Synthetic Closed Court',
        SYN002: 'Synthetic Court Two',
      });
    });

    it('replaces the labels it saved before', () => {
      service.setCourtChipLabels({ SYN900: 'Synthetic Closed Court' }, [
        'SYN900',
      ]);

      service.setCourtChipLabels({ SYN901: 'Synthetic Other Court' }, [
        'SYN901',
      ]);

      expect(service.courtChipLabels()).toEqual({
        SYN901: 'Synthetic Other Court',
      });
    });

    it('does not share the labels with the value it was given or returns', () => {
      const labels: Record<string, string> = {
        SYN900: 'Synthetic Closed Court',
      };

      service.setCourtChipLabels(labels, ['SYN900', 'SYN901']);
      labels['SYN901'] = 'Synthetic Other Court';
      service.courtChipLabels()['SYN902'] = 'Synthetic Third Court';

      expect(service.courtChipLabels()).toEqual({
        SYN900: 'Synthetic Closed Court',
      });
    });

    it('clears the labels on reset', () => {
      service.setCourtChipLabels({ SYN900: 'Synthetic Closed Court' }, [
        'SYN900',
      ]);

      service.reset();

      expect(service.courtChipLabels()).toEqual({});
    });

    it('keeps the labels when the form state is set or patched', () => {
      service.setCourtChipLabels({ SYN900: 'Synthetic Closed Court' }, [
        'SYN900',
      ]);

      service.setState({
        ...DEFAULT_APPLICATIONS_SEARCH_FORM,
        courtCodes: ['SYN900'],
      });
      service.patchState({ isAdvancedSearch: true });

      expect(service.courtChipLabels()).toEqual({
        SYN900: 'Synthetic Closed Court',
      });
    });
  });
});

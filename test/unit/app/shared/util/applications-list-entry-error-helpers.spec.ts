import { FormControl, FormGroup } from '@angular/forms';

import type { ErrorItem } from '@components/error-summary/error-summary.component';
import { buildRespondentErrors } from '@util/applications-list-entry-error-helpers';
import { buildFormErrorSummary } from '@util/error-summary';

jest.mock('@util/error-summary', () => ({
  buildFormErrorSummary: jest.fn(),
}));

describe('buildRespondentErrors', () => {
  const buildFormErrorSummaryMock = jest.mocked(buildFormErrorSummary);

  const errorMessages = {};
  const respondentPersonHrefs = { a: '#a' };
  const respondentOrganisationHrefs = { b: '#b' };
  const respondentBulkHrefs = { numberOfRespondents: '#numberOfRespondents' };

  let respondentPersonForm: FormGroup;
  let respondentOrganisationForm: FormGroup;
  let respondentBulkControl: FormControl<number | null>;

  beforeEach(() => {
    jest.clearAllMocks();

    respondentPersonForm = new FormGroup({
      firstName: new FormControl<string | null>(null),
    });

    respondentOrganisationForm = new FormGroup({
      organisationName: new FormControl<string | null>(null),
    });

    respondentBulkControl = new FormControl<number | null>(null);

    buildFormErrorSummaryMock.mockReturnValue([
      { text: 'x', href: '#x' } as ErrorItem,
    ]);
  });

  it('returns person errors and triggers validation when respondentEntryType is person', () => {
    const markAllAsTouchedSpy = jest.spyOn(
      respondentPersonForm,
      'markAllAsTouched',
    );
    const updateValueAndValiditySpy = jest.spyOn(
      respondentPersonForm,
      'updateValueAndValidity',
    );

    const result = buildRespondentErrors({
      respondentEntryType: 'person',
      respondentPersonForm,
      respondentOrganisationForm,
      respondentBulkControl,
      errorMessages,
      respondentPersonHrefs,
      respondentOrganisationHrefs,
      respondentBulkHrefs,
    });

    expect(markAllAsTouchedSpy).toHaveBeenCalledTimes(1);
    expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
      emitEvent: false,
    });

    expect(buildFormErrorSummaryMock).toHaveBeenCalledWith(
      respondentPersonForm,
      errorMessages,
      {
        hrefs: respondentPersonHrefs,
      },
    );

    expect(result).toEqual([{ text: 'x', href: '#x' } as ErrorItem]);
  });

  it('returns organisation errors and triggers validation when respondentEntryType is organisation', () => {
    const markAllAsTouchedSpy = jest.spyOn(
      respondentOrganisationForm,
      'markAllAsTouched',
    );
    const updateValueAndValiditySpy = jest.spyOn(
      respondentOrganisationForm,
      'updateValueAndValidity',
    );

    const result = buildRespondentErrors({
      respondentEntryType: 'organisation',
      respondentPersonForm,
      respondentOrganisationForm,
      respondentBulkControl,
      errorMessages,
      respondentPersonHrefs,
      respondentOrganisationHrefs,
      respondentBulkHrefs,
    });

    expect(markAllAsTouchedSpy).toHaveBeenCalledTimes(1);
    expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
      emitEvent: false,
    });

    expect(buildFormErrorSummaryMock).toHaveBeenCalledWith(
      respondentOrganisationForm,
      errorMessages,
      {
        hrefs: respondentOrganisationHrefs,
      },
    );

    expect(result).toEqual([{ text: 'x', href: '#x' } as ErrorItem]);
  });

  it('returns bulk errors and triggers validation when respondentEntryType is bulk', () => {
    const markAsTouchedSpy = jest.spyOn(respondentBulkControl, 'markAsTouched');
    const updateValueAndValiditySpy = jest.spyOn(
      respondentBulkControl,
      'updateValueAndValidity',
    );

    const result = buildRespondentErrors({
      respondentEntryType: 'bulk',
      respondentPersonForm,
      respondentOrganisationForm,
      respondentBulkControl,
      errorMessages,
      respondentPersonHrefs,
      respondentOrganisationHrefs,
      respondentBulkHrefs,
    });

    expect(markAsTouchedSpy).toHaveBeenCalledTimes(1);
    expect(updateValueAndValiditySpy).toHaveBeenCalledWith({
      emitEvent: false,
    });

    // Called with a wrapper FormGroup containing the bulk control as numberOfRespondents
    const [passedControl, passedMessages, passedOpts] =
      buildFormErrorSummaryMock.mock.calls[0];

    expect(passedControl).toBeInstanceOf(FormGroup);
    const passedGroup = passedControl;

    expect(passedGroup.contains('numberOfRespondents')).toBe(true);
    expect(passedGroup.controls['numberOfRespondents']).toBe(
      respondentBulkControl,
    );

    expect(passedMessages).toBe(errorMessages);
    expect(passedOpts).toEqual({ hrefs: respondentBulkHrefs });

    expect(result).toEqual([{ text: 'x', href: '#x' } as ErrorItem]);
  });

  it('returns empty array when respondentEntryType is null/undefined', () => {
    const result1 = buildRespondentErrors({
      respondentEntryType: null,
      respondentPersonForm,
      respondentOrganisationForm,
      respondentBulkControl,
      errorMessages,
      respondentPersonHrefs,
      respondentOrganisationHrefs,
      respondentBulkHrefs,
    });

    const result2 = buildRespondentErrors({
      respondentEntryType: undefined,
      respondentPersonForm,
      respondentOrganisationForm,
      respondentBulkControl,
      errorMessages,
      respondentPersonHrefs,
      respondentOrganisationHrefs,
      respondentBulkHrefs,
    });

    expect(result1).toEqual([]);
    expect(result2).toEqual([]);
    expect(buildFormErrorSummaryMock).not.toHaveBeenCalled();
  });
});

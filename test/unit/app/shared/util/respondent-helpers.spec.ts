import { FormControl, FormGroup } from '@angular/forms';

import { respondentFormsHaveAnyValue } from '@util/respondent-helpers';

describe('respondentFormsHaveAnyValue', () => {
  it('returns false when all controls are null/undefined', () => {
    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm: undefined,
        respondentOrganisationForm: null,
      }),
    ).toBe(false);
  });

  it('returns true when numberOfRespondents has a non-zero number', () => {
    const numberOfRespondents = new FormControl<number | null>(2);

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents,
        respondentPersonForm: null,
        respondentOrganisationForm: null,
      }),
    ).toBe(true);
  });

  it('returns false when numberOfRespondents is 0', () => {
    const numberOfRespondents = new FormControl<number | null>(0);

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents,
        respondentPersonForm: null,
        respondentOrganisationForm: null,
      }),
    ).toBe(false);
  });

  it('returns true when person form contains a non-empty trimmed string', () => {
    const respondentPersonForm = new FormGroup({
      firstName: new FormControl<string | null>('  Jane  '),
      lastName: new FormControl<string | null>(''),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm,
        respondentOrganisationForm: null,
      }),
    ).toBe(true);
  });

  it('returns false when person form contains only empty/whitespace strings', () => {
    const respondentPersonForm = new FormGroup({
      firstName: new FormControl<string | null>('   '),
      lastName: new FormControl<string | null>(''),
      middleName: new FormControl<string | null>(null),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm,
        respondentOrganisationForm: null,
      }),
    ).toBe(false);
  });

  it('returns true when organisation form contains a non-zero number nested in an object', () => {
    const respondentOrganisationForm = new FormGroup({
      address: new FormGroup({
        buildingNumber: new FormControl<number | null>(10),
        postcode: new FormControl<string | null>(''),
      }),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm: null,
        respondentOrganisationForm,
      }),
    ).toBe(true);
  });

  it('returns false when organisation form contains only zeros and empty strings', () => {
    const respondentOrganisationForm = new FormGroup({
      organisationName: new FormControl<string | null>(''),
      address: new FormGroup({
        buildingNumber: new FormControl<number | null>(0),
        line1: new FormControl<string | null>('   '),
      }),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm: null,
        respondentOrganisationForm,
      }),
    ).toBe(false);
  });

  it('returns true when there is a meaningful value inside an array', () => {
    const respondentPersonForm = new FormGroup({
      aliases: new FormControl<unknown>(['', '   ', 'Alias']),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm,
        respondentOrganisationForm: null,
      }),
    ).toBe(true);
  });

  it('returns false when arrays contain no meaningful values', () => {
    const respondentPersonForm = new FormGroup({
      aliases: new FormControl<unknown>(['', '   ', null, 0]),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm,
        respondentOrganisationForm: null,
      }),
    ).toBe(false);
  });

  it('treats booleans as no value (returns false if only boolean fields are set)', () => {
    const respondentOrganisationForm = new FormGroup({
      isCompany: new FormControl<boolean>(true),
      isActive: new FormControl<boolean>(false),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents: null,
        respondentPersonForm: null,
        respondentOrganisationForm,
      }),
    ).toBe(false);
  });

  it('returns true if any of the three controls contains a meaningful value', () => {
    const numberOfRespondents = new FormControl<number | null>(0);
    const respondentPersonForm = new FormGroup({
      firstName: new FormControl<string | null>(''),
    });
    const respondentOrganisationForm = new FormGroup({
      organisationName: new FormControl<string | null>('Acme Ltd'),
    });

    expect(
      respondentFormsHaveAnyValue({
        numberOfRespondents,
        respondentPersonForm,
        respondentOrganisationForm,
      }),
    ).toBe(true);
  });
});

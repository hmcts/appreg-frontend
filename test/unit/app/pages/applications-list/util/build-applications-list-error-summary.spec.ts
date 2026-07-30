import { FormControl, FormGroup } from '@angular/forms';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@constants/applications-list/applications-list.constants';
import {
  buildApplicationsListErrorSummary,
  buildErrorSummary,
} from '@services/applications-list/build-applications-list-error-summary';

describe('buildApplicationsListErrorSummary', () => {
  it('uses the applications list default time href', () => {
    const form = new FormGroup({
      time: new FormControl<string | null>(null),
    });
    form.controls.time.setErrors({ required: true });

    const result = buildApplicationsListErrorSummary(form, {
      time: {
        required: 'Enter valid hours and minutes',
      },
    });

    expect(result).toEqual([
      {
        id: 'time',
        href: '#time-hours',
        text: 'Enter valid hours and minutes',
      },
    ]);
  });

  it('allows callers to override the default time href', () => {
    const form = new FormGroup({
      time: new FormControl<string | null>(null),
    });
    form.controls.time.setErrors({ required: true });

    const result = buildApplicationsListErrorSummary(
      form,
      {
        time: {
          required: 'Enter valid hours and minutes',
        },
      },
      {
        hrefs: {
          time: '#custom-time',
        },
      },
    );

    expect(result).toEqual([
      {
        id: 'time',
        href: '#custom-time',
        text: 'Enter valid hours and minutes',
      },
    ]);
  });
});

describe('buildErrorSummary', () => {
  const messages = {
    respondentPostcode: {
      maxlength: 'Postcode must be 8 characters or fewer',
    },
  };

  it('returns mapped control errors when the form has no group-level error', () => {
    const form = new FormGroup({
      respondentPostcode: new FormControl<string>('AB12 3CDE'),
    });
    form.controls.respondentPostcode.setErrors({ maxlength: true });

    expect(buildErrorSummary(form, messages)).toEqual([
      {
        id: 'respondentPostcode',
        href: '#respondentPostcode',
        text: 'Postcode must be 8 characters or fewer',
      },
    ]);
  });

  it('returns the search-criteria error if no other errors exist', () => {
    const form = new FormGroup({
      respondentPostcode: new FormControl<string>('AB12 3CD'),
    });
    form.setErrors({ atLeastOneRequired: true });

    expect(buildErrorSummary(form, messages)).toEqual([
      {
        id: 'search-error',
        href: '#search',
        text: APPLICATIONS_LIST_ERROR_MESSAGES.invalidSearchCriteria,
      },
    ]);

    expect(buildErrorSummary(form, messages)).toHaveLength(1);
  });
});

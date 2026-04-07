import { FormControl, FormGroup } from '@angular/forms';

import { buildApplicationsListErrorSummary } from '@services/applications-list/build-applications-list-error-summary';

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

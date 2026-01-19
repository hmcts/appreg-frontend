import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';
import { ApplicationsListFormControls } from '@shared-types/applications-list/applications-list-form';

type BuildOptions = {
  status: string | null;
  placeUpdateOnChange?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ApplicationsListFormService {
  createSearchForm(): FormGroup<ApplicationsListFormControls> {
    return new FormGroup(this.buildControls({ status: null }));
  }

  createCreateForm(): FormGroup<ApplicationsListFormControls> {
    return new FormGroup(
      this.buildControls({ status: 'open', placeUpdateOnChange: true }),
      { updateOn: 'submit' },
    );
  }

  private buildControls(opts: BuildOptions): ApplicationsListFormControls {
    const placeOpts = opts.placeUpdateOnChange
      ? { updateOn: 'change' as const }
      : undefined;

    return {
      date: new FormControl<string | null>(null),
      time: new FormControl<Duration | null>(null),
      description: new FormControl<string>('', { nonNullable: true }),
      status: new FormControl<string | null>(opts.status),
      court: new FormControl<string>('', { nonNullable: true, ...placeOpts }),
      location: new FormControl<string>('', {
        nonNullable: true,
        ...placeOpts,
      }),
      cja: new FormControl<string>('', { nonNullable: true, ...placeOpts }),
    };
  }
}

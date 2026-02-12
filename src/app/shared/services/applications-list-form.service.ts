import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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
    return new FormGroup(this.buildControlsForCreate(), { updateOn: 'submit' });
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

  private buildControlsForCreate(): ApplicationsListFormControls {
    return {
      date: new FormControl<string | null>(null, {
        validators: [(control) => Validators.required(control)],
      }),
      time: new FormControl<Duration | null>(null, {
        validators: [(control) => Validators.required(control)],
      }),
      description: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          (control) => Validators.required(control),
          (control) => Validators.maxLength(200)(control),
        ],
      }),
      status: new FormControl<string | null>('open'),
      court: new FormControl<string>('', {
        nonNullable: true,
        validators: [(control) => Validators.maxLength(50)(control)],
        updateOn: 'change',
      }),
      location: new FormControl<string>('', {
        nonNullable: true,
        validators: [(control) => Validators.maxLength(200)(control)],
        updateOn: 'change',
      }),
      cja: new FormControl<string>('', {
        nonNullable: true,
        validators: [(control) => Validators.maxLength(50)(control)],
        updateOn: 'change',
      }),
    };
  }
}

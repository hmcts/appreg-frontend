import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';
import {
  ApplicationsListFormControls,
  ApplicationsListUpdateFormControls,
} from '@shared-types/applications-list/applications-list-form';

type BuildOptions = {
  mode: 'search' | 'create' | 'update';
  placeUpdateOnChange?: boolean;
};

@Injectable({ providedIn: 'root' })
export class ApplicationsListFormService {
  createSearchForm(): FormGroup<ApplicationsListFormControls> {
    return new FormGroup(this.buildControls({ mode: 'search' }));
  }

  createCreateForm(): FormGroup<ApplicationsListFormControls> {
    return new FormGroup(this.buildControls({ mode: 'create' }), {
      updateOn: 'submit',
    });
  }

  createUpdateForm(): FormGroup<ApplicationsListUpdateFormControls> {
    return new FormGroup(
      {
        ...this.buildControls({ mode: 'update' }),
        duration: new FormControl<Duration | null>(null),
      },
      { updateOn: 'submit' },
    );
  }

  private buildControls(opts: BuildOptions): ApplicationsListFormControls {
    if (opts.mode === 'search') {
      // keep search loose
      const placeOpts = opts.placeUpdateOnChange
        ? { updateOn: 'change' as const }
        : undefined;

      return {
        date: new FormControl<string | null>(null),
        time: new FormControl<Duration | null>(null),
        description: new FormControl<string>('', { nonNullable: true }),
        status: new FormControl<string | null>(null),
        court: new FormControl<string>('', { nonNullable: true, ...placeOpts }),
        location: new FormControl<string>('', {
          nonNullable: true,
          ...placeOpts,
        }),
        cja: new FormControl<string>('', { nonNullable: true, ...placeOpts }),
      };
    }

    // shared create/update rules
    return {
      date: new FormControl<string | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      time: new FormControl<Duration | null>(null, {
        validators: [(c) => Validators.required(c)],
      }),
      description: new FormControl<string>('', {
        nonNullable: true,
        validators: [(c) => Validators.required(c), Validators.maxLength(200)],
      }),
      status: new FormControl<string | null>(
        opts.mode === 'create' ? 'open' : null,
        { validators: [(c) => Validators.required(c)] },
      ),
      court: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(50)],
        updateOn: 'change',
      }),
      location: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(200)],
        updateOn: 'change',
      }),
      cja: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(50)],
        updateOn: 'change',
      }),
    };
  }
}

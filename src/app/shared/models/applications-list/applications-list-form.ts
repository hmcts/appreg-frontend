import { FormControl } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';

export type ApplicationsListFormControls = {
  date: FormControl<string | null>;
  time: FormControl<Duration | null>;
  description: FormControl<string | null>;
  status: FormControl<string | null>;
  court: FormControl<string>;
  location: FormControl<string>;
  cja: FormControl<string>;
};

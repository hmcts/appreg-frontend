import { FormControl } from '@angular/forms';

import { Duration } from '@components/duration-input/duration-input.component';
import { ApplicationListUpdateDto } from '@openapi';
import { ApplicationListRow } from '@util/types/application-list/types';

export type ApplicationsListFormControls = {
  date: FormControl<string | null>;
  time: FormControl<Duration | null>;
  description: FormControl<string | null>;
  status: FormControl<string | null>;
  court: FormControl<string>;
  location: FormControl<string>;
  cja: FormControl<string>;
};

export type ApplicationsListUpdateFormControls =
  ApplicationsListFormControls & {
    duration: FormControl<Duration | null>;
  };

export type ApplicationsListFormMode = 'search' | 'create' | 'update';

export type AppListNavState = { listRow?: ApplicationListRow, closeRequest?: AppListCloseRequest};

export type AppListCloseRequest = {
  id: string;
  payload: ApplicationListUpdateDto;
  etag: string | null;
};

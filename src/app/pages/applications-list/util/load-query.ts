/* 
Helper function for applications-list.ts - loadApplicationsLists()
Create a query based on user filter if any filters are populated

Input: FormGroup
Process: creates a set that is populated with the key value or null/undefined
Output: ApplicationListGetFilterDto (OpenAPI generated model based on spec)
*/

import { FormGroup } from '@angular/forms';

import { ApplicationListGetFilterDto } from '../../../../generated/openapi';
import { Duration } from '../../../shared/components/duration-input/duration-input.component';
import { toTimeString } from '../../../shared/util/time-helpers';
import { toStatus } from '../../../shared/util/to-status';

export function loadQuery(form: FormGroup): ApplicationListGetFilterDto {
  const raw = form.getRawValue() as {
    date?: string | null;
    time?: Duration | null;
    description?: string | null;
    status?: string | null;
    court?: string | null;
    location?: string | null;
    cja?: string | null;
  };

  const query: Partial<ApplicationListGetFilterDto> = {};

  const set = <K extends keyof ApplicationListGetFilterDto>(
    k: K,
    v: ApplicationListGetFilterDto[K] | undefined,
  ) => {
    if (v !== undefined && v !== null && v !== '') {
      query[k] = v;
    }
  };

  set('date', raw.date || undefined);
  set('time', toTimeString(raw.time));
  set('description', raw.description || undefined);
  set('status', toStatus(raw.status));
  set('courtLocationCode', raw.court || undefined);
  set('otherLocationDescription', raw.location || undefined);
  set('cjaCode', raw.cja || undefined);

  return query;
}

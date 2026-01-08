/* Build payload
   Used in applications-list-create & applications-list-detail
*/
import type { ApplicationListStatus } from '../../../generated/openapi';

import { requireStatus } from './application-status-helpers';
import { has } from './has';
import { requireTime } from './time-helpers';
import type { NormalizedPayload } from './types/application-list/types';

import { FormRaw } from '@core-types/forms/forms.types';

export function buildNormalizedPayload(
  raw: FormRaw<ApplicationListStatus>,
): NormalizedPayload<ApplicationListStatus> {
  const useCourt = has(raw.court);

  const base = {
    date: raw.date as string,
    time: requireTime(raw.time),
    description: raw.description as string,
    status: requireStatus(raw.status),
  };

  return useCourt
    ? { ...base, courtLocationCode: raw.court as string }
    : {
        ...base,
        otherLocationDescription: raw.location as string,
        cjaCode: raw.cja as string,
      };
}

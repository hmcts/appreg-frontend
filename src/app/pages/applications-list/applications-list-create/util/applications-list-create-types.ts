import { Duration } from '@components/duration-input/duration-input.component';
import { FormRaw } from '@core-types/forms/forms.types';
import { ApplicationListStatus } from '@openapi';

export type CreateFormRaw = Omit<
  FormRaw<ApplicationListStatus>,
  'date' | 'time' | 'status'
> & {
  date: string | null;
  time: Duration | null;
  status: string | null;
};

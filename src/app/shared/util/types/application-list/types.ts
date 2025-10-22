/* 
Reused types in /application-list/**  pages
*/

import { ApplicationListGetSummaryDto } from '../../../../../generated/openapi';

type UiExtras = {
  deletable?: boolean;
  etag?: string | null;
  rowVersion?: string | null;
};

export type ApplicationListRow = Omit<
  ApplicationListGetSummaryDto,
  'numberOfEntries'
> & {
  entries: ApplicationListGetSummaryDto['numberOfEntries'];
} & UiExtras;

export type Hm = { hours: number | null; minutes: number | null } | null;

export interface FormRaw<S> {
  date: unknown;
  description: string | null;
  time: Hm | null;
  status: S | string | null;
  court: string | null;
  location: string | null;
  cja: string | null;
}

export type NormalizedPayload<S> = {
  date: unknown;
  time: Hm;
  description: string;
  status: S | string;
} & (
  | { courtLocationCode: string }
  | { otherLocationDescription: string; cjaCode: string }
);
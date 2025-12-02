/* 
Reused types in /application-list/**  pages
*/

import { ApplicationListGetSummaryDto } from '../../../../../generated/openapi';
import { Duration } from '../../../components/duration-input/duration-input.component';

type UiExtras = {
  deletable?: boolean;
  etag?: string | null;
  rowVersion?: string | null;
};

export type ApplicationListRow = Omit<
  ApplicationListGetSummaryDto,
  'numberOfEntries'
> & {
  entries: ApplicationListGetSummaryDto['entriesCount'];
} & UiExtras;

export interface FormRaw<S> {
  date: unknown;
  description: string | null;
  time: Duration | null;
  status: S | string | null;
  court: string | null;
  location: string | null;
  cja: string | null;
}

export type NormalizedPayload<S> = {
  date: unknown;
  time: string;
  description: string;
  status: S | string;
} & (
  | { courtLocationCode: string }
  | { otherLocationDescription: string; cjaCode: string }
);

export type SummaryItem = { text: string; href: string };
export type ProblemDetails = { detail?: unknown; title?: unknown };

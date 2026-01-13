/* 
Reused types in /application-list/**  pages
*/

import { ApplicationListGetSummaryDto } from '@openapi';

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

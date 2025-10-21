import { ApplicationListGetSummaryDto } from '../../../../generated/openapi';

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

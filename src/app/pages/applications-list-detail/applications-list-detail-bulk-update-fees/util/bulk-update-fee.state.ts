import { ApplicationEntriesBaseContext } from '@components/applications-list-entry-detail/util/routing-state-util';
import { ErrorItem } from '@components/error-summary/error-summary.component';

export interface BulkUpdateFeeState {
  listId: string;
  selectedEntries: ApplicationEntriesBaseContext[];
  feeErrors: ErrorItem[];
  submitted: boolean;
}

export const initialBulkUpdateFeeState: BulkUpdateFeeState = {
  listId: '',
  selectedEntries: [],
  feeErrors: [],
  submitted: false,
};

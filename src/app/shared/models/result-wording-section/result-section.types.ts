import { TemplateSubstitution } from '@openapi';
import { PendingResultRow } from '@shared-types/result-code/result-code-row';

export type UpdateExistingResultWordingPayload = {
  resultId: string;
  resultCode: string;
  wordingFields: TemplateSubstitution[];
};

export type ResultSectionSubmitPayload = {
  pendingToCreate: PendingResultRow[];
  existingToUpdate: UpdateExistingResultWordingPayload[];
};

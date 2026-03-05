import { TemplateSubstitution } from '@openapi';

export type ExistingResultRow = {
  kind: 'existing';
  id: string; // real resultId
  resultCode: string;
  display: string; // "CODE - Title"
  wordingFields: TemplateSubstitution[];
  wording: string; // derived display
};

export type PendingResultRow = {
  kind: 'pending';
  tempId: string; // client-side id for tracking in the table
  resultCode: string;
  display: string;
  wordingFields: TemplateSubstitution[];
  wording: string; // derived display
};

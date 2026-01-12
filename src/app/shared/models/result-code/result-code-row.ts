export type ExistingResultRow = {
  kind: 'existing';
  id: string; // real resultId
  resultCode: string;
  display: string; // "CODE - Title"
  wordingFields: string[];
  wording: string; // derived display
};

export type PendingResultRow = {
  kind: 'pending';
  tempId: string; // client-side id for tracking in the table
  resultCode: string;
  display: string;
  wordingFields: string[];
  wording: string; // derived display
};

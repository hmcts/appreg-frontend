export type CloseValidationEntry = {
  id?: string;
  hasResult?: boolean | null;
  hasOfficials?: boolean | null;
  hasFees?: boolean | null;
  hasPaidFee?: boolean | null;
  requiresRespondent?: boolean | null;
  hasRespondent?: boolean | null;
  hasDuration?: boolean | null;
};

export type CloseNotPermittedError = {
  noClose: string[];
};

export type CloseValidationLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

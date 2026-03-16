export type CloseValidationEntry = {
  id?: string;
  hasDuration?: boolean | null;
};

export type CloseNotPermittedError = {
  noClose: string[];
};

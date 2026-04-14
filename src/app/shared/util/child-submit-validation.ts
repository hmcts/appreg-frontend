import { ErrorItem } from '@components/error-summary/error-summary.component';
import { WordingValidationOptions } from '@components/wording-parser/wording-parser.component';

export interface SubmitValidatableSection {
  validateForSubmit(opts?: WordingValidationOptions): ErrorItem[];
}

export type SubmitValidationTarget<T extends string> = {
  source: T;
  section: SubmitValidatableSection | null | undefined;
};

export function collectChildSubmitErrors<T extends string>(
  targets: readonly SubmitValidationTarget<T>[],
): Partial<Record<T, ErrorItem[]>> {
  const errorsBySource: Partial<Record<T, ErrorItem[]>> = {};

  targets.forEach(({ source, section }) => {
    if (!section) {
      return;
    }
    errorsBySource[source] = section.validateForSubmit();
  });

  return errorsBySource;
}

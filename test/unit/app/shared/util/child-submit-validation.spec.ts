import { ErrorItem } from '@components/error-summary/error-summary.component';
import {
  SubmitValidatableSection,
  collectChildSubmitErrors,
} from '@util/child-submit-validation';

describe('collectChildSubmitErrors', () => {
  it('collects errors from each section by source key', () => {
    const wordingErrors: ErrorItem[] = [{ text: 'wording error' }];
    const civilFeeErrors: ErrorItem[] = [{ text: 'civil fee error' }];

    const wordingSection: SubmitValidatableSection = {
      validateForSubmit: () => wordingErrors,
    };
    const civilFeeSection: SubmitValidatableSection = {
      validateForSubmit: () => civilFeeErrors,
    };

    const result = collectChildSubmitErrors([
      { source: 'wording', section: wordingSection },
      { source: 'civilFee', section: civilFeeSection },
    ]);

    expect(result).toEqual({
      wording: wordingErrors,
      civilFee: civilFeeErrors,
    });
  });

  it('omits a source when section is unavailable', () => {
    const result = collectChildSubmitErrors([
      { source: 'wording', section: undefined },
    ]);

    expect(result).toEqual({});
  });
});

import {
  codeFeeMeta,
  savedFeeMeta,
} from '@components/applications-list-entry-detail/util/entry-load-fee-meta';
import { ApplicationCodeGetDetailDto, EntryGetDetailDto } from '@openapi';

const code = {
  feeReference: 'CODE',
  feeAmount: { value: 999, currency: 'GBP' },
  offsiteFeeReference: 'CODE-OFF',
} as ApplicationCodeGetDetailDto;

describe('entry load fee metadata', () => {
  it('maps code metadata including absent fields', () => {
    expect(codeFeeMeta(code)).toEqual({
      feeReference: 'CODE',
      feeDescription: null,
      feeAmount: { value: 999, currency: 'GBP' },
      offsiteFeeReference: 'CODE-OFF',
      offsiteFeeDescription: null,
      offsiteFeeAmount: null,
    });
  });

  it('prefers saved entry fees and converts pounds to pence, including zero', () => {
    expect(
      savedFeeMeta(
        {
          fees: [
            { reference: 'OFF', value: 2, offsite: true },
            { reference: 'MAIN', value: 0 },
          ],
        } as EntryGetDetailDto,
        code,
      ),
    ).toEqual({
      feeReference: 'MAIN',
      feeDescription: null,
      feeAmount: { value: 0, currency: 'GBP' },
      offsiteFeeReference: 'OFF',
      offsiteFeeDescription: null,
      offsiteFeeAmount: { value: 200, currency: 'GBP' },
    });
  });

  it.each([undefined, []])(
    'uses code metadata when saved fees are %s',
    (fees) => {
      expect(savedFeeMeta({ fees } as EntryGetDetailDto, code)).toEqual(
        codeFeeMeta(code),
      );
    },
  );
});

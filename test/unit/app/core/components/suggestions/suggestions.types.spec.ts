import {
  isActivitySuggestionItem,
  isAppcodeSuggestionItem,
  isApplicationCodeSuggestionItem,
  isCjaSuggestionItem,
  isCourtSuggestionItem,
  isResultCodeSuggestionItem,
  toActivitySuggestionItem,
  toAppcodeSuggestionsItem,
  toApplicationCodeSuggestionItem,
  toCjaSuggestionItem,
  toCourtSuggestionItem,
  toResultCodeSuggestionItem,
} from '@components/suggestions/suggestions.types';
import { ActivityType, ApplicationCodeGetSummaryDto } from '@openapi';

const makeApplicationCode = (
  overrides: Partial<ApplicationCodeGetSummaryDto> = {},
): ApplicationCodeGetSummaryDto => ({
  applicationCode: 'AC001',
  title: 'Synthetic application',
  wording: { template: 'Synthetic wording' },
  isFeeDue: true,
  requiresRespondent: false,
  bulkRespondentAllowed: false,
  ...overrides,
});

describe('suggestions.types', () => {
  it('maps a court DTO to a typed suggestion item', () => {
    expect(
      toCourtSuggestionItem({
        locationCode: 'A1',
        name: 'Alpha Court',
      }),
    ).toEqual({
      kind: 'court',
      locationCode: 'A1',
      name: 'Alpha Court',
      label: 'A1 - Alpha Court',
      value: 'A1',
    });
  });

  it('maps a court DTO with a blank name to a code-only label', () => {
    expect(
      toCourtSuggestionItem({
        name: '',
        locationCode: 'A1',
      }),
    ).toEqual({
      kind: 'court',
      locationCode: 'A1',
      name: '',
      label: 'A1',
      value: 'A1',
    });
  });

  it('maps a CJA DTO to a typed suggestion item', () => {
    expect(
      toCjaSuggestionItem({
        code: 'C1',
        description: 'Area One',
      }),
    ).toEqual({
      kind: 'cja',
      code: 'C1',
      description: 'Area One',
      label: 'C1 - Area One',
      value: 'C1',
    });
  });

  it('maps a result code DTO to a typed suggestion item', () => {
    expect(
      toResultCodeSuggestionItem({
        resultCode: 'RC1',
        title: 'Granted',
      }),
    ).toEqual({
      kind: 'result-code',
      resultCode: 'RC1',
      title: 'Granted',
      label: 'RC1 - Granted',
      value: 'RC1',
    });
  });

  it('maps an activity enum value to a typed suggestion item', () => {
    expect(
      toActivitySuggestionItem(
        ActivityType.BULK_UPDATE_FEE_STATUS,
        'Bulk update fee status',
      ),
    ).toEqual({
      kind: 'activity',
      activity: ActivityType.BULK_UPDATE_FEE_STATUS,
      label: 'Bulk update fee status',
      value: ActivityType.BULK_UPDATE_FEE_STATUS,
    });
  });

  it('maps an application code title without changing its casing', () => {
    expect(toAppcodeSuggestionsItem('Private Prosecution')).toEqual({
      kind: 'app-code-title',
      label: 'Private Prosecution',
      value: 'Private Prosecution',
    });
  });

  it('maps an application code DTO to a code and title suggestion item', () => {
    const applicationCode = makeApplicationCode();

    expect(toApplicationCodeSuggestionItem(applicationCode)).toEqual({
      ...applicationCode,
      kind: 'app-code',
      label: 'AC001 - Synthetic application',
      value: 'AC001',
    });
  });

  it('maps an application code DTO with a blank title to a code-only label', () => {
    expect(
      toApplicationCodeSuggestionItem(makeApplicationCode({ title: '' })),
    ).toEqual(
      expect.objectContaining({
        kind: 'app-code',
        label: 'AC001',
        value: 'AC001',
      }),
    );
  });

  it('identifies a court suggestion item', () => {
    const item = toCourtSuggestionItem({
      locationCode: 'A1',
      name: 'Alpha Court',
    });

    expect(isCourtSuggestionItem(item)).toBe(true);
    expect(isCjaSuggestionItem(item)).toBe(false);
    expect(isResultCodeSuggestionItem(item)).toBe(false);
    expect(isActivitySuggestionItem(item)).toBe(false);
  });

  it('identifies a CJA suggestion item', () => {
    const item = toCjaSuggestionItem({
      code: 'C1',
      description: 'Area One',
    });

    expect(isCourtSuggestionItem(item)).toBe(false);
    expect(isCjaSuggestionItem(item)).toBe(true);
    expect(isResultCodeSuggestionItem(item)).toBe(false);
    expect(isActivitySuggestionItem(item)).toBe(false);
  });

  it('identifies a result code suggestion item', () => {
    const item = toResultCodeSuggestionItem({
      resultCode: 'RC1',
      title: 'Granted',
    });

    expect(isCourtSuggestionItem(item)).toBe(false);
    expect(isCjaSuggestionItem(item)).toBe(false);
    expect(isResultCodeSuggestionItem(item)).toBe(true);
    expect(isActivitySuggestionItem(item)).toBe(false);
  });

  it('identifies an activity suggestion item', () => {
    const item = toActivitySuggestionItem(
      ActivityType.REPORT_CREATED,
      'Report created',
    );

    expect(isCourtSuggestionItem(item)).toBe(false);
    expect(isCjaSuggestionItem(item)).toBe(false);
    expect(isResultCodeSuggestionItem(item)).toBe(false);
    expect(isActivitySuggestionItem(item)).toBe(true);
  });

  it('identifies an application code title suggestion item', () => {
    const item = toAppcodeSuggestionsItem('Private Prosecution');

    expect(isAppcodeSuggestionItem(item)).toBe(true);
    expect(isApplicationCodeSuggestionItem(item)).toBe(false);
    expect(isActivitySuggestionItem(item)).toBe(false);
  });

  it('identifies an application code suggestion item', () => {
    const item = toApplicationCodeSuggestionItem(makeApplicationCode());

    expect(isApplicationCodeSuggestionItem(item)).toBe(true);
    expect(isAppcodeSuggestionItem(item)).toBe(false);
    expect(isResultCodeSuggestionItem(item)).toBe(false);
    expect(isCourtSuggestionItem(item)).toBe(false);
  });
});

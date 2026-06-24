import {
  isActivitySuggestionItem,
  isCjaSuggestionItem,
  isCourtSuggestionItem,
  isResultCodeSuggestionItem,
  toActivitySuggestionItem,
  toCjaSuggestionItem,
  toCourtSuggestionItem,
  toResultCodeSuggestionItem,
} from '@components/suggestions/suggestions.types';
import { ActivityType } from '@openapi';

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

  it('maps a court DTO without a name to a code-only label', () => {
    expect(
      toCourtSuggestionItem({
        name: 'test',
        locationCode: 'A1',
      }),
    ).toEqual({
      kind: 'court',
      locationCode: 'A1',
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
});

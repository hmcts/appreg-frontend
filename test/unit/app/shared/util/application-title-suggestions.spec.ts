import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';

import {
  SuggestionsItem,
  toAppcodeSuggestionsItem,
} from '@components/suggestions/suggestions.types';
import { ReferenceDataFacade } from '@core/services/reference-data.facade';
import {
  TitleSelected,
  filterAppTitles,
  titleInputChange,
} from '@util/application-title-suggestions';

describe('application-title-suggestions', () => {
  const applicationCodeTitles = jest.fn<string[], []>();
  const facade = {
    applicationCodeTitles,
  } as unknown as ReferenceDataFacade;

  beforeEach(() => {
    applicationCodeTitles.mockReset();
  });

  describe('filterAppTitles', () => {
    it('returns no suggestions for a blank query without reading reference data', () => {
      expect(filterAppTitles('  ', facade)).toEqual([]);
      expect(applicationCodeTitles).not.toHaveBeenCalled();
    });

    it('matches without case sensitivity, removes duplicates, preserves order, and limits results to 20', () => {
      applicationCodeTitles.mockReturnValue([
        'Private Prosecution',
        'Other title',
        'Private Prosecution',
        ...Array.from(
          { length: 21 },
          (_, index) => `Private application ${index}`,
        ),
      ]);

      const suggestions = filterAppTitles('  PRIVATE  ', facade);

      expect(suggestions).toHaveLength(20);
      expect(suggestions[0]).toEqual(
        toAppcodeSuggestionsItem('Private Prosecution'),
      );
      expect(suggestions[1]).toEqual(
        toAppcodeSuggestionsItem('Private application 0'),
      );
      expect(suggestions[19]).toEqual(
        toAppcodeSuggestionsItem('Private application 18'),
      );
      expect(applicationCodeTitles).toHaveBeenCalledTimes(1);
    });

    it('returns no suggestions when no titles match', () => {
      applicationCodeTitles.mockReturnValue(['Private Prosecution']);

      expect(filterAppTitles('appeal', facade)).toEqual([]);
    });
  });

  describe('titleInputChange', () => {
    it('updates both the search signal and title control with free text', () => {
      const searchValue = signal('Old query');
      const control = new FormControl<string | null>('Old title');

      titleInputChange('New title', control, searchValue);

      expect(searchValue()).toBe('New title');
      expect(control.value).toBe('New title');
    });

    it('clears both values when the input is cleared', () => {
      const searchValue = signal('Old query');
      const control = new FormControl<string | null>('Old title');

      titleInputChange('', control, searchValue);

      expect(searchValue()).toBe('');
      expect(control.value).toBe('');
    });
  });

  describe('TitleSelected', () => {
    it('copies the selected application title with its original casing', () => {
      const searchValue = signal('private');
      const control = new FormControl<string | null>('private');

      TitleSelected(
        toAppcodeSuggestionsItem('Private Prosecution'),
        searchValue,
        control,
      );

      expect(searchValue()).toBe('Private Prosecution');
      expect(control.value).toBe('Private Prosecution');
    });

    it('ignores suggestions of another kind', () => {
      const searchValue = signal('private');
      const control = new FormControl<string | null>('private');
      const otherItem = {
        kind: 'court',
        label: 'Other court',
        value: 'OTHER',
      } as SuggestionsItem;

      TitleSelected(otherItem, searchValue, control);

      expect(searchValue()).toBe('private');
      expect(control.value).toBe('private');
    });
  });
});

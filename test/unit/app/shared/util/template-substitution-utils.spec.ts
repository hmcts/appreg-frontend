import { TemplateSubstitution } from '@openapi';
import {
  isTemplateSubstitution,
  toTemplateSubstitutions,
  toWordingValues,
  wordingFromFields,
} from '@util/template-substitution-utils';

describe('template-substitution-utils', () => {
  describe('isTemplateSubstitution', () => {
    it('returns true for object with string value', () => {
      expect(isTemplateSubstitution({ key: 'Date', value: '2026-03-02' })).toBe(
        true,
      );
    });

    it('returns false for non-objects or objects without string value', () => {
      expect(isTemplateSubstitution('x')).toBe(false);
      expect(isTemplateSubstitution(null)).toBe(false);
      expect(isTemplateSubstitution({ key: 'Date', value: 123 })).toBe(false);
    });
  });

  describe('toTemplateSubstitutions', () => {
    it('maps legacy string values to keyed TemplateSubstitution objects', () => {
      expect(toTemplateSubstitutions(['A', 'B'], ['Date', 'Location'])).toEqual(
        [
          { key: 'Date', value: 'A' },
          { key: 'Location', value: 'B' },
        ],
      );
    });

    it('falls back to generated keys for legacy values when no keys provided', () => {
      expect(toTemplateSubstitutions(['A', 'B'])).toEqual([
        { key: 'field1', value: 'A' },
        { key: 'field2', value: 'B' },
      ]);
    });

    it('preserves TemplateSubstitution objects as-is', () => {
      const fields: TemplateSubstitution[] = [
        { key: 'Date', value: '2026-03-02' },
        { key: 'Location', value: 'London' },
      ];

      expect(toTemplateSubstitutions(fields)).toEqual(fields);
    });

    it('returns undefined for empty/null input', () => {
      expect(toTemplateSubstitutions([])).toBeUndefined();
      expect(toTemplateSubstitutions(null)).toBeUndefined();
      expect(toTemplateSubstitutions(undefined)).toBeUndefined();
    });
  });

  describe('toWordingValues + wordingFromFields', () => {
    it('extracts values from mixed string and TemplateSubstitution input', () => {
      expect(
        toWordingValues([
          'A',
          { key: 'Date', value: '2026-03-02' },
          { key: 'Location', value: 'London' },
        ]),
      ).toEqual(['A', '2026-03-02', 'London']);
    });

    it('formats wording as comma-separated values or "-" when empty', () => {
      expect(
        wordingFromFields([
          { key: 'Date', value: '2026-03-02' },
          { key: 'Location', value: 'London' },
        ]),
      ).toBe('2026-03-02, London');
      expect(wordingFromFields([])).toBe('-');
      expect(wordingFromFields(undefined)).toBe('-');
    });
  });
});

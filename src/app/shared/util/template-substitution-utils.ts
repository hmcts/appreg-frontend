import { TemplateSubstitution } from '@openapi';

export type WordingFieldLike = string | TemplateSubstitution;

export function isTemplateSubstitution(
  value: unknown,
): value is TemplateSubstitution {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'value' in value && typeof value['value'] === 'string';
}

export function toTemplateSubstitutions(
  values: WordingFieldLike[] | null | undefined,
  legacyKeys: readonly string[] = [],
): TemplateSubstitution[] | undefined {
  if (!values?.length) {
    return undefined;
  }

  return values.map((item, index) => {
    if (isTemplateSubstitution(item)) {
      return item;
    }

    return {
      key: legacyKeys[index] ?? `field${index + 1}`,
      value: item,
    };
  });
}

export function toWordingValues(
  values: WordingFieldLike[] | null | undefined,
): string[] {
  if (!values?.length) {
    return [];
  }

  return values.map((item) =>
    isTemplateSubstitution(item) ? item.value : item,
  );
}

export function wordingFromFields(
  values: WordingFieldLike[] | null | undefined,
): string {
  const resolved = toWordingValues(values);
  return resolved.length > 0 ? resolved.join(', ') : '-';
}

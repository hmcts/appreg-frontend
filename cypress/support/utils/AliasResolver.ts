/**
 * Resolves Cypress alias references (values starting with '@') in a string record.
 * Non-alias values are passed through unchanged.
 *
 * @param criteria - Record where some values may be alias refs like "@listDescription"
 * @returns Chainable resolving to the same record with aliases replaced by their stored values
 */
export function resolveAliases(
  criteria: Record<string, string>,
): Cypress.Chainable<Record<string, string>> {
  const aliasKeys = Object.keys(criteria).filter((k) =>
    criteria[k]?.startsWith('@'),
  );

  const resolve = (
    current: Record<string, string>,
    keys: string[],
  ): Cypress.Chainable<Record<string, string>> => {
    if (keys.length === 0) {
      return cy.wrap(current);
    }
    const [key, ...rest] = keys;
    const aliasName = current[key].slice(1); // strip leading '@'
    return cy.get<string>(`@${aliasName}`).then((value) => {
      const resolved =
        typeof value === 'string' ? value : JSON.stringify(value);
      return resolve({ ...current, [key]: resolved }, rest);
    });
  };

  return resolve({ ...criteria }, aliasKeys);
}

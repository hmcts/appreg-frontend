/**
 * Utility for building nested objects from flat dot-notation keys
 */
export class ObjectBuilder {
  /**
   * Converts a flat object with dot-notation keys into a nested object structure
   * Example:
   *   { "applicant.person.name.title": "Mr", "applicant.person.name.surname": "Smith" }
   * becomes:
   *   { applicant: { person: { name: { title: "Mr", surname: "Smith" } } } }
   *
   * Also supports array notation:
   *   { "wordingFields.0.key": "Reference", "wordingFields.0.value": "123" }
   * becomes:
   *   { wordingFields: [{ key: "Reference", value: "123" }] }
   *
   * @param flatObj Flat object with dot-notation keys
   * @returns Nested object structure
   */
  static buildNestedObject(
    flatObj: Record<string, string>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [path, value] of Object.entries(flatObj)) {
      // Skip null or empty string values that represent intentional nulls
      if (value === 'null' || value === '') {
        continue;
      }

      this.setNestedValue(result, path, value);
    }

    return result;
  }

  /**
   * Sets a value in a nested object using a dot-notation path
   * @param obj Target object
   * @param path Dot-notation path (e.g., "applicant.person.name.title" or "officials.0.title")
   * @param value Value to set
   */
  private static setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: string,
  ): void {
    const pathSegments = this.parsePath(path);
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i];
      const nextSegment = pathSegments[i + 1];
      const isNextArray = /^\d+$/.test(nextSegment);

      if (!(segment in current)) {
        // Create array if next segment is a number, otherwise create object
        current[segment] = isNextArray ? [] : {};
      }

      // Navigate deeper
      if (isNextArray && Array.isArray(current[segment])) {
        const arrayIndex = parseInt(nextSegment, 10);
        const arr = current[segment] as unknown[];

        // Ensure array has an object at this index
        while (arr.length <= arrayIndex) {
          arr.push({});
        }

        // Set current to the array element and skip the next iteration
        current = arr[arrayIndex] as Record<string, unknown>;
        i++; // Skip the array index in the next iteration
      } else {
        current = current[segment] as Record<string, unknown>;
      }
    }

    // Set the final value
    const lastSegment = pathSegments[pathSegments.length - 1];
    current[lastSegment] = value;
  }

  /**
   * Parses a dot-notation path into segments
   * Handles both dot notation and array bracket notation
   * Example: "applicant.person.name.title" => ["applicant", "person", "name", "title"]
   * Example: "wordingFields[0].key" => ["wordingFields", "0", "key"]
   * @param path Dot-notation path
   * @returns Array of path segments
   */
  private static parsePath(path: string): string[] {
    return path
      .replace(/\[(\d+)\]/g, '.$1') // Convert array brackets to dots: [0] => .0
      .split('.')
      .filter(Boolean);
  }
}

import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DateTimeHelper } from '../forms/datetime/DateTimeHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
import { RadioHelper } from '../forms/radio/RadioHelper';
import { TextboxHelper } from '../forms/textbox/TextboxHelper';

export class ApplicationListCombinedHelper {
  /**
   * Performs a comprehensive search on the Applications List page
   * Treats datatable first row as field selectors and second row as values
   * @param criteria - Search criteria object (field label -> value)
   */
  static searchApplicationList(criteria: Record<string, string>): void {
    AccordionHelper.ensureAccordionExpanded('Advanced search');

    const processedCriteria = processDatatableRow(criteria);

    cy.log('Searching Application List with criteria:', processedCriteria);

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      // Skip empty values
      if (!value || value.trim() === '') {
        continue;
      }

      // Determine field type and use appropriate helper
      switch (fieldLabel) {
        case 'Date':
          DateTimeHelper.setDateValue(fieldLabel, value);
          break;

        case 'Time':
          DateTimeHelper.setTimeValue(fieldLabel, value);
          break;

        case 'CourtSearch': {
          // CourtSearch = text to type into autocomplete, Court = option to select
          const courtSelectValue = processedCriteria.Court || '';
          TextboxHelper.selectAutocompleteOption(
            'Court',
            value,
            courtSelectValue,
          );
          break;
        }

        case 'Court':
          // Handled by CourtSearch case above; skip if CourtSearch not provided
          if (!processedCriteria.CourtSearch) {
            TextboxHelper.selectAutocompleteOption('Court', value, value);
          }
          break;

        case 'CJASearch':
          // Skip - handled by CJA case
          break;

        case 'Other location description':
        case 'Other location':
          TextboxHelper.typeInTextbox('Other location description', value);
          break;

        case 'Criminal justice area':
        case 'CJA': {
          const cjaSearchText = processedCriteria.CJASearch || value;
          TextboxHelper.selectAutocompleteOption(
            'Criminal justice area',
            cjaSearchText,
            value,
          );
          break;
        }

        case 'Select list status':
        case 'Status':
          if (value !== 'Choose') {
            DropdownHelper.selectDropdownOption('Select list status', value);
          }
          break;

        case 'List description':
        case 'Description':
          TextboxHelper.typeInTextbox('List description', value);
          break;

        case 'Lists to Show':
          RadioHelper.select(value);
          break;
      }
    }

    cy.intercept('GET', '**/application-lists**').as('searchApplicationLists');

    ButtonHelper.clickButton('Search');

    // Client-side validation prevents a search request, so only wait for the
    // results request when the submitted form has no validation errors.
    cy.get('body').then(($body) => {
      const hasValidationError = $body.find('.govuk-error-summary').length > 0;

      if (!hasValidationError) {
        cy.wait('@searchApplicationLists', { timeout: 20000 });
      }
    });

    // Then wait for search results or a validation error to appear.
    cy.get('body', { timeout: 10000 }).should(($body) => {
      const hasTable = $body.find('caption:contains("Lists")').length > 0;
      const hasNoResultsBanner = $body.text().includes('No lists found');
      const hasValidationError = $body.find('.govuk-error-summary').length > 0;

      if (!hasTable && !hasNoResultsBanner && !hasValidationError) {
        throw new Error('Search results not loaded yet - waiting...');
      }
    });

    // Log which state we're in
    cy.get('body').then(($body) => {
      if ($body.find('caption:contains("Lists")').length > 0) {
        cy.log('✓ Search results table loaded');
      } else {
        cy.log('⚠ No results found - "No lists found" banner displayed');
      }
    });
  }
}

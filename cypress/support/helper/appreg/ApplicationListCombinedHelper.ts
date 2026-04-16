import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DateTimeHelper } from '../forms/datetime/DateTimeHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
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

        case 'CourtSearch':
          // Skip - handled by Court case
          break;

        case 'Court': {
          // Use CourtSearch value for typing, Court value for selecting
          const courtSearchText = processedCriteria.CourtSearch || value;
          TextboxHelper.selectAutocompleteOption(
            'Court',
            courtSearchText,
            value,
          );
          break;
        }

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
      }
    }

    ButtonHelper.clickButton('Search');

    // Wait for either the table to appear or the "No lists found" banner
    // This ensures the search has completed before proceeding
    cy.get('body', { timeout: 20000 }).should(($body) => {
      const hasTable = $body.find('caption:contains("Lists")').length > 0;
      const hasNoResultsBanner = $body.text().includes('No lists found');

      if (!hasTable && !hasNoResultsBanner) {
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

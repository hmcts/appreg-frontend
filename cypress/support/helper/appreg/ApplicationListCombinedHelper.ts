import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/AccordionHelper';
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
    AccordionHelper.toggleAccordion('Advanced search');

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

        case 'Other location':
          TextboxHelper.typeInTextbox('Other location', value);
          break;

        case 'CJA': {
          const cjaSearchText = processedCriteria.CJASearch || value;
          TextboxHelper.selectAutocompleteOption('CJA', cjaSearchText, value);
          break;
        }

        case 'Select list status':
          if (value !== 'Choose') {
            DropdownHelper.selectDropdownOption('Select list status', value);
          }
          break;

        case 'Description':
          TextboxHelper.typeInTextbox(fieldLabel, value);
          break;
      }
    }

    ButtonHelper.clickButton('Search');
  }
}

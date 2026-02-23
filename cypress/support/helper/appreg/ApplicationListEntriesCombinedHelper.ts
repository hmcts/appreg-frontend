import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/AccordionHelper';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DateTimeHelper } from '../forms/datetime/DateTimeHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
import { TextboxHelper } from '../forms/textbox/TextboxHelper';

export class ApplicationListEntriesCombinedHelper {
  /**
   * Performs a search for a specific application entry using unique identifiers
   * @param criteria - Search criteria object (field label -> value)
   */
  static searchApplicationListEntry({ criteria }: { criteria: Record<string, string>; }): void {
    // ensure the search accordion is opened/toggled before interacting with fields

    AccordionHelper.toggleAccordion('Advanced search');

    const processedCriteria = processDatatableRow(criteria);

    cy.log(
      'Searching Application List Entry with criteria:',
      processedCriteria,
    );

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      if (!value || value.trim() === '') {
        continue;
      }

      switch (fieldLabel) {
        case 'Date':
          DateTimeHelper.setDateValue('Date', value);
          break;

        case 'Applicant organisation':
          TextboxHelper.typeInTextbox('Applicant Org', value);
          break;

        case 'Respondent organisation':
          TextboxHelper.typeInTextbox('Respondent Org', value);
          break;

        case 'CourtSearch':
          // handled in Court case
          break;

        case 'Court': {
          const courtSearchText = processedCriteria['CourtSearch'] || value;
          TextboxHelper.selectAutocompleteOption(
            'Court',
            courtSearchText,
            value,
          );
          break;
        }

        case 'Applicant surname':
          TextboxHelper.typeInTextbox('Applicant surname', value);
          break;

        case 'Respondent surname':
          TextboxHelper.typeInTextbox('Respondent surname', value);
          break;

        case 'List other location':
          TextboxHelper.typeInTextbox('Other location', value);
          break;

        case 'Applicant code':
          TextboxHelper.typeInTextbox('Applicant code', value);
          break;

        case 'Respondent post code':
          TextboxHelper.typeInTextbox('Respondent post code', value);
          break;

        case 'CJASearch':
          // handled in CJA case
          break;

        case 'Criminal justice area': {
          const cjaSearchText = processedCriteria['CJASearch'] || value;
          TextboxHelper.selectAutocompleteOption(
            'Criminal justice area',
            cjaSearchText,
            value,
          );
          break;
        }

        case 'Select application status':
          if (value !== 'Choose') {
            DropdownHelper.selectDropdownOption(
              'Select application status',
              value,
            );
          }
          break;

        case 'Account reference':
          TextboxHelper.typeInTextbox('Account reference', value);
          break;

        default:
          cy.log(`Unhandled search field: ${fieldLabel}`);
          break;
      }
    }
    ButtonHelper.clickButton('Search');
  }
}

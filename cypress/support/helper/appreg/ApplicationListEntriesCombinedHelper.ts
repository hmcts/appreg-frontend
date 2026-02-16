import { processDatatableRow } from '../../utils/TestDataGenerator';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DateTimeHelper } from '../forms/datetime/DateTimeHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
import { TextboxHelper } from '../forms/textbox/TextboxHelper';

export class ApplicationListEntriesCombinedHelper {
  
  /**
   * Performs a search for a specific application entry using unique identifiers
   * @param criteria - Search criteria object (field label -> value)
   */
  static searchApplicationListEntry(criteria: Record<string, string>): void {
  const processedCriteria = processDatatableRow(criteria);

  cy.log('Searching Application List Entry with criteria:', processedCriteria);

  for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
    if (!value || value.trim() === '') continue;

    switch (fieldLabel) {
      case 'Date':
        DateTimeHelper.setDateValue('Date', value);
        break;

      case 'Applicant Org':
        TextboxHelper.typeInTextbox('Applicant Org', value);
        break;

      case 'Respondent Org':
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

      case 'Post code':
        TextboxHelper.typeInTextbox('Post code', value);
        break;

      case 'CJASearch':
        // handled in CJA case
        break;

      case 'CJA': {
        const cjaSearchText = processedCriteria['CJASearch'] || value;
        TextboxHelper.selectAutocompleteOption(
          'CJA',
          cjaSearchText,
          value,
        );
        break;
      }

      case 'Select status':
        if (value !== 'Choose') {
          DropdownHelper.selectDropdownOption('Select status', value);
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

  ButtonHelper.isButtonEnabled('Search');
  ButtonHelper.clickButton('Search');
}
}

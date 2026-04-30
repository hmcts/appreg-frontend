import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
import { TextboxHelper } from '../forms/textbox/TextboxHelper';

export class ApplicationListEntriesSearchHelper {
  /**
   * Performs a search against the Entries table inside an opened application list.
   * @param criteria - Search criteria object (field label -> value)
   */
  static searchApplicationListEntries({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
    const processedCriteria = processDatatableRow(criteria);

    cy.log('Searching Entries table with criteria:', processedCriteria);

    ButtonHelper.clickButton('Clear search');
    AccordionHelper.ensureAccordionExpanded('Advanced search');

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      if (!value || value.trim() === '') {
        continue;
      }

      switch (fieldLabel) {
        case 'Applicant':
          TextboxHelper.typeInTextbox('Applicant', value);
          break;

        case 'Respondent':
          TextboxHelper.typeInTextbox('Respondent', value);
          break;

        case 'Postcode':
          TextboxHelper.typeInTextbox('Postcode', value);
          break;

        case 'Sequence number':
          TextboxHelper.typeInTextbox('Sequence number', value);
          break;

        case 'Account number':
        case 'Account reference':
          TextboxHelper.typeInTextbox('Account number', value);
          break;

        case 'Title':
          TextboxHelper.typeInTextbox('Title', value);
          break;

        case 'Fee':
          DropdownHelper.selectDropdownOption('Fee', value);
          break;

        case 'Resulted':
          TextboxHelper.typeInTextbox('Resulted', value);
          break;

        default:
          cy.log(`Unhandled entries search field: ${fieldLabel}`);
          break;
      }
    }

    ButtonHelper.clickButton('Search');
  }
}

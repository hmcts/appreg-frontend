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

    cy.intercept('GET', '**/application-lists/*/entries**').as(
      'applicationListEntriesRequest',
    );
    ButtonHelper.clickButton('Clear search');
    cy.wait('@applicationListEntriesRequest', { timeout: 20000 });

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

        case 'Respondent postcode':
          TextboxHelper.typeInTextbox('Respondent postcode', value);
          break;

        case 'Sequence number':
          TextboxHelper.typeInTextbox('Sequence number', value);
          break;

        case 'Account number':
        case 'Account reference':
          TextboxHelper.typeInTextbox('Account number', value);
          break;

        case 'Application title':
          TextboxHelper.typeInTextbox('Application title', value);
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
    cy.wait('@applicationListEntriesRequest', { timeout: 20000 });

    const expectedSearchText = Object.values(processedCriteria).find(
      (value) => value && value.trim() !== '',
    );

    cy.get('body', { timeout: 10000 }).should(($body) => {
      const bodyText = $body.text();
      const hasNoResultsBanner = bodyText.includes('No lists entries found');
      const entriesTableText = $body
        .find('caption:contains("Entries")')
        .closest('table')
        .find('tbody')
        .text()
        .trim();

      if (hasNoResultsBanner) {
        return;
      }

      if (!entriesTableText) {
        throw new Error('Entries search results not loaded yet - waiting...');
      }

      if (
        expectedSearchText &&
        !entriesTableText.includes(expectedSearchText)
      ) {
        throw new Error(
          'Entries table does not show search results yet - waiting...',
        );
      }
    });
  }
}

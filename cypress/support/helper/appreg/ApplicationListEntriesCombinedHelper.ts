import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
import { AccordionDropdownHelper } from '../forms/accordion/accordionDropdown/AccordionDropdownHelper';
import { AccordionTextboxHelper } from '../forms/accordion/accordionTextbox/AccordionTextboxHelper';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { DateTimeHelper } from '../forms/datetime/DateTimeHelper';
import { DropdownHelper } from '../forms/dropdown/DropdownHelper';
import { TextboxHelper } from '../forms/textbox/TextboxHelper';

export class ApplicationListEntriesCombinedHelper {
  /**
   * Performs a search for a specific application entry using unique identifiers
   * @param criteria - Search criteria object (field label -> value)
   */
  static searchApplicationListEntry({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
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

  /**
   * Fills name fields within an accordion (reusable for Applicant/Respondent)
   * @param accordionTitle - Title of the accordion section
   * @param criteria - Name field values
   */
  static fillNameFields({
    accordionTitle,
    criteria,
  }: {
    accordionTitle: string;
    criteria: Record<string, string>;
  }): void {
    const processedCriteria = processDatatableRow(criteria);

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      if (!value || value.trim() === '') {
        continue;
      }

      switch (fieldLabel) {
        case 'Select applicant type':
        case 'Applicant type':
        case 'Select respondent type':
        case 'Respondent type':
          AccordionDropdownHelper.selectDropdownInAccordion(
            accordionTitle,
            fieldLabel.includes('applicant')
              ? 'Select applicant type'
              : 'Select respondent type',
            value,
          );
          break;

        case 'Select title':
        case 'Title':
          AccordionDropdownHelper.selectDropdownInAccordion(
            accordionTitle,
            'Select title',
            value,
          );
          break;

        case 'First name':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'First name',
            value,
          );
          break;

        case 'Middle name(s)':
        case 'Middle name':
        case 'Middle names':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Middle name(s)',
            value,
          );
          break;

        case 'Surname':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Surname',
            value,
          );
          break;

        default:
          cy.log(`Unknown name field: ${fieldLabel}`);
          break;
      }
    }
  }

  /**
   * Fills address fields within an accordion (reusable for Applicant/Respondent)
   * @param accordionTitle - Title of the accordion section
   * @param criteria - Address field values
   */
  static fillAddressFields({
    accordionTitle,
    criteria,
  }: {
    accordionTitle: string;
    criteria: Record<string, string>;
  }): void {
    const processedCriteria = processDatatableRow(criteria);

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      if (!value || value.trim() === '') {
        continue;
      }

      switch (fieldLabel) {
        case 'Address line 1':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Address line 1',
            value,
          );
          break;

        case 'Address line 2':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Address line 2',
            value,
          );
          break;

        case 'Town or city':
        case 'Town':
        case 'City':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Town or city',
            value,
          );
          break;

        case 'County or region':
        case 'County':
        case 'Region':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'County or region',
            value,
          );
          break;

        case 'Post town':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Post town',
            value,
          );
          break;

        case 'Postcode':
        case 'Post code':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Postcode',
            value,
          );
          break;

        default:
          cy.log(`Unknown address field: ${fieldLabel}`);
          break;
      }
    }
  }

  /**
   * Fills contact detail fields within an accordion (reusable for Applicant/Respondent)
   * @param accordionTitle - Title of the accordion section
   * @param criteria - Contact field values
   */
  static fillContactDetails({
    accordionTitle,
    criteria,
  }: {
    accordionTitle: string;
    criteria: Record<string, string>;
  }): void {
    const processedCriteria = processDatatableRow(criteria);

    for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
      if (!value || value.trim() === '') {
        continue;
      }

      switch (fieldLabel) {
        case 'Phone number':
        case 'Phone':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Phone number',
            value,
          );
          break;

        case 'Mobile number':
        case 'Mobile':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Mobile number',
            value,
          );
          break;

        case 'Email address':
        case 'Email':
          AccordionTextboxHelper.enterTextIntoAccordionTextbox(
            accordionTitle,
            'Email address',
            value,
          );
          break;

        default:
          cy.log(`Unknown contact field: ${fieldLabel}`);
          break;
      }
    }
  }

  /**
   * Fills all Applicant fields using reusable field methods
   * @param criteria - All applicant field values
   */
  static fillApplicant({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
    const accordionTitle = 'Applicant';

    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    cy.log('Filling Applicant with criteria:', criteria);

    this.fillNameFields({ accordionTitle, criteria });
    this.fillAddressFields({ accordionTitle, criteria });
    this.fillContactDetails({ accordionTitle, criteria });
  }

  /**
   * Fills all Respondent fields using reusable field methods
   * @param criteria - All respondent field values
   */
  static fillRespondent({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
    const accordionTitle = 'Respondent';

    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    cy.log('Filling Respondent with criteria:', criteria);

    this.fillNameFields({ accordionTitle, criteria });
    this.fillAddressFields({ accordionTitle, criteria });
    this.fillContactDetails({ accordionTitle, criteria });
  }
}

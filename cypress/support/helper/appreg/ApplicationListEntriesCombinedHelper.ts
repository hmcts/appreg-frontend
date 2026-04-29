import { processDatatableRow } from '../../utils/TestDataGenerator';
import { AccordionHelper } from '../forms/accordion/accordion/AccordionHelper';
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
        case 'List date':
        case 'Date':
          DateTimeHelper.setDateValue('List date', value);
          break;

        case 'Applicant organisation':
          TextboxHelper.typeInTextbox('Applicant organisation', value);
          break;

        case 'Respondent organisation':
          TextboxHelper.typeInTextbox('Respondent organisation', value);
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

        case 'Other location description':
        case 'Other location':
        case 'List other location':
          TextboxHelper.typeInTextbox('Other location description', value);
          break;

        case 'Standard applicant code':
          TextboxHelper.typeInTextbox('Standard applicant code', value);
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

        case 'Criminal justice area':
        case 'CJA': {
          const cjaSearchText = processedCriteria['CJASearch'] || value;
          TextboxHelper.selectAutocompleteOption(
            'Criminal justice area',
            cjaSearchText,
            value,
          );
          break;
        }

        case 'Select application status':
        case 'Status':
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
        case 'Select type': {
          const dropdownLabel = fieldLabel.includes('applicant')
            ? 'Select applicant type'
            : 'Select type';
          AccordionHelper.within(accordionTitle, () => {
            DropdownHelper.selectDropdownOption(dropdownLabel, value);
          });
          // Wait for Angular to re-render form fields after type change
          cy.wait(500);
          break;
        }

        case 'Organisation name':
        case 'Organization name':
        case 'Org name':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Organisation name', value),
          );
          break;

        case 'Select title':
        case 'Title':
          AccordionHelper.within(accordionTitle, () => {
            DropdownHelper.selectDropdownOption('Select title', value);
          });
          break;

        case 'First name':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('First name', value),
          );
          break;

        case 'Middle name(s)':
        case 'Middle name':
        case 'Middle names':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Middle name(s)', value),
          );
          break;

        case 'Surname':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Surname', value),
          );
          break;

        case 'Date of birth':
          AccordionHelper.within(accordionTitle, () =>
            DateTimeHelper.setDateValue('Date of birth', value),
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
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Address line 1', value),
          );
          break;

        case 'Address line 2':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Address line 2', value),
          );
          break;

        case 'Town or city':
        case 'Town':
        case 'City':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Town or city', value),
          );
          break;

        case 'County or region':
        case 'County':
        case 'Region':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('County or region', value),
          );
          break;

        case 'Post town':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Post town', value),
          );
          break;

        case 'Postcode':
        case 'Post code':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Postcode', value),
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
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Phone number', value),
          );
          break;

        case 'Mobile number':
        case 'Mobile':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Mobile number', value),
          );
          break;

        case 'Email address':
        case 'Email':
          AccordionHelper.within(accordionTitle, () =>
            TextboxHelper.typeInTextbox('Email address', value),
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

    const processedCriteria = processDatatableRow(criteria);
    const applicantType =
      processedCriteria['Select applicant type'] ||
      processedCriteria['Applicant type'] ||
      '';

    // Handle Standard Applicant differently - it uses a table selection, not form fields
    if (applicantType.toLowerCase().includes('standard')) {
      // Select Standard Applicant from dropdown
      AccordionHelper.within(accordionTitle, () => {
        DropdownHelper.selectDropdownOption(
          'Select applicant type',
          applicantType,
        );
      });

      // Wait for Angular to render the standard applicant table
      cy.wait(500);

      // Select from standard applicant table by Code
      const codeToSelect =
        processedCriteria['Code'] || processedCriteria['Applicant code'];
      if (codeToSelect) {
        cy.get(`#apps-${codeToSelect}`).check();
        cy.log(`Selected standard applicant: ${codeToSelect}`);
      }

      return;
    }

    // For Person or Organisation types, fill all form fields
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

  /**
   * Verifies all Applicant fields using reusable verification methods
   * @param criteria - Applicant field values to verify
   */
  static verifyApplicant({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
    const accordionTitle = 'Applicant';

    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    cy.log('Verifying Applicant with criteria:', criteria);

    const processedCriteria = processDatatableRow(criteria);

    AccordionHelper.within(accordionTitle, () => {
      for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
        if (!value || value.trim() === '') {
          continue;
        }

        this.verifyNameFields(fieldLabel, value);
        this.verifyAddressFields(fieldLabel, value);
        this.verifyContactDetails(fieldLabel, value);
      }
    });
  }

    /**
   * Verifies all Respondent fields using reusable verification methods
   * @param criteria - Respondent field values to verify
   */
  static verifyRespondent({
    criteria,
  }: {
    criteria: Record<string, string>;
  }): void {
    const accordionTitle = 'Respondent';

    AccordionHelper.isAccordionVisible(accordionTitle);
    AccordionHelper.ensureAccordionExpanded(accordionTitle);

    cy.log('Verifying Respondent with criteria:', criteria);

    const processedCriteria = processDatatableRow(criteria);

    AccordionHelper.within(accordionTitle, () => {
      for (const [fieldLabel, value] of Object.entries(processedCriteria)) {
        if (!value || value.trim() === '') {
          continue;
        }

        this.verifyNameFields(fieldLabel, value);
        this.verifyAddressFields(fieldLabel, value);
        this.verifyContactDetails(fieldLabel, value);
      }
    });
  }

  static verifyNameFields(fieldLabel: string, value: string): void {
    switch (fieldLabel) {
      case 'Select applicant type':
      case 'Applicant type':
        DropdownHelper.verifyDropdownOptionSelected(
          'Select applicant type',
          value,
        );
        break;

      case 'Organisation name':
      case 'Organization name':
      case 'Org name':
        TextboxHelper.getValueInTextbox('Organisation name').should('eq', value);
        break;

      case 'Select title':
      case 'Title':
        DropdownHelper.verifyDropdownOptionSelected('Select title', value);
        break;

      case 'First name':
        TextboxHelper.getValueInTextbox('First name').should('eq', value);
        break;

      case 'Middle name(s)':
      case 'Middle name':
      case 'Middle names':
        TextboxHelper
          .getValueInTextbox('Middle name(s)')
          .should('eq', value);
        break;

      case 'Surname':
        TextboxHelper.getValueInTextbox('Surname').should('eq', value);
        break;

      case 'Date of birth':
        DateTimeHelper.verifyDateValue('Date of birth', value);
        break;

      default:
        cy.log(`Unknown name field for verification: ${fieldLabel}`);
        break;
    }
  }

  static verifyAddressFields(fieldLabel: string, value: string): void {
    switch (fieldLabel) {
      case 'Address line 1':  // Address line 1
        TextboxHelper.getValueInTextbox('Address line 1').should('eq', value);
        break;      

      case 'Address line 2':  // Address line 2
        TextboxHelper.getValueInTextbox('Address line 2').should('eq', value);
        break;

      case 'Town or city':  // Town or city
        TextboxHelper.getValueInTextbox('Town or city').should('eq', value);
        break;

      case 'County or region':  // County or region
        TextboxHelper.getValueInTextbox('County or region').should('eq', value);
        break;

      case 'Post town':  // Post town
        TextboxHelper.getValueInTextbox('Post town').should('eq', value);
        break;

      case 'Postcode':  // Postcode
      case 'Post code':
        TextboxHelper.getValueInTextbox('Postcode').should('eq', value);
        break;

      default:
        cy.log(`Unknown address field for verification: ${fieldLabel}`);
        break;
    }
  }

  static verifyContactDetails(fieldLabel: string, value: string): void {
    switch (fieldLabel) {
      case 'Phone number':  // Phone number
      case 'Phone':
        TextboxHelper.getValueInTextbox('Phone number').should('eq', value);
        break;      

      case 'Mobile number':  // Mobile number
      case 'Mobile':
        TextboxHelper.getValueInTextbox('Mobile number').should('eq', value);
        break;      

      case 'Email address':  // Email address
      case 'Email':
        TextboxHelper.getValueInTextbox('Email address').should('eq', value);
        break;

      default:
        cy.log(`Unknown contact field for verification: ${fieldLabel}`);
        break;
    }
  }
}
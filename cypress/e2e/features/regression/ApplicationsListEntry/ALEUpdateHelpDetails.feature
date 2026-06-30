Feature: Applications list entry update help details

  Background: Create applications list entry
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                         | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Entry update help list {RANDOM}     | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                           |
      | applicationCode                               | MX99006                        |
      | applicant.person.name.title                   | Mr                             |
      | applicant.person.name.lastName                | Taylor {RANDOM}                |
      | applicant.person.name.firstName               | Henry                          |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                    |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
      | applicant.person.contactDetails.phone         | 01632960001                    |
      | applicant.person.contactDetails.mobile        | 07700900001                    |
      | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
      | respondent.person.name.title                  | Ms                             |
      | respondent.person.name.lastName               | Clark {RANDOM}                 |
      | respondent.person.name.firstName              | Emily                          |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
      | respondent.person.contactDetails.addressLine2 | Bristol                        |
      | respondent.person.contactDetails.postcode     | BS15 5AA                       |
      | respondent.person.contactDetails.phone        | 01632960001                    |
      | respondent.person.contactDetails.mobile       | 07700900001                    |
      | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                   |
      | wordingFields.0.key                           | Describe Seized Food           |
      | wordingFields.0.value                         | Help wording {RANDOM}          |
      | feeStatuses.0.paymentReference                | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                   | PAID                           |
      | feeStatuses.0.statusDate                      | todayiso                       |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-{RANDOM}                   |
      | notes                                         | Help details note              |
      | lodgementDate                                 | todayiso                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"

  @regression @applicationListEntry @helpDetails
  Scenario: Expand and collapse update entry help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId/update-entry/:entryId"
    Then User Sees Page Heading "Applications list entry update"
    When User Clicks On The "Show all sections" Button

    Then User Should See The Accordion "Help with applicant details" Is Collapsed
    When User Toggles The Accordion "Help with applicant details"
    Then User Should See The Following Text In The Accordion "Help with applicant details":
      | Enter applicant details for a single applicant or organisation. |
      | If you select a standard applicant, you can choose a different standard applicant, but you cannot edit the standard applicant |
      | The selected standard applicant is shown above the search results. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-Applicant-Expanded"
    When User Toggles The Accordion "Help with applicant details"
    Then User Should See The Accordion "Help with applicant details" Is Collapsed

    Then User Should See The Accordion "Help with application codes" Is Collapsed
    When User Toggles The Accordion "Help with application codes"
    Then User Should See The Following Text In The Accordion "Help with application codes":
      | Select the application code that matches the nature of the application being recorded. |
      | The lodgement date is the date the court office received the application. |
      | The lodgement date is used to find the correct fee for the date the application was received. |
      | Once the lodgement date is saved it cannot be changed. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-ApplicationCodes-Expanded"
    When User Toggles The Accordion "Help with application codes"
    Then User Should See The Accordion "Help with application codes" Is Collapsed

    Then User Should See The Accordion "Help with application wording" Is Collapsed
    When User Toggles The Accordion "Help with application wording"
    Then User Should See The Following Text In The Accordion "Help with application wording":
      | Application wording is based on the selected application code and may include fixed text and fields you need to complete. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-ApplicationWording-Expanded"
    When User Toggles The Accordion "Help with application wording"
    Then User Should See The Accordion "Help with application wording" Is Collapsed

    Then User Should See The Accordion "Help with civil fee details" Is Collapsed
    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Following Text In The Accordion "Help with civil fee details":
      | Civil fee details record whether an application fee is due, paid, remitted or covered by an undertaking. |
      | Due means the fee still needs to be paid or resolved. |
      | Paid means the fee has been paid in full. You can add a payment reference if needed. |
      | Remitted means the court has waived the fee, for example through Help with Fees. |
      | Undertaking means the applicant has formally agreed to pay later. The list cannot be closed until this is updated to Paid. |
      | Applications that do not need a fee show No fee required and the fee fields cannot be changed. |
      | Select Off-site fee if an additional fee applies because a magistrate attended a location away from court premises. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-CivilFee-Expanded"
    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Accordion "Help with civil fee details" Is Collapsed

    Then User Should See The Accordion "Help with application notes" Is Collapsed
    When User Toggles The Accordion "Help with application notes"
    Then User Should See The Following Text In The Accordion "Help with application notes":
      | Use this section to record case references, account references and any additional notes for the application. |
      | Account reference is required for enforcement application codes prefixed with EF. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-Notes-Expanded"
    When User Toggles The Accordion "Help with application notes"
    Then User Should See The Accordion "Help with application notes" Is Collapsed

    Then User Should See The Accordion "Help with result wording" Is Collapsed
    When User Toggles The Accordion "Help with result wording"
    Then User Should See The Following Text In The Accordion "Help with result wording":
      | Result wording is based on the selected result code and may include fixed text and fields you need to complete. |
      | Fixed wording cannot be edited on this page. |
    Then User Takes Screenshot "HelpDetails-ALEUpdate-ResultWording-Expanded"
    When User Toggles The Accordion "Help with result wording"
    Then User Should See The Accordion "Help with result wording" Is Collapsed

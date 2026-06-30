Feature: Application list entries bulk update fees help details

  Background: Create fee-required application list entry
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                              | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Bulk fee help details list {RANDOM}      | LCCC065           |
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
      | wordingFields.0.value                         | Bulk fee help wording          |
      | feeStatuses.0.paymentStatus                   | DUE                            |
      | feeStatuses.0.statusDate                      | todayiso                       |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-FEE-{RANDOM}               |
      | notes                                         | Bulk fee help note             |
      | lodgementDate                                 | todayiso                       |
    Then User Verify Response Status Code Should Be "201"

  @regression @applicationsListEntries @helpDetails
  Scenario: Expand and collapse bulk update fees help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId"
    When User Checks The Checkbox In Row Of Table "Entries" With:
      | Sequence number | Account number    | Applicant             | Respondent           | Postcode | Title                      | Fee | Resulted |
      | 1               | ACC-FEE-{RANDOM}  | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
    Then User Should See The Button "Actions" Is Enabled
    When User Clicks "Actions" Then "Update fee details" From Caption Menu In Table "Entries"
    Then User Sees Page Heading "Update fee details"
    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Text "Civil fee details record whether an application fee is due, paid, remitted or covered by an undertaking." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Due means the fee still needs to be paid or resolved." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Paid means the fee has been paid in full. You can add a payment reference if needed." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Remitted means the court has waived the fee, for example through Help with Fees." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Undertaking means the applicant has formally agreed to pay later. The list cannot be closed until this is updated to Paid." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Applications that do not need a fee show No fee required and the fee fields cannot be changed." In The Accordion "Help with civil fee details"
    Then User Should See The Text "Select Off-site fee if an additional fee applies because a magistrate attended a location away from court premises." In The Accordion "Help with civil fee details"
    Then User Takes Screenshot "HelpDetails-BulkUpdateFees-CivilFee-Expanded"
    When User Toggles The Accordion "Help with civil fee details"

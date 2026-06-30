Feature: Application list entries result selected help details

  Background: Create application list entry
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                                  | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Result selected help details list {RANDOM}   | LCCC065           |
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
      | wordingFields.0.value                         | Result selected help wording   |
      | feeStatuses.0.paymentStatus                   | DUE                            |
      | feeStatuses.0.statusDate                      | todayiso                       |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-RES-{RANDOM}               |
      | notes                                         | Result selected help note      |
      | lodgementDate                                 | todayiso                       |
    Then User Verify Response Status Code Should Be "201"

  @regression @applicationsListEntries @helpDetails
  Scenario: Expand and collapse list result selected help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId"
    When User Checks The Checkbox In Row Of Table "Entries" With:
      | Sequence number | Account number    | Applicant             | Respondent           | Postcode | Title                      | Fee | Resulted |
      | 1               | ACC-RES-{RANDOM}  | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | BS15 5AA | Condemnation of Unfit Food | Yes |          |
    Then User Should See The Button "Actions" Is Enabled
    When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Entries"
    Then User Sees Page Heading "Result applications"
    When User Toggles The Accordion "Help with result wording"
    Then User Should See The Text "Result wording is based on the selected result code and may include fixed text and fields you need to complete." In The Accordion "Help with result wording"
    Then User Should See The Text "Fixed wording cannot be edited on this page." In The Accordion "Help with result wording"
    Then User Takes Screenshot "HelpDetails-ListResultSelected-ResultWording-Expanded"
    When User Toggles The Accordion "Help with result wording"

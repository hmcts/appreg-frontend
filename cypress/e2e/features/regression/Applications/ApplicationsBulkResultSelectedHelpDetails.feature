Feature: Applications result selected help details

  Background: Create application entry
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                            | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Applications result help list {RANDOM} | LCCC065           |
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
      | wordingFields.0.value                         | Applications result help       |
      | feeStatuses.0.paymentStatus                   | DUE                            |
      | feeStatuses.0.statusDate                      | todayiso                       |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-APP-RES-{RANDOM}           |
      | notes                                         | Applications result help note  |
      | lodgementDate                                 | todayiso                       |
    Then User Verify Response Status Code Should Be "201"

  @regression @applications @helpDetails @ARCPOC-377
  Scenario: Expand and collapse applications result selected help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications"
    Then User Sees Page Heading "Applications"
    When User Searches Applications With:
      | Date  | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference    |
      | today |             |       |                        |                   |                         |                    |                           |                      |           |                       |                            |                         |                      |
    Then User Should See Table "Application list entries" Has Rows
    Then User Should See Row In Table "Application list entries" With Values:
      | Date         | Applicant             | Respondent           | Application title          | Fee | Resulted | Status |
      | todaydisplay | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | Condemnation of Unfit Food | Yes | No       | OPEN   |
    When User Checks The Checkbox In Row Of Table "Application list entries" With:
      | Date         | Applicant             | Respondent           | Application title          | Fee | Resulted | Status |
      | todaydisplay | Henry Taylor {RANDOM} | Emily Clark {RANDOM} | Condemnation of Unfit Food | Yes | No       | OPEN   |
    When User Clicks "Actions" Then "Result selected" From Caption Menu In Table "Application list entries"
    Then User Sees Page Heading "Result applications"
    When User Toggles The Accordion "Help with result wording"
    Then User Should See The Text "Result wording is based on the selected result code and may include fixed text and fields you need to complete." In The Accordion "Help with result wording"
    Then User Should See The Text "Fixed wording cannot be edited on this page." In The Accordion "Help with result wording"
    Then User Takes Screenshot "HelpDetails-ApplicationsResultSelected-ResultWording-Expanded"
    When User Toggles The Accordion "Help with result wording"

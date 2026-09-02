Feature: Applications Update Notes

  Background: Create a closed application list entry
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | description       | Applications update notes {SCENARIO_ID} |
      | courtLocationCode | LCCC065                            |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                                |
      | applicationCode                               | MX99009                             |
      | applicant.person.name.title                   | Mr                                  |
      | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                     |
      | applicant.person.name.firstName               | Henry                               |
      | applicant.person.name.middleName              | James                               |
      | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street                |
      | applicant.person.contactDetails.addressLine2  | Westminster                         |
      | applicant.person.contactDetails.addressLine3  | London                              |
      | applicant.person.contactDetails.addressLine4  | Greater London                      |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                        |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com       |
      | respondent.person.name.title                  | Ms                                  |
      | respondent.person.name.lastName               | Clark {SCENARIO_ID}                      |
      | respondent.person.name.firstName              | Emily                               |
      | respondent.person.name.middleName             | Rose                                |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road                |
      | respondent.person.contactDetails.addressLine2 | Bristol                             |
      | respondent.person.contactDetails.addressLine3 | Avon                                |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.person.contactDetails.postcode     | BS15 5AA                            |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com      |
      | respondent.person.dateOfBirth                 | todayiso-25y                        |
      | feeStatuses.0.paymentReference                | REF-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                   | PAID                                |
      | feeStatuses.0.statusDate                      | todayiso                            |
      | hasOffsiteFee                                 | false                               |
      | caseReference                                 | CASE-{RANDOM}                       |
      | accountNumber                                 | APP-NOTES-{RANDOM}                  |
      | notes                                         | Applications original note {SCENARIO_ID} |
      | lodgementDate                                 | todayiso                            |
      | officials.0.title                             | Mr                                  |
      | officials.0.surname                           | Turner {SCENARIO_ID}                     |
      | officials.0.forename                          | Graham                              |
      | officials.0.type                              | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode | AUTH |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:listId" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | CLOSED                             |
      | description       | Applications update notes {SCENARIO_ID} |
      | courtLocationCode | LCCC065                            |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "200"

  @regression @applications @applicationListEntry @ARCPOC-1512
  Scenario: Update notes from the Applications search page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Applications"
    Then User Verify The Page URL Contains "/applications"
    When User Searches Applications With:
      | Date  | CourtSearch | Court | Applicant organisation | Applicant surname | Respondent organisation | Respondent surname | Select application status | Respondent post code | CJASearch | Criminal justice area | Other location description | Standard applicant code | Account reference |
      | today |             |       |                        | Taylor {SCENARIO_ID}   |                         |                    |                           |                      |           |                       |                            |                         |                   |
    Then User Should See Row In Table "Application list entries" With Values:
      | Date         | Applicant             | Respondent           | Application title                                        | Fee | Resulted | Status |
      | todaydisplay | Henry Taylor {SCENARIO_ID} | Emily Clark {SCENARIO_ID} | Application for order re public health measures (person) | Yes | Yes      | CLOSED |
    When User Clicks "Update notes" Button In Row Of Table "Application list entries" With:
      | Applicant             | Respondent           |
      | Henry Taylor {SCENARIO_ID} | Emily Clark {SCENARIO_ID} |
    Then User Verifies The "Application notes" Textbox Has Value "Applications original note {SCENARIO_ID}"
    Then User Verifies The "Additional notes" Textbox Is Empty
    Then User Should See The Textbox "Additional notes" Is Enabled
    Then User Should See The Textbox "Application notes" Is Disabled
    Then User Verifies The Summary Table "Selected application" Contains:
      | Applicant         | Henry Taylor {SCENARIO_ID}                                    |
      | Respondent        | Emily Clark {SCENARIO_ID}                                     |
      | Application code  | MX99009                                                  |
      | Application title | Application for order re public health measures (person) |
      | Date              | todaydisplay                                             |
      | Fee               | Yes                                                      |
      | Resulted          | Yes                                                      |
    Then User Enters "Updated from Applications search" Into The "Additional notes" Textbox
    When User Clicks On The "Save additional notes" Button
    Then User Sees Success Banner "Success" Containing "Application entry updated successfully"
    Then User Verifies The "Application notes" Textbox Has Value "Applications original note {SCENARIO_ID} Updated from Applications search"
    Then User Verifies The "Additional notes" Textbox Is Empty
    When User Makes DELETE API Request To "/application-lists/:listId"
    Then User Verify Response Status Code Should Be "400"

Feature: API - Application List Entry Closed Updates

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario Outline: Update a closed application list entry through the closed-entry endpoint
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | Closed entry update list {SCENARIO_ID}     |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Closed                          |
      | applicant.person.name.lastName               | Updatable{SCENARIO_ID}               |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | closed{SCENARIO_ID}@example.com      |
      | feeStatuses.0.paymentReference               | CLO{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | CLC{RANDOM}                    |
      | accountNumber                                | CLC{RANDOM}                    |
      | notes                                        | Existing closed note            |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | ClosedOfficial{SCENARIO_ID}          |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:listId" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | CLOSED                            |
      | description       | Closed entry update list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "status" Should Be "CLOSED"
    When User Makes PUT API Request To "/application-lists/:listId/entries/closed/:entryId" With Object Builder:
      | additionalNotes | Appended closed note |
    Then User Verify Response Status Code Should Be "204"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "409"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario Outline: Reject closed-entry update when the application list is not closed
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-2h                         |
      | status            | OPEN                                   |
      | description       | Closed entry invalid state list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                  |
      | applicationCode                              | AD99002                               |
      | applicant.person.name.title                  | Mr                                    |
      | applicant.person.name.firstName              | Closed                                |
      | applicant.person.name.lastName               | InvalidState{SCENARIO_ID}                  |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                           |
      | applicant.person.contactDetails.addressLine3 | London                                |
      | applicant.person.contactDetails.addressLine4 | Greater London                        |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                        |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                              |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                          |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                         |
      | applicant.person.contactDetails.email        | closed-invalid{SCENARIO_ID}@example.com    |
      | feeStatuses.0.paymentReference               | CLI{RANDOM}                          |
      | feeStatuses.0.paymentStatus                  | PAID                                  |
      | feeStatuses.0.statusDate                     | todayiso                              |
      | hasOffsiteFee                                | false                                 |
      | caseReference                                | CLI{RANDOM}                          |
      | accountNumber                                | CLI{RANDOM}                          |
      | notes                                        | Open list note                        |
      | lodgementDate                                | todayiso                              |
      | officials.0.title                            | Mr                                    |
      | officials.0.surname                          | ClosedInvalidOfficial{SCENARIO_ID}         |
      | officials.0.forename                         | Clerk                                 |
      | officials.0.type                             | CLERK                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/closed/:entryId" With Object Builder:
      | additionalNotes | Should not append |
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "notes" Should Be "Open list note"

    Examples:
      | User  |
      | user1 |

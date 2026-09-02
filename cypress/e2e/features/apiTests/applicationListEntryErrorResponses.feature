Feature: API - Application List Entry Error Responses

  Background:
    Given User Authenticates Via API As "user1"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Create entry returns 404 for a missing list and 409 for a closed list
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 create state {SCENARIO_ID} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Closed                           |
      | applicant.person.name.lastName               | CreateState{SCENARIO_ID}              |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | create-state{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | CRESTATE-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CRESTATE-{RANDOM}                |
      | accountNumber                                | CRESTATE-{RANDOM}                |
      | notes                                        | Entry used to close list         |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | CreateState{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:listId" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | CLOSED                            |
      | description       | ARCPOC-1461 create state {SCENARIO_ID} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Missing                          |
      | applicant.person.name.lastName               | List{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | missing-list{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | MISSLIST-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | MISSLIST-{RANDOM}                |
      | accountNumber                                | MISSLIST-{RANDOM}                |
      | notes                                        | Missing list create              |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | MissingList{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
    Then User Verify Response Status Code Should Be "404"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                |
      | applicationCode                              | AD99002                             |
      | applicant.person.name.title                  | Ms                                  |
      | applicant.person.name.firstName              | Closed                              |
      | applicant.person.name.lastName               | Rejected{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street               |
      | applicant.person.contactDetails.addressLine2 | Westminster                         |
      | applicant.person.contactDetails.addressLine3 | London                              |
      | applicant.person.contactDetails.addressLine4 | Greater London                      |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                        |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                       |
      | applicant.person.contactDetails.email        | closed-rejected{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | CLOSED-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                                |
      | feeStatuses.0.statusDate                     | todayiso                            |
      | hasOffsiteFee                                | false                               |
      | caseReference                                | CLOSED-{RANDOM}                     |
      | accountNumber                                | CLOSED-{RANDOM}                     |
      | notes                                        | Closed list create attempt          |
      | lodgementDate                                | todayiso                            |
      | officials.0.title                            | Ms                                  |
      | officials.0.surname                          | ClosedReject{SCENARIO_ID}                |
      | officials.0.forename                         | Bench                               |
      | officials.0.type                             | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @regression @ARCPOC-1461 @ARCPOC-1461
  Scenario: Get and update entry return expected statuses for missing resources, wrong parentage and closed lists
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-3h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 get update A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 get update B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-1h                         |
      | status            | OPEN                                   |
      | description       | ARCPOC-1461 get update closed {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Primary                           |
      | applicant.person.name.lastName               | Entry{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                          |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                     |
      | applicant.person.contactDetails.email        | primary-entry{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PRIMARY-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | PRIMARY-{RANDOM}                  |
      | accountNumber                                | PRIMARY-{RANDOM}                  |
      | notes                                        | Primary entry                     |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | Primary{SCENARIO_ID}                   |
      | officials.0.forename                         | Clerk                             |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Ms                                |
      | applicant.person.name.firstName              | Foreign                           |
      | applicant.person.name.lastName               | Entry{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                          |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                     |
      | applicant.person.contactDetails.email        | foreign-entry{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | FOREIGN-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | FOREIGN-{RANDOM}                  |
      | accountNumber                                | FOREIGN-{RANDOM}                  |
      | notes                                        | Foreign entry                     |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Ms                                |
      | officials.0.surname                          | Foreign{SCENARIO_ID}                   |
      | officials.0.forename                         | Bench                             |
      | officials.0.type                             | MAGISTRATE                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Closed                           |
      | applicant.person.name.lastName               | Entry{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                         |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                    |
      | applicant.person.contactDetails.email        | closed-entry{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | CLENT-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CLENT-{RANDOM}                   |
      | accountNumber                                | CLENT-{RANDOM}                   |
      | notes                                        | Closed entry                     |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | Closed{SCENARIO_ID}                   |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-1h                         |
      | status            | CLOSED                                 |
      | description       | ARCPOC-1461 get update closed {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "200"
    When User Makes GET API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:primaryEntryId"
    Then User Verify Response Status Code Should Be "404"
    When User Makes GET API Request To "/application-lists/:primaryListId/entries/00000000-0000-0000-0000-000000000001"
    Then User Verify Response Status Code Should Be "404"
    When User Makes GET API Request To "/application-lists/:primaryListId/entries/:foreignEntryId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/:closedListId/entries/:closedEntryId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:primaryEntryId" With Object Builder:
      | standardApplicantCode                        | null                                    |
      | applicationCode                              | AD99002                                 |
      | applicant.person.name.title                  | Mr                                      |
      | applicant.person.name.firstName              | Updated                                 |
      | applicant.person.name.lastName               | MissingList{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                    |
      | applicant.person.contactDetails.addressLine2 | Westminster                             |
      | applicant.person.contactDetails.addressLine3 | London                                  |
      | applicant.person.contactDetails.addressLine4 | Greater London                          |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                          |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                                |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                            |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                           |
      | applicant.person.contactDetails.email        | update-missing-list{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEA-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                  | PAID                                    |
      | feeStatuses.0.statusDate                     | todayiso                                |
      | hasOffsiteFee                                | false                                   |
      | caseReference                                | UPDATEA-{RANDOM}                        |
      | accountNumber                                | UPDATEA-{RANDOM}                        |
      | notes                                        | Update missing list                     |
      | officials.0.title                            | Mr                                      |
      | officials.0.surname                          | UpdateA{SCENARIO_ID}                         |
      | officials.0.forename                         | Clerk                                   |
      | officials.0.type                             | CLERK                                   |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:primaryListId/entries/00000000-0000-0000-0000-000000000001" With Object Builder:
      | standardApplicantCode                        | null                                     |
      | applicationCode                              | AD99002                                  |
      | applicant.person.name.title                  | Ms                                       |
      | applicant.person.name.firstName              | Updated                                  |
      | applicant.person.name.lastName               | MissingEntry{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street                   |
      | applicant.person.contactDetails.addressLine2 | Westminster                              |
      | applicant.person.contactDetails.addressLine3 | London                                   |
      | applicant.person.contactDetails.addressLine4 | Greater London                           |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                           |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                 |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                             |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                            |
      | applicant.person.contactDetails.email        | update-missing-entry{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEB-{RANDOM}                         |
      | feeStatuses.0.paymentStatus                  | PAID                                     |
      | feeStatuses.0.statusDate                     | todayiso                                 |
      | hasOffsiteFee                                | false                                    |
      | caseReference                                | UPDATEB-{RANDOM}                         |
      | accountNumber                                | UPDATEB-{RANDOM}                         |
      | notes                                        | Update missing entry                     |
      | officials.0.title                            | Ms                                       |
      | officials.0.surname                          | UpdateB{SCENARIO_ID}                          |
      | officials.0.forename                         | Bench                                    |
      | officials.0.type                             | MAGISTRATE                               |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:primaryListId/entries/:foreignEntryId" With Object Builder:
      | standardApplicantCode                        | null                                    |
      | applicationCode                              | AD99002                                 |
      | applicant.person.name.title                  | Ms                                      |
      | applicant.person.name.firstName              | Updated                                 |
      | applicant.person.name.lastName               | WrongParent{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street                   |
      | applicant.person.contactDetails.addressLine2 | Westminster                             |
      | applicant.person.contactDetails.addressLine3 | London                                  |
      | applicant.person.contactDetails.addressLine4 | Greater London                          |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                          |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                                |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                            |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                           |
      | applicant.person.contactDetails.email        | update-wrong-parent{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEC-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                  | PAID                                    |
      | feeStatuses.0.statusDate                     | todayiso                                |
      | hasOffsiteFee                                | false                                   |
      | caseReference                                | UPDATEC-{RANDOM}                        |
      | accountNumber                                | UPDATEC-{RANDOM}                        |
      | notes                                        | Update wrong parent                     |
      | officials.0.title                            | Ms                                      |
      | officials.0.surname                          | UpdateC{SCENARIO_ID}                         |
      | officials.0.forename                         | Bench                                   |
      | officials.0.type                             | MAGISTRATE                              |
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/:closedListId/entries/:closedEntryId" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Closed                            |
      | applicant.person.name.lastName               | WrongState{SCENARIO_ID}                |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                          |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                     |
      | applicant.person.contactDetails.email        | update-closed{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | UPDATED-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | UPDATED-{RANDOM}                  |
      | accountNumber                                | UPDATED-{RANDOM}                  |
      | notes                                        | Update closed list                |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | UpdateClosed{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                             |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Delete entry returns 404 and 409 for missing resources, wrong parentage and invalid state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                      |
      | time              | timenowhhmm-2h                |
      | status            | OPEN                          |
      | description       | ARCPOC-1461 delete A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                        |
      | durationHours     | 2                             |
      | durationMinutes   | 22                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                      |
      | time              | timenowhhmm-1h                |
      | status            | OPEN                          |
      | description       | ARCPOC-1461 delete B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                        |
      | durationHours     | 2                             |
      | durationMinutes   | 22                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "otherListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Delete                            |
      | applicant.person.name.lastName               | Source{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                          |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                     |
      | applicant.person.contactDetails.email        | delete-source{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | DELSRC-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | DELSRC-{RANDOM}                   |
      | accountNumber                                | DELSRC-{RANDOM}                   |
      | notes                                        | Delete source                     |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | DeleteSource{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                             |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceEntryId"
    When User Makes POST API Request To "/application-lists/:otherListId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Ms                               |
      | applicant.person.name.firstName              | Delete                           |
      | applicant.person.name.lastName               | Other{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                    |
      | applicant.person.contactDetails.email        | delete-other{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | DELOTH-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | DELOTH-{RANDOM}                  |
      | accountNumber                                | DELOTH-{RANDOM}                  |
      | notes                                        | Delete other                     |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Ms                               |
      | officials.0.surname                          | DeleteOther{SCENARIO_ID}              |
      | officials.0.forename                         | Bench                            |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "otherEntryId"
    When User Makes DELETE API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:sourceEntryId"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:sourceListId/entries/00000000-0000-0000-0000-000000000001"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:sourceListId/entries/:otherEntryId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes DELETE API Request To "/application-lists/:sourceListId/entries/:sourceEntryId"
    Then User Verify Response Status Code Should Be "204"
    When User Makes DELETE API Request To "/application-lists/:sourceListId/entries/:sourceEntryId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/:sourceListId/entries/:sourceEntryId"
    Then User Verify Response Status Code Should Be "404"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Closed-entry update returns 404 and 409 for missing resources, wrong parentage and wrong state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-2h                      |
      | status            | OPEN                                |
      | description       | ARCPOC-1461 closed entry A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-1h                      |
      | status            | OPEN                                |
      | description       | ARCPOC-1461 closed entry B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm                         |
      | status            | OPEN                                |
      | description       | ARCPOC-1461 closed entry C {SCENARIO_ID} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Open                            |
      | applicant.person.name.lastName               | ClosedUpdate{SCENARIO_ID}            |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | closed-open{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | COPEN-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | COPEN-{RANDOM}                  |
      | accountNumber                                | COPEN-{RANDOM}                  |
      | notes                                        | Open list note                  |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | Open{SCENARIO_ID}                    |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Ms                               |
      | applicant.person.name.firstName              | Closed                           |
      | applicant.person.name.lastName               | Valid{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                    |
      | applicant.person.contactDetails.email        | closed-valid{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | CVAL-{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CVAL-{RANDOM}                    |
      | accountNumber                                | CVAL-{RANDOM}                    |
      | notes                                        | Closed list note                 |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Ms                               |
      | officials.0.surname                          | ClosedValid{SCENARIO_ID}              |
      | officials.0.forename                         | Bench                            |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-1h                      |
      | status            | CLOSED                              |
      | description       | ARCPOC-1461 closed entry B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Mr                                 |
      | applicant.person.name.firstName              | Foreign                            |
      | applicant.person.name.lastName               | Closed{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                           |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                      |
      | applicant.person.contactDetails.email        | closed-foreign{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | CFOR-{RANDOM}                      |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | CFOR-{RANDOM}                      |
      | accountNumber                                | CFOR-{RANDOM}                      |
      | notes                                        | Foreign closed entry               |
      | lodgementDate                                | todayiso                           |
      | officials.0.title                            | Mr                                 |
      | officials.0.surname                          | ClosedForeign{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                              |
      | officials.0.type                             | CLERK                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes PUT API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/closed/:closedEntryId" With Object Builder:
      | additionalNotes | Missing list |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:closedListId/entries/closed/00000000-0000-0000-0000-000000000001" With Object Builder:
      | additionalNotes | Missing entry |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:closedListId/entries/closed/:foreignEntryId" With Object Builder:
      | additionalNotes | Wrong parent |
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/:openListId/entries/closed/:openEntryId" With Object Builder:
      | additionalNotes | Wrong state |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Bulk officials replacement returns 404 for missing lists, 400 for invalid entry ids, and 409 for wrong state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 officials A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-1h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 officials B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm                      |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 officials C {SCENARIO_ID} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                  |
      | applicationCode                              | AD99002                               |
      | applicant.person.name.title                  | Mr                                    |
      | applicant.person.name.firstName              | Primary                               |
      | applicant.person.name.lastName               | Officials{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                           |
      | applicant.person.contactDetails.addressLine3 | London                                |
      | applicant.person.contactDetails.addressLine4 | Greater London                        |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                        |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                              |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                          |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                         |
      | applicant.person.contactDetails.email        | officials-primary{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | OFFA-{RANDOM}                         |
      | feeStatuses.0.paymentStatus                  | PAID                                  |
      | feeStatuses.0.statusDate                     | todayiso                              |
      | hasOffsiteFee                                | false                                 |
      | caseReference                                | OFFA-{RANDOM}                         |
      | accountNumber                                | OFFA-{RANDOM}                         |
      | notes                                        | Officials primary                     |
      | lodgementDate                                | todayiso                              |
      | officials.0.title                            | Mr                                    |
      | officials.0.surname                          | Original{SCENARIO_ID}                      |
      | officials.0.forename                         | Clerk                                 |
      | officials.0.type                             | CLERK                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                  |
      | applicationCode                              | AD99002                               |
      | applicant.person.name.title                  | Ms                                    |
      | applicant.person.name.firstName              | Foreign                               |
      | applicant.person.name.lastName               | Officials{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                           |
      | applicant.person.contactDetails.addressLine3 | London                                |
      | applicant.person.contactDetails.addressLine4 | Greater London                        |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                        |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                              |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                          |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                         |
      | applicant.person.contactDetails.email        | officials-foreign{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | OFFB-{RANDOM}                         |
      | feeStatuses.0.paymentStatus                  | PAID                                  |
      | feeStatuses.0.statusDate                     | todayiso                              |
      | hasOffsiteFee                                | false                                 |
      | caseReference                                | OFFB-{RANDOM}                         |
      | accountNumber                                | OFFB-{RANDOM}                         |
      | notes                                        | Officials foreign                     |
      | lodgementDate                                | todayiso                              |
      | officials.0.title                            | Ms                                    |
      | officials.0.surname                          | Foreign{SCENARIO_ID}                       |
      | officials.0.forename                         | Bench                                 |
      | officials.0.type                             | MAGISTRATE                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                 |
      | applicationCode                              | AD99002                              |
      | applicant.person.name.title                  | Mr                                   |
      | applicant.person.name.firstName              | Closed                               |
      | applicant.person.name.lastName               | Officials{SCENARIO_ID}                    |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                          |
      | applicant.person.contactDetails.addressLine3 | London                               |
      | applicant.person.contactDetails.addressLine4 | Greater London                       |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                       |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                             |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                         |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                        |
      | applicant.person.contactDetails.email        | officials-closed{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | OFFC-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                  | PAID                                 |
      | feeStatuses.0.statusDate                     | todayiso                             |
      | hasOffsiteFee                                | false                                |
      | caseReference                                | OFFC-{RANDOM}                        |
      | accountNumber                                | OFFC-{RANDOM}                        |
      | notes                                        | Officials closed                     |
      | lodgementDate                                | todayiso                             |
      | officials.0.title                            | Mr                                   |
      | officials.0.surname                          | Closed{SCENARIO_ID}                       |
      | officials.0.forename                         | Clerk                                |
      | officials.0.type                             | CLERK                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm                      |
      | status            | CLOSED                           |
      | description       | ARCPOC-1461 officials C {SCENARIO_ID} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/officials" With Object Builder:
      | entryIds.0           | :primaryEntryId |
      | officials.0.title    | Ms              |
      | officials.0.surname  | MissingList     |
      | officials.0.forename | Ada             |
      | officials.0.type     | MAGISTRATE      |
    Then User Verify Response Status Code Should Be "404"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries/officials" With Object Builder:
      | entryIds.0           | 00000000-0000-0000-0000-000000000001 |
      | officials.0.title    | Ms                                   |
      | officials.0.surname  | MissingEntry                         |
      | officials.0.forename | Ada                                  |
      | officials.0.type     | MAGISTRATE                           |
    Then User Verify Response Status Code Should Be "400"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries/officials" With Object Builder:
      | entryIds.0           | :foreignEntryId |
      | officials.0.title    | Ms              |
      | officials.0.surname  | WrongParent     |
      | officials.0.forename | Ada             |
      | officials.0.type     | MAGISTRATE      |
    Then User Verify Response Status Code Should Be "400"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/officials" With Object Builder:
      | entryIds.0           | :closedEntryId |
      | officials.0.title    | Ms             |
      | officials.0.surname  | WrongState     |
      | officials.0.forename | Ada            |
      | officials.0.type     | MAGISTRATE     |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @applicationListEntryResults @regression @ARCPOC-1461 @ARCPOC-1576
  Scenario: Create and retrieve results return 404 and 409 for missing resources and wrong parentage, while closed-list retrieval remains available
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | ARCPOC-1461 results create A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-1h                        |
      | status            | OPEN                                  |
      | description       | ARCPOC-1461 results create B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm                           |
      | status            | OPEN                                  |
      | description       | ARCPOC-1461 results create C {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Open                             |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                   |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | results-open{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RESOPEN-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | RESOPEN-{RANDOM}                 |
      | accountNumber                                | RESOPEN-{RANDOM}                 |
      | notes                                        | Results open entry               |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | ResultsOpen{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                |
      | applicationCode                              | AD99002                             |
      | applicant.person.name.title                  | Ms                                  |
      | applicant.person.name.firstName              | Foreign                             |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                      |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                         |
      | applicant.person.contactDetails.addressLine3 | London                              |
      | applicant.person.contactDetails.addressLine4 | Greater London                      |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                        |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                       |
      | applicant.person.contactDetails.email        | results-foreign{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RFOR-{RANDOM}                       |
      | feeStatuses.0.paymentStatus                  | PAID                                |
      | feeStatuses.0.statusDate                     | todayiso                            |
      | hasOffsiteFee                                | false                               |
      | caseReference                                | RFOR-{RANDOM}                       |
      | accountNumber                                | RFOR-{RANDOM}                       |
      | notes                                        | Results foreign entry               |
      | lodgementDate                                | todayiso                            |
      | officials.0.title                            | Ms                                  |
      | officials.0.surname                          | ResultsForeign{SCENARIO_ID}              |
      | officials.0.forename                         | Bench                               |
      | officials.0.type                             | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Mr                                 |
      | applicant.person.name.firstName              | Closed                             |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                           |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                      |
      | applicant.person.contactDetails.email        | results-closed{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RCLO-{RANDOM}                      |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | RCLO-{RANDOM}                      |
      | accountNumber                                | RCLO-{RANDOM}                      |
      | notes                                        | Results closed entry               |
      | lodgementDate                                | todayiso                           |
      | officials.0.title                            | Mr                                 |
      | officials.0.surname                          | ResultsClosed{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                              |
      | officials.0.type                             | CLERK                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedResultId"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm                           |
      | status            | CLOSED                                |
      | description       | ARCPOC-1461 results create C {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:openEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "404"
    When User Makes POST API Request To "/application-lists/:openListId/entries/00000000-0000-0000-0000-000000000001/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "404"
    When User Makes POST API Request To "/application-lists/:openListId/entries/:foreignEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "409"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:closedEntryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "404"
    When User Makes GET API Request To "/application-lists/:openListId/entries/00000000-0000-0000-0000-000000000001/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "404"
    When User Makes GET API Request To "/application-lists/:openListId/entries/:foreignEntryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/:closedListId/entries/:closedEntryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @applicationListEntryResults @regression @ARCPOC-1461
  Scenario: Update and delete results return 404 and 409 for missing resources, wrong parentage and wrong state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | ARCPOC-1461 results update A {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Mr                                 |
      | applicant.person.name.firstName              | Update                             |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                     |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street               |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                           |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                      |
      | applicant.person.contactDetails.email        | results-update{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RUPD-{RANDOM}                      |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | RUPD-{RANDOM}                      |
      | accountNumber                                | RUPD-{RANDOM}                      |
      | notes                                        | Results update entry               |
      | lodgementDate                                | todayiso                           |
      | officials.0.title                            | Mr                                 |
      | officials.0.surname                          | ResultsUpdate{SCENARIO_ID}              |
      | officials.0.forename                         | Clerk                              |
      | officials.0.type                             | CLERK                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                |
      | applicationCode                              | AD99002                             |
      | applicant.person.name.title                  | Ms                                  |
      | applicant.person.name.firstName              | Sibling                             |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                      |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                         |
      | applicant.person.contactDetails.addressLine3 | London                              |
      | applicant.person.contactDetails.addressLine4 | Greater London                      |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                        |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                       |
      | applicant.person.contactDetails.email        | results-sibling{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RESSIB-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                                |
      | feeStatuses.0.statusDate                     | todayiso                            |
      | hasOffsiteFee                                | false                               |
      | caseReference                                | RESSIB-{RANDOM}                     |
      | accountNumber                                | RESSIB-{RANDOM}                     |
      | notes                                        | Results sibling entry               |
      | lodgementDate                                | todayiso                            |
      | officials.0.title                            | Ms                                  |
      | officials.0.surname                          | ResultsSibling{SCENARIO_ID}              |
      | officials.0.forename                         | Bench                               |
      | officials.0.type                             | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "siblingEntryId"
    When User Makes POST API Request To "/application-lists/:openListId/entries/:openEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-1h                        |
      | status            | OPEN                                  |
      | description       | ARCPOC-1461 results update B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                                      |
      | applicationCode                              | AD99002                                   |
      | applicant.person.name.title                  | Mr                                        |
      | applicant.person.name.firstName              | Closed                                    |
      | applicant.person.name.lastName               | Result{SCENARIO_ID}                            |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Street                     |
      | applicant.person.contactDetails.addressLine2 | Westminster                               |
      | applicant.person.contactDetails.addressLine3 | London                                    |
      | applicant.person.contactDetails.addressLine4 | Greater London                            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                            |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                                  |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                              |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                             |
      | applicant.person.contactDetails.email        | results-closed-update{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | RCLUP-{RANDOM}                            |
      | feeStatuses.0.paymentStatus                  | PAID                                      |
      | feeStatuses.0.statusDate                     | todayiso                                  |
      | hasOffsiteFee                                | false                                     |
      | caseReference                                | RCLUP-{RANDOM}                            |
      | accountNumber                                | RCLUP-{RANDOM}                            |
      | notes                                        | Results closed update entry               |
      | lodgementDate                                | todayiso                                  |
      | officials.0.title                            | Mr                                        |
      | officials.0.surname                          | ResultsClosedUpdate{SCENARIO_ID}               |
      | officials.0.forename                         | Clerk                                     |
      | officials.0.type                             | CLERK                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedResultId"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-1h                        |
      | status            | CLOSED                                |
      | description       | ARCPOC-1461 results update B {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "200"
    When User Makes PUT API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:openEntryId/results/:resultId" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:openListId/entries/00000000-0000-0000-0000-000000000001/results/:resultId" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:openListId/entries/:openEntryId/results/00000000-0000-0000-0000-000000000001" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:openListId/entries/:siblingEntryId/results/:resultId" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/:closedListId/entries/:closedEntryId/results/:closedResultId" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "409"
    When User Makes DELETE API Request To "/application-lists/entries/results" With Object Builder:
      | results.0.listId   | 00000000-0000-0000-0000-000000000001 |
      | results.0.entryId  | :openEntryId                         |
      | results.0.resultId | :resultId                            |
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/entries/results" With Object Builder:
      | results.0.listId   | :openListId                          |
      | results.0.entryId  | 00000000-0000-0000-0000-000000000001 |
      | results.0.resultId | :resultId                            |
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/entries/results" With Object Builder:
      | results.0.listId   | :openListId                          |
      | results.0.entryId  | :openEntryId                         |
      | results.0.resultId | 00000000-0000-0000-0000-000000000001 |
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/entries/results" With Object Builder:
      | results.0.listId   | :openListId     |
      | results.0.entryId  | :siblingEntryId |
      | results.0.resultId | :resultId       |
    Then User Verify Response Status Code Should Be "409"
    When User Makes DELETE API Request To "/application-lists/entries/results" With Object Builder:
      | results.0.listId   | :closedListId   |
      | results.0.entryId  | :closedEntryId  |
      | results.0.resultId | :closedResultId |
    Then User Verify Response Status Code Should Be "409"

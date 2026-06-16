Feature: API - Application List Entry Error Responses

  Background:
    Given User Authenticates Via API As "user1"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Create entry returns 404 for a missing list and 409 for a closed list
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 create state {RANDOM} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Closed                         |
      | applicant.person.name.lastName               | CreateState{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | create-state{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | CRESTATE-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CRESTATE-{RANDOM}              |
      | accountNumber                                | CRESTATE-{RANDOM}              |
      | notes                                        | Entry used to close list       |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | CreateState{RANDOM}            |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
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
      | description       | ARCPOC-1461 create state {RANDOM} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Missing                        |
      | applicant.person.name.lastName               | List{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | missing-list{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MISSLIST-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | MISSLIST-{RANDOM}              |
      | accountNumber                                | MISSLIST-{RANDOM}              |
      | notes                                        | Missing list create            |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | MissingList{RANDOM}            |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "404"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Ms                              |
      | applicant.person.name.firstName              | Closed                          |
      | applicant.person.name.lastName               | Rejected{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                        |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                   |
      | applicant.person.contactDetails.email        | closed-rejected{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | CLOSED-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | CLOSED-{RANDOM}                 |
      | accountNumber                                | CLOSED-{RANDOM}                 |
      | notes                                        | Closed list create attempt      |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Ms                              |
      | officials.0.surname                          | ClosedReject{RANDOM}            |
      | officials.0.forename                         | Bench                           |
      | officials.0.type                             | MAGISTRATE                      |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Get and update entry return expected statuses for missing resources, wrong parentage and closed lists
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                       |
      | time              | timenowhhmm-3h                 |
      | status            | OPEN                           |
      | description       | ARCPOC-1461 get update A {RANDOM} |
      | courtLocationCode | RCJ001                         |
      | durationHours     | 2                              |
      | durationMinutes   | 22                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                       |
      | time              | timenowhhmm-2h                 |
      | status            | OPEN                           |
      | description       | ARCPOC-1461 get update B {RANDOM} |
      | courtLocationCode | RCJ001                         |
      | durationHours     | 2                              |
      | durationMinutes   | 22                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                       |
      | time              | timenowhhmm-1h                 |
      | status            | OPEN                           |
      | description       | ARCPOC-1461 get update closed {RANDOM} |
      | courtLocationCode | RCJ001                         |
      | durationHours     | 2                              |
      | durationMinutes   | 22                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Primary                         |
      | applicant.person.name.lastName               | Entry{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | primary-entry{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PRIMARY-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | PRIMARY-{RANDOM}                |
      | accountNumber                                | PRIMARY-{RANDOM}                |
      | notes                                        | Primary entry                   |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | Primary{RANDOM}                 |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Ms                              |
      | applicant.person.name.firstName              | Foreign                         |
      | applicant.person.name.lastName               | Entry{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                        |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                   |
      | applicant.person.contactDetails.email        | foreign-entry{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | FOREIGN-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | FOREIGN-{RANDOM}                |
      | accountNumber                                | FOREIGN-{RANDOM}                |
      | notes                                        | Foreign entry                   |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Ms                              |
      | officials.0.surname                          | Foreign{RANDOM}                 |
      | officials.0.forename                         | Bench                           |
      | officials.0.type                             | MAGISTRATE                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Closed                          |
      | applicant.person.name.lastName               | Entry{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                        |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                   |
      | applicant.person.contactDetails.email        | closed-entry{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | CLENT-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | CLENT-{RANDOM}                  |
      | accountNumber                                | CLENT-{RANDOM}                  |
      | notes                                        | Closed entry                    |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | Closed{RANDOM}                  |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
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
      | description       | ARCPOC-1461 get update closed {RANDOM} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
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
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Mr                                 |
      | applicant.person.name.firstName              | Updated                            |
      | applicant.person.name.lastName               | MissingList{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street               |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                           |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                      |
      | applicant.person.contactDetails.email        | update-missing-list{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEA-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | UPDATEA-{RANDOM}                   |
      | accountNumber                                | UPDATEA-{RANDOM}                   |
      | notes                                        | Update missing list                |
      | officials.0.title                            | Mr                                 |
      | officials.0.surname                          | UpdateA{RANDOM}                    |
      | officials.0.forename                         | Clerk                              |
      | officials.0.type                             | CLERK                              |
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/:primaryListId/entries/00000000-0000-0000-0000-000000000001" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Ms                                 |
      | applicant.person.name.firstName              | Updated                            |
      | applicant.person.name.lastName               | MissingEntry{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                           |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                      |
      | applicant.person.contactDetails.email        | update-missing-entry{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEB-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | UPDATEB-{RANDOM}                   |
      | accountNumber                                | UPDATEB-{RANDOM}                   |
      | notes                                        | Update missing entry               |
      | officials.0.title                            | Ms                                 |
      | officials.0.surname                          | UpdateB{RANDOM}                    |
      | officials.0.forename                         | Bench                              |
      | officials.0.type                             | MAGISTRATE                         |
    Then User Verify Response Status Code Should Be "404"
    When User Makes PUT API Request To "/application-lists/:primaryListId/entries/:foreignEntryId" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Ms                                 |
      | applicant.person.name.firstName              | Updated                            |
      | applicant.person.name.lastName               | WrongParent{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                           |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                      |
      | applicant.person.contactDetails.email        | update-wrong-parent{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | UPDATEC-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | UPDATEC-{RANDOM}                   |
      | accountNumber                                | UPDATEC-{RANDOM}                   |
      | notes                                        | Update wrong parent                |
      | officials.0.title                            | Ms                                 |
      | officials.0.surname                          | UpdateC{RANDOM}                    |
      | officials.0.forename                         | Bench                              |
      | officials.0.type                             | MAGISTRATE                         |
    Then User Verify Response Status Code Should Be "409"
    When User Makes PUT API Request To "/application-lists/:closedListId/entries/:closedEntryId" With Object Builder:
      | standardApplicantCode                        | null                               |
      | applicationCode                              | AD99002                            |
      | applicant.person.name.title                  | Mr                                 |
      | applicant.person.name.firstName              | Closed                             |
      | applicant.person.name.lastName               | WrongState{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                        |
      | applicant.person.contactDetails.addressLine3 | London                             |
      | applicant.person.contactDetails.addressLine4 | Greater London                     |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                     |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                           |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                       |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                      |
      | applicant.person.contactDetails.email        | update-closed{RANDOM}@example.com  |
      | feeStatuses.0.paymentReference               | UPDATED-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                               |
      | feeStatuses.0.statusDate                     | todayiso                           |
      | hasOffsiteFee                                | false                              |
      | caseReference                                | UPDATED-{RANDOM}                   |
      | accountNumber                                | UPDATED-{RANDOM}                   |
      | notes                                        | Update closed list                 |
      | officials.0.title                            | Mr                                 |
      | officials.0.surname                          | UpdateClosed{RANDOM}               |
      | officials.0.forename                         | Clerk                              |
      | officials.0.type                             | CLERK                              |
    Then User Verify Response Status Code Should Be "409"

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario: Delete entry returns 404 and 409 for missing resources, wrong parentage and invalid state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                     |
      | time              | timenowhhmm-2h               |
      | status            | OPEN                         |
      | description       | ARCPOC-1461 delete A {RANDOM} |
      | courtLocationCode | RCJ001                       |
      | durationHours     | 2                            |
      | durationMinutes   | 22                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                     |
      | time              | timenowhhmm-1h               |
      | status            | OPEN                         |
      | description       | ARCPOC-1461 delete B {RANDOM} |
      | courtLocationCode | RCJ001                       |
      | durationHours     | 2                            |
      | durationMinutes   | 22                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "otherListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Delete                       |
      | applicant.person.name.lastName               | Source{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | delete-source{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | DELSRC-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | DELSRC-{RANDOM}              |
      | accountNumber                                | DELSRC-{RANDOM}              |
      | notes                                        | Delete source                |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | DeleteSource{RANDOM}         |
      | officials.0.forename                         | Clerk                        |
      | officials.0.type                             | CLERK                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceEntryId"
    When User Makes POST API Request To "/application-lists/:otherListId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Ms                           |
      | applicant.person.name.firstName              | Delete                       |
      | applicant.person.name.lastName               | Other{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                     |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                |
      | applicant.person.contactDetails.email        | delete-other{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | DELOTH-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | DELOTH-{RANDOM}              |
      | accountNumber                                | DELOTH-{RANDOM}              |
      | notes                                        | Delete other                 |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Ms                           |
      | officials.0.surname                          | DeleteOther{RANDOM}          |
      | officials.0.forename                         | Bench                        |
      | officials.0.type                             | MAGISTRATE                   |
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
      | date              | todayiso                        |
      | time              | timenowhhmm-2h                  |
      | status            | OPEN                            |
      | description       | ARCPOC-1461 closed entry A {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm-1h                  |
      | status            | OPEN                            |
      | description       | ARCPOC-1461 closed entry B {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm                     |
      | status            | OPEN                            |
      | description       | ARCPOC-1461 closed entry C {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Open                           |
      | applicant.person.name.lastName               | ClosedUpdate{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | closed-open{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | COPEN-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | COPEN-{RANDOM}                 |
      | accountNumber                                | COPEN-{RANDOM}                 |
      | notes                                        | Open list note                 |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Open{RANDOM}                   |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Ms                                |
      | applicant.person.name.firstName              | Closed                            |
      | applicant.person.name.lastName               | Valid{RANDOM}                     |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                          |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                     |
      | applicant.person.contactDetails.email        | closed-valid{RANDOM}@example.com  |
      | feeStatuses.0.paymentReference               | CVAL-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | CVAL-{RANDOM}                     |
      | accountNumber                                | CVAL-{RANDOM}                     |
      | notes                                        | Closed list note                  |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Ms                                |
      | officials.0.surname                          | ClosedValid{RANDOM}               |
      | officials.0.forename                         | Bench                             |
      | officials.0.type                             | MAGISTRATE                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-1h                     |
      | status            | CLOSED                             |
      | description       | ARCPOC-1461 closed entry B {RANDOM} |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "200"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Foreign                          |
      | applicant.person.name.lastName               | Closed{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                         |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                    |
      | applicant.person.contactDetails.email        | closed-foreign{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | CFOR-{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CFOR-{RANDOM}                    |
      | accountNumber                                | CFOR-{RANDOM}                    |
      | notes                                        | Foreign closed entry             |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | ClosedForeign{RANDOM}            |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
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
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 officials A {RANDOM}  |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-1h                    |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 officials B {RANDOM}  |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm                       |
      | status            | OPEN                              |
      | description       | ARCPOC-1461 officials C {RANDOM}  |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:primaryListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Primary                        |
      | applicant.person.name.lastName               | Officials{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | officials-primary{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | OFFA-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | OFFA-{RANDOM}                  |
      | accountNumber                                | OFFA-{RANDOM}                  |
      | notes                                        | Officials primary              |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Original{RANDOM}               |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "primaryEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Ms                             |
      | applicant.person.name.firstName              | Foreign                        |
      | applicant.person.name.lastName               | Officials{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                  |
      | applicant.person.contactDetails.email        | officials-foreign{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | OFFB-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | OFFB-{RANDOM}                  |
      | accountNumber                                | OFFB-{RANDOM}                  |
      | notes                                        | Officials foreign              |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Ms                             |
      | officials.0.surname                          | Foreign{RANDOM}                |
      | officials.0.forename                         | Bench                          |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Closed                         |
      | applicant.person.name.lastName               | Officials{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                       |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                  |
      | applicant.person.contactDetails.email        | officials-closed{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | OFFC-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | OFFC-{RANDOM}                  |
      | accountNumber                                | OFFC-{RANDOM}                  |
      | notes                                        | Officials closed               |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Closed{RANDOM}                 |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
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
      | description       | ARCPOC-1461 officials C {RANDOM} |
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

  @api @applicationListEntry @applicationListEntryResults @regression @ARCPOC-1461
  Scenario: Create and retrieve results return 404 and 409 for missing resources and wrong parentage, while closed-list retrieval remains available
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 results create A {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-1h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 results create B {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm                      |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 results create C {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Open                           |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-open{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RESOPEN-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RESOPEN-{RANDOM}               |
      | accountNumber                                | RESOPEN-{RANDOM}               |
      | notes                                        | Results open entry             |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | ResultsOpen{RANDOM}            |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:foreignListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Ms                             |
      | applicant.person.name.firstName              | Foreign                        |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-foreign{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RFOR-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RFOR-{RANDOM}                  |
      | accountNumber                                | RFOR-{RANDOM}                  |
      | notes                                        | Results foreign entry          |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Ms                             |
      | officials.0.surname                          | ResultsForeign{RANDOM}         |
      | officials.0.forename                         | Bench                          |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "foreignEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Closed                         |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                       |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-closed{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RCLO-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RCLO-{RANDOM}                  |
      | accountNumber                                | RCLO-{RANDOM}                  |
      | notes                                        | Results closed entry           |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | ResultsClosed{RANDOM}          |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedResultId"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm                            |
      | status            | CLOSED                                 |
      | description       | ARCPOC-1461 results create C {RANDOM}  |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
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
    Then User Verify Response Status Code Should Be "200"

  @api @applicationListEntry @applicationListEntryResults @regression @ARCPOC-1461
  Scenario: Update and delete results return 404 and 409 for missing resources, wrong parentage and wrong state
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 results update A {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openListId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Update                         |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-update{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RUPD-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RUPD-{RANDOM}                  |
      | accountNumber                                | RUPD-{RANDOM}                  |
      | notes                                        | Results update entry           |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | ResultsUpdate{RANDOM}          |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "openEntryId"
    When User Makes POST API Request To "/application-lists/:openListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Ms                             |
      | applicant.person.name.firstName              | Sibling                        |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-sibling{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RESSIB-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RESSIB-{RANDOM}                |
      | accountNumber                                | RESSIB-{RANDOM}                |
      | notes                                        | Results sibling entry          |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Ms                             |
      | officials.0.surname                          | ResultsSibling{RANDOM}         |
      | officials.0.forename                         | Bench                          |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "siblingEntryId"
    When User Makes POST API Request To "/application-lists/:openListId/entries/:openEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-1h                   |
      | status            | OPEN                             |
      | description       | ARCPOC-1461 results update B {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedListId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Closed                         |
      | applicant.person.name.lastName               | Result{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                       |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                  |
      | applicant.person.contactDetails.email        | results-closed-update{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | RCLUP-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | RCLUP-{RANDOM}                 |
      | accountNumber                                | RCLUP-{RANDOM}                 |
      | notes                                        | Results closed update entry    |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | ResultsClosedUpdate{RANDOM}    |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedEntryId"
    When User Makes POST API Request To "/application-lists/:closedListId/entries/:closedEntryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "closedResultId"
    When User Makes PUT API Request To "/application-lists/:closedListId" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-1h                         |
      | status            | CLOSED                                 |
      | description       | ARCPOC-1461 results update B {RANDOM}  |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
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
    When User Makes DELETE API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries/:openEntryId/results/:resultId"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:openListId/entries/00000000-0000-0000-0000-000000000001/results/:resultId"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:openListId/entries/:openEntryId/results/00000000-0000-0000-0000-000000000001"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:openListId/entries/:siblingEntryId/results/:resultId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes DELETE API Request To "/application-lists/:closedListId/entries/:closedEntryId/results/:closedResultId"
    Then User Verify Response Status Code Should Be "409"

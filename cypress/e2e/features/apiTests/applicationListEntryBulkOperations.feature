Feature: API - Application List Entry Bulk Operations

  @api @applicationListEntry @regression @ARCPOC-275
  Scenario Outline: Replace officials for multiple application list entries
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                                 |
      | time              | timenowhhmm-2h                           |
      | status            | OPEN                                     |
      | description       | Bulk officials replacement list {RANDOM} |
      | courtLocationCode | RCJ001                                   |
      | durationHours     | 2                                        |
      | durationMinutes   | 22                                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | First                      |
      | applicant.person.name.lastName               | BulkOfficial{RANDOM}A      |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                   |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}              |
      | applicant.person.contactDetails.email        | bulk-a{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-A-{RANDOM}             |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-A-{RANDOM}            |
      | accountNumber                                | ACC-A-{RANDOM}             |
      | notes                                        | Bulk official entry A      |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | OriginalA{RANDOM}          |
      | officials.0.forename                         | Clerk                      |
      | officials.0.type                             | CLERK                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Ms                         |
      | applicant.person.name.firstName              | Second                     |
      | applicant.person.name.lastName               | BulkOfficial{RANDOM}B      |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street     |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | BS1 5AA                    |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}              |
      | applicant.person.contactDetails.email        | bulk-b{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-B-{RANDOM}             |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-B-{RANDOM}            |
      | accountNumber                                | ACC-B-{RANDOM}             |
      | notes                                        | Bulk official entry B      |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mrs                        |
      | officials.0.surname                          | OriginalB{RANDOM}          |
      | officials.0.forename                         | Bench                      |
      | officials.0.type                             | MAGISTRATE                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/officials" With Object Builder:
      | entryIds.0           | :entryId1     |
      | entryIds.1           | :entryId2     |
      | officials.0.title    | Ms            |
      | officials.0.surname  | Bench{RANDOM} |
      | officials.0.forename | Ada           |
      | officials.0.type     | MAGISTRATE    |
      | officials.1.title    | Mr            |
      | officials.1.surname  | Clerk{RANDOM} |
      | officials.1.forename | Clive         |
      | officials.1.type     | CLERK         |
    Then User Verify Response Status Code Should Be "204"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId1"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | officials.length      | 2             |
      | officials[0].title    | Ms            |
      | officials[0].forename | Ada           |
      | officials[0].surname  | Bench{RANDOM} |
      | officials[0].type     | MAGISTRATE    |
      | officials[1].title    | Mr            |
      | officials[1].forename | Clive         |
      | officials[1].surname  | Clerk{RANDOM} |
      | officials[1].type     | CLERK         |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId2"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | officials.length      | 2             |
      | officials[0].title    | Ms            |
      | officials[0].forename | Ada           |
      | officials[0].surname  | Bench{RANDOM} |
      | officials[0].type     | MAGISTRATE    |
      | officials[1].title    | Mr            |
      | officials[1].forename | Clive         |
      | officials[1].surname  | Clerk{RANDOM} |
      | officials[1].type     | CLERK         |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-277
  Scenario Outline: Reject duplicate entry ids in bulk officials replacement
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | Duplicate officials list {RANDOM} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                          |
      | applicationCode                              | AD99002                       |
      | applicant.person.name.title                  | Mr                            |
      | applicant.person.name.firstName              | Duplicate                     |
      | applicant.person.name.lastName               | Officials{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                   |
      | applicant.person.contactDetails.addressLine3 | London                        |
      | applicant.person.contactDetails.addressLine4 | Greater London                |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                      |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                  |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                 |
      | applicant.person.contactDetails.email        | duplicate{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                          |
      | feeStatuses.0.statusDate                     | todayiso                      |
      | hasOffsiteFee                                | false                         |
      | caseReference                                | CASE-{RANDOM}                 |
      | accountNumber                                | ACC-{RANDOM}                  |
      | notes                                        | Duplicate officials setup     |
      | lodgementDate                                | todayiso                      |
      | officials.0.title                            | Mr                            |
      | officials.0.surname                          | Original{RANDOM}              |
      | officials.0.forename                         | Keeper                        |
      | officials.0.type                             | CLERK                         |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/officials" With Object Builder:
      | entryIds.0           | :entryId    |
      | entryIds.1           | :entryId    |
      | officials.0.title    | Ms          |
      | officials.0.surname  | Replacement |
      | officials.0.forename | Ada         |
      | officials.0.type     | MAGISTRATE  |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | AL-21 |
      | status | 400   |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | officials.length      | 1                |
      | officials[0].title    | Mr               |
      | officials[0].forename | Keeper           |
      | officials[0].surname  | Original{RANDOM} |
      | officials[0].type     | CLERK            |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1461
  Scenario Outline: Reject bulk officials replacement when one target entry does not exist
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm-2h                  |
      | status            | OPEN                            |
      | description       | Invalid officials list {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                  |
      | applicationCode                              | AD99002                               |
      | applicant.person.name.title                  | Mr                                    |
      | applicant.person.name.firstName              | Missing                               |
      | applicant.person.name.lastName               | Officials{RANDOM}                     |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                           |
      | applicant.person.contactDetails.addressLine3 | London                                |
      | applicant.person.contactDetails.addressLine4 | Greater London                        |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                        |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                              |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                          |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                         |
      | applicant.person.contactDetails.email        | missing-officials{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | OFFMISS-{RANDOM}                      |
      | feeStatuses.0.paymentStatus                  | PAID                                  |
      | feeStatuses.0.statusDate                     | todayiso                              |
      | hasOffsiteFee                                | false                                 |
      | caseReference                                | OFFMISS-{RANDOM}                      |
      | accountNumber                                | OFFMISS-{RANDOM}                      |
      | notes                                        | Bulk officials unchanged              |
      | lodgementDate                                | todayiso                              |
      | officials.0.title                            | Mr                                    |
      | officials.0.surname                          | Original{RANDOM}                      |
      | officials.0.forename                         | Clerk                                 |
      | officials.0.type                             | CLERK                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/officials" With Object Builder:
      | entryIds.0           | :entryId                             |
      | entryIds.1           | 00000000-0000-0000-0000-000000000001 |
      | officials.0.title    | Ms                                   |
      | officials.0.surname  | Replacement                          |
      | officials.0.forename | Ada                                  |
      | officials.0.type     | MAGISTRATE                           |
    Then User Verify Response Status Code Should Be "400"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | officials.length      | 1     |
      | officials[0].title    | Mr    |
      | officials[0].forename | Clerk |
      | officials[0].type     | CLERK |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Reject application list entry lookup when the source list does not exist
    Given User Authenticates Via API As "<User>"
    When User Makes GET API Request To "/application-lists/00000000-0000-0000-0000-000000000001/entries?pageNumber=0&pageSize=1"
    Then User Verify Response Status Code Should Be "404"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @applicationListEntryResults @regression
  Scenario Outline: Compose bulk officials replacement and bulk result creation
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                       |
      | time              | timenowhhmm-2h                 |
      | status            | OPEN                           |
      | description       | Bulk composition list {RANDOM} |
      | courtLocationCode | RCJ001                         |
      | durationHours     | 2                              |
      | durationMinutes   | 22                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Bulk                         |
      | applicant.person.name.lastName               | ComposeOne{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | compose1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | COMPOSE1-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | COMPOSE1-{RANDOM}            |
      | accountNumber                                | COMPOSE1-{RANDOM}            |
      | notes                                        | Compose bulk entry one       |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | OriginalOne{RANDOM}          |
      | officials.0.forename                         | Clerk                        |
      | officials.0.type                             | CLERK                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Ms                           |
      | applicant.person.name.firstName              | Bulk                         |
      | applicant.person.name.lastName               | ComposeTwo{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                     |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                |
      | applicant.person.contactDetails.email        | compose2{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | COMPOSE2-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | COMPOSE2-{RANDOM}            |
      | accountNumber                                | COMPOSE2-{RANDOM}            |
      | notes                                        | Compose bulk entry two       |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Ms                           |
      | officials.0.surname                          | OriginalTwo{RANDOM}          |
      | officials.0.forename                         | Bench                        |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/officials" With Object Builder:
      | entryIds.0           | :entryId1   |
      | entryIds.1           | :entryId2   |
      | officials.0.title    | Ms          |
      | officials.0.surname  | Replacement |
      | officials.0.forename | Ada         |
      | officials.0.type     | MAGISTRATE  |
      | officials.1.title    | Mr          |
      | officials.1.surname  | Clerk       |
      | officials.1.forename | Clive       |
      | officials.1.type     | CLERK       |
    Then User Verify Response Status Code Should Be "204"
    When User Makes POST API Request To "/application-lists/:listId/entries/results" With Object Builder:
      | entryIds.0                   | :entryId1          |
      | entryIds.1                   | :entryId2          |
      | result.resultCode            | RTC                |
      | result.wordingFields.0.key   | Date               |
      | result.wordingFields.0.value | 24-02-2026         |
      | result.wordingFields.1.key   | Courthouse         |
      | result.wordingFields.1.value | London Crown Court |
    Then User Verify Response Status Code Should Be "200"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId1"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | officials.length  | 2          |
      | officials[0].type | MAGISTRATE |
      | officials[1].type | CLERK      |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId1/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements         | 1   |
      | content[0].resultCode | RTC |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId2/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements         | 1   |
      | content[0].resultCode | RTC |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-1186
  Scenario Outline: Apply the same result to multiple entries in a list
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Bulk result single list {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Mr                          |
      | applicant.person.name.firstName              | Result                      |
      | applicant.person.name.lastName               | BulkOne{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}               |
      | applicant.person.contactDetails.email        | result1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-1-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | CASE-1-{RANDOM}             |
      | accountNumber                                | ACC-1-{RANDOM}              |
      | notes                                        | Bulk result entry one       |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | Official1{RANDOM}           |
      | officials.0.forename                         | John                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Ms                          |
      | applicant.person.name.firstName              | Result                      |
      | applicant.person.name.lastName               | BulkTwo{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                    |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}               |
      | applicant.person.contactDetails.email        | result2{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-2-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | CASE-2-{RANDOM}             |
      | accountNumber                                | ACC-2-{RANDOM}              |
      | notes                                        | Bulk result entry two       |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Ms                          |
      | officials.0.surname                          | Official2{RANDOM}           |
      | officials.0.forename                         | Jane                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/results" With Object Builder:
      | entryIds.0                   | :entryId1          |
      | entryIds.1                   | :entryId2          |
      | result.resultCode            | RTC                |
      | result.wordingFields.0.key   | Date               |
      | result.wordingFields.0.value | 24-02-2026         |
      | result.wordingFields.1.key   | Courthouse         |
      | result.wordingFields.1.value | London Crown Court |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "length" Should Be "2"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId1/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                  |
      | content[0].entryId                                       | :entryId1          |
      | content[0].resultCode                                    | RTC                |
      | content[0].wording.substitution-key-constraints[0].key   | Date               |
      | content[0].wording.substitution-key-constraints[0].value | 24-02-2026         |
      | content[0].wording.substitution-key-constraints[1].key   | Courthouse         |
      | content[0].wording.substitution-key-constraints[1].value | London Crown Court |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId2/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                  |
      | content[0].entryId                                       | :entryId2          |
      | content[0].resultCode                                    | RTC                |
      | content[0].wording.substitution-key-constraints[0].key   | Date               |
      | content[0].wording.substitution-key-constraints[0].value | 24-02-2026         |
      | content[0].wording.substitution-key-constraints[1].key   | Courthouse         |
      | content[0].wording.substitution-key-constraints[1].value | London Crown Court |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-1186
  Scenario Outline: Reject bulk result creation when one target entry is invalid
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | description       | Bulk result rollback list {RANDOM} |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Rollback                     |
      | applicant.person.name.lastName               | Candidate{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | rollback{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | CASE-{RANDOM}                |
      | accountNumber                                | ACC-{RANDOM}                 |
      | notes                                        | Bulk result rollback         |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Rollback{RANDOM}             |
      | officials.0.forename                         | John                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/results" With Object Builder:
      | entryIds.0                   | :entryId                             |
      | entryIds.1                   | 00000000-0000-0000-0000-000000000001 |
      | result.resultCode            | RTC                                  |
      | result.wordingFields.0.key   | Date                                 |
      | result.wordingFields.0.value | 24-02-2026                           |
      | result.wordingFields.1.key   | Courthouse                           |
      | result.wordingFields.1.value | London Crown Court                   |
    Then User Verify Response Status Code Should Be "404"
    Then User Verify Response Body Should Have:
      | type   | ALER-4 |
      | status | 404    |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-1186
  Scenario Outline: Apply the same result to multiple entries across lists
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm-2h                  |
      | status            | OPEN                            |
      | description       | Bulk cross-list source {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId1"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm-1h                  |
      | status            | OPEN                            |
      | description       | Bulk cross-list target {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId2"
    When User Makes POST API Request To "/application-lists/:listId1/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | Cross                      |
      | applicant.person.name.lastName               | ListOne{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                   |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}              |
      | applicant.person.contactDetails.email        | cross1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-CL1-{RANDOM}           |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-CL1-{RANDOM}          |
      | accountNumber                                | ACC-CL1-{RANDOM}           |
      | notes                                        | Cross-list entry one       |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | CrossOne{RANDOM}           |
      | officials.0.forename                         | John                       |
      | officials.0.type                             | MAGISTRATE                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId2/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Ms                         |
      | applicant.person.name.firstName              | Cross                      |
      | applicant.person.name.lastName               | ListTwo{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                   |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}              |
      | applicant.person.contactDetails.email        | cross2{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-CL2-{RANDOM}           |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-CL2-{RANDOM}          |
      | accountNumber                                | ACC-CL2-{RANDOM}           |
      | notes                                        | Cross-list entry two       |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Ms                         |
      | officials.0.surname                          | CrossTwo{RANDOM}           |
      | officials.0.forename                         | Jane                       |
      | officials.0.type                             | MAGISTRATE                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/entries/results" With Object Builder:
      | entryIds.0                   | :entryId1              |
      | entryIds.1                   | :entryId2              |
      | result.resultCode            | RTC                    |
      | result.wordingFields.0.key   | Date                   |
      | result.wordingFields.0.value | 25-02-2026             |
      | result.wordingFields.1.key   | Courthouse             |
      | result.wordingFields.1.value | Manchester Crown Court |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "length" Should Be "2"
    When User Makes GET API Request To "/application-lists/:listId1/entries/:entryId1/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                      |
      | content[0].entryId                                       | :entryId1              |
      | content[0].resultCode                                    | RTC                    |
      | content[0].wording.substitution-key-constraints[0].value | 25-02-2026             |
      | content[0].wording.substitution-key-constraints[1].value | Manchester Crown Court |
    When User Makes GET API Request To "/application-lists/:listId2/entries/:entryId2/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                      |
      | content[0].entryId                                       | :entryId2              |
      | content[0].resultCode                                    | RTC                    |
      | content[0].wording.substitution-key-constraints[0].value | 25-02-2026             |
      | content[0].wording.substitution-key-constraints[1].value | Manchester Crown Court |

    Examples:
      | User  |
      | user1 |

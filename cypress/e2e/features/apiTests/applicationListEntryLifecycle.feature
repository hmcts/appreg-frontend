Feature: API - Application List Entry Lifecycle

  @api @applicationListEntry @regression @ARCPOC-279
  Scenario Outline: Move application list entries between lists
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                  |
      | time              | timenowhhmm-3h            |
      | status            | OPEN                      |
      | description       | Move source list {RANDOM} |
      | courtLocationCode | RCJ001                    |
      | durationHours     | 2                         |
      | durationMinutes   | 22                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                  |
      | time              | timenowhhmm-2h            |
      | status            | OPEN                      |
      | description       | Move target list {RANDOM} |
      | courtLocationCode | RCJ001                    |
      | durationHours     | 2                         |
      | durationMinutes   | 22                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Mr                          |
      | applicant.person.name.firstName              | Move                        |
      | applicant.person.name.lastName               | SourceOne{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}               |
      | applicant.person.contactDetails.email        | source1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVE-S1-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | MOVE-S1-{RANDOM}            |
      | accountNumber                                | ACC-S1-{RANDOM}             |
      | notes                                        | Move source one             |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | SourceOne{RANDOM}           |
      | officials.0.forename                         | Clerk                       |
      | officials.0.type                             | CLERK                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceEntryId1"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Ms                          |
      | applicant.person.name.firstName              | Move                        |
      | applicant.person.name.lastName               | SourceTwo{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | BS1 5AA                     |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}               |
      | applicant.person.contactDetails.email        | source2{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVE-S2-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | MOVE-S2-{RANDOM}            |
      | accountNumber                                | ACC-S2-{RANDOM}             |
      | notes                                        | Move source two             |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Ms                          |
      | officials.0.surname                          | SourceTwo{RANDOM}           |
      | officials.0.forename                         | Bench                       |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceEntryId2"
    When User Makes POST API Request To "/application-lists/:targetListId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | Stay                       |
      | applicant.person.name.lastName               | TargetExisting{RANDOM}     |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Existing Street   |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                   |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}              |
      | applicant.person.contactDetails.email        | target{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVE-T-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | MOVE-T-{RANDOM}            |
      | accountNumber                                | ACC-T-{RANDOM}             |
      | notes                                        | Target existing entry      |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | Target{RANDOM}             |
      | officials.0.forename                         | Keeper                     |
      | officials.0.type                             | CLERK                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetEntryId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries/move" With Object Builder:
      | targetListId | :targetListId   |
      | entryIds.0   | :sourceEntryId1 |
      | entryIds.1   | :sourceEntryId2 |
    Then User Verify Response Status Code Should Be "200"
    When User Makes GET API Request To "/application-lists/:sourceListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |
    When User Makes GET API Request To "/application-lists/:targetListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 3 |
      | elementsOnPage | 3 |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :targetEntryId  |
      | :sourceEntryId1 |
      | :sourceEntryId2 |
    Then User Verify Response Body Array Property "content" At Field "sequenceNumber" Should Contain Values:
      | 1 |
      | 2 |
      | 3 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Accept duplicate move entry ids by de-duplicating the move set
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-3h                      |
      | status            | OPEN                                |
      | description       | Move duplicate source list {RANDOM} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-2h                      |
      | status            | OPEN                                |
      | description       | Move duplicate target list {RANDOM} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Move                         |
      | applicant.person.name.lastName               | Duplicate{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | move-dup{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVEDUP-{RANDOM}             |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | MOVEDUP-{RANDOM}             |
      | accountNumber                                | MOVEDUP-{RANDOM}             |
      | notes                                        | Move duplicate setup         |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Duplicate{RANDOM}            |
      | officials.0.forename                         | Clerk                        |
      | officials.0.type                             | CLERK                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries/move" With Object Builder:
      | targetListId | :targetListId |
      | entryIds.0   | :entryId      |
      | entryIds.1   | :entryId      |
    Then User Verify Response Status Code Should Be "200"
    When User Makes GET API Request To "/application-lists/:sourceListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |
    When User Makes GET API Request To "/application-lists/:targetListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements             | 1             |
      | elementsOnPage            | 1             |
      | content[0].id             | :entryId      |
      | content[0].listId         | :targetListId |
      | content[0].sequenceNumber | 1             |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Reject move when one entry belongs to another list
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                     |
      | time              | timenowhhmm-3h               |
      | status            | OPEN                         |
      | description       | Move invalid source {RANDOM} |
      | courtLocationCode | RCJ001                       |
      | durationHours     | 2                            |
      | durationMinutes   | 22                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                     |
      | time              | timenowhhmm-2h               |
      | status            | OPEN                         |
      | description       | Move invalid target {RANDOM} |
      | courtLocationCode | RCJ001                       |
      | durationHours     | 2                            |
      | durationMinutes   | 22                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                      |
      | time              | timenowhhmm-1h                |
      | status            | OPEN                          |
      | description       | Move invalid foreign {RANDOM} |
      | courtLocationCode | RCJ001                        |
      | durationHours     | 2                             |
      | durationMinutes   | 22                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "otherListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Source                       |
      | applicant.person.name.lastName               | Valid{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | move-src{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVESRC-{RANDOM}             |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | MOVESRC-{RANDOM}             |
      | accountNumber                                | MOVESRC-{RANDOM}             |
      | notes                                        | Move invalid source entry    |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Source{RANDOM}               |
      | officials.0.forename                         | Clerk                        |
      | officials.0.type                             | CLERK                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceEntryId"
    When User Makes POST API Request To "/application-lists/:targetListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Ms                              |
      | applicant.person.name.firstName              | Target                          |
      | applicant.person.name.lastName               | Existing{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Bridge Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                        |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                   |
      | applicant.person.contactDetails.email        | move-target{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVETGT-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | MOVETGT-{RANDOM}                |
      | accountNumber                                | MOVETGT-{RANDOM}                |
      | notes                                        | Move invalid target entry       |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Ms                              |
      | officials.0.surname                          | Target{RANDOM}                  |
      | officials.0.forename                         | Bench                           |
      | officials.0.type                             | MAGISTRATE                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetEntryId"
    When User Makes POST API Request To "/application-lists/:otherListId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Other                          |
      | applicant.person.name.lastName               | Foreign{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                       |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                  |
      | applicant.person.contactDetails.email        | move-other{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVEOTH-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | MOVEOTH-{RANDOM}               |
      | accountNumber                                | MOVEOTH-{RANDOM}               |
      | notes                                        | Move invalid foreign entry     |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Foreign{RANDOM}                |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "otherEntryId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries/move" With Object Builder:
      | targetListId | :targetListId  |
      | entryIds.0   | :sourceEntryId |
      | entryIds.1   | :otherEntryId  |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | AL-12 |
      | status | 400   |
    When User Makes GET API Request To "/application-lists/:sourceListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :sourceEntryId |
    When User Makes GET API Request To "/application-lists/:targetListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :targetEntryId |
    When User Makes GET API Request To "/application-lists/:otherListId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :otherEntryId |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Preserve result history when moving an entry between lists
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                    |
      | time              | timenowhhmm-3h              |
      | status            | OPEN                        |
      | description       | Move result source {RANDOM} |
      | courtLocationCode | RCJ001                      |
      | durationHours     | 2                           |
      | durationMinutes   | 22                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "sourceListId"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                    |
      | time              | timenowhhmm-2h              |
      | status            | OPEN                        |
      | description       | Move result target {RANDOM} |
      | courtLocationCode | RCJ001                      |
      | durationHours     | 2                           |
      | durationMinutes   | 22                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "targetListId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Result                          |
      | applicant.person.name.lastName               | Continuity{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | move-result{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | MOVERSLT-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | MOVERSLT-{RANDOM}               |
      | accountNumber                                | MOVERSLT-{RANDOM}               |
      | notes                                        | Move result continuity          |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | Continuity{RANDOM}              |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes POST API Request To "/application-lists/:sourceListId/entries/move" With Object Builder:
      | targetListId | :targetListId |
      | entryIds.0   | :entryId      |
    Then User Verify Response Status Code Should Be "200"
    When User Makes GET API Request To "/application-lists/:targetListId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements         | 1         |
      | content[0].id         | :resultId |
      | content[0].entryId    | :entryId  |
      | content[0].resultCode | APPC      |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-797 @ARCPOC-1461
  Scenario Outline: Soft delete an application list entry
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                  |
      | time              | timenowhhmm-2h            |
      | status            | OPEN                      |
      | description       | Soft delete list {RANDOM} |
      | courtLocationCode | RCJ001                    |
      | durationHours     | 2                         |
      | durationMinutes   | 22                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | Soft                       |
      | applicant.person.name.lastName               | Delete{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                   |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}              |
      | applicant.person.contactDetails.email        | delete{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-{RANDOM}              |
      | accountNumber                                | ACC-{RANDOM}               |
      | notes                                        | Soft delete setup          |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | Delete{RANDOM}             |
      | officials.0.forename                         | Clerk                      |
      | officials.0.type                             | CLERK                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes DELETE API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "204"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "404"
    When User Makes DELETE API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "409"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-927
  Scenario Outline: Persist offsite fees as separate fee records
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | Offsite persistence list {RANDOM} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99001                     |
      | applicant.person.name.title                  | Mr                          |
      | applicant.person.name.firstName              | Offsite                     |
      | applicant.person.name.lastName               | Persist{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.postcode     | AA1 1AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.email        | offsite{RANDOM}@example.com |
      | wordingFields                                | __empty_array__             |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | true                        |
      | caseReference                                | CASE-{RANDOM}               |
      | notes                                        | Offsite persistence         |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | Clerk{RANDOM}               |
      | officials.0.forename                         | John                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | id                              | :entryId     |
      | applicationCode                 | AD99001      |
      | hasOffsiteFee                   | true         |
      | feeStatuses.length              | 1            |
      | feeStatuses[0].paymentReference | PAY-{RANDOM} |
      | feeStatuses[0].paymentStatus    | PAID         |
      | feeStatuses[0].statusDate       | todayiso     |

    Examples:
      | User  |
      | user1 |

Feature: API - Application List Entry Fees

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-276 @ARCPOC-1421 @ARCPOC-1475
  Scenario Outline: Bulk update fee details for multiple application list entries
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                |
      | time              | timenowhhmm-2h          |
      | status            | OPEN                    |
      | description       | Bulk fees list {RANDOM} |
      | courtLocationCode | RCJ001                  |
      | durationHours     | 2                       |
      | durationMinutes   | 22                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Mr                        |
      | applicant.person.name.firstName              | Fee                       |
      | applicant.person.name.lastName               | Alpha{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                  |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}             |
      | applicant.person.contactDetails.email        | fee-a{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAYA{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                      |
      | feeStatuses.0.statusDate                     | 2025-01-10                |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | FEA{RANDOM}               |
      | accountNumber                                | FEA{RANDOM}               |
      | notes                                        | Bulk fees entry alpha     |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Mr                        |
      | officials.0.surname                          | FeeOfficialA{RANDOM}      |
      | officials.0.forename                         | Clerk                     |
      | officials.0.type                             | CLERK                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Ms                        |
      | applicant.person.name.firstName              | Fee                       |
      | applicant.person.name.lastName               | Beta{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street    |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | BS1 5AA                   |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}             |
      | applicant.person.contactDetails.email        | fee-b{RANDOM}@example.com |
      | feeStatuses.0.paymentStatus                  | DUE                       |
      | feeStatuses.0.statusDate                     | 2025-01-10                |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | FEB{RANDOM}               |
      | accountNumber                                | FEB{RANDOM}               |
      | notes                                        | Bulk fees entry beta      |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Ms                        |
      | officials.0.surname                          | FeeOfficialB{RANDOM}      |
      | officials.0.forename                         | Bench                     |
      | officials.0.type                             | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes PUT API Request To "/application-lists/:listId/entries/fees" With Object Builder:
      | entryIds.0                    | :entryId1   |
      | entryIds.1                    | :entryId2   |
      | feeDetails.0.paymentStatus    | REMITTED    |
      | feeDetails.0.statusDate       | 2025-10-07  |
      | feeDetails.0.paymentReference | PAY-UPDATED |
      | feeDetails.0.hasOffsiteFee    | true        |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalCount   | 2         |
      | updatedCount | 2         |
      | status       | SUCCEEDED |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId1"
    Then User Verify Response Status Code Should Be "200"
    # Then User Verify Response Body Should Have:
    #   | feeStatuses.length              | 1           |
    #   | feeStatuses[0].paymentStatus    | REMITTED    |
    #   | feeStatuses[0].statusDate       | 2025-10-07  |
    #   | feeStatuses[0].paymentReference | PAY-UPDATED |
    #   | hasOffsiteFee                   | true        |
    Then User Verify Response Body Should Have:
      | feeStatuses.length              | 2            |
      | feeStatuses[0].paymentStatus    | PAID         |
      | feeStatuses[0].statusDate       | 2025-01-10   |
      | feeStatuses[0].paymentReference | PAYA{RANDOM} |
      | hasOffsiteFee                   | true         |
      | feeStatuses[1].paymentStatus    | REMITTED     |
      | feeStatuses[1].statusDate       | 2025-10-07   |
      | feeStatuses[1].paymentReference | PAY-UPDATED  |
      | hasOffsiteFee                   | true         |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId2"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      # | feeStatuses.length              | 1           |
      # | feeStatuses[0].paymentStatus    | REMITTED    |
      # | feeStatuses[0].statusDate       | 2025-10-07  |
      # | feeStatuses[0].paymentReference | PAY-UPDATED |
      # | hasOffsiteFee                   | true        |
      | feeStatuses.length              | 2           |
      | feeStatuses[0].paymentStatus    | DUE         |
      | feeStatuses[0].statusDate       | 2025-01-10  |
      | feeStatuses[1].paymentStatus    | REMITTED    |
      | feeStatuses[1].statusDate       | 2025-10-07  |
      | feeStatuses[1].paymentReference | PAY-UPDATED |
      | hasOffsiteFee                   | true        |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-276 @ARCPOC-1421 @ARCPOC-1475
  Scenario Outline: Reject bulk fee update when one target entry is invalid
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-2h                         |
      | status            | OPEN                                   |
      | description       | Bulk fees invalid target list {RANDOM} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | Fee                             |
      | applicant.person.name.lastName               | InvalidTarget{RANDOM}           |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street            |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | fee-invalid{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAYI{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | 2025-01-10                      |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | FEI{RANDOM}                     |
      | accountNumber                                | FEI{RANDOM}                     |
      | notes                                        | Bulk fees invalid target        |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | FeeOfficialInvalid{RANDOM}      |
      | officials.0.forename                         | Clerk                           |
      | officials.0.type                             | CLERK                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/fees" With Object Builder:
      | entryIds.0                    | :entryId                             |
      | entryIds.1                    | 11111111-1111-1111-1111-111111111111 |
      | feeDetails.0.paymentStatus    | REMITTED                             |
      | feeDetails.0.statusDate       | 2025-10-07                           |
      | feeDetails.0.paymentReference | PAY-UPDATED                          |
      | feeDetails.0.hasOffsiteFee    | true                                 |
    Then User Verify Response Status Code Should Be "400"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | feeStatuses.length              | 1            |
      | feeStatuses[0].paymentStatus    | PAID         |
      | feeStatuses[0].statusDate       | 2025-01-10   |
      | feeStatuses[0].paymentReference | PAYI{RANDOM} |
      | hasOffsiteFee                   | false        |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-276 @ARCPOC-1421 @ARCPOC-1475
  Scenario Outline: Accept duplicate entry ids in bulk fee update by de-duplicating the target set
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | Bulk fees duplicate ids list {RANDOM} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Fee                               |
      | applicant.person.name.lastName               | Duplicate{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street              |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                          |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                     |
      | applicant.person.contactDetails.email        | fee-duplicate{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAYD{RANDOM}                      |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | 2025-01-10                        |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | FED{RANDOM}                       |
      | accountNumber                                | FED{RANDOM}                       |
      | notes                                        | Bulk fees duplicate ids           |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | FeeOfficialDuplicate{RANDOM}      |
      | officials.0.forename                         | Clerk                             |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/fees" With Object Builder:
      | entryIds.0                    | :entryId    |
      | entryIds.1                    | :entryId    |
      | feeDetails.0.paymentStatus    | REMITTED    |
      | feeDetails.0.statusDate       | 2025-10-07  |
      | feeDetails.0.paymentReference | PAY-UPDATED |
      | feeDetails.0.hasOffsiteFee    | true        |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalCount   | 1         |
      | updatedCount | 1         |
      | status       | SUCCEEDED |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | feeStatuses.length              | 2            |
      | feeStatuses[0].paymentStatus    | PAID         |
      | feeStatuses[0].statusDate       | 2025-01-10   |
      | feeStatuses[0].paymentReference | PAYD{RANDOM} |
      | feeStatuses[1].paymentStatus    | REMITTED     |
      | feeStatuses[1].statusDate       | 2025-10-07   |
      | feeStatuses[1].paymentReference | PAY-UPDATED  |
      | hasOffsiteFee                   | true         |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-276 @ARCPOC-1421 @ARCPOC-1475
  Scenario Outline: Preserve coherent fee readback after offsite entry bulk fee update
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Bulk fee composite list {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                  |
      | applicationCode                              | AD99001                               |
      | applicant.person.name.title                  | Mr                                    |
      | applicant.person.name.firstName              | Offsite                               |
      | applicant.person.name.lastName               | Composite{RANDOM}                     |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                           |
      | applicant.person.contactDetails.addressLine3 | London                                |
      | applicant.person.contactDetails.addressLine4 | Greater London                        |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                        |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                              |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                          |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                         |
      | applicant.person.contactDetails.email        | offsite-composite{RANDOM}@example.com |
      | wordingFields                                | __empty_array__                       |
      | feeStatuses.0.paymentReference               | OFFCMP-{RANDOM}                       |
      | feeStatuses.0.paymentStatus                  | PAID                                  |
      | feeStatuses.0.statusDate                     | todayiso                              |
      | hasOffsiteFee                                | true                                  |
      | caseReference                                | OFFCMP-{RANDOM}                       |
      | notes                                        | Offsite bulk fee composite            |
      | lodgementDate                                | todayiso                              |
      | officials.0.title                            | Mr                                    |
      | officials.0.surname                          | Composite{RANDOM}                     |
      | officials.0.forename                         | Clerk                                 |
      | officials.0.type                             | CLERK                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/fees" With Object Builder:
      | entryIds.0                    | :entryId        |
      | feeDetails.0.paymentStatus    | REMITTED        |
      | feeDetails.0.statusDate       | 2025-10-07      |
      | feeDetails.0.paymentReference | OFFSITE-UPDATED |
      | feeDetails.0.hasOffsiteFee    | true            |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalCount   | 1         |
      | updatedCount | 1         |
      | status       | SUCCEEDED |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | hasOffsiteFee                   | true            |
      | feeStatuses.length              | 2               |
      | feeStatuses[0].paymentStatus    | PAID            |
      | feeStatuses[0].statusDate       | todayiso        |
      | feeStatuses[0].paymentReference | OFFCMP-{RANDOM} |
      | feeStatuses[1].paymentStatus    | REMITTED        |
      | feeStatuses[1].statusDate       | 2025-10-07      |
      | feeStatuses[1].paymentReference | OFFSITE-UPDATED |

    Examples:
      | User  |
      | user1 |

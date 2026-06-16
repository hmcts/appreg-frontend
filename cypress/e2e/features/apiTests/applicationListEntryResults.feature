Feature: API - Application List Entry Results

  @api @applicationListEntryResults @regression @ARCPOC-576 @ARCPOC-577 @ARCPOC-1017
  Scenario Outline: Create and retrieve an application list entry result
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                            |
      | time              | timenowhhmm-2h                      |
      | status            | OPEN                                |
      | description       | Result lifecycle test list {RANDOM} |
      | courtLocationCode | RCJ001                              |
      | durationHours     | 2                                   |
      | durationMinutes   | 22                                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | John                       |
      | applicant.person.name.lastName               | ResultTester{RANDOM}       |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                   |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}              |
      | applicant.person.contactDetails.email        | result{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-{RANDOM}              |
      | accountNumber                                | APP-{RANDOM}               |
      | notes                                        | Result API setup {RANDOM}  |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | Smith{RANDOM}              |
      | officials.0.forename                         | John                       |
      | officials.0.type                             | MAGISTRATE                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    Then User Verify Response Body Should Have:
      | entryId                                       | :entryId                                     |
      | resultCode                                    | APPC                                         |
      | wording.template                              | Appeal forwarded to {{Name of Crown Court}}. |
      | wording.substitution-key-constraints[0].key   | Name of Crown Court                          |
      | wording.substitution-key-constraints[0].value | Leeds Crown Court                            |
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                                            |
      | elementsOnPage                                           | 1                                            |
      | content[0].id                                            | :resultId                                    |
      | content[0].entryId                                       | :entryId                                     |
      | content[0].resultCode                                    | APPC                                         |
      | content[0].wording.template                              | Appeal forwarded to {{Name of Crown Court}}. |
      | content[0].wording.substitution-key-constraints[0].key   | Name of Crown Court                          |
      | content[0].wording.substitution-key-constraints[0].value | Leeds Crown Court                            |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-578 @ARCPOC-579 @ARCPOC-1111
  Scenario Outline: Update an application list entry result and retrieve updated details
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Result update test list {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Ms                           |
      | applicant.person.name.firstName              | Jane                         |
      | applicant.person.name.lastName               | Updater{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Crown Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                     |
      | applicant.person.contactDetails.phone        | 0203{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07111{RANDOM}                |
      | applicant.person.contactDetails.email        | update{RANDOM}@example.com   |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | CASE-{RANDOM}                |
      | accountNumber                                | APP-{RANDOM}                 |
      | notes                                        | Result update setup {RANDOM} |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Ms                           |
      | officials.0.surname                          | Clerk{RANDOM}                |
      | officials.0.forename                         | Jane                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                   |
      | wordingFields.0.key   | Name of Crown Court    |
      | wordingFields.0.value | Central Criminal Court |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/:entryId/results/:resultId" With Object Builder:
      | resultCode            | FRO                   |
      | wordingFields.0.key   | Reason text           |
      | wordingFields.0.value | Caseworker discretion |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | id                                            | :resultId                              |
      | entryId                                       | :entryId                               |
      | resultCode                                    | FRO                                    |
      | wording.template                              | Fee remitted. Reason: {{Reason text}}. |
      | wording.substitution-key-constraints[0].key   | Reason text                            |
      | wording.substitution-key-constraints[0].value | Caseworker discretion                  |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                                            | 1                                      |
      | content[0].id                                            | :resultId                              |
      | content[0].entryId                                       | :entryId                               |
      | content[0].resultCode                                    | FRO                                    |
      | content[0].wording.template                              | Fee remitted. Reason: {{Reason text}}. |
      | content[0].wording.substitution-key-constraints[0].key   | Reason text                            |
      | content[0].wording.substitution-key-constraints[0].value | Caseworker discretion                  |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-580 @ARCPOC-932 @ARCPOC-1454 @ARCPOC-1461
  Scenario Outline: Delete an application list entry result
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Result delete test list {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99002                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | Alex                         |
      | applicant.person.name.lastName               | Deleter{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Court Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 0AA                     |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07122{RANDOM}                |
      | applicant.person.contactDetails.email        | delete{RANDOM}@example.com   |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | CASE-{RANDOM}                |
      | accountNumber                                | APP-{RANDOM}                 |
      | notes                                        | Result delete setup {RANDOM} |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Judge{RANDOM}                |
      | officials.0.forename                         | Alex                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId"
    When User Makes DELETE API Request To "/application-lists/:listId/entries/:entryId/results/:resultId"
    Then User Verify Response Status Code Should Be "204"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |
    When User Makes DELETE API Request To "/application-lists/:listId/entries/:entryId/results/:resultId"
    Then User Verify Response Status Code Should Be "404"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-576 @ARCPOC-577 @ARCPOC-1094
  Scenario Outline: Retrieve paginated application list entry results
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                             |
      | time              | timenowhhmm-2h                       |
      | status            | OPEN                                 |
      | description       | Result pagination test list {RANDOM} |
      | courtLocationCode | RCJ001                               |
      | durationHours     | 2                                    |
      | durationMinutes   | 22                                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Pat                              |
      | applicant.person.name.lastName               | Pager{RANDOM}                    |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Justice Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 3AA                         |
      | applicant.person.contactDetails.phone        | 0209{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07133{RANDOM}                    |
      | applicant.person.contactDetails.email        | page{RANDOM}@example.com         |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-{RANDOM}                    |
      | accountNumber                                | APP-{RANDOM}                     |
      | notes                                        | Result pagination setup {RANDOM} |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | Bench{RANDOM}                    |
      | officials.0.forename                         | Pat                              |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId1"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | APPC                   |
      | wordingFields.0.key   | Name of Crown Court    |
      | wordingFields.0.value | Manchester Crown Court |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "resultId3"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=2"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | pageNumber     | 0 |
      | pageSize       | 2 |
      | totalElements  | 3 |
      | totalPages     | 2 |
      | elementsOnPage | 2 |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | pageNumber     | 0  |
      | pageSize       | 10 |
      | totalElements  | 3  |
      | totalPages     | 1  |
      | elementsOnPage | 3  |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :resultId1 |
      | :resultId2 |
      | :resultId3 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntryResults @regression @ARCPOC-1425
  Scenario Outline: Reject bulk result creation with duplicate target entry ids
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                             |
      | time              | timenowhhmm-2h                       |
      | status            | OPEN                                 |
      | description       | Bulk duplicate results list {RANDOM} |
      | courtLocationCode | RCJ001                               |
      | durationHours     | 2                                    |
      | durationMinutes   | 22                                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Duplicate                      |
      | applicant.person.name.lastName               | Results{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | dup-result{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | DUPRES-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | DUPRES-{RANDOM}                |
      | accountNumber                                | DUPRES-{RANDOM}                |
      | notes                                        | Duplicate bulk results         |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Duplicate{RANDOM}              |
      | officials.0.forename                         | Clerk                          |
      | officials.0.type                             | CLERK                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/results" With Object Builder:
      | entryIds.0                   | :entryId           |
      | entryIds.1                   | :entryId           |
      | result.resultCode            | RTC                |
      | result.wordingFields.0.key   | Date               |
      | result.wordingFields.0.value | 24-02-2026         |
      | result.wordingFields.1.key   | Courthouse         |
      | result.wordingFields.1.value | London Crown Court |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | AL-21 |
      | status | 400   |
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId/results?pageNumber=0&pageSize=10"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 0 |
      | elementsOnPage | 0 |

    Examples:
      | User  |
      | user1 |

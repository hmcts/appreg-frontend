Feature: API - Application List Entry

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-229 @ARCPOC-1371
  Scenario Outline: Create Application List Entry with CJA and Other Location
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date                     | todayiso                                     |
      | time                     | timenowhhmm-2h                               |
      | status                   | OPEN                                         |
      | date                     | todayiso                                     |
      | time                     | timenowhhmm-2h                               |
      | status                   | OPEN                                         |
      | description              | Applications to review at Test_{SCENARIO_ID} |
      | durationHours            | 2                                            |
      | durationMinutes          | 22                                           |
      | otherLocationDescription | Temporary Courtroom at Town Hall             |
      | cjaCode                  | 01                                           |
      | durationHours            | 2                                            |
      | durationMinutes          | 22                                           |
      | otherLocationDescription | Temporary Courtroom at Town Hall             |
      | cjaCode                  | 01                                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                     |
      | applicationCode                              | AD99002                                  |
      | applicant.person.name.title                  | Mr                                       |
      | applicant.person.name.firstName              | John                                     |
      | applicant.person.name.middleName             | A B                                      |
      | applicant.person.name.lastName               | Smith{SCENARIO_ID}                       |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                              |
      | applicant.person.contactDetails.addressLine3 | London                                   |
      | applicant.person.contactDetails.addressLine4 | Greater London                           |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                           |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                 |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                             |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                            |
      | applicant.person.contactDetails.addressLine2 | Westminster                              |
      | applicant.person.contactDetails.addressLine3 | London                                   |
      | applicant.person.contactDetails.addressLine4 | Greater London                           |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                           |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                 |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                             |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                            |
      | applicant.person.contactDetails.email        | john.smith{SCENARIO_ID}@example.com      |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                             |
      | feeStatuses.0.paymentStatus                  | PAID                                     |
      | feeStatuses.0.statusDate                     | todayiso                                 |
      | hasOffsiteFee                                | false                                    |
      | caseReference                                | CASE-001                                 |
      | accountNumber                                | APP-{RANDOM}                             |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                             |
      | feeStatuses.0.paymentStatus                  | PAID                                     |
      | feeStatuses.0.statusDate                     | todayiso                                 |
      | hasOffsiteFee                                | false                                    |
      | caseReference                                | CASE-001                                 |
      | accountNumber                                | APP-{RANDOM}                             |
      | notes                                        | Application discussion ref {SCENARIO_ID} |
      | lodgementDate                                | todayiso                                 |
      | officials.0.title                            | Mr                                       |
      | lodgementDate                                | todayiso                                 |
      | officials.0.title                            | Mr                                       |
      | officials.0.surname                          | Smith{SCENARIO_ID}                       |
      | officials.0.forename                         | John                                     |
      | officials.0.type                             | MAGISTRATE                               |
      | officials.0.forename                         | John                                     |
      | officials.0.type                             | MAGISTRATE                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId/results" With Object Builder:
      | resultCode            | RTC               |
      | wordingFields.0.key   | Date              |
      | wordingFields.0.value | 24-02-2026        |
      | wordingFields.1.key   | Courthouse        |
      | wordingFields.1.value | London Courthouse |
    Then User Verify Response Status Code Should Be "201"
    When User Makes PUT API Request To "/application-lists/:listId/entries/:entryId" With Object Builder:
      | standardApplicantCode                        | null                                             |
      | applicationCode                              | AD99002                                          |
      | applicant.person.name.title                  | Mr                                               |
      | applicant.person.name.firstName              | John                                             |
      | applicant.person.name.middleName             | A B                                              |
      | standardApplicantCode                        | null                                             |
      | applicationCode                              | AD99002                                          |
      | applicant.person.name.title                  | Mr                                               |
      | applicant.person.name.firstName              | John                                             |
      | applicant.person.name.middleName             | A B                                              |
      | applicant.person.name.lastName               | Smith{SCENARIO_ID}                               |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                        |
      | applicant.person.contactDetails.addressLine2 | Westminster                                      |
      | applicant.person.contactDetails.addressLine3 | London                                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                                    |
      | applicant.person.contactDetails.addressLine2 | Westminster                                      |
      | applicant.person.contactDetails.addressLine3 | London                                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                                    |
      | applicant.person.contactDetails.email        | john.smith{SCENARIO_ID}@example.com              |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                                     |
      | feeStatuses.0.paymentStatus                  | PAID                                             |
      | feeStatuses.0.statusDate                     | todayiso                                         |
      | hasOffsiteFee                                | false                                            |
      | caseReference                                | CASE-001                                         |
      | accountNumber                                | APP-{RANDOM}                                     |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                                     |
      | feeStatuses.0.paymentStatus                  | PAID                                             |
      | feeStatuses.0.statusDate                     | todayiso                                         |
      | hasOffsiteFee                                | false                                            |
      | caseReference                                | CASE-001                                         |
      | accountNumber                                | APP-{RANDOM}                                     |
      | notes                                        | Updated application discussion ref {SCENARIO_ID} |
      | officials.0.title                            | Mr                                               |
      | officials.0.title                            | Mr                                               |
      | officials.0.surname                          | Smith{SCENARIO_ID}                               |
      | officials.0.forename                         | John                                             |
      | officials.0.type                             | MAGISTRATE                                       |
      | officials.0.forename                         | John                                             |
      | officials.0.type                             | MAGISTRATE                                       |
    Then User Verify Response Status Code Should Be "200"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-280 @ARCPOC-290 @ARCPOC-1035
  Scenario Outline: Retrieve an application list entry by id
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                             |
      | time              | timenowhhmm-2h                       |
      | status            | OPEN                                 |
      | date              | todayiso                             |
      | time              | timenowhhmm-2h                       |
      | status            | OPEN                                 |
      | description       | Entry detail test list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                               |
      | durationHours     | 2                                    |
      | durationMinutes   | 22                                   |
      | courtLocationCode | RCJ001                               |
      | durationHours     | 2                                    |
      | durationMinutes   | 22                                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                                |
      | applicationCode                               | AP99001                             |
      | applicant.person.name.title                   | Mr                                  |
      | applicant.person.name.firstName               | Detail                              |
      | standardApplicantCode                         | null                                |
      | applicationCode                               | AP99001                             |
      | applicant.person.name.title                   | Mr                                  |
      | applicant.person.name.firstName               | Detail                              |
      | applicant.person.name.lastName                | Applicant{SCENARIO_ID}              |
      | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} High Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                         |
      | applicant.person.contactDetails.addressLine3  | London                              |
      | applicant.person.contactDetails.addressLine4  | Greater London                      |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.person.contactDetails.postcode      | SW1A 2AA                            |
      | applicant.person.contactDetails.phone         | 0207{RANDOM}                        |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.person.contactDetails.addressLine2  | Westminster                         |
      | applicant.person.contactDetails.addressLine3  | London                              |
      | applicant.person.contactDetails.addressLine4  | Greater London                      |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.person.contactDetails.postcode      | SW1A 2AA                            |
      | applicant.person.contactDetails.phone         | 0207{RANDOM}                        |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.person.contactDetails.email         | detail{SCENARIO_ID}@example.com     |
      | respondent.person.name.title                  | Mrs                                 |
      | respondent.person.name.firstName              | Sarah                               |
      | respondent.person.name.title                  | Mrs                                 |
      | respondent.person.name.firstName              | Sarah                               |
      | respondent.person.name.lastName               | Respondent{SCENARIO_ID}             |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Street         |
      | respondent.person.contactDetails.addressLine2 | Bristol                             |
      | respondent.person.contactDetails.addressLine3 | Avon                                |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.person.contactDetails.postcode     | BS15 5AA                            |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.person.contactDetails.addressLine2 | Bristol                             |
      | respondent.person.contactDetails.addressLine3 | Avon                                |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.person.contactDetails.postcode     | BS15 5AA                            |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                        |
      | wordingFields.0.key                           | Date of Hearing                     |
      | respondent.person.dateOfBirth                 | todayiso-25y                        |
      | wordingFields.0.key                           | Date of Hearing                     |
      | wordingFields.0.value                         | {SCENARIO_ID}                       |
      | hasOffsiteFee                                 | true                                |
      | caseReference                                 | CASE-{RANDOM}                       |
      | accountNumber                                 | ACC-{RANDOM}                        |
      | hasOffsiteFee                                 | true                                |
      | caseReference                                 | CASE-{RANDOM}                       |
      | accountNumber                                 | ACC-{RANDOM}                        |
      | notes                                         | Entry detail notes {SCENARIO_ID}    |
      | lodgementDate                                 | todayiso                            |
      | officials.0.title                             | Mr                                  |
      | lodgementDate                                 | todayiso                            |
      | officials.0.title                             | Mr                                  |
      | officials.0.surname                           | Turner{SCENARIO_ID}                 |
      | officials.0.forename                          | Graham                              |
      | officials.0.type                              | MAGISTRATE                          |
      | officials.0.forename                          | Graham                              |
      | officials.0.type                              | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | id                                            | :entryId                         |
      | listId                                        | :listId                          |
      | applicationCode                               | AP99001                          |
      | applicant.person.name.firstName               | Detail                           |
      | id                                            | :entryId                         |
      | listId                                        | :listId                          |
      | applicationCode                               | AP99001                          |
      | applicant.person.name.firstName               | Detail                           |
      | applicant.person.name.lastName                | Applicant{SCENARIO_ID}           |
      | respondent.person.name.firstName              | Sarah                            |
      | respondent.person.name.firstName              | Sarah                            |
      | respondent.person.name.lastName               | Respondent{SCENARIO_ID}          |
      | respondent.person.dateOfBirth                 | todayiso-25y                     |
      | wording.substitution-key-constraints[0].key   | Date of Hearing                  |
      | respondent.person.dateOfBirth                 | todayiso-25y                     |
      | wording.substitution-key-constraints[0].key   | Date of Hearing                  |
      | wording.substitution-key-constraints[0].value | "{SCENARIO_ID}"                  |
      | notes                                         | Entry detail notes {SCENARIO_ID} |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-280 @ARCPOC-290
  Scenario Outline: Retrieve application list entries for a list
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | date              | todayiso                           |
      | time              | timenowhhmm-2h                     |
      | status            | OPEN                               |
      | description       | Entry page test list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
      | courtLocationCode | RCJ001                             |
      | durationHours     | 2                                  |
      | durationMinutes   | 22                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Page                           |
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | Page                           |
      | applicant.person.name.lastName               | First{SCENARIO_ID}             |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | page1{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-P1-{RANDOM}               |
      | accountNumber                                | ACC-P1-{RANDOM}                |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-P1-{RANDOM}               |
      | accountNumber                                | ACC-P1-{RANDOM}                |
      | notes                                        | Entry page one {SCENARIO_ID}   |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | PageOne{SCENARIO_ID}           |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP013                         |
      | applicationCode                               | AP99001                        |
      | respondent.person.name.title                  | Mrs                            |
      | respondent.person.name.firstName              | Page                           |
      | respondent.person.name.lastName               | Second{SCENARIO_ID}            |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Road       |
      | respondent.person.contactDetails.addressLine2 | Gloucester                     |
      | respondent.person.contactDetails.postcode     | GL1 1AA                        |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}                  |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}                  |
      | respondent.person.contactDetails.addressLine2 | Gloucester                     |
      | respondent.person.contactDetails.postcode     | GL1 1AA                        |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}                  |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}                  |
      | respondent.person.contactDetails.email        | page2{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-33y                   |
      | wordingFields.0.key                           | Date of Hearing                |
      | respondent.person.dateOfBirth                 | todayiso-33y                   |
      | wordingFields.0.key                           | Date of Hearing                |
      | wordingFields.0.value                         | "{SCENARIO_ID}""               |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-P2-{RANDOM}               |
      | accountNumber                                 | ACC-P2-{RANDOM}                |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-P2-{RANDOM}               |
      | accountNumber                                 | ACC-P2-{RANDOM}                |
      | notes                                         | Entry page two {SCENARIO_ID}   |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Ms                             |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Ms                             |
      | officials.0.surname                           | PageTwo{SCENARIO_ID}           |
      | officials.0.forename                          | Jane                           |
      | officials.0.type                              | MAGISTRATE                     |
      | officials.0.forename                          | Jane                           |
      | officials.0.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | pageNumber        | 0       |
      | pageSize          | 10      |
      | totalElements     | 2       |
      | totalPages        | 1       |
      | elementsOnPage    | 2       |
      | content[0].listId | :listId |
      | content[1].listId | :listId |
      | pageNumber        | 0       |
      | pageSize          | 10      |
      | totalElements     | 2       |
      | totalPages        | 1       |
      | elementsOnPage    | 2       |
      | content[0].listId | :listId |
      | content[1].listId | :listId |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :entryId1 |
      | :entryId2 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1322
  Scenario Outline: Filter application list entries by applicant name including standard applicants
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                                     |
      | time              | timenowhhmm-2h                               |
      | status            | OPEN                                         |
      | date              | todayiso                                     |
      | time              | timenowhhmm-2h                               |
      | status            | OPEN                                         |
      | description       | Standard applicant filter list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                       |
      | durationHours     | 2                                            |
      | durationMinutes   | 22                                           |
      | courtLocationCode | RCJ001                                       |
      | durationHours     | 2                                            |
      | durationMinutes   | 22                                           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | John                            |
      | standardApplicantCode                        | null                            |
      | applicationCode                              | AD99002                         |
      | applicant.person.name.title                  | Mr                              |
      | applicant.person.name.firstName              | John                            |
      | applicant.person.name.lastName               | Turner{SCENARIO_ID}             |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.addressLine2 | Westminster                     |
      | applicant.person.contactDetails.addressLine3 | London                          |
      | applicant.person.contactDetails.addressLine4 | Greater London                  |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                  |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                        |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                    |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                   |
      | applicant.person.contactDetails.email        | person{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | CASE-F1-{RANDOM}                |
      | accountNumber                                | ACC-F1-{RANDOM}                 |
      | notes                                        | Applicant filter person         |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                    |
      | feeStatuses.0.paymentStatus                  | PAID                            |
      | feeStatuses.0.statusDate                     | todayiso                        |
      | hasOffsiteFee                                | false                           |
      | caseReference                                | CASE-F1-{RANDOM}                |
      | accountNumber                                | ACC-F1-{RANDOM}                 |
      | notes                                        | Applicant filter person         |
      | lodgementDate                                | todayiso                        |
      | officials.0.title                            | Mr                              |
      | officials.0.surname                          | FilterOne{SCENARIO_ID}          |
      | officials.0.forename                         | John                            |
      | officials.0.type                             | MAGISTRATE                      |
      | officials.0.forename                         | John                            |
      | officials.0.type                             | MAGISTRATE                      |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                              | null                                |
      | applicationCode                                    | AP99001                             |
      | standardApplicantCode                              | null                                |
      | applicationCode                                    | AP99001                             |
      | applicant.organisation.name                        | Applicant Industries {SCENARIO_ID}  |
      | applicant.organisation.contactDetails.addressLine1 | {SCENARIO_ID} King Street           |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3 | London                              |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3 | London                              |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.email        | org{SCENARIO_ID}@example.com        |
      | respondent.person.name.title                       | Ms                                  |
      | respondent.person.name.firstName                   | Emily                               |
      | respondent.person.name.title                       | Ms                                  |
      | respondent.person.name.firstName                   | Emily                               |
      | respondent.person.name.lastName                    | Brown{SCENARIO_ID}                  |
      | respondent.person.contactDetails.addressLine1      | {SCENARIO_ID} Market Road           |
      | respondent.person.contactDetails.addressLine2      | Bristol                             |
      | respondent.person.contactDetails.addressLine3      | Avon                                |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                      |
      | respondent.person.contactDetails.postcode          | BS15 5AA                            |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                       |
      | respondent.person.contactDetails.addressLine2      | Bristol                             |
      | respondent.person.contactDetails.addressLine3      | Avon                                |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                      |
      | respondent.person.contactDetails.postcode          | BS15 5AA                            |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                       |
      | respondent.person.contactDetails.email             | respondent{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                      | todayiso-25y                        |
      | wordingFields.0.key                                | Date of Hearing                     |
      | respondent.person.dateOfBirth                      | todayiso-25y                        |
      | wordingFields.0.key                                | Date of Hearing                     |
      | wordingFields.0.value                              | "{SCENARIO_ID}"                     |
      | hasOffsiteFee                                      | false                               |
      | caseReference                                      | CASE-F2-{RANDOM}                    |
      | accountNumber                                      | ACC-F2-{RANDOM}                     |
      | notes                                              | Applicant filter organisation       |
      | lodgementDate                                      | todayiso                            |
      | officials.0.title                                  | Ms                                  |
      | hasOffsiteFee                                      | false                               |
      | caseReference                                      | CASE-F2-{RANDOM}                    |
      | accountNumber                                      | ACC-F2-{RANDOM}                     |
      | notes                                              | Applicant filter organisation       |
      | lodgementDate                                      | todayiso                            |
      | officials.0.title                                  | Ms                                  |
      | officials.0.surname                                | FilterTwo{SCENARIO_ID}              |
      | officials.0.forename                               | Jane                                |
      | officials.0.type                                   | MAGISTRATE                          |
      | officials.0.forename                               | Jane                                |
      | officials.0.type                                   | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP036                            |
      | applicationCode                               | AP99001                           |
      | respondent.person.name.title                  | Mrs                               |
      | respondent.person.name.firstName              | Claire                            |
      | respondent.person.name.lastName               | Quinn{SCENARIO_ID}                |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Crown Road          |
      | respondent.person.contactDetails.addressLine2 | Gloucester                        |
      | respondent.person.contactDetails.postcode     | GL1 1AA                           |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}                     |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}                     |
      | respondent.person.contactDetails.addressLine2 | Gloucester                        |
      | respondent.person.contactDetails.postcode     | GL1 1AA                           |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}                     |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}                     |
      | respondent.person.contactDetails.email        | standard{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-33y                      |
      | wordingFields.0.key                           | Date of Hearing                   |
      | respondent.person.dateOfBirth                 | todayiso-33y                      |
      | wordingFields.0.key                           | Date of Hearing                   |
      | wordingFields.0.value                         | "{SCENARIO_ID}"                   |
      | hasOffsiteFee                                 | false                             |
      | caseReference                                 | CASE-F3-{RANDOM}                  |
      | accountNumber                                 | ACC-F3-{RANDOM}                   |
      | notes                                         | Applicant filter standard         |
      | lodgementDate                                 | todayiso                          |
      | officials.0.title                             | Mr                                |
      | hasOffsiteFee                                 | false                             |
      | caseReference                                 | CASE-F3-{RANDOM}                  |
      | accountNumber                                 | ACC-F3-{RANDOM}                   |
      | notes                                         | Applicant filter standard         |
      | lodgementDate                                 | todayiso                          |
      | officials.0.title                             | Mr                                |
      | officials.0.surname                           | FilterThree{SCENARIO_ID}          |
      | officials.0.forename                          | James                             |
      | officials.0.type                              | MAGISTRATE                        |
      | officials.0.forename                          | James                             |
      | officials.0.type                              | MAGISTRATE                        |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "standardEntryId"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc&applicantName=British%20Gas%20Trading%20Limited"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                          | 1                           |
      | elementsOnPage                         | 1                           |
      | content[0].applicant.organisation.name | British Gas Trading Limited |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :standardEntryId |
    When User Makes GET API Request To "/application-codes/AP99001?date=todayiso"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | applicationCode | AP99001                 |
      | title           | "Appeal to Crown Court" |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1322 @ARCPOC-1325
  Scenario Outline: Filter application list entries by result code across all applied results
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | Result filter test list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | applicant.person.name.lastName               | One{SCENARIO_ID}                 |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | result1{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R1-{RANDOM}                 |
      | accountNumber                                | ACC-R1-{RANDOM}                  |
      | notes                                        | Result filter one                |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R1-{RANDOM}                 |
      | accountNumber                                | ACC-R1-{RANDOM}                  |
      | notes                                        | Result filter one                |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | ResultOne{SCENARIO_ID}           |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId1/results" With Object Builder:
      | resultCode            | GRSW        |
      | wordingFields.0.key   | Time issued |
      | wordingFields.0.value | 10:00       |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | applicant.person.name.lastName               | Two{SCENARIO_ID}                 |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | result2{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R2-{RANDOM}                 |
      | accountNumber                                | ACC-R2-{RANDOM}                  |
      | notes                                        | Result filter two                |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R2-{RANDOM}                 |
      | accountNumber                                | ACC-R2-{RANDOM}                  |
      | notes                                        | Result filter two                |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | ResultTwo{SCENARIO_ID}           |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Object Builder:
      | resultCode            | GRSW        |
      | wordingFields.0.key   | Time issued |
      | wordingFields.0.value | 10:00       |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Result                           |
      | applicant.person.name.lastName               | Three{SCENARIO_ID}               |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | result3{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R3-{RANDOM}                 |
      | accountNumber                                | ACC-R3-{RANDOM}                  |
      | notes                                        | Result filter three              |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                     |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | CASE-R3-{RANDOM}                 |
      | accountNumber                                | ACC-R3-{RANDOM}                  |
      | notes                                        | Result filter three              |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | ResultThree{SCENARIO_ID}         |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
      | officials.0.forename                         | John                             |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId3"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Object Builder:
      | resultCode            | GRSW        |
      | wordingFields.0.key   | Time issued |
      | wordingFields.0.value | 10:00       |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Object Builder:
      | resultCode            | FRO                   |
      | wordingFields.0.key   | Reason text           |
      | wordingFields.0.value | Caseworker discretion |
    Then User Verify Response Status Code Should Be "201"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc&resulted=GRSW"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 3 |
      | elementsOnPage | 3 |
      | totalElements  | 3 |
      | elementsOnPage | 3 |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :entryId1 |
      | :entryId2 |
      | :entryId3 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1155 @ARCPOC-992 @ARCPOC-1045
  Scenario Outline: Retrieve application list entries with single-column sorting
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                               |
      | time              | timenowhhmm-2h                         |
      | status            | OPEN                                   |
      | date              | todayiso                               |
      | time              | timenowhhmm-2h                         |
      | status            | OPEN                                   |
      | description       | Applicant sort test list {SCENARIO_ID} |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
      | courtLocationCode | RCJ001                                 |
      | durationHours     | 2                                      |
      | durationMinutes   | 22                                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP013                         |
      | applicationCode                               | AP99001                        |
      | respondent.person.name.title                  | Mrs                            |
      | respondent.person.name.firstName              | Claire                         |
      | respondent.person.name.lastName               | Abbott{SCENARIO_ID}            |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Bond Street      |
      | respondent.person.contactDetails.addressLine2 | London                         |
      | respondent.person.contactDetails.postcode     | W1S 1AA                        |
      | respondent.person.contactDetails.phone        | 02071{RANDOM}                  |
      | respondent.person.contactDetails.mobile       | 07470{RANDOM}                  |
      | respondent.person.contactDetails.addressLine2 | London                         |
      | respondent.person.contactDetails.postcode     | W1S 1AA                        |
      | respondent.person.contactDetails.phone        | 02071{RANDOM}                  |
      | respondent.person.contactDetails.mobile       | 07470{RANDOM}                  |
      | respondent.person.contactDetails.email        | sort1{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-31y                   |
      | wordingFields.0.key                           | Date of Hearing                |
      | respondent.person.dateOfBirth                 | todayiso-31y                   |
      | wordingFields.0.key                           | Date of Hearing                |
      | wordingFields.0.value                         | "{SCENARIO_ID}"                |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-S1-{RANDOM}               |
      | accountNumber                                 | ACC-S1-{RANDOM}                |
      | notes                                         | Sort standard applicant        |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-S1-{RANDOM}               |
      | accountNumber                                 | ACC-S1-{RANDOM}                |
      | notes                                         | Sort standard applicant        |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | officials.0.surname                           | SortOne{SCENARIO_ID}           |
      | officials.0.forename                          | John                           |
      | officials.0.type                              | MAGISTRATE                     |
      | officials.0.forename                          | John                           |
      | officials.0.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                              | null                                |
      | applicationCode                                    | AP99001                             |
      | applicant.organisation.name                        | Beta Org                            |
      | standardApplicantCode                              | null                                |
      | applicationCode                                    | AP99001                             |
      | applicant.organisation.name                        | Beta Org                            |
      | applicant.organisation.contactDetails.addressLine1 | {SCENARIO_ID} King Street           |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3 | London                              |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3 | London                              |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.email        | sort2{SCENARIO_ID}@example.com      |
      | respondent.person.name.title                       | Ms                                  |
      | respondent.person.name.firstName                   | Emily                               |
      | respondent.person.name.title                       | Ms                                  |
      | respondent.person.name.firstName                   | Emily                               |
      | respondent.person.name.lastName                    | Brown{SCENARIO_ID}                  |
      | respondent.person.contactDetails.addressLine1      | {SCENARIO_ID} Market Road           |
      | respondent.person.contactDetails.addressLine2      | Bristol                             |
      | respondent.person.contactDetails.addressLine3      | Avon                                |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                      |
      | respondent.person.contactDetails.postcode          | BS15 5AA                            |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                       |
      | respondent.person.contactDetails.addressLine2      | Bristol                             |
      | respondent.person.contactDetails.addressLine3      | Avon                                |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                      |
      | respondent.person.contactDetails.postcode          | BS15 5AA                            |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                       |
      | respondent.person.contactDetails.email             | respondent{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                      | todayiso-25y                        |
      | wordingFields.0.key                                | Date of Hearing                     |
      | respondent.person.dateOfBirth                      | todayiso-25y                        |
      | wordingFields.0.key                                | Date of Hearing                     |
      | wordingFields.0.value                              | "{SCENARIO_ID}"                     |
      | hasOffsiteFee                                      | false                               |
      | caseReference                                      | CASE-S2-{RANDOM}                    |
      | accountNumber                                      | ACC-S2-{RANDOM}                     |
      | notes                                              | Sort organisation                   |
      | lodgementDate                                      | todayiso                            |
      | officials.0.title                                  | Ms                                  |
      | hasOffsiteFee                                      | false                               |
      | caseReference                                      | CASE-S2-{RANDOM}                    |
      | accountNumber                                      | ACC-S2-{RANDOM}                     |
      | notes                                              | Sort organisation                   |
      | lodgementDate                                      | todayiso                            |
      | officials.0.title                                  | Ms                                  |
      | officials.0.surname                                | SortTwo{SCENARIO_ID}                |
      | officials.0.forename                               | Jane                                |
      | officials.0.type                                   | MAGISTRATE                          |
      | officials.0.forename                               | Jane                                |
      | officials.0.type                                   | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | John                           |
      | standardApplicantCode                        | null                           |
      | applicationCode                              | AD99002                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | John                           |
      | applicant.person.name.lastName               | Turner{SCENARIO_ID}            |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | sort3{SCENARIO_ID}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-S3-{RANDOM}               |
      | accountNumber                                | ACC-S3-{RANDOM}                |
      | notes                                        | Sort person                    |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                           |
      | feeStatuses.0.statusDate                     | todayiso                       |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-S3-{RANDOM}               |
      | accountNumber                                | ACC-S3-{RANDOM}                |
      | notes                                        | Sort person                    |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | SortThree{SCENARIO_ID}         |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId3"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=applicantName,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                              | 3                   |
      | elementsOnPage                             | 3                   |
      | content[0].applicant.organisation.name     | Beta Org            |
      | content[1].applicant.person.name.lastName  | Turner{SCENARIO_ID} |
      | content[2].respondent.person.name.lastName | Abbott{SCENARIO_ID} |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :entryId1 |
      | :entryId2 |
      | :entryId3 |

    When User Makes GET API Request To "/application-codes/AP99001?date=todayiso"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | applicationCode | AP99001               |
      | title           | Appeal to Crown Court |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Reject invalid application list entry sort query
    Given User Authenticates Via API As "<User>"
    When User Makes GET API Request To "/application-lists/entries?pageNumber=0&pageSize=1&sort=invalid-sort"
    Then User Verify Response Status Code Should Be "400"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Reject application list entry requests with unsupported Accept header
    Given User Authenticates Via API As "<User>"
    When User Makes Raw GET API Request To "/application-lists/entries?pageNumber=0&pageSize=1" With Headers:
      | Accept | application/json |
    Then User Verify Response Status Code Should Be "406"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression
  Scenario Outline: Reject invalid application list entry page size
    Given User Authenticates Via API As "<User>"
    When User Makes GET API Request To "/application-lists/entries?pageNumber=0&pageSize=-1"
    Then User Verify Response Status Code Should Be "400"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-229 @ARCPOC-1371 @ARCPOC-1560
  Scenario Outline: Create Application List Entry with Court Location
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                                     |
      | time              | timenowhhmm-2h                               |
      | status            | OPEN                                         |
      | date              | todayiso                                     |
      | time              | timenowhhmm-2h                               |
      | status            | OPEN                                         |
      | description       | Applications to review at Test_{SCENARIO_ID} |
      | durationHours     | 2                                            |
      | durationMinutes   | 22                                           |
      | courtLocationCode | LCCC065                                      |
      | durationHours     | 2                                            |
      | durationMinutes   | 22                                           |
      | courtLocationCode | LCCC065                                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                                |
      | applicationCode                               | AP99001                             |
      | applicant.person.name.title                   | Mr                                  |
      | standardApplicantCode                         | null                                |
      | applicationCode                               | AP99001                             |
      | applicant.person.name.title                   | Mr                                  |
      | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                |
      | applicant.person.name.firstName               | Henry                               |
      | applicant.person.name.middleName              | James                               |
      | applicant.person.name.firstName               | Henry                               |
      | applicant.person.name.middleName              | James                               |
      | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                         |
      | applicant.person.contactDetails.addressLine3  | London                              |
      | applicant.person.contactDetails.addressLine4  | Greater London                      |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                        |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.person.contactDetails.addressLine2  | Westminster                         |
      | applicant.person.contactDetails.addressLine3  | London                              |
      | applicant.person.contactDetails.addressLine4  | Greater London                      |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                            |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                        |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.person.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
      | respondent.person.name.title                  | Ms                                  |
      | respondent.person.name.title                  | Ms                                  |
      | respondent.person.name.lastName               | Clark {SCENARIO_ID}                 |
      | respondent.person.name.firstName              | Emily                               |
      | respondent.person.name.middleName             | Rose                                |
      | respondent.person.name.firstName              | Emily                               |
      | respondent.person.name.middleName             | Rose                                |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
      | respondent.person.contactDetails.addressLine2 | Bristol                             |
      | respondent.person.contactDetails.addressLine3 | Avon                                |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.person.contactDetails.postcode     | BS15 5AA                            |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.person.contactDetails.addressLine2 | Bristol                             |
      | respondent.person.contactDetails.addressLine3 | Avon                                |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.person.contactDetails.postcode     | BS15 5AA                            |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.person.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                        |
      | wordingFields.0.key                           | Date of Hearing                     |
      | respondent.person.dateOfBirth                 | todayiso-25y                        |
      | wordingFields.0.key                           | Date of Hearing                     |
      | wordingFields.0.value                         | "{SCENARIO_ID}"                     |
      | hasOffsiteFee                                 | true                                |
      | caseReference                                 | CASE-{RANDOM}                       |
      | accountNumber                                 | ACC-{RANDOM}                        |
      | hasOffsiteFee                                 | true                                |
      | caseReference                                 | CASE-{RANDOM}                       |
      | accountNumber                                 | ACC-{RANDOM}                        |
      | notes                                         | Case noted with ref {SCENARIO_ID}   |
      | lodgementDate                                 | todayiso                            |
      | officials.0.title                             | Mr                                  |
      | lodgementDate                                 | todayiso                            |
      | officials.0.title                             | Mr                                  |
      | officials.0.surname                           | Turner {SCENARIO_ID}                |
      | officials.0.forename                          | Graham                              |
      | officials.0.type                              | MAGISTRATE                          |
      | officials.1.title                             | Ms                                  |
      | officials.0.forename                          | Graham                              |
      | officials.0.type                              | MAGISTRATE                          |
      | officials.1.title                             | Ms                                  |
      | officials.1.surname                           | Hayes {SCENARIO_ID}                 |
      | officials.1.forename                          | Laura                               |
      | officials.1.type                              | MAGISTRATE                          |
      | officials.2.title                             | Mr                                  |
      | officials.1.forename                          | Laura                               |
      | officials.1.type                              | MAGISTRATE                          |
      | officials.2.title                             | Mr                                  |
      | officials.2.surname                           | Miller {SCENARIO_ID}                |
      | officials.2.forename                          | Peter                               |
      | officials.2.type                              | CLERK                               |
      | officials.3.title                             | Ms                                  |
      | officials.2.forename                          | Peter                               |
      | officials.2.type                              | CLERK                               |
      | officials.3.title                             | Ms                                  |
      | officials.3.surname                           | Patel {SCENARIO_ID}                 |
      | officials.3.forename                          | Anita                               |
      | officials.3.type                              | MAGISTRATE                          |
      | officials.3.forename                          | Anita                               |
      | officials.3.type                              | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/:entryId" With Object Builder:
      | standardApplicantCode                         | null                                      |
      | applicationCode                               | AP99001                                   |
      | applicant.person.name.title                   | Mr                                        |
      | standardApplicantCode                         | null                                      |
      | applicationCode                               | AP99001                                   |
      | applicant.person.name.title                   | Mr                                        |
      | applicant.person.name.lastName                | Taylor {SCENARIO_ID}                      |
      | applicant.person.name.firstName               | Henry                                     |
      | applicant.person.name.middleName              | James                                     |
      | applicant.person.name.firstName               | Henry                                     |
      | applicant.person.name.middleName              | James                                     |
      | applicant.person.contactDetails.addressLine1  | {SCENARIO_ID} King Street                 |
      | applicant.person.contactDetails.addressLine2  | Westminster                               |
      | applicant.person.contactDetails.addressLine3  | London                                    |
      | applicant.person.contactDetails.addressLine4  | Greater London                            |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                            |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                                  |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                              |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                             |
      | applicant.person.contactDetails.addressLine2  | Westminster                               |
      | applicant.person.contactDetails.addressLine3  | London                                    |
      | applicant.person.contactDetails.addressLine4  | Greater London                            |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                            |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                                  |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                              |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                             |
      | applicant.person.contactDetails.email         | {SCENARIO_ID}@example.com                 |
      | respondent.person.name.title                  | Ms                                        |
      | respondent.person.name.title                  | Ms                                        |
      | respondent.person.name.lastName               | Clark {SCENARIO_ID}                       |
      | respondent.person.name.firstName              | Emily                                     |
      | respondent.person.name.middleName             | Rose                                      |
      | respondent.person.name.firstName              | Emily                                     |
      | respondent.person.name.middleName             | Rose                                      |
      | respondent.person.contactDetails.addressLine1 | {SCENARIO_ID} Market Road                 |
      | respondent.person.contactDetails.addressLine2 | Bristol                                   |
      | respondent.person.contactDetails.addressLine3 | Avon                                      |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                            |
      | respondent.person.contactDetails.postcode     | BS15 5AA                                  |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                              |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                             |
      | respondent.person.contactDetails.addressLine2 | Bristol                                   |
      | respondent.person.contactDetails.addressLine3 | Avon                                      |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                            |
      | respondent.person.contactDetails.postcode     | BS15 5AA                                  |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                              |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                             |
      | respondent.person.contactDetails.email        | {SCENARIO_ID}@example.com                 |
      | respondent.person.dateOfBirth                 | todayiso-25y                              |
      | wordingFields.0.key                           | Date of Hearing                           |
      | respondent.person.dateOfBirth                 | todayiso-25y                              |
      | wordingFields.0.key                           | Date of Hearing                           |
      | wordingFields.0.value                         | "{SCENARIO_ID}"                           |
      | hasOffsiteFee                                 | true                                      |
      | caseReference                                 | CASE-{RANDOM}                             |
      | accountNumber                                 | ACC-{RANDOM}                              |
      | hasOffsiteFee                                 | true                                      |
      | caseReference                                 | CASE-{RANDOM}                             |
      | accountNumber                                 | ACC-{RANDOM}                              |
      | notes                                         | Updated case noted with ref {SCENARIO_ID} |
      | lodgementDate                                 | todayiso                                  |
      | officials.0.title                             | Mr                                        |
      | lodgementDate                                 | todayiso                                  |
      | officials.0.title                             | Mr                                        |
      | officials.0.surname                           | Turner {SCENARIO_ID}                      |
      | officials.0.forename                          | Graham                                    |
      | officials.0.type                              | MAGISTRATE                                |
      | officials.0.forename                          | Graham                                    |
      | officials.0.type                              | MAGISTRATE                                |
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                     |
      | applicationCode                              | AD99002                                  |
      | applicant.person.name.title                  | Mr                                       |
      | standardApplicantCode                        | null                                     |
      | applicationCode                              | AD99002                                  |
      | applicant.person.name.title                  | Mr                                       |
      | applicant.person.name.lastName               | Smith {SCENARIO_ID}                      |
      | applicant.person.name.firstName              | John                                     |
      | applicant.person.name.middleName             | A                                        |
      | applicant.person.name.firstName              | John                                     |
      | applicant.person.name.middleName             | A                                        |
      | applicant.person.contactDetails.addressLine1 | {SCENARIO_ID} High Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                              |
      | applicant.person.contactDetails.addressLine3 | London                                   |
      | applicant.person.contactDetails.addressLine4 | Greater London                           |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                           |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                 |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                             |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                            |
      | applicant.person.contactDetails.addressLine2 | Westminster                              |
      | applicant.person.contactDetails.addressLine3 | London                                   |
      | applicant.person.contactDetails.addressLine4 | Greater London                           |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                           |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                 |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                             |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                            |
      | applicant.person.contactDetails.email        | john.smith{SCENARIO_ID}@example.com      |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                             |
      | feeStatuses.0.paymentStatus                  | PAID                                     |
      | feeStatuses.0.statusDate                     | todayiso                                 |
      | hasOffsiteFee                                | false                                    |
      | caseReference                                | CASE-001                                 |
      | accountNumber                                | APP-{RANDOM}                             |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                             |
      | feeStatuses.0.paymentStatus                  | PAID                                     |
      | feeStatuses.0.statusDate                     | todayiso                                 |
      | hasOffsiteFee                                | false                                    |
      | caseReference                                | CASE-001                                 |
      | accountNumber                                | APP-{RANDOM}                             |
      | notes                                        | Application discussion ref {SCENARIO_ID} |
      | lodgementDate                                | todayiso                                 |
      | officials.0.title                            | Mr                                       |
      | lodgementDate                                | todayiso                                 |
      | officials.0.title                            | Mr                                       |
      | officials.0.surname                          | Smith{SCENARIO_ID}                       |
      | officials.0.forename                         | John                                     |
      | officials.0.type                             | MAGISTRATE                               |
      | officials.0.forename                         | John                                     |
      | officials.0.type                             | MAGISTRATE                               |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                               | null                                |
      | applicationCode                                     | AP99001                             |
      | standardApplicantCode                               | null                                |
      | applicationCode                                     | AP99001                             |
      | applicant.organisation.name                         | Applicant Industries {SCENARIO_ID}  |
      | applicant.organisation.contactDetails.addressLine1  | {SCENARIO_ID} King Street           |
      | applicant.organisation.contactDetails.addressLine2  | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3  | London                              |
      | applicant.organisation.contactDetails.addressLine4  | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode      | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.addressLine2  | Westminster                         |
      | applicant.organisation.contactDetails.addressLine3  | London                              |
      | applicant.organisation.contactDetails.addressLine4  | Greater London                      |
      | applicant.organisation.contactDetails.addressLine5  | United Kingdom                      |
      | applicant.organisation.contactDetails.postcode      | SW1A 1AA                            |
      | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                        |
      | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                       |
      | applicant.organisation.contactDetails.email         | applicant{SCENARIO_ID}@example.com  |
      | respondent.organisation.name                        | Respondent Industries {SCENARIO_ID} |
      | respondent.organisation.contactDetails.addressLine1 | {SCENARIO_ID} Market Road           |
      | respondent.organisation.contactDetails.addressLine2 | Bristol                             |
      | respondent.organisation.contactDetails.addressLine3 | Avon                                |
      | respondent.organisation.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.organisation.contactDetails.postcode     | BS15 5AA                            |
      | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.organisation.contactDetails.addressLine2 | Bristol                             |
      | respondent.organisation.contactDetails.addressLine3 | Avon                                |
      | respondent.organisation.contactDetails.addressLine4 | United Kingdom                      |
      | respondent.organisation.contactDetails.postcode     | BS15 5AA                            |
      | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                        |
      | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                       |
      | respondent.organisation.contactDetails.email        | respondent{SCENARIO_ID}@example.com |
      | wordingFields.0.key                                 | Date of Hearing                     |
      | wordingFields.0.key                                 | Date of Hearing                     |
      | wordingFields.0.value                               | "{SCENARIO_ID}"                     |
      | hasOffsiteFee                                       | true                                |
      | caseReference                                       | CASE-{RANDOM}                       |
      | accountNumber                                       | ACC-{RANDOM}                        |
      | hasOffsiteFee                                       | true                                |
      | caseReference                                       | CASE-{RANDOM}                       |
      | accountNumber                                       | ACC-{RANDOM}                        |
      | notes                                               | Case noted with ref {SCENARIO_ID}   |
      | lodgementDate                                       | todayiso                            |
      | officials.0.title                                   | Mr                                  |
      | lodgementDate                                       | todayiso                            |
      | officials.0.title                                   | Mr                                  |
      | officials.0.surname                                 | Turner {SCENARIO_ID}                |
      | officials.0.forename                                | Graham                              |
      | officials.0.type                                    | MAGISTRATE                          |
      | officials.1.title                                   | Ms                                  |
      | officials.0.forename                                | Graham                              |
      | officials.0.type                                    | MAGISTRATE                          |
      | officials.1.title                                   | Ms                                  |
      | officials.1.surname                                 | Hayes {SCENARIO_ID}                 |
      | officials.1.forename                                | Laura                               |
      | officials.1.type                                    | MAGISTRATE                          |
      | officials.2.title                                   | Mr                                  |
      | officials.1.forename                                | Laura                               |
      | officials.1.type                                    | MAGISTRATE                          |
      | officials.2.title                                   | Mr                                  |
      | officials.2.surname                                 | Miller {SCENARIO_ID}                |
      | officials.2.forename                                | Peter                               |
      | officials.2.type                                    | CLERK                               |
      | officials.3.title                                   | Ms                                  |
      | officials.2.forename                                | Peter                               |
      | officials.2.type                                    | CLERK                               |
      | officials.3.title                                   | Ms                                  |
      | officials.3.surname                                 | Patel {SCENARIO_ID}                 |
      | officials.3.forename                                | Anita                               |
      | officials.3.type                                    | MAGISTRATE                          |
      | officials.3.forename                                | Anita                               |
      | officials.3.type                                    | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/print" With Json Body
      """
      {
        "listIds": [
          ":listId"
        ]
      }
      """
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | [0].date                     | todayiso                          |
      | [0].time                     | timenowhhmm-2h                    |
      | [0].courtName                | Leeds Combined Court Centre Set 7 |
      | [0].cja                      | null                              |
      | [0].otherLocationDescription | null                              |
      | [0].duration                 | 2 Hours 22 Minutes                |
    When User Makes GET API Request To "/application-list-entries?respondentOrganisation=Respondent Industries {SCENARIO_ID}"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | content[0].respondent.organisation.name | Respondent Industries {SCENARIO_ID} |

    Examples:
      | User  |
      | user1 |

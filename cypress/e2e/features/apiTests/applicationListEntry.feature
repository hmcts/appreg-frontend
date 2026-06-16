Feature: API - Application List Entry

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-229 @ARCPOC-1371
  Scenario Outline: Create Application List Entry with CJA and Other Location
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date                     | todayiso                                |
      | time                     | timenowhhmm-2h                          |
      | status                   | OPEN                                    |
      | description              | Applications to review at Test_{RANDOM} |
      | durationHours            | 2                                       |
      | durationMinutes          | 22                                      |
      | otherLocationDescription | Temporary Courtroom at Town Hall        |
      | cjaCode                  | 01                                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                |
      | applicationCode                              | AD99002                             |
      | applicant.person.name.title                  | Mr                                  |
      | applicant.person.name.firstName              | John                                |
      | applicant.person.name.middleName             | A B                                 |
      | applicant.person.name.lastName               | Smith{RANDOM}                       |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                         |
      | applicant.person.contactDetails.addressLine3 | London                              |
      | applicant.person.contactDetails.addressLine4 | Greater London                      |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                        |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.person.contactDetails.email        | john.smith{RANDOM}@example.com      |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                  | PAID                                |
      | feeStatuses.0.statusDate                     | todayiso                            |
      | hasOffsiteFee                                | false                               |
      | caseReference                                | CASE-001                            |
      | accountNumber                                | APP-{RANDOM}                        |
      | notes                                        | Application discussion ref {RANDOM} |
      | lodgementDate                                | todayiso                            |
      | officials.0.title                            | Mr                                  |
      | officials.0.surname                          | Smith{RANDOM}                       |
      | officials.0.forename                         | John                                |
      | officials.0.type                             | MAGISTRATE                          |
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
      | standardApplicantCode                        | null                                        |
      | applicationCode                              | AD99002                                     |
      | applicant.person.name.title                  | Mr                                          |
      | applicant.person.name.firstName              | John                                        |
      | applicant.person.name.middleName             | A B                                         |
      | applicant.person.name.lastName               | Smith{RANDOM}                               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                        |
      | applicant.person.contactDetails.addressLine2 | Westminster                                 |
      | applicant.person.contactDetails.addressLine3 | London                                      |
      | applicant.person.contactDetails.addressLine4 | Greater London                              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                              |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                               |
      | applicant.person.contactDetails.email        | john.smith{RANDOM}@example.com              |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                                |
      | feeStatuses.0.paymentStatus                  | PAID                                        |
      | feeStatuses.0.statusDate                     | todayiso                                    |
      | hasOffsiteFee                                | false                                       |
      | caseReference                                | CASE-001                                    |
      | accountNumber                                | APP-{RANDOM}                                |
      | notes                                        | Updated application discussion ref {RANDOM} |
      | officials.0.title                            | Mr                                          |
      | officials.0.surname                          | Smith{RANDOM}                               |
      | officials.0.forename                         | John                                        |
      | officials.0.type                             | MAGISTRATE                                  |
    Then User Verify Response Status Code Should Be "200"

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-280 @ARCPOC-290 @ARCPOC-1035
  Scenario Outline: Retrieve an application list entry by id
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                        |
      | time              | timenowhhmm-2h                  |
      | status            | OPEN                            |
      | description       | Entry detail test list {RANDOM} |
      | courtLocationCode | RCJ001                          |
      | durationHours     | 2                               |
      | durationMinutes   | 22                              |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                           |
      | applicationCode                               | CT99002                        |
      | applicant.person.name.title                   | Mr                             |
      | applicant.person.name.firstName               | Detail                         |
      | applicant.person.name.lastName                | Applicant{RANDOM}              |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                    |
      | applicant.person.contactDetails.addressLine3  | London                         |
      | applicant.person.contactDetails.addressLine4  | Greater London                 |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
      | applicant.person.contactDetails.postcode      | SW1A 2AA                       |
      | applicant.person.contactDetails.phone         | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email         | detail{RANDOM}@example.com     |
      | respondent.person.name.title                  | Mrs                            |
      | respondent.person.name.firstName              | Sarah                          |
      | respondent.person.name.lastName               | Respondent{RANDOM}             |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | respondent.person.contactDetails.addressLine2 | Bristol                        |
      | respondent.person.contactDetails.addressLine3 | Avon                           |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
      | respondent.person.contactDetails.postcode     | BS15 5AA                       |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                   |
      | wordingFields.0.key                           | Reference                      |
      | wordingFields.0.value                         | REF-{RANDOM}                   |
      | hasOffsiteFee                                 | true                           |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-{RANDOM}                   |
      | notes                                         | Entry detail notes {RANDOM}    |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | officials.0.surname                           | Turner{RANDOM}                 |
      | officials.0.forename                          | Graham                         |
      | officials.0.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes GET API Request To "/application-lists/:listId/entries/:entryId"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | id                                            | :entryId                    |
      | listId                                        | :listId                     |
      | applicationCode                               | CT99002                     |
      | applicant.person.name.firstName               | Detail                      |
      | applicant.person.name.lastName                | Applicant{RANDOM}           |
      | respondent.person.name.firstName              | Sarah                       |
      | respondent.person.name.lastName               | Respondent{RANDOM}          |
      | respondent.person.dateOfBirth                 | todayiso-25y                |
      | wording.substitution-key-constraints[0].key   | Reference                   |
      | wording.substitution-key-constraints[0].value | REF-{RANDOM}                |
      | notes                                         | Entry detail notes {RANDOM} |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-280 @ARCPOC-290
  Scenario Outline: Retrieve application list entries for a list
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                      |
      | time              | timenowhhmm-2h                |
      | status            | OPEN                          |
      | description       | Entry page test list {RANDOM} |
      | courtLocationCode | RCJ001                        |
      | durationHours     | 2                             |
      | durationMinutes   | 22                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Mr                        |
      | applicant.person.name.firstName              | Page                      |
      | applicant.person.name.lastName               | First{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                  |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}             |
      | applicant.person.contactDetails.email        | page1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                      |
      | feeStatuses.0.statusDate                     | todayiso                  |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | CASE-P1-{RANDOM}          |
      | accountNumber                                | ACC-P1-{RANDOM}           |
      | notes                                        | Entry page one {RANDOM}   |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Mr                        |
      | officials.0.surname                          | PageOne{RANDOM}           |
      | officials.0.forename                         | John                      |
      | officials.0.type                             | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP013                    |
      | applicationCode                               | CT99002                   |
      | respondent.person.name.title                  | Mrs                       |
      | respondent.person.name.firstName              | Page                      |
      | respondent.person.name.lastName               | Second{RANDOM}            |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Crown Road       |
      | respondent.person.contactDetails.addressLine2 | Gloucester                |
      | respondent.person.contactDetails.postcode     | GL1 1AA                   |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}             |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}             |
      | respondent.person.contactDetails.email        | page2{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-33y              |
      | wordingFields.0.key                           | Reference                 |
      | wordingFields.0.value                         | PAGE-{RANDOM}             |
      | hasOffsiteFee                                 | false                     |
      | caseReference                                 | CASE-P2-{RANDOM}          |
      | accountNumber                                 | ACC-P2-{RANDOM}           |
      | notes                                         | Entry page two {RANDOM}   |
      | lodgementDate                                 | todayiso                  |
      | officials.0.title                             | Ms                        |
      | officials.0.surname                           | PageTwo{RANDOM}           |
      | officials.0.forename                          | Jane                      |
      | officials.0.type                              | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | pageNumber        | 0         |
      | pageSize          | 10        |
      | totalElements     | 2         |
      | totalPages        | 1         |
      | elementsOnPage    | 2         |
      | content[0].id     | :entryId1 |
      | content[0].listId | :listId   |
      | content[1].id     | :entryId2 |
      | content[1].listId | :listId   |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1322
  Scenario Outline: Filter application list entries by applicant name including standard applicants
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                                |
      | time              | timenowhhmm-2h                          |
      | status            | OPEN                                    |
      | description       | Standard applicant filter list {RANDOM} |
      | courtLocationCode | RCJ001                                  |
      | durationHours     | 2                                       |
      | durationMinutes   | 22                                      |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                       |
      | applicationCode                              | AD99002                    |
      | applicant.person.name.title                  | Mr                         |
      | applicant.person.name.firstName              | John                       |
      | applicant.person.name.lastName               | Turner{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street       |
      | applicant.person.contactDetails.addressLine2 | Westminster                |
      | applicant.person.contactDetails.addressLine3 | London                     |
      | applicant.person.contactDetails.addressLine4 | Greater London             |
      | applicant.person.contactDetails.addressLine5 | United Kingdom             |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                   |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}               |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}              |
      | applicant.person.contactDetails.email        | person{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                       |
      | feeStatuses.0.statusDate                     | todayiso                   |
      | hasOffsiteFee                                | false                      |
      | caseReference                                | CASE-F1-{RANDOM}           |
      | accountNumber                                | ACC-F1-{RANDOM}            |
      | notes                                        | Applicant filter person    |
      | lodgementDate                                | todayiso                   |
      | officials.0.title                            | Mr                         |
      | officials.0.surname                          | FilterOne{RANDOM}          |
      | officials.0.forename                         | John                       |
      | officials.0.type                             | MAGISTRATE                 |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                              | null                           |
      | applicationCode                                    | CT99002                        |
      | applicant.organisation.name                        | Applicant Industries {RANDOM}  |
      | applicant.organisation.contactDetails.addressLine1 | {RANDOM} King Street           |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                    |
      | applicant.organisation.contactDetails.addressLine3 | London                         |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                 |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                   |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.organisation.contactDetails.email        | org{RANDOM}@example.com        |
      | respondent.person.name.title                       | Ms                             |
      | respondent.person.name.firstName                   | Emily                          |
      | respondent.person.name.lastName                    | Brown{RANDOM}                  |
      | respondent.person.contactDetails.addressLine1      | {RANDOM} Market Road           |
      | respondent.person.contactDetails.addressLine2      | Bristol                        |
      | respondent.person.contactDetails.addressLine3      | Avon                           |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                 |
      | respondent.person.contactDetails.postcode          | BS15 5AA                       |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email             | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                      | todayiso-25y                   |
      | wordingFields.0.key                                | Reference                      |
      | wordingFields.0.value                              | {RANDOM}                       |
      | hasOffsiteFee                                      | false                          |
      | caseReference                                      | CASE-F2-{RANDOM}               |
      | accountNumber                                      | ACC-F2-{RANDOM}                |
      | notes                                              | Applicant filter organisation  |
      | lodgementDate                                      | todayiso                       |
      | officials.0.title                                  | Ms                             |
      | officials.0.surname                                | FilterTwo{RANDOM}              |
      | officials.0.forename                               | Jane                           |
      | officials.0.type                                   | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP036                       |
      | applicationCode                               | CT99002                      |
      | respondent.person.name.title                  | Mrs                          |
      | respondent.person.name.firstName              | Claire                       |
      | respondent.person.name.lastName               | Quinn{RANDOM}                |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Crown Road          |
      | respondent.person.contactDetails.addressLine2 | Gloucester                   |
      | respondent.person.contactDetails.postcode     | GL1 1AA                      |
      | respondent.person.contactDetails.phone        | 01454{RANDOM}                |
      | respondent.person.contactDetails.mobile       | 07360{RANDOM}                |
      | respondent.person.contactDetails.email        | standard{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-33y                 |
      | wordingFields.0.key                           | Reference                    |
      | wordingFields.0.value                         | STD-{RANDOM}                 |
      | hasOffsiteFee                                 | false                        |
      | caseReference                                 | CASE-F3-{RANDOM}             |
      | accountNumber                                 | ACC-F3-{RANDOM}              |
      | notes                                         | Applicant filter standard    |
      | lodgementDate                                 | todayiso                     |
      | officials.0.title                             | Mr                           |
      | officials.0.surname                           | FilterThree{RANDOM}          |
      | officials.0.forename                          | James                        |
      | officials.0.type                              | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "standardEntryId"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc&applicantName=Innovative%20Solutions%20Inc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                          | 1                        |
      | elementsOnPage                         | 1                        |
      | content[0].id                          | :standardEntryId         |
      | content[0].applicant.organisation.name | Innovative Solutions Inc |
    When User Makes GET API Request To "/application-codes/CT99002?date=todayiso"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | applicationCode | CT99002                                        |
      | title           | Issue of liability order summons - council tax |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1322 @ARCPOC-1325
  Scenario Outline: Filter application list entries by result code across all applied results
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Result filter test list {RANDOM} |
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
      | applicant.person.name.lastName               | One{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}               |
      | applicant.person.contactDetails.email        | result1{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | CASE-R1-{RANDOM}            |
      | accountNumber                                | ACC-R1-{RANDOM}             |
      | notes                                        | Result filter one           |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | ResultOne{RANDOM}           |
      | officials.0.forename                         | John                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId1/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Mr                          |
      | applicant.person.name.firstName              | Result                      |
      | applicant.person.name.lastName               | Two{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}               |
      | applicant.person.contactDetails.email        | result2{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | CASE-R2-{RANDOM}            |
      | accountNumber                                | ACC-R2-{RANDOM}             |
      | notes                                        | Result filter two           |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | ResultTwo{RANDOM}           |
      | officials.0.forename                         | John                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId2/results" With Object Builder:
      | resultCode    | CASE            |
      | wordingFields | __empty_array__ |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                        |
      | applicationCode                              | AD99002                     |
      | applicant.person.name.title                  | Mr                          |
      | applicant.person.name.firstName              | Result                      |
      | applicant.person.name.lastName               | Three{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                 |
      | applicant.person.contactDetails.addressLine3 | London                      |
      | applicant.person.contactDetails.addressLine4 | Greater London              |
      | applicant.person.contactDetails.addressLine5 | United Kingdom              |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                    |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}               |
      | applicant.person.contactDetails.email        | result3{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                |
      | feeStatuses.0.paymentStatus                  | PAID                        |
      | feeStatuses.0.statusDate                     | todayiso                    |
      | hasOffsiteFee                                | false                       |
      | caseReference                                | CASE-R3-{RANDOM}            |
      | accountNumber                                | ACC-R3-{RANDOM}             |
      | notes                                        | Result filter three         |
      | lodgementDate                                | todayiso                    |
      | officials.0.title                            | Mr                          |
      | officials.0.surname                          | ResultThree{RANDOM}         |
      | officials.0.forename                         | John                        |
      | officials.0.type                             | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId3"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Object Builder:
      | resultCode            | APPC                |
      | wordingFields.0.key   | Name of Crown Court |
      | wordingFields.0.value | Leeds Crown Court   |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries/:entryId3/results" With Object Builder:
      | resultCode            | FRO                   |
      | wordingFields.0.key   | Reason text           |
      | wordingFields.0.value | Caseworker discretion |
    Then User Verify Response Status Code Should Be "201"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc&resulted=APPC"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 3         |
      | elementsOnPage | 3         |
      | content[0].id  | :entryId1 |
      | content[1].id  | :entryId2 |
      | content[2].id  | :entryId3 |

    Examples:
      | User  |
      | user1 |

  @api @applicationListEntry @regression @ARCPOC-1155 @ARCPOC-992 @ARCPOC-1045
  Scenario Outline: Retrieve application list entries with single-column sorting
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                          |
      | time              | timenowhhmm-2h                    |
      | status            | OPEN                              |
      | description       | Applicant sort test list {RANDOM} |
      | courtLocationCode | RCJ001                            |
      | durationHours     | 2                                 |
      | durationMinutes   | 22                                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | APP013                    |
      | applicationCode                               | CT99002                   |
      | respondent.person.name.title                  | Mrs                       |
      | respondent.person.name.firstName              | Claire                    |
      | respondent.person.name.lastName               | Abbott{RANDOM}            |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Bond Street      |
      | respondent.person.contactDetails.addressLine2 | London                    |
      | respondent.person.contactDetails.postcode     | W1S 1AA                   |
      | respondent.person.contactDetails.phone        | 02071{RANDOM}             |
      | respondent.person.contactDetails.mobile       | 07470{RANDOM}             |
      | respondent.person.contactDetails.email        | sort1{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-31y              |
      | wordingFields.0.key                           | Reference                 |
      | wordingFields.0.value                         | {RANDOM}                  |
      | hasOffsiteFee                                 | false                     |
      | caseReference                                 | CASE-S1-{RANDOM}          |
      | accountNumber                                 | ACC-S1-{RANDOM}           |
      | notes                                         | Sort standard applicant   |
      | lodgementDate                                 | todayiso                  |
      | officials.0.title                             | Mr                        |
      | officials.0.surname                           | SortOne{RANDOM}           |
      | officials.0.forename                          | John                      |
      | officials.0.type                              | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                              | null                           |
      | applicationCode                                    | CT99002                        |
      | applicant.organisation.name                        | Beta Org                       |
      | applicant.organisation.contactDetails.addressLine1 | {RANDOM} King Street           |
      | applicant.organisation.contactDetails.addressLine2 | Westminster                    |
      | applicant.organisation.contactDetails.addressLine3 | London                         |
      | applicant.organisation.contactDetails.addressLine4 | Greater London                 |
      | applicant.organisation.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.organisation.contactDetails.postcode     | SW1A 1AA                       |
      | applicant.organisation.contactDetails.phone        | 0203{RANDOM}                   |
      | applicant.organisation.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.organisation.contactDetails.email        | sort2{RANDOM}@example.com      |
      | respondent.person.name.title                       | Ms                             |
      | respondent.person.name.firstName                   | Emily                          |
      | respondent.person.name.lastName                    | Brown{RANDOM}                  |
      | respondent.person.contactDetails.addressLine1      | {RANDOM} Market Road           |
      | respondent.person.contactDetails.addressLine2      | Bristol                        |
      | respondent.person.contactDetails.addressLine3      | Avon                           |
      | respondent.person.contactDetails.addressLine4      | United Kingdom                 |
      | respondent.person.contactDetails.postcode          | BS15 5AA                       |
      | respondent.person.contactDetails.phone             | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile            | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email             | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                      | todayiso-25y                   |
      | wordingFields.0.key                                | Reference                      |
      | wordingFields.0.value                              | {RANDOM}                       |
      | hasOffsiteFee                                      | false                          |
      | caseReference                                      | CASE-S2-{RANDOM}               |
      | accountNumber                                      | ACC-S2-{RANDOM}                |
      | notes                                              | Sort organisation              |
      | lodgementDate                                      | todayiso                       |
      | officials.0.title                                  | Ms                             |
      | officials.0.surname                                | SortTwo{RANDOM}                |
      | officials.0.forename                               | Jane                           |
      | officials.0.type                                   | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Mr                        |
      | applicant.person.name.firstName              | John                      |
      | applicant.person.name.lastName               | Turner{RANDOM}            |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                  |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}             |
      | applicant.person.contactDetails.email        | sort3{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}              |
      | feeStatuses.0.paymentStatus                  | PAID                      |
      | feeStatuses.0.statusDate                     | todayiso                  |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | CASE-S3-{RANDOM}          |
      | accountNumber                                | ACC-S3-{RANDOM}           |
      | notes                                        | Sort person               |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Mr                        |
      | officials.0.surname                          | SortThree{RANDOM}         |
      | officials.0.forename                         | John                      |
      | officials.0.type                             | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId3"
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=applicantName,asc"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements                              | 3             |
      | elementsOnPage                             | 3             |
      | content[0].id                              | :entryId1     |
      | content[0].applicant.person.name.title     | Ms            |
      | content[0].applicant.person.name.firstName | Amelia        |
      | content[0].applicant.person.name.lastName  | Hall          |
      | content[1].id                              | :entryId2     |
      | content[1].applicant.organisation.name     | Beta Org      |
      | content[2].id                              | :entryId3     |
      | sort.orders[0].property                    | applicantName |
      | sort.orders[0].direction                   | asc           |
    When User Makes GET API Request To "/application-codes/CT99002?date=todayiso"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | applicationCode | CT99002                                        |
      | title           | Issue of liability order summons - council tax |

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

  @api @applicationListEntry @regression @ARCPOC-222 @ARCPOC-229 @ARCPOC-1371
  Scenario Outline: Create Application List Entry with Court Location
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                                |
      | time              | timenowhhmm-2h                          |
      | status            | OPEN                                    |
      | description       | Applications to review at Test_{RANDOM} |
      | durationHours     | 2                                       |
      | durationMinutes   | 22                                      |
      | courtLocationCode | LCCC065                                 |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                           |
      | applicationCode                               | CT99002                        |
      | applicant.person.name.title                   | Mr                             |
      | applicant.person.name.lastName                | Taylor {RANDOM}                |
      | applicant.person.name.firstName               | Henry                          |
      | applicant.person.name.middleName              | James                          |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                    |
      | applicant.person.contactDetails.addressLine3  | London                         |
      | applicant.person.contactDetails.addressLine4  | Greater London                 |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                   |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
      | respondent.person.name.title                  | Ms                             |
      | respondent.person.name.lastName               | Clark {RANDOM}                 |
      | respondent.person.name.firstName              | Emily                          |
      | respondent.person.name.middleName             | Rose                           |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
      | respondent.person.contactDetails.addressLine2 | Bristol                        |
      | respondent.person.contactDetails.addressLine3 | Avon                           |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
      | respondent.person.contactDetails.postcode     | BS15 5AA                       |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                   |
      | wordingFields.0.key                           | Reference                      |
      | wordingFields.0.value                         | {RANDOM}                       |
      | hasOffsiteFee                                 | true                           |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-{RANDOM}                   |
      | notes                                         | Case noted with ref {RANDOM}   |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | officials.0.surname                           | Turner {RANDOM}                |
      | officials.0.forename                          | Graham                         |
      | officials.0.type                              | MAGISTRATE                     |
      | officials.1.title                             | Ms                             |
      | officials.1.surname                           | Hayes {RANDOM}                 |
      | officials.1.forename                          | Laura                          |
      | officials.1.type                              | MAGISTRATE                     |
      | officials.2.title                             | Mr                             |
      | officials.2.surname                           | Miller {RANDOM}                |
      | officials.2.forename                          | Peter                          |
      | officials.2.type                              | CLERK                          |
      | officials.3.title                             | Ms                             |
      | officials.3.surname                           | Patel {RANDOM}                 |
      | officials.3.forename                          | Anita                          |
      | officials.3.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"
    When User Makes PUT API Request To "/application-lists/:listId/entries/:entryId" With Object Builder:
      | standardApplicantCode                         | null                                 |
      | applicationCode                               | CT99002                              |
      | applicant.person.name.title                   | Mr                                   |
      | applicant.person.name.lastName                | Taylor {RANDOM}                      |
      | applicant.person.name.firstName               | Henry                                |
      | applicant.person.name.middleName              | James                                |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street                 |
      | applicant.person.contactDetails.addressLine2  | Westminster                          |
      | applicant.person.contactDetails.addressLine3  | London                               |
      | applicant.person.contactDetails.addressLine4  | Greater London                       |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                       |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                             |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                         |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                        |
      | applicant.person.contactDetails.email         | {RANDOM}@example.com                 |
      | respondent.person.name.title                  | Ms                                   |
      | respondent.person.name.lastName               | Clark {RANDOM}                       |
      | respondent.person.name.firstName              | Emily                                |
      | respondent.person.name.middleName             | Rose                                 |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road                 |
      | respondent.person.contactDetails.addressLine2 | Bristol                              |
      | respondent.person.contactDetails.addressLine3 | Avon                                 |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                       |
      | respondent.person.contactDetails.postcode     | BS15 5AA                             |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                         |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                        |
      | respondent.person.contactDetails.email        | {RANDOM}@example.com                 |
      | respondent.person.dateOfBirth                 | todayiso-25y                         |
      | wordingFields.0.key                           | Reference                            |
      | wordingFields.0.value                         | {RANDOM}                             |
      | hasOffsiteFee                                 | true                                 |
      | caseReference                                 | CASE-{RANDOM}                        |
      | accountNumber                                 | ACC-{RANDOM}                         |
      | notes                                         | Updated case noted with ref {RANDOM} |
      | lodgementDate                                 | todayiso                             |
      | officials.0.title                             | Mr                                   |
      | officials.0.surname                           | Turner {RANDOM}                      |
      | officials.0.forename                          | Graham                               |
      | officials.0.type                              | MAGISTRATE                           |
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                                |
      | applicationCode                              | AD99002                             |
      | applicant.person.name.title                  | Mr                                  |
      | applicant.person.name.lastName               | Smith {RANDOM}                      |
      | applicant.person.name.firstName              | John                                |
      | applicant.person.name.middleName             | A                                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street                |
      | applicant.person.contactDetails.addressLine2 | Westminster                         |
      | applicant.person.contactDetails.addressLine3 | London                              |
      | applicant.person.contactDetails.addressLine4 | Greater London                      |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                      |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                            |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                        |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                       |
      | applicant.person.contactDetails.email        | john.smith{RANDOM}@example.com      |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                        |
      | feeStatuses.0.paymentStatus                  | PAID                                |
      | feeStatuses.0.statusDate                     | todayiso                            |
      | hasOffsiteFee                                | false                               |
      | caseReference                                | CASE-001                            |
      | accountNumber                                | APP-{RANDOM}                        |
      | notes                                        | Application discussion ref {RANDOM} |
      | lodgementDate                                | todayiso                            |
      | officials.0.title                            | Mr                                  |
      | officials.0.surname                          | Smith{RANDOM}                       |
      | officials.0.forename                         | John                                |
      | officials.0.type                             | MAGISTRATE                          |
    Then User Verify Response Status Code Should Be "201"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                               | null                           |
      | applicationCode                                     | CT99002                        |
      | applicant.organisation.name                         | Applicant Industries {RANDOM}  |
      | applicant.organisation.contactDetails.addressLine1  | {RANDOM} King Street           |
      | applicant.organisation.contactDetails.addressLine2  | Westminster                    |
      | applicant.organisation.contactDetails.addressLine3  | London                         |
      | applicant.organisation.contactDetails.addressLine4  | Greater London                 |
      | applicant.organisation.contactDetails.addressLine5  | United Kingdom                 |
      | applicant.organisation.contactDetails.postcode      | SW1A 1AA                       |
      | applicant.organisation.contactDetails.phone         | 0203{RANDOM}                   |
      | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}                  |
      | applicant.organisation.contactDetails.email         | applicant{RANDOM}@example.com  |
      | respondent.organisation.name                        | Respondent Industries {RANDOM} |
      | respondent.organisation.contactDetails.addressLine1 | {RANDOM} Market Road           |
      | respondent.organisation.contactDetails.addressLine2 | Bristol                        |
      | respondent.organisation.contactDetails.addressLine3 | Avon                           |
      | respondent.organisation.contactDetails.addressLine4 | United Kingdom                 |
      | respondent.organisation.contactDetails.postcode     | BS15 5AA                       |
      | respondent.organisation.contactDetails.phone        | 0117{RANDOM}                   |
      | respondent.organisation.contactDetails.mobile       | 07984{RANDOM}                  |
      | respondent.organisation.contactDetails.email        | respondent{RANDOM}@example.com |
      | wordingFields.0.key                                 | Reference                      |
      | wordingFields.0.value                               | {RANDOM}                       |
      | hasOffsiteFee                                       | true                           |
      | caseReference                                       | CASE-{RANDOM}                  |
      | accountNumber                                       | ACC-{RANDOM}                   |
      | notes                                               | Case noted with ref {RANDOM}   |
      | lodgementDate                                       | todayiso                       |
      | officials.0.title                                   | Mr                             |
      | officials.0.surname                                 | Turner {RANDOM}                |
      | officials.0.forename                                | Graham                         |
      | officials.0.type                                    | MAGISTRATE                     |
      | officials.1.title                                   | Ms                             |
      | officials.1.surname                                 | Hayes {RANDOM}                 |
      | officials.1.forename                                | Laura                          |
      | officials.1.type                                    | MAGISTRATE                     |
      | officials.2.title                                   | Mr                             |
      | officials.2.surname                                 | Miller {RANDOM}                |
      | officials.2.forename                                | Peter                          |
      | officials.2.type                                    | CLERK                          |
      | officials.3.title                                   | Ms                             |
      | officials.3.surname                                 | Patel {RANDOM}                 |
      | officials.3.forename                                | Anita                          |
      | officials.3.type                                    | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    When User Makes GET API Request To "/application-lists/:listId/print"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | date                     | todayiso                          |
      | time                     | timenowhhmm-2h                    |
      | courtName                | Leeds Combined Court Centre Set 7 |
      | cja                      | null                              |
      | otherLocationDescription | null                              |
      | duration                 | 2 Hours 22 Minutes                |
    When User Makes GET API Request To "/application-list-entries?respondentOrganisation=Respondent Industries {RANDOM}"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | content[0].respondent.organisation.name | Respondent Industries {RANDOM} |

    Examples:
      | User  |
      | user1 |

Feature: API - Application List Entry Validation

  Background:
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                              |
      | time              | timenowhhmm-2h                        |
      | status            | OPEN                                  |
      | description       | ALE validation test list {RANDOM}     |
      | courtLocationCode | RCJ001                                |
      | durationHours     | 2                                     |
      | durationMinutes   | 22                                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @api @applicationListEntry @regression @ARCPOC-934
  Scenario: Create application list entry with optional respondent for a non-respondent application code
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | CT99001                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | John                           |
      | applicant.person.name.lastName               | Optional{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | optional{RANDOM}@example.com   |
      | respondent.person.name.title                 | Ms                             |
      | respondent.person.name.firstName             | Rachel                         |
      | respondent.person.name.lastName              | Optional{RANDOM}               |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Street        |
      | respondent.person.contactDetails.addressLine2 | Bristol                       |
      | respondent.person.contactDetails.addressLine3 | Avon                          |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                |
      | respondent.person.contactDetails.postcode    | BS15 5AA                       |
      | respondent.person.contactDetails.phone       | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile      | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email       | respondent{RANDOM}@example.com |
      | wordingFields.0.key                          | Number                         |
      | wordingFields.0.value                        | 5                              |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-{RANDOM}                  |
      | notes                                        | Optional respondent validation |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Clerk{RANDOM}                  |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Verify Response Body Should Have:
      | applicationCode                    | CT99001          |
      | respondent.person.name.firstName   | Rachel           |
      | respondent.person.name.lastName    | Optional{RANDOM} |

  @api @applicationListEntry @regression @ARCPOC-935
  Scenario: Create application list entry with bulk respondent details when application code allows bulk respondents
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | CT99001                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | John                         |
      | applicant.person.name.lastName               | Bulk{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | bulk{RANDOM}@example.com     |
      | numberOfRespondents                          | 5                            |
      | wordingFields.0.key                          | Number                       |
      | wordingFields.0.value                        | 5                            |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | CASE-{RANDOM}                |
      | notes                                        | Bulk respondent validation   |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Clerk{RANDOM}                |
      | officials.0.forename                         | John                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Verify Response Body Should Have:
      | applicationCode       | CT99001 |
      | numberOfRespondents   | 5       |

  @api @applicationListEntry @regression @ARCPOC-935
  Scenario: Reject bulk respondent payloads when both respondent details and respondent count are provided
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                           |
      | applicationCode                              | CT99001                        |
      | applicant.person.name.title                  | Mr                             |
      | applicant.person.name.firstName              | John                           |
      | applicant.person.name.lastName               | Both{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                    |
      | applicant.person.contactDetails.addressLine3 | London                         |
      | applicant.person.contactDetails.addressLine4 | Greater London                 |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                 |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                       |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email        | both{RANDOM}@example.com       |
      | respondent.person.name.title                 | Ms                             |
      | respondent.person.name.firstName             | Rachel                         |
      | respondent.person.name.lastName              | Both{RANDOM}                   |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Street        |
      | respondent.person.contactDetails.addressLine2 | Bristol                       |
      | respondent.person.contactDetails.addressLine3 | Avon                          |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                |
      | respondent.person.contactDetails.postcode    | BS15 5AA                       |
      | respondent.person.contactDetails.phone       | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile      | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email       | respondent{RANDOM}@example.com |
      | numberOfRespondents                          | 10                             |
      | wordingFields.0.key                          | Number                         |
      | wordingFields.0.value                        | 5                              |
      | hasOffsiteFee                                | false                          |
      | caseReference                                | CASE-{RANDOM}                  |
      | notes                                        | Mutually exclusive validation  |
      | lodgementDate                                | todayiso                       |
      | officials.0.title                            | Mr                             |
      | officials.0.surname                          | Clerk{RANDOM}                  |
      | officials.0.forename                         | John                           |
      | officials.0.type                             | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | ALE-21 |
      | status | 400    |

  @api @applicationListEntry @regression @ARCPOC-935
  Scenario: Reject bulk respondent payloads when neither respondent details nor respondent count are provided
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | CT99001                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | John                         |
      | applicant.person.name.lastName               | Missing{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.addressLine2 | Westminster                  |
      | applicant.person.contactDetails.addressLine3 | London                       |
      | applicant.person.contactDetails.addressLine4 | Greater London               |
      | applicant.person.contactDetails.addressLine5 | United Kingdom               |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                     |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                |
      | applicant.person.contactDetails.email        | missing{RANDOM}@example.com  |
      | wordingFields.0.key                          | Number                       |
      | wordingFields.0.value                        | 5                            |
      | hasOffsiteFee                                | false                        |
      | caseReference                                | CASE-{RANDOM}                |
      | notes                                        | Missing respondent validation |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Clerk{RANDOM}                |
      | officials.0.forename                         | John                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | ALE-22 |
      | status | 400    |

  @api @applicationListEntry @regression @ARCPOC-1027
  Scenario: Reject EF application code entries without an account number
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                           |
      | applicationCode                               | EF1213                         |
      | applicant.person.name.title                   | Mr                             |
      | applicant.person.name.firstName               | John                           |
      | applicant.person.name.lastName                | Fine{RANDOM}                   |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                    |
      | applicant.person.contactDetails.addressLine3  | London                         |
      | applicant.person.contactDetails.addressLine4  | Greater London                 |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
      | applicant.person.contactDetails.postcode      | SW1A 2AA                       |
      | applicant.person.contactDetails.phone         | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email         | fine{RANDOM}@example.com       |
      | respondent.person.name.title                  | Ms                             |
      | respondent.person.name.firstName              | Rachel                         |
      | respondent.person.name.lastName               | Fine{RANDOM}                   |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Street         |
      | respondent.person.contactDetails.addressLine2 | Bristol                        |
      | respondent.person.contactDetails.addressLine3 | Avon                           |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
      | respondent.person.contactDetails.postcode     | BS15 5AA                       |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
      | wordingFields                                 | __empty_array__                |
      | feeStatuses.0.paymentReference                | PAY-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                   | PAID                           |
      | feeStatuses.0.statusDate                      | todayiso                       |
      | hasOffsiteFee                                 | false                          |
      | caseReference                                 | CASE-{RANDOM}                  |
      | notes                                         | EF account number validation   |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | officials.0.surname                           | Clerk{RANDOM}                  |
      | officials.0.forename                          | John                           |
      | officials.0.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | ALE-20 |
      | status | 400    |

  @api @applicationListEntry @regression @ARCPOC-1028
  Scenario: Reject disallowed characters in applicant fields
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                               | null                        |
      | applicationCode                                     | CT99001                     |
      | applicant.organisation.name                         | Applicant	Industries        |
      | applicant.organisation.contactDetails.addressLine1  | {RANDOM} High Street        |
      | applicant.organisation.contactDetails.addressLine2  | Westminster                 |
      | applicant.organisation.contactDetails.addressLine3  | London                      |
      | applicant.organisation.contactDetails.addressLine4  | Greater London              |
      | applicant.organisation.contactDetails.addressLine5  | United Kingdom              |
      | applicant.organisation.contactDetails.postcode      | SW1A 2AA                    |
      | applicant.organisation.contactDetails.phone         | 0207{RANDOM}                |
      | applicant.organisation.contactDetails.mobile        | 07123{RANDOM}               |
      | applicant.organisation.contactDetails.email         | applicant{RANDOM}@example.com |
      | numberOfRespondents                                 | 5                           |
      | wordingFields.0.key                                 | Number                      |
      | wordingFields.0.value                               | 5                           |
      | hasOffsiteFee                                       | false                       |
      | caseReference                                       | CASE-{RANDOM}               |
      | notes                                               | Applicant validation        |
      | lodgementDate                                       | todayiso                    |
      | officials.0.title                                   | Mr                          |
      | officials.0.surname                                 | Clerk{RANDOM}               |
      | officials.0.forename                                | John                        |
      | officials.0.type                                    | MAGISTRATE                  |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | COMMON-11                     |
      | status | 400                           |
      | detail | Validation failed for fields: |

  @api @applicationListEntry @regression @ARCPOC-1029
  Scenario: Reject disallowed characters in respondent fields
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                                | null                           |
      | applicationCode                                      | CT99001                        |
      | applicant.person.name.title                          | Mr                             |
      | applicant.person.name.firstName                      | John                           |
      | applicant.person.name.lastName                       | Respondent{RANDOM}             |
      | applicant.person.contactDetails.addressLine1         | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2         | Westminster                    |
      | applicant.person.contactDetails.addressLine3         | London                         |
      | applicant.person.contactDetails.addressLine4         | Greater London                 |
      | applicant.person.contactDetails.addressLine5         | United Kingdom                 |
      | applicant.person.contactDetails.postcode             | SW1A 2AA                       |
      | applicant.person.contactDetails.phone                | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile               | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email                | applicant{RANDOM}@example.com  |
      | respondent.organisation.name                         | Respondent	Industries         |
      | respondent.organisation.contactDetails.addressLine1  | {RANDOM} Market Street         |
      | respondent.organisation.contactDetails.addressLine2  | Bristol                        |
      | respondent.organisation.contactDetails.addressLine3  | Avon                           |
      | respondent.organisation.contactDetails.addressLine4  | United Kingdom                 |
      | respondent.organisation.contactDetails.postcode      | BS15 5AA                       |
      | respondent.organisation.contactDetails.phone         | 0117{RANDOM}                   |
      | respondent.organisation.contactDetails.mobile        | 07984{RANDOM}                  |
      | respondent.organisation.contactDetails.email         | respondent{RANDOM}@example.com |
      | wordingFields.0.key                                  | Number                         |
      | wordingFields.0.value                                | 5                              |
      | hasOffsiteFee                                        | false                          |
      | caseReference                                        | CASE-{RANDOM}                  |
      | notes                                                | Respondent validation          |
      | lodgementDate                                        | todayiso                       |
      | officials.0.title                                    | Mr                             |
      | officials.0.surname                                  | Clerk{RANDOM}                  |
      | officials.0.forename                                 | John                           |
      | officials.0.type                                     | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | COMMON-11                     |
      | status | 400                           |
      | detail | Validation failed for fields: |

  @api @applicationListEntry @regression @ARCPOC-1032
  Scenario: Reject organisation respondent payloads that include date of birth
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                                | null                           |
      | applicationCode                                      | CT99001                        |
      | applicant.person.name.title                          | Mr                             |
      | applicant.person.name.firstName                      | John                           |
      | applicant.person.name.lastName                       | Organisation{RANDOM}           |
      | applicant.person.contactDetails.addressLine1         | {RANDOM} High Street           |
      | applicant.person.contactDetails.addressLine2         | Westminster                    |
      | applicant.person.contactDetails.addressLine3         | London                         |
      | applicant.person.contactDetails.addressLine4         | Greater London                 |
      | applicant.person.contactDetails.addressLine5         | United Kingdom                 |
      | applicant.person.contactDetails.postcode             | SW1A 2AA                       |
      | applicant.person.contactDetails.phone                | 0207{RANDOM}                   |
      | applicant.person.contactDetails.mobile               | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email                | applicant{RANDOM}@example.com  |
      | respondent.person.name.title                         | Ms                             |
      | respondent.person.name.firstName                     | Rachel                         |
      | respondent.person.name.lastName                      | Person{RANDOM}                 |
      | respondent.person.contactDetails.addressLine1        | {RANDOM} Market Street         |
      | respondent.person.contactDetails.addressLine2        | Bristol                        |
      | respondent.person.contactDetails.addressLine3        | Avon                           |
      | respondent.person.contactDetails.addressLine4        | United Kingdom                 |
      | respondent.person.contactDetails.postcode            | BS15 5AA                       |
      | respondent.person.contactDetails.phone               | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile              | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email               | person{RANDOM}@example.com     |
      | respondent.person.dateOfBirth                        | todayiso-25y                   |
      | respondent.organisation.name                         | Organisation {RANDOM}          |
      | respondent.organisation.contactDetails.addressLine1  | {RANDOM} Market Road           |
      | respondent.organisation.contactDetails.addressLine2  | Bristol                        |
      | respondent.organisation.contactDetails.addressLine3  | Avon                           |
      | respondent.organisation.contactDetails.addressLine4  | United Kingdom                 |
      | respondent.organisation.contactDetails.postcode      | BS15 5AA                       |
      | respondent.organisation.contactDetails.phone         | 0117{RANDOM}                   |
      | respondent.organisation.contactDetails.mobile        | 07984{RANDOM}                  |
      | respondent.organisation.contactDetails.email         | organisation{RANDOM}@example.com |
      | wordingFields.0.key                                  | Number                         |
      | wordingFields.0.value                                | 5                              |
      | hasOffsiteFee                                        | false                          |
      | caseReference                                        | CASE-{RANDOM}                  |
      | notes                                                | Organisation respondent validation |
      | lodgementDate                                        | todayiso                       |
      | officials.0.title                                    | Mr                             |
      | officials.0.surname                                  | Clerk{RANDOM}                  |
      | officials.0.forename                                 | John                           |
      | officials.0.type                                     | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "400"
    Then User Verify Response Body Should Have:
      | type   | ALE-1 |
      | status | 400   |

  @api @applicationListEntry @regression @ARCPOC-1271
  Scenario: Create application list entry with a valid offsite fee selection
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                         |
      | applicationCode                              | AD99001                      |
      | applicant.person.name.title                  | Mr                           |
      | applicant.person.name.firstName              | John                         |
      | applicant.person.name.lastName               | Offsite{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street         |
      | applicant.person.contactDetails.postcode     | AA1 1AA                      |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                 |
      | applicant.person.contactDetails.email        | offsite{RANDOM}@example.com  |
      | wordingFields                                | __empty_array__              |
      | feeStatuses.0.paymentReference               | PAY-{RANDOM}                 |
      | feeStatuses.0.paymentStatus                  | PAID                         |
      | feeStatuses.0.statusDate                     | todayiso                     |
      | hasOffsiteFee                                | true                         |
      | caseReference                                | CASE-{RANDOM}                |
      | notes                                        | Offsite fee validation       |
      | lodgementDate                                | todayiso                     |
      | officials.0.title                            | Mr                           |
      | officials.0.surname                          | Clerk{RANDOM}                |
      | officials.0.forename                         | John                         |
      | officials.0.type                             | MAGISTRATE                   |
    Then User Verify Response Status Code Should Be "201"
    Then User Verify Response Body Should Have:
      | applicationCode  | AD99001 |
      | hasOffsiteFee    | true    |

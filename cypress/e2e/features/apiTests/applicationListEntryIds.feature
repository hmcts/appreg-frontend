Feature: API - Application List Entry IDs

  # TODO: map follow-on JIRA keys for entry-ids coverage.
  @api @applicationListEntry @regression
  Scenario Outline: Retrieve all application list entry ids for a list
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                       |
      | time              | timenowhhmm-2h                 |
      | status            | OPEN                           |
      | description       | Entry ids list {RANDOM}        |
      | courtLocationCode | RCJ001                         |
      | durationHours     | 2                              |
      | durationMinutes   | 22                             |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Mr                        |
      | applicant.person.name.firstName              | Ids                       |
      | applicant.person.name.lastName               | Alpha{RANDOM}             |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street      |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                  |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}             |
      | applicant.person.contactDetails.email        | ids-a{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | IDS-A-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                      |
      | feeStatuses.0.statusDate                     | todayiso                  |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | IDS-A-{RANDOM}            |
      | accountNumber                                | IDS-A-{RANDOM}            |
      | notes                                        | Entry ids alpha           |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Mr                        |
      | officials.0.surname                          | OfficialA{RANDOM}         |
      | officials.0.forename                         | Clerk                     |
      | officials.0.type                             | CLERK                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                      |
      | applicationCode                              | AD99002                   |
      | applicant.person.name.title                  | Ms                        |
      | applicant.person.name.firstName              | Ids                       |
      | applicant.person.name.lastName               | Beta{RANDOM}              |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street    |
      | applicant.person.contactDetails.addressLine2 | Westminster               |
      | applicant.person.contactDetails.addressLine3 | London                    |
      | applicant.person.contactDetails.addressLine4 | Greater London            |
      | applicant.person.contactDetails.addressLine5 | United Kingdom            |
      | applicant.person.contactDetails.postcode     | BS1 5AA                   |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}              |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}             |
      | applicant.person.contactDetails.email        | ids-b{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | IDS-B-{RANDOM}            |
      | feeStatuses.0.paymentStatus                  | PAID                      |
      | feeStatuses.0.statusDate                     | todayiso                  |
      | hasOffsiteFee                                | false                     |
      | caseReference                                | IDS-B-{RANDOM}            |
      | accountNumber                                | IDS-B-{RANDOM}            |
      | notes                                        | Entry ids beta            |
      | lodgementDate                                | todayiso                  |
      | officials.0.title                            | Ms                        |
      | officials.0.surname                          | OfficialB{RANDOM}         |
      | officials.0.forename                         | Bench                     |
      | officials.0.type                             | MAGISTRATE                |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId2"
    When User Makes GET API Request To "/application-lists/:listId/entries/ids"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | ids.length | 2 |
    Then User Verify Response Body Array Property "ids" Should Contain Values:
      | :entryId1 |
      | :entryId2 |

    Examples:
      | User  |
      | user1 |

  # TODO: map follow-on JIRA keys for entry-ids coverage.
  @api @applicationListEntry @regression
  Scenario Outline: Retrieve filtered application list entry ids by applicant name
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Filtered entry ids list {RANDOM} |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Mr                               |
      | applicant.person.name.firstName              | Match                            |
      | applicant.person.name.lastName               | CandidateA{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                         |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                    |
      | applicant.person.contactDetails.email        | ids-match-a{RANDOM}@example.com  |
      | feeStatuses.0.paymentReference               | IDS-MA-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | IDS-MA-{RANDOM}                  |
      | accountNumber                                | IDS-MA-{RANDOM}                  |
      | notes                                        | Entry ids match alpha            |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Mr                               |
      | officials.0.surname                          | MatchOfficialA{RANDOM}           |
      | officials.0.forename                         | Clerk                            |
      | officials.0.type                             | CLERK                            |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "matchingEntryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                             |
      | applicationCode                              | AD99002                          |
      | applicant.person.name.title                  | Ms                               |
      | applicant.person.name.firstName              | Match                            |
      | applicant.person.name.lastName               | CandidateB{RANDOM}               |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street           |
      | applicant.person.contactDetails.addressLine2 | Westminster                      |
      | applicant.person.contactDetails.addressLine3 | London                           |
      | applicant.person.contactDetails.addressLine4 | Greater London                   |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                   |
      | applicant.person.contactDetails.postcode     | BS1 5AA                          |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}                     |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                    |
      | applicant.person.contactDetails.email        | ids-match-b{RANDOM}@example.com  |
      | feeStatuses.0.paymentReference               | IDS-MB-{RANDOM}                  |
      | feeStatuses.0.paymentStatus                  | PAID                             |
      | feeStatuses.0.statusDate                     | todayiso                         |
      | hasOffsiteFee                                | false                            |
      | caseReference                                | IDS-MB-{RANDOM}                  |
      | accountNumber                                | IDS-MB-{RANDOM}                  |
      | notes                                        | Entry ids match beta             |
      | lodgementDate                                | todayiso                         |
      | officials.0.title                            | Ms                               |
      | officials.0.surname                          | MatchOfficialB{RANDOM}           |
      | officials.0.forename                         | Bench                            |
      | officials.0.type                             | MAGISTRATE                       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "matchingEntryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Other                             |
      | applicant.person.name.lastName               | Candidate{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Other Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                          |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                     |
      | applicant.person.contactDetails.email        | ids-other{RANDOM}@example.com     |
      | feeStatuses.0.paymentReference               | IDS-OT-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | IDS-OT-{RANDOM}                   |
      | accountNumber                                | IDS-OT-{RANDOM}                   |
      | notes                                        | Entry ids other                   |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | OtherOfficial{RANDOM}             |
      | officials.0.forename                         | Keeper                            |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "201"
    When User Makes GET API Request To "/application-lists/:listId/entries/ids?applicantName=Match"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | ids.length | 2 |
    Then User Verify Response Body Array Property "ids" Should Contain Values:
      | :matchingEntryId1 |
      | :matchingEntryId2 |

    Examples:
      | User  |
      | user1 |

  # TODO: map follow-on JIRA keys for entry-ids coverage.
  @api @applicationListEntry @regression
  Scenario Outline: Match entry ids endpoint results to paged list results
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Object Builder:
      | date              | todayiso                         |
      | time              | timenowhhmm-2h                   |
      | status            | OPEN                             |
      | description       | Matched entry ids list {RANDOM}  |
      | courtLocationCode | RCJ001                           |
      | durationHours     | 2                                |
      | durationMinutes   | 22                               |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                          |
      | applicationCode                              | AD99002                       |
      | applicant.person.name.title                  | Mr                            |
      | applicant.person.name.firstName              | Compare                       |
      | applicant.person.name.lastName               | MatchA{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} High Street          |
      | applicant.person.contactDetails.addressLine2 | Westminster                   |
      | applicant.person.contactDetails.addressLine3 | London                        |
      | applicant.person.contactDetails.addressLine4 | Greater London                |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                |
      | applicant.person.contactDetails.postcode     | SW1A 1AA                      |
      | applicant.person.contactDetails.phone        | 0207{RANDOM}                  |
      | applicant.person.contactDetails.mobile       | 07123{RANDOM}                 |
      | applicant.person.contactDetails.email        | ids-compare-a{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | IDS-CA-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                          |
      | feeStatuses.0.statusDate                     | todayiso                      |
      | hasOffsiteFee                                | false                         |
      | caseReference                                | IDS-CA-{RANDOM}               |
      | accountNumber                                | IDS-CA-{RANDOM}               |
      | notes                                        | Entry ids compare alpha       |
      | lodgementDate                                | todayiso                      |
      | officials.0.title                            | Mr                            |
      | officials.0.surname                          | CompareOfficialA{RANDOM}      |
      | officials.0.forename                         | Clerk                         |
      | officials.0.type                             | CLERK                         |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "matchingEntryId1"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                          |
      | applicationCode                              | AD99002                       |
      | applicant.person.name.title                  | Ms                            |
      | applicant.person.name.firstName              | Compare                       |
      | applicant.person.name.lastName               | MatchB{RANDOM}                |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Market Street        |
      | applicant.person.contactDetails.addressLine2 | Westminster                   |
      | applicant.person.contactDetails.addressLine3 | London                        |
      | applicant.person.contactDetails.addressLine4 | Greater London                |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                |
      | applicant.person.contactDetails.postcode     | BS1 5AA                       |
      | applicant.person.contactDetails.phone        | 0117{RANDOM}                  |
      | applicant.person.contactDetails.mobile       | 07124{RANDOM}                 |
      | applicant.person.contactDetails.email        | ids-compare-b{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | IDS-CB-{RANDOM}               |
      | feeStatuses.0.paymentStatus                  | PAID                          |
      | feeStatuses.0.statusDate                     | todayiso                      |
      | hasOffsiteFee                                | false                         |
      | caseReference                                | IDS-CB-{RANDOM}               |
      | accountNumber                                | IDS-CB-{RANDOM}               |
      | notes                                        | Entry ids compare beta        |
      | lodgementDate                                | todayiso                      |
      | officials.0.title                            | Ms                            |
      | officials.0.surname                          | CompareOfficialB{RANDOM}      |
      | officials.0.forename                         | Bench                         |
      | officials.0.type                             | MAGISTRATE                    |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "matchingEntryId2"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                        | null                              |
      | applicationCode                              | AD99002                           |
      | applicant.person.name.title                  | Mr                                |
      | applicant.person.name.firstName              | Different                         |
      | applicant.person.name.lastName               | Candidate{RANDOM}                 |
      | applicant.person.contactDetails.addressLine1 | {RANDOM} Other Street             |
      | applicant.person.contactDetails.addressLine2 | Westminster                       |
      | applicant.person.contactDetails.addressLine3 | London                            |
      | applicant.person.contactDetails.addressLine4 | Greater London                    |
      | applicant.person.contactDetails.addressLine5 | United Kingdom                    |
      | applicant.person.contactDetails.postcode     | SW1A 2AA                          |
      | applicant.person.contactDetails.phone        | 0208{RANDOM}                      |
      | applicant.person.contactDetails.mobile       | 07125{RANDOM}                     |
      | applicant.person.contactDetails.email        | ids-compare-other{RANDOM}@example.com |
      | feeStatuses.0.paymentReference               | IDS-CO-{RANDOM}                   |
      | feeStatuses.0.paymentStatus                  | PAID                              |
      | feeStatuses.0.statusDate                     | todayiso                          |
      | hasOffsiteFee                                | false                             |
      | caseReference                                | IDS-CO-{RANDOM}                   |
      | accountNumber                                | IDS-CO-{RANDOM}                   |
      | notes                                        | Entry ids compare other           |
      | lodgementDate                                | todayiso                          |
      | officials.0.title                            | Mr                                |
      | officials.0.surname                          | CompareOfficialOther{RANDOM}      |
      | officials.0.forename                         | Keeper                            |
      | officials.0.type                             | CLERK                             |
    Then User Verify Response Status Code Should Be "201"
    When User Makes GET API Request To "/application-lists/:listId/entries/ids?applicantName=Compare"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | ids.length | 2 |
    Then User Verify Response Body Array Property "ids" Should Contain Values:
      | :matchingEntryId1 |
      | :matchingEntryId2 |
    When User Makes GET API Request To "/application-lists/:listId/entries?pageNumber=0&pageSize=10&sort=sequenceNumber,asc&applicantName=Compare"
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Should Have:
      | totalElements  | 2 |
      | elementsOnPage | 2 |
    Then User Verify Response Body Array Property "content" At Field "id" Should Contain Values:
      | :matchingEntryId1 |
      | :matchingEntryId2 |

    Examples:
      | User  |
      | user1 |

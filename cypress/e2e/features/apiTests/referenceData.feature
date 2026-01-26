Feature: Reference Data

    @api @regression @ARCPOC-415
    Scenario Outline: Verifying Court Locations Reference Data via API
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/court-locations"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | pageNumber              | 0                         |
            | pageSize                | 10                        |
            | totalPages              | 6                         |
            | totalElements           | 56                        |
            | first                   | true                      |
            | last                    | false                     |
            | elementsOnPage          | 10                        |
            | content[0].name         | Bristol Crown Court Set 3 |
            | content[0].locationCode | BCC026                    |
            | content[1].name         | Bristol Crown Court Set 4 |
            | content[1].locationCode | BCC036                    |
            | content[9].name         | Cardiff Crown Court Set 1 |
            | content[9].locationCode | CCC003                    |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-416
    Scenario Outline: Verifying Court Location Code
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/court-locations/RCJ001?date=2025-12-04"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | name         | Royal Courts of Justice Set 1 |
            | locationCode | RCJ001                        |
            | startDate    | 1875-12-04                    |
        When User Makes GET API Request To "/court-locations/RCJ021?date=2025-12-04"
        Then User Verify Response Body Should Have:
            | title  | Court Location not found |
            | status | 404                      |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-551
    Scenario Outline: Verifying Criminal Justice Area Reference Data via API
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/criminal-justice-areas"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | pageNumber             | 0          |
            | pageSize               | 10         |
            | totalPages             | 4          |
            | totalElements          | 32         |
            | first                  | true       |
            | last                   | false      |
            | elementsOnPage         | 10         |
            | content[0].code        | 01         |
            | content[0].description | London     |
            | content[1].code        | 02         |
            | content[1].description | Manchester |
            | content[2].code        | 03         |
            | content[2].description | Birmingham |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-550
    Scenario Outline: Verifying CJA Code
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/criminal-justice-areas/09"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | code        | 09         |
            | description | Nottingham |
        When User Makes GET API Request To "/criminal-justice-areas/99"
        Then User Verify Response Body Should Have:
            | title  | Criminal Justice Area not found |
            | status | 404                             |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-411
    Scenario Outline: Verifying Application Codes Reference Data via API
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/application-codes"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | pageNumber     | 0     |
            | pageSize       | 10    |
            | totalPages     | 9     |
            | totalElements  | 83    |
            | first          | true  |
            | last           | false |
            | elementsOnPage | 10    |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-412
    Scenario Outline: Verifying Application Code
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/application-codes/RE99003?date=2016-01-01"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | applicationCode                                           | RE99003                                                             |
            | title                                                     | Rights of Entry Warrant - Food Safety Regs                          |
            | wording.template                                          | Application for a warrant to enter premises at {{Premises Address}} |
            | wording.substitution-key-constraints[0].key               | Premises Address                                                    |
            | wording.substitution-key-constraints[0].value             | null                                                                |
            | wording.substitution-key-constraints[0].constraint.type   | TEXT                                                                |
            | wording.substitution-key-constraints[0].constraint.length | 200                                                                 |
            | isFeeDue                                                  | true                                                                |
            | requiresRespondent                                        | false                                                               |
            | bulkRespondentAllowed                                     | false                                                               |
            | feeReference                                              | CO9.1                                                               |
            | feeDescription                                            | Rights of entry warrant                                             |
            | feeAmount.value                                           | 2200                                                                |
            | feeAmount.currency                                        | GBP                                                                 |
            | startDate                                                 | 2016-01-01                                                          |
        When User Makes GET API Request To "/application-codes/XX99999?date=2016-01-01"
        Then User Verify Response Body Should Have:
            | title  | Application code not found |
            | status | 404                        |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-656
    Scenario Outline: Verify Result Code Reference Data via API
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/result-codes"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | pageNumber            | 0                     |
            | pageSize              | 10                    |
            | totalPages            | 4                     |
            | totalElements         | 38                    |
            | first                 | true                  |
            | last                  | false                 |
            | elementsOnPage        | 10                    |
            | content[0].resultCode | APPABANDON            |
            | content[0].title      | Application Abandoned |
            | content[1].resultCode | APPC                  |
            | content[1].title      | Appeal to Crown Court |
        Examples:
            | User  |
            | user1 |

    @api @regression @ARCPOC-413
    Scenario Outline: Verify Result Code via code
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/result-codes/APPC?date=2016-01-01"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | resultCode | APPC                  |
            | title      | Appeal to Crown Court |
        When User Makes GET API Request To "/result-codes/XXXX?date=2016-01-01"
        Then User Verify Response Body Should Have:
            | title  | Result Code not found |
            | status | 404                   |
        Examples:
            | User  |
            | user1 |

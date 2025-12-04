Feature: API Tests

    @api @regression
    Scenario Outline: Verifying api
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/court-locations"
        Then User Verify Response Status Code Should Be "200"
        Then User Verify Response Body Should Have:
            | pageNumber     | 0                                                              |
            | pageSize       | 10                                                             |
            | totalElements  | 15                                                             |
            | totalPages     | 2                                                              |
            | first          | true                                                           |
            | last           | false                                                          |
            | elementsOnPage | 10                                                             |
            | sort           | {"orders":[{"property":"name","direction":"asc"}]}             |
            | content        | [{"name":"Cardiff Crown Court Set 4","locationCode":"CCC033"}] |
        Examples:
            | User  |
            | user1 |


    @api @regression
    Scenario Outline: Create Application List via API
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                                                  | courtLocationCode | durationHours | durationMinutes |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at the Test Courthouse. Test_{RANDOM} | RCJ001            | 2             | 22              |
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |

    @api @regression
    Scenario Outline: Create Application List via API
        Given User Authenticates Via API As "<User>"
        When User Makes POST API Request To "/application-lists" With Body:
            | date     | time           | status | description                             | durationHours | durationMinutes | otherLocationDescription         | cjaCode |
            | todayiso | timenowhhmm-2h | OPEN   | Applications to review at Test_{RANDOM} | 2             | 22              | Temporary Courtroom at Town Hall | 01  |
        Then User Verify Response Status Code Should Be "201"
        Examples:
            | User  |
            | user1 |
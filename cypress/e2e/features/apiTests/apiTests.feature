Feature: Applications List Search

    @test @api @apiTests
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
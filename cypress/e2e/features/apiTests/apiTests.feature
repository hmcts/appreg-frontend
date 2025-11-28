Feature: Applications List Search

    @test @api @apiTests
    Scenario Outline: Verifying api
        Given User Authenticates Via API As "<User>"
        When User Makes GET API Request To "/court-locations"
        Examples:
            | User  |
            | user1 |
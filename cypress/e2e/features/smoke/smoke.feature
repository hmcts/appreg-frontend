Feature: Applications Register Portal Access

  @smoke
  Scenario: Verify portal access and SSO login flow
    Given User Is On The Portal Page
    Then User Verify The Page Title Is "HMCTS Applications Register - Home - GOV.UK"
    And User See "Applications register" On The Page
    And User See "Sign in" On The Page
    And User See "To access this service, you now must use the Ministry of Justice Modernisation Platform’s Single Sign On (SSO):" On The Page
    Then User Verifies The Button "Sign in with your Justice SSO account" Should Be Visible
    When User Signs In With Microsoft SSO As "user1"
    Then User See "Applications register" On The Page

@smoke
  Scenario Outline: Sign in and Sign out flow for "<role>"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<role>"
    Then User See "Applications register" On The Page
    Then User Verify The Page URL Contains "/applications-list"
    Then User Signs Out From The Application
    Then User Verify The Page URL Contains "/login"

    Examples:
      | role   |
      | user1  |
      | user2  |
      | user3  |
      | admin1 |
      | admin2 |
      | admin3 |

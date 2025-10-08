Feature: Applications List Create

  @regression
  Scenario Outline: Verify applications list is displayed
    Given User Is On The Portal Page
    Then User Signs In With Microsoft SSO As "<User>"
    Then User Navigates To The URL "/applications-list/create"
    Then User Clicks On The Link "Applications list"
  Examples:
    | User  |
    | user1 |
Feature: Applications List

  @regression
  Scenario: Verify applications list is displayed
    Given User Is On The Portal Page
    Then User Signs In With Microsoft SSO As "admin1"
    Then User Clicks On The Link "Applications list"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "today"
    When User Set Time Field "Time" To "10:00"

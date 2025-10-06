Feature: Applications List

  @regression
  Scenario: Verify applications list is displayed
    Given User Is On The Portal Page
    Then User Signs In With Microsoft SSO As "admin1"
    Then User Clicks On The Link "Applications list"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "today"
    When User Set Time Field "Time" To "timenow"
    Then User Enters "Test" Into The "Description" Textbox
    Then User Selects "Open" In The "Select status" Dropdown
    Then User Enters "Court 1" Into The "Court" Textbox
    Then User Enters "Other Location" Into The "Other location" Textbox
    Then User Enters "CJA" Into The "CJA" Textbox
    When User Clicks On The "Search" Button

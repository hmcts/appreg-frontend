Feature: Applications List Search

  @regression
  Scenario: Verify components on applications list search page
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link "Applications list"
    Then User Sees Text "For example, 27 3 2007" In "Date"
    Then User Should See The Date Field "Date"
    Then User Should See The Time Field "Time"
  
  @regression
  Scenario Outline: Verify applications list is displayed
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link "Applications list"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<Status>" In The "Select status" Dropdown
    Then User Enters "<Court>" Into The "Court" Textbox
    Then User Enters "<OtherLocation>" Into The "Other location" Textbox
    Then User Enters "<CJA>" Into The "CJA" Textbox
    When User Clicks On The "Search" Button
    Examples:
      | User   | Date     | Time       | Description | Status | Court   | OtherLocation  | CJA  |
      | admin1 | today    | timenow-2h | Test 1      | Open   | Court 1 | Other Location | CJA  |
      | admin1 | tomorrow | timenow    | Test 2      | Closed | Court 2 | Another Place  | CJA2 |

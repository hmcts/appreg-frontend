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
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Should See The Date Field "Date"
    When User Set Date Field "Date" To "<Date>"
    Then User Should See The Time Field "Time"
    When User Set Time Field "Time" To "<Time>"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<Status>" In The "Select status" Dropdown
    Then User Enters "<Court>" Into The "Court" Textbox
    When User Clicks On The "Search" Button
    Examples:
      | User   | Date     | Time       | Description | Status | Court   | OtherLocation  | CJA  |
      | admin1 | today    | timenow-2h | Test 1      | Open   | Court 1 | Other Location | CJA  |
      | admin1 | tomorrow | timenow    | Test 2      | Closed | Court 2 | Another Place  | CJA2 |

  @regression @ARCPOC-660
  Scenario Outline: Verify CJA field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "CJA" Textbox Has Selected Value "<ExpectedValue>"
    When User Clicks On The "Search" Button
    Then User Does Not See Validation Errors
    Examples:
      | User   | SearchText | OptionText   | ExpectedValue     |
      | admin1 | 1          | CJA Number 1 | 01 - CJA Number 1 |
      | admin1 | 5          | CJA Number 5 | 05 - CJA Number 5 |

  @regression @ARCPOC-660
  Scenario Outline: Verify CJA field validation with invalid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "CJA" Textbox Has Selected Value "<ExpectedValue>"
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "<ValidationMessage>"
    Examples:
      | User   | SearchText | ValidationMessage                                            | OptionText | ExpectedValue |
      | admin1 | abc123     | There is a problem Criminal Justice Area not found           |            | abc123        |




Feature: Applications List Search

  @regression @ARCPOC-452
  Scenario: Verify components on applications list search page
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link "Applications list"
    Then User See "Applications List" On The Page
    Then User Should See The Date Field "Date"
    Then User Sees Text "For example, 27 3 2007" In "Date" Field
    Then User Should See The Time Field "Time"
    Then User Sees Text "Enter the time in 24-hour format, for example 08:30" In "Time" Field
    Then User Should See The Textbox "Description"
    Then User Sees Text "A description of the application list" In "Description" Field
    Then User Should See The Dropdown "Select status"
    Then User Sees Text "The status of the application list" In "Select status" Field
    Then User Verifies "Select status" Dropdown Has Options "Choose, Open, Closed"
    Then User Should See The Textbox "Court"
    Then User Sees Text "Start typing to search" In "Court" Field
    Then User Should See The Textbox "Other location"
    Then User Sees Text "Other location description" In "Other location" Field
    Then User Should See The Textbox "CJA"
    Then User Sees Text "Start typing to search" In "CJA" Field
    Then User Should See The Button "Search"

  @regression @ARCPOC-452
  Scenario: Verify mutual exclusivity of Court and CJA fields
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link "Applications list"
    # Verify Court field disables Other location and CJA when typing
    Then User Enters "London" Into The "Court" Textbox
    Then User Should See The Textbox "Other location" Is Disabled
    Then User Should See The Textbox "CJA" Is Disabled
    # Clear Court and verify CJA field disables Court when typing
    Then User Clears The "Court" Textbox
    Then User Enters "01" Into The "CJA" Textbox
    Then User Should See The Textbox "Court" Is Disabled
    # Clear CJA and verify Other location field disables Court when typing
    Then User Clears The "CJA" Textbox
    Then User Enters "Test Location" Into The "Other location" Textbox
    Then User Should See The Textbox "Court" Is Disabled

  @regression @ARCPOC-452
  Scenario Outline: Verify applications list search validation
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    # Verify validation when clicking Search without entering any data
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "There is a problem Invalid Search Criteria. At least one field must be entered."
    # Verify date validation with invalid date
    When User Set Date Field "Date" To "99/99/9999"
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "There is a problem Enter a real date"
    # Verify time validation with invalid time
    When User Set Date Field "Date" To "today"
    When User Set Time Field "Time" To "25:61"
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "There is a problem Enter a valid duration between 00:00 and 23:59"
    Examples:
      | User   |
      | admin1 |

  @regression @ARCPOC-452
  Scenario Outline: Verify applications list table is displayed with search results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    Then User Should See Table "<TableName>" Has Rows
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | Court                     | Description                   | Entries | Status |
      | user1 | Lists     | 19/05/2025 | 2025-05-19  | 09:00 | Cardiff Crown Court Set 4 | Cancelled hearing for Probate | 2       | CLOSED |

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
      | User   | SearchText | ValidationMessage                                  | OptionText | ExpectedValue |
      | admin1 | abc123     | There is a problem Criminal Justice Area not found |            | abc123        |

  @regression @ARCPOC-452
  Scenario Outline: Verify applications list table sorting functionality
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    # Search to get table with data
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    # Verify all sortable headers default to 'none'
    Then User Should See Table "<TableName>" Header "Date" Has Sort Order "none"
    Then User Should See Table "<TableName>" Header "Time" Has Sort Order "none"
    Then User Should See Table "<TableName>" Header "Location" Has Sort Order "none"
    Then User Should See Table "<TableName>" Header "Description" Has Sort Order "none"
    Then User Should See Table "<TableName>" Header "Entries" Has Sort Order "none"
    Then User Should See Table "<TableName>" Header "Status" Has Sort Order "none"
    # Test sort cycle: none -> ascending -> descending
    When User Clicks On Table Header "<Column>" In Table "<TableName>"
    Then User Should See Table "<TableName>" Header "<Column>" Has Sort Order "ascending"
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks On Table Header "<Column>" In Table "<TableName>"
    Then User Should See Table "<TableName>" Header "<Column>" Has Sort Order "descending"
    Then User Should See Table "<TableName>" Has Rows
    Examples:
      | User  | TableName | SearchDate | Status | Column |
      | user1 | Lists     | 19/05/2025 | Closed | Date   |

  @regression @ARCPOC-452
  Scenario Outline: Verify applications list table shows empty state with no results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    # Perform search with filters that return no results
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    # Verify notification banner is displayed for empty state
    Then User Sees Notification Banner "<NotificationMessage>"
    Examples:
      | User  | SearchDate | Status | NotificationMessage                                          |
      | user1 | 01/01/2099 | Closed | Important No lists found Try different filters, or create a new list|

@regression @ARCPOC-691
  Scenario Outline: Verify Court field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "Court" Textbox Has Selected Value "<ExpectedValue>"
    When User Clicks On The "Search" Button
    Then User Does Not See Validation Errors
    Examples:
      | User   | SearchText | OptionText                     | ExpectedValue                               |
      | admin1 | Cardiff    | Cardiff Crown Court Set 4      | CCC033 - Cardiff Crown Court Set 4          |
 
@regression @ARCPOC-691
  Scenario Outline: Verify Court field validation with invalid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "Court" Textbox Has Selected Value "<ExpectedValue>"
   #  Then User Verifies "<TextboxErrorMessage>" Is Shown For The "Court" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Examples:
      | User   | SearchText | NotificationMessage                                             | OptionText | ExpectedValue |
      | admin1 | London     | No lists found Try different filters, or create a new list      |            | London        |    
 
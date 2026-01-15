Feature: Applications List Search

  @regression @ARCPOC-214 @ARCPOC-452
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

  @regression @ARCPOC-214 @ARCPOC-452
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

  @regression @ARCPOC-214 @ARCPOC-452
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

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario Outline: Verify applications list table is displayed with search results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    # Table and header validation
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    # Row value validation
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | Court                     | Description                   | Entries | Status |
      | user1 | Lists     | 19/05/2025 | 2025-05-19  | 09:00 | Cardiff Crown Court Set 4 | Cancelled hearing for Probate | 2       | CLOSED |

  @regression @ARCPOC-214 @ARCPOC-452 @ARCPOC-759
  Scenario Outline: Filter and verify applications list with multiple filters
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Test status filter
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Status" First And Last Page Has Value "<Status>"
    # Test time filter
    Then User Selects "Choose" In The "Select status" Dropdown
    When User Set Time Field "Time" To "<Time>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Time" First And Last Page Has Value "<Time>"
    # Test date filter
    When User Clears The Time Field "Time"
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Date" First And Last Page Has Value "<DisplayDate>"
    # Test description filter
    When User Clears The Date Field "Date"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Description" First And Last Page Has Value "<Description>"
    # Test court location filter
    Then User Clears The "Description" Textbox
    Then User Selects "<OptionTextCourt>" From The Textbox "Court" Autocomplete By Typing "<SearchTextCourt>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Location" First And Last Page Has Value "<OptionTextCourt>"
    Examples:
      | User  | Status | TableName | Time  | SearchDate | DisplayDate | Description | SearchTextCourt | OptionTextCourt           |
      | user1 | Open   | Lists     | 14:00 | 19/05/2025 | 2025-05-19  | No show     | Cardiff         | Cardiff Crown Court Set 4 |

  @regression @ARCPOC-214 @ARCPOC-660
  Scenario Outline: Verify CJA field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "CJA" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Not Visible Under The "CJA" Textbox
    When User Clicks On The "Search" Button
    Then User Does Not See Validation Errors
    Examples:
      | User   | SearchText | OptionText   | ExpectedValue     | Info             |
      | admin1 | 1          | CJA Number 1 | 01 - CJA Number 1 | No results found |
      | admin1 | 5          | CJA Number 5 | 05 - CJA Number 5 | No results found |

  @regression @ARCPOC-214 @ARCPOC-660
  Scenario Outline: Verify CJA field validation with invalid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    # Then User Verifies The "CJA" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Visible Under The "CJA" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "<ValidationMessage>"
    Examples:
      | User   | SearchText | ValidationMessage                                  | OptionText | ExpectedValue | Info             |
      | admin1 | abc123     | There is a problem Criminal Justice Area not found |            | abc123        | No results found |

  # This Scenario has been ignored due to bug in sorting functionality @ARCPOC-756
  @ignore @ARCPOC-214 @ARCPOC-452 @ARCPOC-756
  Scenario Outline: Verify applications list table sorting functionality
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Search to get table with data
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
    Then User Should See Table "<TableName>" Column "<Column>" Is Sorted "ascending"
    When User Clicks On Table Header "<Column>" In Table "<TableName>"
    Then User Should See Table "<TableName>" Header "<Column>" Has Sort Order "descending"
    Then User Should See Table "<TableName>" Has Rows
    Then User Should See Table "<TableName>" Column "<Column>" Is Sorted "descending"
    Examples:
      | User  | TableName | SearchDate | Status | Column |
      | user1 | Lists     | 19/05/2025 | Closed | Date   |

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario Outline: Verify applications list table shows empty state with no results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time | Description | CourtSearch | Court | Status   | Other location | CJA |
      | <SearchDate> |      |             |             |       | <Status> |                |     |
    # Verify notification banner is displayed for empty state
    Then User Sees Notification Banner "<NotificationMessage>"
    Then User Clicks On The Link "<LinkText>"
    Then User See "<CreatePageText>" On The Page
    Then User Verify The Page URL Contains "/applications-list/create"
    Examples:
      | User  | SearchDate | Status | NotificationMessage                                                  | LinkText          | CreatePageText               |
      | user1 | 01/01/2099 | Closed | Important No lists found Try different filters, or create a new list | create a new list | Create new applications list |

  @regression @ARCPOC-214 @ARCPOC-691
  Scenario Outline: Verify Court field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "Court" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Not Visible Under The "Court" Textbox
    When User Clicks On The "Search" Button
    Then User Does Not See Validation Errors
    Examples:
      | User   | SearchText | OptionText                | ExpectedValue                      | Info             |
      | admin1 | Cardiff    | Cardiff Crown Court Set 4 | CCC033 - Cardiff Crown Court Set 4 | No results found |

  @regression @ARCPOC-214 @ARCPOC-691
  Scenario Outline: Verify Court field validation with invalid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    Then User Verifies "<Info>" Is Visible Under The "Court" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Examples:
      | User   | SearchText | NotificationMessage                                        | OptionText | ExpectedValue | Info             |
      | admin1 | London     | No lists found Try different filters, or create a new list |            | London        | No results found |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list Open
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time   | Description   | CourtSearch       | Court   | Status   | Other location | CJA |
      | <SearchDate> | <Time> | <Description> | <OptionTextCourt> | <Court> | <Status> |                |     |
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Then User Should See The Link "List details"
    Examples:
      | User  | TableName | DisplayDate | Time  | Court                             | Description | Entries | Status | ButtonName | SearchDate | SelectButtonText | OptionTextCourt |
      | user1 | Lists     | 2001-01-01  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | *SKIP*     | Select           | LCCC025         |
      | user1 | Lists     | 2001-01-01  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | 01/1/2001  | Select           | LCCC025         |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list row menu options
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time   | Description   | CourtSearch       | Court   | Status   | Other location | CJA |
      | <SearchDate> | <Time> | <Description> | <OptionTextCourt> | <Court> | <Status> |                |     |
    When User Clicks "<SelectButtonText>" In Row Of Table "<TableName>" And Verify Menu Options "<MenuOptions>"
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | OptionTextCourt | Court                             | Description                          | Entries | Status | SelectButtonText | MenuOptions                                 |
      | user1 | Lists     | 12/01/2026 | 2026-01-12  | 14:51 | LCCC065         | Leeds Combined Court Centre Set 7 | Applications to review at Test_1153  | 2       | OPEN   | Select           | Open, Print page,  Print continuous, Delete |
      | user1 | Lists     | 07/01/2026 | 2026-01-07  | 15:31 | LCCC025         | Leeds Combined Court Centre Set 3 | Applications to review at Test_13162 | 1       | CLOSED | Select           | Print page,  Print continuous               |
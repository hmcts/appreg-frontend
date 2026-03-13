Feature: Applications List Search

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario: Verify components on applications list search page
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Sees Page Heading "Applications List"
    Then User Should See The Date Field "Date"
    Then User Sees Text "For example, 27 3 2007" In "Date" Field
    Then User Should See The Time Field "Time"
    Then User Sees Text "For example, 17:30" In "Time" Field
    Then User Should See The Dropdown "Select list status"
    Then User Verifies "Select list status" Dropdown Has Options "Choose, Open, Closed"
    Then User Should See The Textbox "Court"
    When User Toggles The Accordion "Advanced search"
    Then User Should See The Textbox "List description"
    Then User Should See The Textbox "Criminal justice area"
    Then User Should See The Textbox "Other location description"
    Then User Should See The Button "Search"
    Then User Should See The Button "Clear search"

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario: Verify mutual exclusivity of Court and CJA fields
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Toggles The Accordion "Advanced search"
    # Verify Court field disables Other location and CJA when typing
    Then User Enters "London" Into The "Court" Textbox
    Then User Should See The Textbox "Other location description" Is Disabled
    Then User Should See The Textbox "Criminal justice area" Is Disabled
    # Clear Court and verify CJA field disables Court when typing
    When User Clicks On The "Clear search" Button
    When User Toggles The Accordion "Advanced search"
    Then User Enters "01" Into The "Criminal justice area" Textbox
    Then User Should See The Textbox "Court" Is Disabled
    # Clear CJA and verify Other location field disables Court when typing
    When User Clicks On The "Clear search" Button
    When User Toggles The Accordion "Advanced search"
    Then User Enters "Test Location" Into The "Other location description" Textbox
    Then User Should See The Textbox "Court" Is Disabled

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario Outline: Verify applications list search validation
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Verify validation when clicking Search without entering any data
    When User Clicks On The "Search" Button
    Then User Sees Validation Error Banner "There is a problem Invalid Search Criteria. At least one field must be entered."
    # Verify date validation with invalid date
    When User Set Date Field "Date" To "99/99/9999"
    When User Clicks On The "Search" Button
    Then User Sees Validation Error Banner "There is a problem Enter a valid date"
    # Verify time validation with invalid time
    When User Set Date Field "Date" To "today"
    When User Set Time Field "Time" To "25:61"
    When User Clicks On The "Search" Button
    Then User Sees Validation Error Banner "There is a problem Enter a valid duration between 00:00 and 23:59"
    Examples:
      | User   |
      | admin1 |

  @regression @ARCPOC-214 @ARCPOC-452 @ARCPOC-977
  Scenario Outline: Verify applications list table is displayed with search results and values retained
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Search" Button
    # Table and header validation
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    # Row value validation
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    When User Clicks "<SelectButtonText>" Then "Open" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Then User Should See The Link "List details"
    Then User Clicks On The Breadcrumb Link "Applications list"
    Then User Verifies The Date field "Date" Has Value "<SearchDate>"
    Then User Verifies The "Court" Textbox Has Value "<SearchText> - <Court>"
    Then User Should See Table "<TableName>" Has Rows
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | Court                     | Description | Entries | Status | SearchText | OptionText                | SelectButtonText | TableName |
      | user1 | Lists     | 23/05/2025 | 23 May 2025 | 16:00 | Cardiff Crown Court Set 4 | Urgent list | 2       | OPEN   | CCC033     | Cardiff Crown Court Set 4 | Select           | Lists     |

  @regression @ARCPOC-214 @ARCPOC-452 @ARCPOC-759
  Scenario Outline: Filter and verify applications list with multiple filters
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Test Description and status filter
    When User Toggles The Accordion "Advanced search"
    Then User Enters "<Description>" Into The "Description" Textbox
    Then User Selects "<Status>" In The "Select list status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Status" First And Last Page Has Value "<Status>"
    # Test time filter
    When User Clicks On The "Clear search" Button
    Then User Selects "Choose" In The "Select list status" Dropdown
    When User Set Time Field "Time" To "<Time>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Time" First And Last Page Has Value "<Time>"
    # Test date filter
    When User Clicks On The "Clear search" Button
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Date" First And Last Page Has Value "<DisplayDate>"
    # Test court location filter
    When User Clicks On The "Clear search" Button
    Then User Selects "<OptionTextCourt>" From The Textbox "Court" Autocomplete By Typing "<SearchTextCourt>"
    When User Clicks On The "Search" Button
    Then User Should See Table "<TableName>" Column "Location" First And Last Page Has Value "<OptionTextCourt>"
    Examples:
      | User  | Status | TableName | Time  | SearchDate | DisplayDate | Description | SearchTextCourt | OptionTextCourt           |
      | user1 | Closed | Lists     | 14:00 | 19/05/2025 | 19 May 2025 | No show     | Cardiff         | Cardiff Crown Court Set 4 |

  @regression @ARCPOC-214 @ARCPOC-660
  Scenario Outline: Verify CJA field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Toggles The Accordion "Advanced search"
    Then User Selects "<OptionText>" From The Textbox "Criminal justice area" Autocomplete By Typing "<SearchText>"
    Then User Verifies The "Criminal justice area" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Not Visible Under The "Criminal justice area" Textbox
    When User Clicks On The "Search" Button
    Then User Does Not See Validation Error Banner "There is a problem Criminal justice area not found"
    Examples:
      | User   | SearchText | OptionText | ExpectedValue  | Info             |
      | admin1 | 01         | London     | 01 - London    | No results found |
      | admin1 | 05         | Liverpool  | 05 - Liverpool | No results found |

  @regression @ARCPOC-214 @ARCPOC-660
  Scenario Outline: Verify CJA field validation with invalid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Toggles The Accordion "Advanced search"
    Then User Selects "<OptionText>" From The Textbox "Criminal justice area" Autocomplete By Typing "<SearchText>"
    # Then User Verifies The "Criminal justice area" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Visible Under The "Criminal justice area" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Validation Error Banner "<ValidationMessage>"
    Examples:
      | User   | SearchText | ValidationMessage                                  | OptionText | ExpectedValue | Info             |
      | admin1 | abc123     | There is a problem Criminal justice area not found |            | abc123        | No results found |

  @regression @ARCPOC-214 @ARCPOC-452
  Scenario Outline: Verify applications list table shows empty state with no results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> |      |                  |             |       | <Status>           |                            |                       |           |
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
    Then User Does Not See Validation Error Banner "There is a problem Court location not found"
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
    Then User Sees Validation Error Banner "<ValidationErrorMessage>"
    Examples:
      | User   | SearchText | ValidationErrorMessage                      | OptionText | ExpectedValue | Info             |
      | admin1 | London     | There is a problem Court location not found |            | London        | No results found |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list Open
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time   | List description | CourtSearch   | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> | <Time> | <Description>    | <CourtSearch> | <Court> | <Status>           |                            |                       |           |
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Then User Should See The Link "List details"
    Examples:
      | User  | TableName | DisplayDate | Time  | Court                             | Description | Entries | Status | ButtonName | SearchDate | SelectButtonText | CourtSearch |
      | user1 | Lists     | 1 Jan 2001  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | *SKIP*     | Select           | LCCC025     |
      | user1 | Lists     | 1 Jan 2001  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | 01/1/2001  | Select           | LCCC025     |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list row menu options
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    When User Searches Application List With:
      | Date         | Time   | List description | CourtSearch   | Court   | Select list status | Other location description | Criminal justice area | CJASearch |
      | <SearchDate> | <Time> | <Description>    | <CourtSearch> | <Court> | <Status>           |                            |                       |           |
    When User Clicks "<SelectButtonText>" In Row Of Table "<TableName>" And Verify Menu Options "<MenuOptions>"
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | CourtSearch | Court                             | Description                          | Entries | Status | SelectButtonText | MenuOptions                                 |
      | user1 | Lists     | 12/01/2026 | 12 Jan 2026 | 14:51 | LCCC065     | Leeds Combined Court Centre Set 7 | Applications to review at Test_1153  | 2       | OPEN   | Select           | Open, Print page,  Print continuous, Delete |
      | user1 | Lists     | 07/01/2026 | 7 Jan 2026  | 15:31 | LCCC025     | Leeds Combined Court Centre Set 3 | Applications to review at Test_13162 | 1       | CLOSED | Select           | Print page,  Print continuous               |

  @regression @ARCPOC-214 @ARCPOC-452 @ARCPOC-756 @ARCPOC-891 @PJ
  Scenario: Verify applications list table sorting functionality and pagination persistence
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    # Search to get table with multiple pages
    When User Searches Application List With:
      | Date | Time  | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      |      | 05:54 |                  |             |       |                    |                            | London                |           |
    Then User Should See The Table "Lists"
    # Verify all sortable headers default to 'none'
    Then User Should See Table "Lists" Header "Date" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Description" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Entries" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "none"
    # Test Date column
    When User Clicks On Table Header "Date" In Table "Lists"
    Then User Should See Table "Lists" Header "Date" Has Sort Order "ascending"
    Then User Should See Table "Lists" Column "Date" Is Sorted "ascending"
    When User Goes To First Page
    When User Clicks On Table Header "Date" In Table "Lists"
    Then User Should See Table "Lists" Header "Date" Has Sort Order "descending"
    # Search to get table with multiple pages
    When User Clicks On The "Clear search" Button
    When User Searches Application List With:
      | Date       | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | 24/02/2026 |      |                  |             |       |                    |                            |                       |           |
    # Test Time column
    When User Clicks On Table Header "Time" In Table "Lists"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "ascending"
    When User Clicks On Table Header "Time" In Table "Lists"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "descending"
    Then User Should See Table "Lists" Column "Time" Is Sorted "descending"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Header "Time" Has Sort Order "descending"
    # Test Description column
    When User Clicks On Table Header "Description" In Table "Lists"
    Then User Should See Table "Lists" Header "Description" Has Sort Order "ascending"
    Then User Should See Table "Lists" Column "Description" Is Sorted "ascending"
    When User Goes To Last Page
    Then User Should See Table "Lists" Header "Description" Has Sort Order "ascending"
    When User Goes To First Page
    Then User Should See Table "Lists" Header "Description" Has Sort Order "ascending"
    When User Clicks On Table Header "Description" In Table "Lists"
    Then User Should See Table "Lists" Header "Description" Has Sort Order "descending"
    # Test Entries column
    When User Clicks On Table Header "Entries" In Table "Lists"
    Then User Should See Table "Lists" Header "Entries" Has Sort Order "ascending"
    When User Clicks On Table Header "Entries" In Table "Lists"
    Then User Should See Table "Lists" Header "Entries" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Column "Entries" Is Sorted "descending"
    # Test Status column
    When User Clicks On Table Header "Status" In Table "Lists"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "ascending"
    When User Goes To First Page
    Then User Should See Table "Lists" Column "Status" Is Sorted "ascending"
    When User Clicks On Table Header "Status" In Table "Lists"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "descending"
    # Test Location column
    When User Clicks On Table Header "Location" In Table "Lists"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "ascending"
    When User Clicks On Table Header "Location" In Table "Lists"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Column "Location" Is Sorted "descending"
    When User Goes To Last Page
    Then User Should See Table "Lists" Header "Location" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Header "Location" Has Sort Order "descending"

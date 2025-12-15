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
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    # Table and header validation
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    Then User Should See Table "<TableName>" Has Rows
    # Row value validation
    Then User Should See Row In Table "<TableName>" With Values:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | Court                     | Description                   | Entries | Status |
      | user1 | Lists     | 19/05/2025 | 2025-05-19  | 09:00 | Cardiff Crown Court Set 4 | Cancelled hearing for Probate | 2       | CLOSED |

  @regression @ARCPOC-214 @ARCPOC-452 @ARCPOC-759
  Scenario Outline: Filter and verify applications list table results
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    # Filter by status
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Table "<TableName>" Column "Status" Has Value "<Status>"
    # Reset status filter and filter by time, then verify table updates
    Then User Selects "Choose" In The "Select status" Dropdown
    When User Set Time Field "Time" To "<Time>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Table "<TableName>" Column "Time" Has Value "<Time>"
    # Clear time filter and filter by date, then verify table updates
    When User Clears The Time Field "Time"
    Then User Selects "Choose" In The "Select status" Dropdown
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Table "<TableName>" Column "Date" Has Value "<DisplayDate>"
    # Clear date filter and filter by description, then verify table updates
    When User Clears The Date Field "Date"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Table "<TableName>" Column "Description" Has Value "<Description>"
    # Clear description filter and filter by court, then verify table updates
    Then User Clears The "Description" Textbox
    Then User Selects "<OptionTextCourt>" From The Textbox "Court" Autocomplete By Typing "<SearchTextCourt>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "Lists"
    Then User Should See Table "Lists" Has Rows
    Then User Should See Table "<TableName>" Column "Location" Has Value "<OptionTextCourt>"
    Examples:
      | User  | Status | TableName | Time  | SearchDate | DisplayDate | Description | SearchTextCourt | OptionTextCourt           | SearchTextCJA | OptionTextCJA |
      | user1 | Open   | Lists     | 14:00 | 19/05/2025 | 2025-05-19  | No show     | Cardiff         | Cardiff Crown Court Set 4 | 1             | CJA Number 1  |

  @regression @ARCPOC-214 @ARCPOC-660
  Scenario Outline: Verify CJA field validation with valid input
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
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
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<SearchText>"
    # Then User Verifies The "CJA" Textbox Has Selected Value "<ExpectedValue>"
    Then User Verifies "<Info>" Is Visible Under The "CJA" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Validation Error "<ValidationMessage>"
    Examples:
      | User   | SearchText | ValidationMessage                                  | OptionText | ExpectedValue | Info             |
      | admin1 | abc123     | There is a problem Criminal Justice Area not found |            | abc123        | No results found |

  # This Scenario has been ignored due to bug in sorting functionality @ARCPOC-756
  @ignore @ARCPOC-214 @ARCPOC-452
  Scenario Outline: Verify applications list table sorting functionality
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
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
    Then User Clicks On The Link "Applications list"
    # Perform search with filters that return no results
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
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
    Then User Clicks On The Link "Applications list"
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
    Then User Clicks On The Link "Applications list"
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    Then User Verifies "<Info>" Is Visible Under The "Court" Textbox
    When User Clicks On The "Search" Button
    Then User Sees Notification Banner "<NotificationMessage>"
    Examples:
      | User   | SearchText | NotificationMessage                                        | OptionText | ExpectedValue | Info             |
      | admin1 | London     | No lists found Try different filters, or create a new list |            | London        | No results found |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list Open with multiple pages of results is returned
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Then User Should See The Link "List details"
    Examples:
      | User  | TableName | DisplayDate | Time  | Court                             | Description | Entries | Status | ButtonName | SearchDate | SelectButtonText |
      | user1 | Lists     | 2001-01-01  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | *SKIP*     | Select           |
      | user1 | Lists     | 2001-01-01  | 10:10 | Leeds Combined Court Centre Set 3 | test        | 0       | Open   | Open       | 01/1/2001  | Select           |

  @regression @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list row menu options
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    Then User Selects "<Status>" In The "Select status" Dropdown
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" In Row Of Table "<TableName>" And Verify Menu Options "<MenuOptions>"
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Examples:
      | User  | TableName | DisplayDate | Time  | Court                                 | Description                                    | Entries | Status | SelectButtonText | MenuOptions                                 |
      | user1 | Lists     | 2025-06-27  | 14:00 | Manchester Civil Justice Centre Set 8 | Afternoon list for Civil Court                 | 1       | Open   | Select           | Open, Print page,  Print continuous, Delete |
      | user1 | Lists     | 2025-11-26  | 16:45 | Royal Courts of Justice Set 1         | Applications to review at the Test Courthouse. | 0       | Closed | Select           | Print page,  Print continuous               |

  @regression @ARCPOC-214 @ARCPOC-453
  Scenario Outline: Verify PDF download for 0 entries
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date          | time   | status   | description   | courtLocationCode   |
      | <DisplayDate> | <Time> | <Status> | <Description> | <courtLocationCode> |
    Then User Verify Response Status Code Should Be "201"
    Given User Has No Downloaded PDFs
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Rows
    # Click Print continuous to download PDF
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    Then User Sees Notification Banner "There is a problem No entries available to print"
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time           | courtLocationCode | Court                             | Description                              | Entries | Status | SelectButtonText | ButtonName       |
      | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | RCJ001            | Royal Courts of Justice Set 1     | Test_{RANDOM} for Applications to review | 0       | OPEN   | Select           | Print continuous |
      | user1 | Lists     | today      | todayiso    | timenowhhmm-2h | LCCC025           | Leeds Combined Court Centre Set 3 | Test_{RANDOM} for Leeds applications     | 0       | OPEN   | Select           | Print page       |

  @regression @ARCPOC-214 @ARCPOC-453
  Scenario Outline: Verify PDF download for print continuous with entries for Court
    Given User Has No Downloaded PDFs
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |
    # Verify PDF was downloaded and contains expected content
    Then User Verifies PDF "<PDFName>" Is Downloaded
    Then User Verifies Latest Downloaded PDF Is Not Empty
    Then User Verifies Latest Downloaded PDF Has <Pages> Pages
    Then User Verifies Latest Downloaded PDF Contains Text "Check List Report"
    #  Time is not added due to bug ARCPOC-803
    Then User Verifies Latest Downloaded PDF Contains <Entries> "Applicant" Entries
    Then User Verifies Latest Downloaded PDF Contains The Following Values:
      | Date & Time       | <DisplayDate>                                              |
      | Duration          | <Duration>                                                 |
      | Location          | <Court>                                                    |
      | Applicant         | Miss Sophia King                                           |
      | Case Reference    | CASE101-01                                                 |
      | Application Code  | AP99004                                                    |
      | Account Reference | ACC000189                                                  |
      | Application Title | Request for Certificate of Refusal to State a Case (Civil) |
      | Applicant         | Mr James Lee                                               |
      | Respondent        | Mr John Turner                                             |
      | Case Reference    | CASE101-02                                                 |
      | Application Code  | CT99001                                                    |
    Then User Clears Downloaded PDFs
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time  | Court                         | Description             | Entries | Status | SelectButtonText | ButtonName       | Duration          | PDFName                       | Pages |
      | user1 | Lists     | 16/11/2025 | 2025-11-16  | 13:26 | Royal Courts of Justice Set 1 | ENFORCEMENT LIST - TEST | 2       | Open   | Select           | Print continuous | 2 Hours 0 Minutes | royal-courts-of-justice-set-1 | 2     |

  @regression @ARCPOC-214 @ARCPOC-453
  Scenario Outline: Verify PDF download for print page with entries for CJA
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date          | time   | status   | description   | cjaCode   | otherLocationDescription   |
      | <DisplayDate> | <Time> | <Status> | <Description> | <cjaCode> | <otherLocationDescription> |
    Then User Verify Response Status Code Should Be "201"
    Given User Has No Downloaded PDFs
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Selects "<OptionText>" From The Textbox "CJA" Autocomplete By Typing "<cjaCode>"
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location     | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <OptionText> | <Description> | <Entries> | <Status> |
    # Verify PDF was downloaded and contains expected content
    Then User Sees Notification Banner "There is a problem No entries available to print"
    Then User Clears Downloaded PDFs
    Examples:
      | User  | TableName | SearchDate | DisplayDate | Time           | cjaCode | OptionText     | otherLocationDescription                          | Description             | Entries | Status | SelectButtonText | ButtonName | Duration          | PDFName      | Pages |
      | user1 | Lists     | today      | todayiso    | timenowhhmm-1h | A8      | CJA Number 308 | This is a location description for CJA Number 318 | ENFORCEMENT LIST - TEST | 0       | OPEN   | Select           | Print page | 2 Hours 0 Minutes | cja-number-1 | 2     |

  @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
  Scenario Outline: Update applications list Successfully with Other location and CJA selected
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date          | time   | description   | status   | otherLocationDescription | cjaCode   | durationHours | durationMinutes |
      | <DisplayDate> | <Time> | <Description> | <Status> | <OtherLocation>          | <cjaCode> | <HH>          | <MM>            |
    Then User Verify Response Status Code Should Be "201"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <Court>  | <Description> | <Entries> | <Status> |

    Then User Should See The Link "List details"
    Then User Clicks On The Link "List details"
    Then User Verify The Page URL Contains "#list-details"
    Then User Verifies The Time field "Time" Has Value "<Time>"
    Then User Verifies The "Description" Textbox Has Value "<Description>"
    Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
    Then User Verifies The "Court" Textbox Has Selected Value "<CourtValue>"
    Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
    Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
    Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
    Then User Clears The "Description" Textbox
    Then User Enters "<Updated description>" Into The "Description" Textbox
    Then User Clears The "Other location" Textbox
    Then User Enters "<Updated other location>" Into The "Other location" Textbox
    When User Clicks On The "Update" Button
    Then User Sees Notification Banner "Success Update complete List successfully updated"

    Examples:
      | User  | TableName | DisplayDate | Time  | Court          | Description | Entries | Status | ButtonName | SearchDate | SelectButtonText | CourtValue | OtherLocation        | cjaCode | CJAValue            | HH | MM | Updated description | Updated other location |
      | user1 | Lists     | 2025-12-04  | 15:05 | CJA Number 319 | Test_21442  | 0       | OPEN   | Open       | 04/12/2025 | Select           |            | Other Location_21442 | B9      | B9 - CJA Number 319 | 11 | 30 | Updated Test_21442  | Updated Location_21442 |

  @regression @ARCPOC-214 @ARCPOC-450 @ARCPOC-799
  Scenario Outline: Update applications list Successfully with Court selected
    Given User Authenticates Via API As "<User>"
    When User Makes POST API Request To "/application-lists" With Body:
      | date          | time   | description   | status   | courtLocationCode | durationHours | durationMinutes |
      | <DisplayDate> | <Time> | <Description> | <Status> | <Court>           | <HH>          | <MM>            |

    Then User Verify Response Status Code Should Be "201"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    Then User Clicks On The Link "Applications list"
    When User Set Date Field "Date" To "<SearchDate>"
    Then User Enters "<Description>" Into The "Description" Textbox
    When User Clicks On The "Search" Button
    Then User Should See The Table "<TableName>"
    Then User Should See Table "<TableName>" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "<TableName>" Header "Actions" Is Not Sortable
    Then User Should See Table "<TableName>" Has Rows
    When User Clicks "<SelectButtonText>" Then "<ButtonName>" From Menu In Row Of Table "<TableName>" With:
      | Date          | Time   | Location        | Description   | Entries   | Status   |
      | <DisplayDate> | <Time> | <courtLocation> | <Description> | <Entries> | <Status> |

    Then User Should See The Link "List details"
    Then User Clicks On The Link "List details"
    Then User Verify The Page URL Contains "#list-details"
    Then User Verifies The Time field "Time" Has Value "<Time>"
    Then User Verifies The "Description" Textbox Has Value "<Description>"
    Then User Verifies "<Status>" Is Selected In The "Status" Dropdown
    Then User Verifies The "Court" Textbox Has Selected Value "<Court> - <courtLocation>"
    Then User Verifies The "Other location" Textbox Has Value "<OtherLocation>"
    Then User Verifies The "CJA" Textbox Has Value "<CJAValue>"
    Then User Verifies The "Duration" field Has Values hours "<HH>" and minutes "<MM>"
    #When User clears the "<ClearHH>" and "<ClearMM>" fields in the "Duration" field
    When User Set "<InvalidHH>" and "<InvalidMM>" In The "Duration" Field
    When User Clicks On The "Update" Button
    Then User Sees Validation Error "There is a problem... Enter hours between 0 and 99 Enter minutes between 0 and 59"
    When User Set "<UpdatedHH>" and "<UpdatedMM>" In The "Duration" Field
    Then User Clears The "Description" Textbox
    When User Clicks On The "Update" Button
    Then User Sees Validation Error "There is a problem... Description is required"
    Then User Enters "<UpdatedDescription>" Into The "Description" Textbox
    Then User Clears The "Court" Textbox
    Then User Selects "<OptionText>" From The Textbox "Court" Autocomplete By Typing "<SearchText>"
    When User Clicks On The "Update" Button
    Then User Sees Notification Banner "Success Update complete List successfully updated"

    Examples:
      | User  | TableName | DisplayDate | Time  | Court  | courtLocation                 | Description   | Entries | Status | ButtonName | SearchDate | SelectButtonText | OtherLocation | cjaCode | CJAValue | HH | MM | UpdatedDescription           | OptionText                | SearchText | InvalidHH | InvalidMM | UpdatedHH | UpdatedMM |
      | user1 | Lists     | 2025-12-11  | 16:05 | RCJ001 | Royal Courts of Justice Set 1 | Test_11122025 | 0       | OPEN   | Open       | 11/12/2025 | Select           |               |         |          | 11 | 30 | Updated Description For Test | Cardiff Crown Court Set 4 | CCC033     | A1B2      | C3D4      | 12        | 45        |

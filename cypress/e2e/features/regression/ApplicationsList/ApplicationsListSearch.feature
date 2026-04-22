Feature: Applications List Search

  Background: Create Applications List and Entry via API
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time           | status | description                                | courtLocationCode |
      | todayiso | timenowhhmm-2h | OPEN   | Test Applications List for Search {RANDOM} | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    Then User Stores Response Body Property "description" As "listDescription"
    When User Makes POST API Request To "/application-lists/:listId/entries" With Object Builder:
      | standardApplicantCode                         | null                           |
      | applicationCode                               | CT99002                        |
      | applicant.person.name.title                   | Mr                             |
      | applicant.person.name.surname                 | Taylor {RANDOM}                |
      | applicant.person.name.firstForename           | Henry                          |
      | applicant.person.name.secondForename          | James                          |
      | applicant.person.contactDetails.addressLine1  | {RANDOM} King Street           |
      | applicant.person.contactDetails.addressLine2  | Westminster                    |
      | applicant.person.contactDetails.addressLine3  | London                         |
      | applicant.person.contactDetails.addressLine4  | Greater London                 |
      | applicant.person.contactDetails.addressLine5  | United Kingdom                 |
      | applicant.person.contactDetails.postcode      | SW1A 1AA                       |
      | applicant.person.contactDetails.phone         | 0203{RANDOM}                   |
      | applicant.person.contactDetails.mobile        | 07123{RANDOM}                  |
      | applicant.person.contactDetails.email         | applicant{RANDOM}@example.com  |
      | respondent.person.name.title                  | Ms                             |
      | respondent.person.name.surname                | Clark {RANDOM}                 |
      | respondent.person.name.firstForename          | Emily                          |
      | respondent.person.name.secondForename         | Rose                           |
      | respondent.person.contactDetails.addressLine1 | {RANDOM} Market Road           |
      | respondent.person.contactDetails.addressLine2 | Bristol                        |
      | respondent.person.contactDetails.addressLine3 | Avon                           |
      | respondent.person.contactDetails.addressLine4 | United Kingdom                 |
      | respondent.person.contactDetails.postcode     | BS15 5AA                       |
      | respondent.person.contactDetails.phone        | 0117{RANDOM}                   |
      | respondent.person.contactDetails.mobile       | 07984{RANDOM}                  |
      | respondent.person.contactDetails.email        | respondent{RANDOM}@example.com |
      | respondent.person.dateOfBirth                 | todayiso-25y                   |
      | wordingFields.0.key                           | Reference                      |
      | wordingFields.0.value                         | {RANDOM}                       |
      | hasOffsiteFee                                 | true                           |
      | caseReference                                 | CASE-{RANDOM}                  |
      | accountNumber                                 | ACC-{RANDOM}                   |
      | notes                                         | Case noted with ref {RANDOM}   |
      | lodgementDate                                 | todayiso                       |
      | officials.0.title                             | Mr                             |
      | officials.0.surname                           | Turner {RANDOM}                |
      | officials.0.forename                          | Graham                         |
      | officials.0.type                              | MAGISTRATE                     |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "entryId"

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452 @ARCPOC-977
  Scenario: Verify applications list table is displayed with search results and values retained
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Searches Application List With:
      | Date  | List description | CourtSearch | Court                             | Select list status | Other location description | Criminal justice area | CJASearch |
      | today | @listDescription | LCCC065     | Leeds Combined Court Centre Set 7 |                    |                            |                       |           |
    # Table and header validation
    Then User Should See Table "Lists" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "Lists" Header "Actions" Is Not Sortable
    # Row value validation - verify the list created in Background appears
    Then User Should See Row In Table "Lists" With Values:
      | Date         | Location                          | Entries | Status |
      | todaydisplay | Leeds Combined Court Centre Set 7 | 1       | OPEN   |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Location                          | Entries | Status |
      | todaydisplay | Leeds Combined Court Centre Set 7 | 1       | OPEN   |
    Then User Should See The Link "List details"
    Then User Clicks On The Breadcrumb Link "Applications list"
    Then User Verifies The Date field "Date" Has Value "today"
    Then User Verifies The "Court" Textbox Has Value "LCCC065 - Leeds Combined Court Centre Set 7"
    Then User Should See Table "Lists" Has Rows

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452 @ARCPOC-759
  Scenario Outline: Filter and verify applications list with multiple filters
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "<User>"
    # Test Description and status filter
    When User Toggles The Accordion "Advanced search"
    Then User Enters "<Description>" Into The "List description" Textbox
    Then User Selects "<Status>" In The "Select list status" Dropdown
    When User Submits The Application List Search
    Then User Should See Table "<TableName>" Column "Status" First And Last Page Has Value "<Status>"
    # Test time filter
    When User Clicks On The "Clear search" Button
    Then User Selects "Choose" In The "Select list status" Dropdown
    When User Set Time Field "Time" To "<Time>"
    When User Submits The Application List Search
    Then User Should See Table "<TableName>" Column "Time" First And Last Page Has Value "<Time>"
    # Test date filter
    When User Clicks On The "Clear search" Button
    When User Set Date Field "Date" To "<SearchDate>"
    When User Submits The Application List Search
    Then User Should See Table "<TableName>" Column "Date" First And Last Page Has Value "<DisplayDate>"
    # Test court location filter
    When User Clicks On The "Clear search" Button
    Then User Selects "<OptionTextCourt>" From The Textbox "Court" Autocomplete By Typing "<SearchTextCourt>"
    When User Submits The Application List Search
    Then User Should See Table "<TableName>" Column "Location" First And Last Page Has Value "<OptionTextCourt>"
    Examples:
      | User  | Status | TableName | Time  | SearchDate | DisplayDate | Description | SearchTextCourt | OptionTextCourt           |
      | user1 | Closed | Lists     | 14:00 | 19/05/2025 | 19 May 2025 | No show     | Cardiff         | Cardiff Crown Court Set 4 |

  @regression @applicationsList @ARCPOC-214 @ARCPOC-660
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-660
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-691
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-691
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

  @regression @applicationsList @ARCPOC-214 @ARCPOC-417
  Scenario: Verify application list Open
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Searches Application List With:
      | Date  | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today | @listDescription | LCCC065     |       | OPEN               |                            |                       |           |
    Then User Should See Table "Lists" Has Sortable Headers "Date, Time, Location, Description, Entries, Status"
    Then User Should See Table "Lists" Header "Actions" Is Not Sortable
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Location                          | Entries | Status |
      | todaydisplay | Leeds Combined Court Centre Set 7 | 1       | OPEN   |
    Then User Should See The Link "List details"

  @regression @applicationsList @ARCPOC-214 @ARCPOC-417
  Scenario: Verify application list row menu options for OPEN list
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Searches Application List With:
      | Date  | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today | @listDescription | LCCC065     |       | OPEN               |                            |                       |           |
    When User Clicks "Select" In Row Of Table "Lists" And Verify Menu Options "Open, Print page,  Print continuous, Delete"
      | Date         | Location                          | Entries | Status |
      | todaydisplay | Leeds Combined Court Centre Set 7 | 1       | OPEN   |

  @regression @applicationsList @ARCPOC-214 @ARCPOC-417
  Scenario Outline: Verify application list row menu options for CLOSED list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time           | status | description   | courtLocationCode |
      | todayiso | timenowhhmm-3h | OPEN   | <Description> | <CourtCode>       |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"
    When User Makes PUT API Request To "/application-lists/:listId" With Body:
      | date     | time           | status | description   | courtLocationCode | durationHours | durationMinutes |
      | todayiso | timenowhhmm-3h | CLOSED | <Description> | <CourtCode>       | 2             | 22              |
    Then User Verify Response Status Code Should Be "200"
    Then User Verify Response Body Property "status" Should Be "CLOSED"
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Searches Application List With:
      | Date  | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today | <Description>    | <CourtCode> |       | CLOSED             |                            |                       |           |
    When User Clicks "Select" In Row Of Table "Lists" And Verify Menu Options "Print page,  Print continuous"
      | Date         | Location    | Entries | Status |
      | todaydisplay | <CourtName> | 0       | CLOSED |
    Examples:
      | CourtCode | CourtName                         | Description                              |
      | LCCC025   | Leeds Combined Court Centre Set 3 | Test Applications List to Close {RANDOM} |

  @regression @applicationsList @ARCPOC-214 @ARCPOC-452 @ARCPOC-756 @ARCPOC-891
  Scenario: Verify applications list table sorting functionality and pagination persistence
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    # Search to get table with multiple pages
    When User Searches Application List With:
      | Date | Time  | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      |      | 05:54 |                  |             |       |                    |                            | London                |           |
    Then User Should See The Table "Lists"
    # Verify all sortable headers default to 'none'
    Then User Should See Table "Lists" Header "Time" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Description" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Entries" Has Sort Order "none"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "none"
    # Test Date column
    When User Clicks On Table Header "Date" In Table "Lists"
    Then User Should See Table "Lists" Header "Date" Has Sort Order "ascending"
    When User Goes To First Page
    When User Clicks On Table Header "Date" In Table "Lists"
    Then User Should See Table "Lists" Header "Date" Has Sort Order "descending"
    # Search to get table with multiple pages
    When User Clicks On The "Clear search" Button
    When User Searches Application List With:
      | Date       | Time | List description | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | 26/03/2026 |      |                  |             |       |                    |                            |                       |           |
    # Test Time column
    When User Clicks On Table Header "Time" In Table "Lists"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "ascending"
    When User Clicks On Table Header "Time" In Table "Lists"
    Then User Should See Table "Lists" Header "Time" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Header "Time" Has Sort Order "descending"
    # Test Description column
    When User Clicks On Table Header "Description" In Table "Lists"
    Then User Should See Table "Lists" Header "Description" Has Sort Order "ascending"
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
    # Test Status column - only verify sort indicators
    When User Clicks On Table Header "Status" In Table "Lists"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "ascending"
    When User Goes To First Page
    When User Clicks On Table Header "Status" In Table "Lists"
    Then User Should See Table "Lists" Header "Status" Has Sort Order "descending"
    # Test Location column
    When User Clicks On Table Header "Location" In Table "Lists"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "ascending"
    When User Clicks On Table Header "Location" In Table "Lists"
    Then User Should See Table "Lists" Header "Location" Has Sort Order "descending"
    When User Goes To First Page
    Then User Should See Table "Lists" Header "Location" Has Sort Order "descending"

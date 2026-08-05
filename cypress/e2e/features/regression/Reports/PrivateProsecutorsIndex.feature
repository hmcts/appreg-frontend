Feature: Private prosecutors index Report

    @regression @reports @ARCPOC-250
    Scenario: Private prosecutors index Report - Render report filters
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "Private prosecutors index"
        Then User See "Private prosecutors index" On The Page
        Then User Should See The Date Field "Date from"
        Then User Should See The Date Field "Date to"
        Then User Should See The Textbox "Applicant organisation name"
        Then User Should See The Textbox "Applicant first name"
        Then User Should See The Textbox "Applicant last name"
        When User Toggles The Accordion "Advanced filters"
        Then User Should See The Textbox "Standard applicant name"
        Then User Should See The Textbox "Respondent first name"
        Then User Should See The Textbox "Respondent surname"
        Then User Should See The Textbox "Respondent organisation"
        Then User Should See The Textbox "Court"
        Then User Should See The Textbox "Criminal justice area"
        Then User Should See The Textbox "Other location description"

    @regression @reports @ARCPOC-250
    Scenario: Private prosecutors index Report - Validate required dates and location exclusivity
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Private prosecutors index"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Enter date from Enter date to"
        When User Set Date Field "Date from" To "27/03/2026"
        When User Set Date Field "Date to" To "27/02/2026"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Date to must be on or after Date from"
        When User Clicks On The "Clear filters" Button
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        When User Toggles The Accordion "Advanced filters"
        Then User Selects "Leeds Combined Court Centre" From The Textbox "Court" Autocomplete By Typing "Leeds"
        Then User Should See The Textbox "Other location description" Is Disabled
        Then User Should See The Textbox "Criminal justice area" Is Disabled
        When User Clicks On The "Clear filters" Button
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Enters "Annex" Into The "Other location description" Textbox
        Then User Should See The Textbox "Court" Is Disabled
        Then User Should See The Textbox "Criminal justice area" Is Enabled

    @regression @reports @ARCPOC-250
    Scenario: Private prosecutors index Report - Download completed CSV
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clears Downloaded CSVs
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Private prosecutors index"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        When User Toggles The Accordion "Advanced filters"
        Then User Enters "Annex" Into The "Other location description" Textbox
        Then User Should See The Textbox "Court" Is Disabled
        Then User Selects "London" From The Textbox "Criminal justice area" Autocomplete By Typing "01"
        When User Clicks On The "Download CSV" Button
        Then User Waits For The Report Download To Complete
        Then User Verifies CSV "<CSVFileName>" Is Downloaded
        Then User Sees Success Banner "Success Report downloaded The private prosecutors index report has downloaded."
        Then User Verifies Latest Downloaded CSV Contains Text "Private Prosecution Index Report" In Row 1
        Then User Verifies The Downloaded CSV Has Headers In Row 2:
            | List Date                    |
            | List Court House Name        |
            | List Other Location          |
            | CJA Code                     |
            | Applicant Name/Surname       |
            | Applicant First Name         |
            | Standard Applicant Name      |
            | Respondent First Name        |
            | Respondent Surname           |
            | Respondent Organisation Name |
            | Application Wording          |
            | Result 1                     |
            | Result 2                     |
            | Result 3                     |
            | Result 4                     |
            | Application Notes            |
        Then User Clears Downloaded CSVs
        Examples:
            | CSVFileName                               |
            | private-prosecutors-index-report-todayiso |

  @regression @reports @ARCPOC-1401
  Scenario: Private prosecutors index Report - verify "Clear search" button functionality
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Private prosecutors index"
    When User Toggles The Accordion "Advanced filters"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/03/2026"
    Then User Enters "Test org" Into The "Applicant organisation name" Textbox
    Then User Enters "Test first name" Into The "Applicant first name" Textbox
    Then User Enters "Smith" Into The "Applicant last name" Textbox
    Then User Enters "John Smith" Into The "Standard applicant name" Textbox
    Then User Enters "Res first name" Into The "Respondent first name" Textbox
    Then User Enters "Res surname" Into The "Respondent surname" Textbox
    Then User Enters "Res org" Into The "Respondent organisation" Textbox
    Then User Selects "Cardiff Crown Court Set 4" From The Textbox "Court" Autocomplete By Typing "Cardiff"
    When User Clicks On The "Clear filters" Button
    Then User Verifies The Date field "Date from" Is Empty
    Then User Verifies The Date field "Date to" Is Empty
    Then User Verifies The "Court" Textbox Is Empty
    Then User Verifies The "Applicant organisation name" Textbox Is Empty
    Then User Verifies The "Applicant first name" Textbox Is Empty
    Then User Verifies The "Applicant last name" Textbox Is Empty
    Then User Verifies The "Standard applicant name" Textbox Is Empty
    Then User Verifies The "Respondent first name" Textbox Is Empty
    Then User Verifies The "Respondent surname" Textbox Is Empty
    Then User Verifies The "Respondent organisation" Textbox Is Empty

  @regression @reports @ARCPOC-1401
  Scenario: Private prosecutors index Report - verify "Clear search" button functionality (CJA + Other location)
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Private prosecutors index"
    When User Toggles The Accordion "Advanced filters"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/03/2026"
    Then User Enters "Test org" Into The "Applicant organisation name" Textbox
    Then User Enters "Test first name" Into The "Applicant first name" Textbox
    Then User Enters "Smith" Into The "Applicant last name" Textbox
    Then User Enters "John Smith" Into The "Standard applicant name" Textbox
    Then User Enters "Res first name" Into The "Respondent first name" Textbox
    Then User Enters "Res surname" Into The "Respondent surname" Textbox
    Then User Enters "Res org" Into The "Respondent organisation" Textbox
    Then User Selects "London" From The Textbox "Criminal Justice Area" Autocomplete By Typing "01"
    Then User Enters "Other location 1" Into The "Other location description" Textbox
    When User Clicks On The "Clear filters" Button
    Then User Verifies The Date field "Date from" Is Empty
    Then User Verifies The Date field "Date to" Is Empty
    Then User Verifies The "Criminal Justice Area" Textbox Is Empty
    Then User Verifies The "Other location description" Textbox Is Empty
    Then User Verifies The "Applicant organisation name" Textbox Is Empty
    Then User Verifies The "Applicant first name" Textbox Is Empty
    Then User Verifies The "Applicant last name" Textbox Is Empty
    Then User Verifies The "Standard applicant name" Textbox Is Empty
    Then User Verifies The "Respondent first name" Textbox Is Empty
    Then User Verifies The "Respondent surname" Textbox Is Empty
    Then User Verifies The "Respondent organisation" Textbox Is Empty

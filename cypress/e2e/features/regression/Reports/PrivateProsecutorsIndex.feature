Feature: List Maintenance Report

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
    Scenario: Workload Report - Download completed CSV
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

    @regression @reports @ARCPOC-250
    Scenario: Private prosecutors index Report - Accessibility
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Private prosecutors index"
        When User Toggles The Accordion "Advanced filters"
        Then User Checks Accessibility Of The Current Page

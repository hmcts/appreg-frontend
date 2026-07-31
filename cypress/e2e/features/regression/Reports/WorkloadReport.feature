Feature: Workload Report

    @regression @reports @ARCPOC-248
    Scenario: Workload Report - Render filters and preserve shared dates
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "Fees"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        When User Selects The Radio Button "Workload"
        Then User See "Workload" On The Page
        Then User Verifies The Date field "Date from" Has Value "27/02/2026"
        Then User Verifies The Date field "Date to" Has Value "27/03/2026"
        Then User Should See The Date Field "Date from"
        Then User Should See The Date Field "Date to"
        Then User Should See The Textbox "Court"
        When User Toggles The Accordion "Advanced filters"
        Then User Should See The Textbox "Criminal justice area"
        Then User Should See The Textbox "Other location description"

    @regression @reports @ARCPOC-248
    Scenario: Workload Report - Validate required dates and location exclusivity
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Workload"
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

    @regression @reports @ARCPOC-248 @SC2
    Scenario: Workload Report - Download completed CSV
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Workload"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        When User Toggles The Accordion "Advanced filters"
        Then User Enters "Annex" Into The "Other location description" Textbox
        Then User Should See The Textbox "Court" Is Disabled
        Then User Selects "London" From The Textbox "Criminal justice area" Autocomplete By Typing "01"
        When User Clicks On The "Download CSV" Button
        Then User Waits For The Report Download To Complete
        Then User Verifies CSV "<CSVFileName>" Is Downloaded
        Then User Sees Success Banner "Success Report downloaded The workload report has downloaded."
        Then User Verifies Latest Downloaded CSV Contains Text "Workload Report" In Row 1
        Then User Verifies The Downloaded CSV Has Headers In Row 2:
            | List Date               |
            | List Court House Name   |
            | List Other Location     |
            | CJA Code                |
            | List Description        |
            | Standard Applicant Code |
            | Applicant Name/Surname  |
            | Application Code        |
            | Application Code Title  |
            | Results                 |
            | JP1                     |
            | JP2                     |
            | JP3                     |
            | Official                |
        Then User Clears Downloaded CSVs
        Examples:
            | CSVFileName             |
            | workload-report-todayiso |

    @regression @reports @ARCPOC-248
    Scenario: Workload Report - Accessibility
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Workload"
        When User Toggles The Accordion "Advanced filters"
        Then User Checks Accessibility Of The Current Page

Feature: List Maintenance Report

    @reports @list-maintenance
    Scenario: List Maintenance Report - Render report filters
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "List maintenance"
        Then User See "List maintenance" On The Page
        Then User Should See The Date Field "Date from"
        Then User Should See The Date Field "Date to"
        Then User Should See The Textbox "Court"
        When User Toggles The Accordion "Advanced filters"
        Then User Should See The Textbox "List description"
        Then User Should See The Textbox "Criminal justice area"
        Then User Should See The Textbox "Other location description"

    @reports @list-maintenance
    Scenario: List Maintenance Report - Validate date fields
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "List maintenance"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Enter date from Enter date to"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Enter date to"
        When User Clicks On The "Clear filters" Button
        When User Set Date Field "Date to" To "27/03/2026"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Enter date from"
        When User Set Date Field "Date from" To "31/02/2026"
        When User Set Date Field "Date to" To "02/14/2026"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "Date from must be a valid date Date to must be a valid date"
        When User Set Date Field "Date from" To "27/03/2026"
        When User Set Date Field "Date to" To "27/02/2026"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Date to must be on or after Date from"

    @reports @list-maintenance
    Scenario: List Maintenance Report - Preserve dates and enforce location exclusivity
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Search warrants"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        When User Selects The Radio Button "List maintenance"
        Then User Verifies The Date field "Date from" Has Value "27/02/2026"
        Then User Verifies The Date field "Date to" Has Value "27/03/2026"
        When User Toggles The Accordion "Advanced filters"
        Then User Enters "Annex" Into The "Other location description" Textbox
        Then User Should See The Textbox "Court" Is Disabled
        Then User Should See The Textbox "Criminal justice area" Is Enabled

    @reports @list-maintenance
    Scenario: List Maintenance Report - Download completed CSV
        Given User Has No Downloaded CSVs
        Given List Maintenance Report Job Will Be Accepted With Job Id "list-maintenance-job-1"
        And Report Job "list-maintenance-job-1" Will Complete
        And Report Job "list-maintenance-job-1" Will Download Headers Only CSV:
            | List description |
            | Date from        |
            | Date to          |
            | Court            |
            | Other location   |
            | CJA              |
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "List maintenance"
        When User Toggles The Accordion "Advanced filters"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Selects "Leeds Combined Court Centre" From The Textbox "Court" Autocomplete By Typing "Leeds"
        Then User Enters "Stale lists" Into The "List description" Textbox
        When User Clicks On The "Download CSV" Button
        Then User Sees Report Progress Message
        Then User Verifies List Maintenance Report Job Request Contains Only Populated Filters
        Then User Verifies CSV "list-maintenance-report-todayiso" Is Downloaded
        Then User Verifies Latest Downloaded CSV Contains Only Header Row
        Then User Sees Success Banner "Success Report downloaded The list maintenance report has downloaded."

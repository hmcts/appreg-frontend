Feature: Fees Report

    @regression @reports @ARCPOC-381 @ARCPOC-245
    Scenario: Fee Report - Download Report for Courts
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "Fees"
        When User Toggles The Accordion "Advanced filters"
        When User Clicks On The "Download CSV" Button
        Then User Sees Validation Error Banner "There is a problem Enter date from Enter date to"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Enters "APP001" Into The "Standard applicant code" Textbox
        Then User Enters "Smith" Into The "Applicant surname or organisation name" Textbox
        Then User Selects "Cardiff Crown Court Set 4" From The Textbox "Court" Autocomplete By Typing "Cardiff"
        When User Clicks On The "Download CSV" Button
        Then User Verifies CSV "<CSVFileName>" Is Downloaded
        Then User Sees Success Banner "Success Report downloaded The fees report has downloaded."
        Then User Verifies Latest Downloaded CSV Contains Text "Fees Report" In Row 1
        Then User Verifies The Downloaded CSV Has Headers In Row 2:
            | List Date               |
            | List Court House Name   |
            | List Other Location     |
            | CJA Code                |
            | Standard Applicant Code |
            | Applicant Name/Surname  |
            | Application Code        |
            | Application Code Title  |
            | Fee Value               |
            | Off Site Fee Value      |
            | Total fee Value         |
            | Fee Status              |
            | Fee Status Date         |
            | Payment Reference       |
        Then User Clears Downloaded CSVs
        Examples:
            | CSVFileName          |
            | fees-report-todayiso |

    @regression @reports @ARCPOC-381 @ARCPOC-245 @SC2
    Scenario: Fee Report - Download Report for Criminal Justice Area
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Fees"
        When User Toggles The Accordion "Advanced filters"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Selects "London" From The Textbox "Criminal Justice Area" Autocomplete By Typing "01"
        Then User Enters "APP001" Into The "Standard applicant code" Textbox
        Then User Enters "Smith" Into The "Applicant surname or organisation name" Textbox
        When User Clicks On The "Download" Button
        Then User Verifies CSV "<CSVFileName>" Is Downloaded
        Then User Sees Success Banner "Success Report downloaded The fees report has downloaded."
        Then User Verifies Latest Downloaded CSV Contains Text "Fees Report" In Row 1
        Then User Verifies The Downloaded CSV Has Headers In Row 2:
            | List Date               |
            | List Court House Name   |
            | List Other Location     |
            | CJA Code                |
            | Standard Applicant Code |
            | Applicant Name/Surname  |
            | Application Code        |
            | Application Code Title  |
            | Fee Value               |
            | Off Site Fee Value      |
            | Total fee Value         |
            | Fee Status              |
            | Fee Status Date         |
            | Payment Reference       |
        Then User Clears Downloaded CSVs
        Examples:
            | CSVFileName          |
            | fees-report-todayiso |

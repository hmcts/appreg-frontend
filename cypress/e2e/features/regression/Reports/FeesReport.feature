Feature: Fees Report

    @reports @ARCPOC-381
    Scenario: Fee Report - Download Report for Courts
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        Then User See "Reports" On The Page
        Then User See "Select the report you wish to download?" On The Page
        When User Selects The Radio Button "Fees"
        When User Clicks On The "Download" Button
        Then User Sees Validation Error Banner "There is a problem Enter day, month and year"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Selects "Cardiff Crown Court Set 4" From The Textbox "Court" Autocomplete By Typing "Cardiff"
        Then User Enters "APP001" Into The "Applicant code" Textbox
        Then User Enters "Smith" Into The "Surname or organisation" Textbox
        When User Clicks On The "Download" Button
        Then User Verifies The Downloaded CSV Has Headers:
            | Application date      |
            | Court                 |
            | Application code      |
            | Applicant code        |
            | Applicant name        |
            | Respondent name       |
            | Fee amount            |
            | Fee type              |
            | Criminal justice area |

    @reports @ARCPOC-381
    Scenario: Fee Report - Download Report for Criminal Justice Area
        Given User Has No Downloaded CSVs
        Given User Is On The Portal Page
        When User Signs In With Microsoft SSO As "user1"
        Then User Clicks On The Link Using Exact Text Match "Reports"
        Then User Verify The Page URL Contains "/reports"
        When User Selects The Radio Button "Fees"
        When User Set Date Field "Date from" To "27/02/2026"
        When User Set Date Field "Date to" To "27/03/2026"
        Then User Selects "London" From The Textbox "Criminal Justice Area" Autocomplete By Typing "01"
        Then User Enters "APP001" Into The "Applicant code" Textbox
        Then User Enters "Smith" Into The "Surname or organisation" Textbox
        When User Clicks On The "Download" Button
        Then User Verifies The Downloaded CSV Has Headers:
            | Application date      |
            | Court                 |
            | Application code      |
            | Applicant code        |
            | Applicant name        |
            | Respondent name       |
            | Fee amount            |
            | Fee type              |
            | Criminal justice area |

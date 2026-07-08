Feature: Activity Audit Report

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Render report filters
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    Then User See "Activity audit" On The Page
    Then User Should See The Date Field "Date from"
    Then User Should See The Date Field "Date to"
    Then User Should See The Textbox "Username"
    Then User Should See The Textbox "Activity"

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Download report Fails With Invalid From and To Headers
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "Enter date from"
    Then User Sees Validation Error Banner "Enter date to"

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Download report Fails With To date Before From Date
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/01/2026"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "Date to must be on or after Date from"

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Download report Fails No Activity
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/03/2026"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "At least 1 activity is required"

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Valid date fields
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clears Downloaded CSVs
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "28/02/2026"
    Then User Should Not See The Link "Remove"
    Then User Selects "Add application" From The Textbox "Activity" Autocomplete By Typing "Add application"
    Then User Sees Text "Add application" In "Selected activities" Field
    When User Clicks On The "Download CSV" Button
    Then User Sees Success Banner "Success Report downloaded The activity audit report has downloaded."
    Then User Verifies CSV "<CSVFileName>" Is Downloaded
    Then User Verifies Latest Downloaded CSV Contains Text "Activity Audit Report" In Row 1
    Then User Verifies The Downloaded CSV Has Headers In Row 2:
      | Event Name   |
      | Table Name   |
      | Column Name  |
      | Old Value    |
      | New Value    |
      | Created Date |
      | User Name    |
    Then User Clears Downloaded CSVs
    Examples:
      | CSVFileName                    |
      | activity-audit-report-todayiso |

Feature: Activity Audit Report

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Render report filters
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    Then User See "Activity audit" On The Page
    Then User See "Provides a report of all user activity for a given period and optionally filtered by username" On The Page
    Then User Should See The Date Field "Date from"
    Then User Should See The Date Field "Date to"
    Then User Should See The Textbox "Username"
    Then User Should See The Textbox "Activity"

  @regression @reports @ARCPOC-383
  Scenario: Activity Audit Report - Download report Fails With Invalid From and To Headers
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

  @regression @reports @core @ARCPOC-383 @ARCPOC-1748 @ARCPOC-1822
  Scenario: Activity Audit Report - Valid date fields
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
    Then User Sees Success Banner "Report downloaded" Containing "The activity audit report has downloaded."
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

  @regression @reports @ARCPOC-1401
  Scenario: Activity Audit Report - verify "Clear search" button functionality
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/03/2026"
    Then User Should Not See The Link "Remove"
    Then User Selects "Add application" From The Textbox "Activity" Autocomplete By Typing "Add application"
    Then User Enters "user1" Into The "Username" Textbox
    When User Clicks On The "Clear filters" Button
    Then User Verifies The Date field "Date from" Is Empty
    Then User Verifies The Date field "Date to" Is Empty
    Then User Verifies The "Username" Textbox Is Empty
    Then User Verifies The "Activity" Textbox Is Empty

  @regression @reports @ARCPOC-1831 @ARCPOC-1833
  Scenario Outline: Activity Audit Report - Verify modal dialog for Warnings When User Tries To Navigate Away While Report Is Being Generated
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Activity audit"
    When User Set Date Field "Date from" To "<StartDate>"
    When User Set Date Field "Date to" To "<EndDate>"
    Then User Should Not See The Link "Remove"
    Then User Selects "Add application" From The Textbox "Activity" Autocomplete By Typing "Add application"
    Then User Sees Text "Add application" In "Selected activities" Field
    When User Clicks On The "Download CSV" Button
    # ARCPOC-1833: All the radio button are disabled while the report is being generated
    Then User Verifies The Radio Button "Activity audit" Is Disabled
    Then User Verifies The Radio Button "Fees" Is Disabled
    Then User Verifies The Radio Button "List maintenance" Is Disabled
    Then User Verifies The Radio Button "Search warrants" Is Disabled
    Then User Verifies The Radio Button "Workload" Is Disabled
    Then User Verifies The Radio Button "Duration" Is Disabled
    Then User Verifies The Radio Button "Private prosecutors index" Is Disabled
    # User Tries to move away from the page while the report is being generated
    Then User Clicks On The Link Using Exact Text Match "Applications"
    Then User Should See The Modal Dialog With Heading "Leave the reports page?"
    Then User Should See The Text "Your report is still being generated and downloaded. If you leave this page, you will not receive it." In The Modal Dialog
    Then User Should See The Modal Dialog With Button "Stay on this page"
    Then User Should See The Modal Dialog With Button "Leave this page"
    When User Clicks On The "Stay on this page" Button
    Then User Clicks On The Link Using Exact Text Match "Applications"
    Then User Should See The Modal Dialog With Heading "Leave the reports page?"
    When User Clicks On The "Leave this page" Button
    Then User Should Not See The Modal Dialog

    Examples:
      | StartDate  | EndDate |
      | 01/01/2001 | today   |

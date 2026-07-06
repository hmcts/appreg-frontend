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
  Scenario: Activity Audit Report - Validate date fields
    Given User Is On The Portal Page
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
    Then User Sees Text "Add application" In "Selected activities" Field
    Then User Should See The Link "Remove"
    Then User Clicks On The Link "Remove"
    Then User Should Not See The Link "Remove"

  @regression @reports @ARCPOC-383 @JF
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

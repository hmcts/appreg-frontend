Feature: Duration Report

  @regression @reports @ARCPOC-249
  Scenario Outline: Duration Report - Download Report for Courts
    Given User Has No Downloaded CSVs
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User See "Reports" On The Page
    Then User See "Select the report you wish to download?" On The Page
    When User Selects The Radio Button "Duration"
    When User Toggles The Accordion "Advanced filters"
    When User Clicks On The "Download CSV" Button
    # No date filters set, so validation error expected
    Then User Sees Validation Error Banner "There is a problem Enter date from Enter date to"
    # Set From Date only
    When User Set Date Field "Date from" To "27/02/2026"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "There is a problem Enter date to"
    # Set To Date only
    When User Clicks On The "Clear filters" Button
    When User Set Date Field "Date to" To "27/03/2026"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "There is a problem Enter date from"
    # Set invalid date formats
    When User Set Date Field "Date from" To "31/02/2026"
    When User Set Date Field "Date to" To "02/14/2026"
    When User Clicks On The "Download CSV" Button
    Then User Sees Validation Error Banner "Date from must be a valid date Date to must be a valid date"
    # Set valid date range
    When User Set Date Field "Date from" To "27/02/2026"
    When User Set Date Field "Date to" To "27/03/2026"
    Then User Selects "Cardiff Crown Court Set 4" From The Textbox "Court" Autocomplete By Typing "Cardiff"
    When User Clicks On The "Download CSV" Button
    Then User Verifies CSV "<CSVFileName>" Is Downloaded
    Then User Sees Success Banner "Success Report downloaded The duration report has downloaded."
    Then User Verifies Latest Downloaded CSV Contains Text "Duration Report" In Row 1
    Then User Verifies The Downloaded CSV Has Headers In Row 2:
      | List Date             |
      | List Court House Name |
      | List Other Location   |
      | CJA Code              |
      | List Description      |
      | Duration Hours        |
      | Duration Minutes      |
    Then User Clears Downloaded CSVs
    Examples:
      | CSVFileName              |
      | duration-report-todayiso |

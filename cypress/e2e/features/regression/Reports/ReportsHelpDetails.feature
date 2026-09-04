Feature: Reports help details

  @regression @reports @helpDetails @ARCPOC-377
  Scenario: Expand and collapse reports help details
    When User Signs In With Microsoft SSO As "user1"
    Then User Clicks On The Link Using Exact Text Match "Reports"
    Then User Verify The Page URL Contains "/reports"
    Then User Sees Page Heading "Reports"
    Then User Should See The Accordion "Help with reports"
    When User Toggles The Accordion "Help with reports"
    Then User Should See The Text "Use this page to generate and download CSV reports." In The Accordion "Help with reports"
    Then User Should See The Text "Select a report type, then enter the filters needed for that report." In The Accordion "Help with reports"
    Then User Should See The Text "Date from and date to are required for each report." In The Accordion "Help with reports"
    Then User Should See The Text "Leave optional filters blank to include all matching records." In The Accordion "Help with reports"
    Then User Should See The Text "If you enter a court, the criminal justice area and other location fields are not needed." In The Accordion "Help with reports"
    Then User Should See The Text "Select Download CSV. The report will be generated and downloaded automatically when ready." In The Accordion "Help with reports"
    Then User Takes Screenshot "HelpDetails-Reports-Expanded"
    When User Toggles The Accordion "Help with reports"

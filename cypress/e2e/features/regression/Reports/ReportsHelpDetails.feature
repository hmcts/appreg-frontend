Feature: Reports help details

  @regression @reports @helpDetails
  Scenario: Expand and collapse reports help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/reports"
    Then User Sees Page Heading "Reports"
    Then User Should See The Accordion "Help with reports"
    Then User Should See The Accordion "Help with reports" Is Collapsed
    When User Toggles The Accordion "Help with reports"
    Then User Should See The Accordion "Help with reports" Is Expanded
    Then User Should See The Following Text In The Accordion "Help with reports":
      | Use this page to generate and download CSV reports. |
      | Select a report type, then enter the filters needed for that report. |
      | Date from and date to are required for each report. |
      | Leave optional filters blank to include all matching records. |
      | If you enter a court, the criminal justice area and other location fields are not needed. |
      | Select Download CSV. The report will be generated and downloaded automatically when ready. |
    Then User Takes Screenshot "HelpDetails-Reports-Expanded"
    When User Toggles The Accordion "Help with reports"
    Then User Should See The Accordion "Help with reports" Is Collapsed

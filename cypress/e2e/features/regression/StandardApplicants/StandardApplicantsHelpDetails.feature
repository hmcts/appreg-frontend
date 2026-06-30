Feature: Standard applicants help details

  @regression @standardApplicants @helpDetails
  Scenario: Expand and collapse standard applicants help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/standard-applicants"
    Then User Sees Page Heading "Standard applicants"
    Then User Should See The Accordion "Help with standard applicants"
    Then User Should See The Accordion "Help with standard applicants" Is Collapsed
    When User Toggles The Accordion "Help with standard applicants"
    Then User Should See The Accordion "Help with standard applicants" Is Expanded
    Then User Should See The Following Text In The Accordion "Help with standard applicants":
      | Use this page to search for standard applicant records by code or name. |
      | Select View to see the details for a standard applicant. |
      | Use Export to download standard applicant search results for use in a spreadsheet. |
      | Use Print to create a PDF report of standard applicant search results. |
      | Standard applicant records cannot be created or amended on this page. |
    Then User Takes Screenshot "HelpDetails-StandardApplicants-Expanded"
    When User Toggles The Accordion "Help with standard applicants"
    Then User Should See The Accordion "Help with standard applicants" Is Collapsed

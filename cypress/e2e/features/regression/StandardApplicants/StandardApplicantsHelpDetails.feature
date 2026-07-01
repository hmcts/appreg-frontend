Feature: Standard applicants help details

  @regression @standardApplicants @helpDetails @ARCPOC-377
  Scenario: Expand and collapse standard applicants help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/standard-applicants"
    Then User Sees Page Heading "Standard applicants"
    Then User Should See The Accordion "Help with standard applicants"
    When User Toggles The Accordion "Help with standard applicants"
    Then User Should See The Text "Use this page to search for standard applicant records by code or name." In The Accordion "Help with standard applicants"
    Then User Should See The Text "Select View to see the details for a standard applicant." In The Accordion "Help with standard applicants"
    Then User Should See The Text "Use Export to download standard applicant search results for use in a spreadsheet." In The Accordion "Help with standard applicants"
    Then User Should See The Text "Use Print to create a PDF report of standard applicant search results." In The Accordion "Help with standard applicants"
    Then User Should See The Text "Standard applicant records cannot be created or amended on this page." In The Accordion "Help with standard applicants"
    Then User Takes Screenshot "HelpDetails-StandardApplicants-Expanded"
    When User Toggles The Accordion "Help with standard applicants"

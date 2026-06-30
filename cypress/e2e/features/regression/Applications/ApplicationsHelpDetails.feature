Feature: Applications help details

  @regression @applications @helpDetails
  Scenario: Expand and collapse applications search help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications"
    Then User Sees Page Heading "Applications"
    Then User Should See The Accordion "Help with searching applications"
    When User Toggles The Accordion "Help with searching applications"
    Then User Should See The Text "Use this page to search for applications when you do not know which application list they are in." In The Accordion "Help with searching applications"
    Then User Should See The Text "Select one or more applications to use the Actions menu." In The Accordion "Help with searching applications"
    Then User Should See The Text "Result selected applies a result to selected open applications." In The Accordion "Help with searching applications"
    Then User Should See The Text "Print continuous prints selected applications together as a court list or register." In The Accordion "Help with searching applications"
    Then User Should See The Text "Print page prints each selected application starting on a new page." In The Accordion "Help with searching applications"
    Then User Should See The Text "Closed applications cannot be opened from this page." In The Accordion "Help with searching applications"
    Then User Takes Screenshot "HelpDetails-Applications-Expanded"
    When User Toggles The Accordion "Help with searching applications"

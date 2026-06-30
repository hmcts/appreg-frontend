Feature: Applications list help details

  @regression @applicationsList @helpDetails @ARCPOC-377
  Scenario: Expand and collapse application list help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Sees Page Heading "Applications list"
    Then User Should See The Accordion "Help with application lists"
    When User Toggles The Accordion "Help with application lists"
    Then User Should See The Text "Actions are only available after you select a list from the search results." In The Accordion "Help with application lists"
    Then User Should See The Text "If you enter another location, you must also select the relevant or owning CJA." In The Accordion "Help with application lists"
    Then User Should See The Text "Print continuous prints all applications together as a court list or register." In The Accordion "Help with application lists"
    Then User Should See The Text "Print page prints each application entry starting on a new page." In The Accordion "Help with application lists"
    Then User Should See The Text "Delete list removes the selected list and its entries." In The Accordion "Help with application lists"
    Then User Takes Screenshot "HelpDetails-ApplicationLists-Expanded"
    When User Toggles The Accordion "Help with application lists"

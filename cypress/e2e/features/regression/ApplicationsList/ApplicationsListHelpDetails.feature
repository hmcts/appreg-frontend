Feature: Applications list help details

  @regression @applicationsList @helpDetails
  Scenario: Expand and collapse application list help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Then User Sees Page Heading "Applications list"
    Then User Should See The Accordion "Help with application lists"
    Then User Should See The Accordion "Help with application lists" Is Collapsed
    When User Toggles The Accordion "Help with application lists"
    Then User Should See The Accordion "Help with application lists" Is Expanded
    Then User Should See The Following Text In The Accordion "Help with application lists":
      | Actions are only available after you select a list from the search results. |
      | If you enter another location, you must also select the relevant or owning CJA. |
      | Print continuous prints all applications together as a court list or register. |
      | Print page prints each application entry starting on a new page. |
      | Delete list removes the selected list and its entries. |
    Then User Takes Screenshot "HelpDetails-ApplicationLists-Expanded"
    When User Toggles The Accordion "Help with application lists"
    Then User Should See The Accordion "Help with application lists" Is Collapsed

Feature: Applications list detail help details

  Background: Create applications list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Help details list {SCENARIO_ID} | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @regression @applicationsList @helpDetails @ARCPOC-377
  Scenario: Expand and collapse applications tab help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    When User Searches Application List With:
      | Date  | Time | List description           | CourtSearch | Court | Select list status | Other location description | Criminal justice area | CJASearch |
      | today |      | Help details list {SCENARIO_ID} |             |       | OPEN               |                            |                       |           |
    When User Clicks "Select" Then "Open" From Menu In Row Of Table "Lists" With:
      | Date         | Time  | Location                          | Description                | Entries | Status |
      | todaydisplay | 10:20 | Leeds Combined Court Centre Set 7 | Help details list {SCENARIO_ID} | 0       | OPEN   |
    Then User Sees Page Heading "Applications list"
    Then User Should See The Accordion "Help with applications"
    When User Toggles The Accordion "Help with applications"
    Then User Should See The Text "Actions are applied to the entries selected in the table." In The Accordion "Help with applications"
    Then User Should See The Text "Result selected applies the same result to all selected entries." In The Accordion "Help with applications"
    Then User Should See The Text "Move entries moves the selected entries to another application list." In The Accordion "Help with applications"
    Then User Should See The Text "Update officials changes the recorded justice of peace or official for selected entries." In The Accordion "Help with applications"
    Then User Should See The Text "Update fee details changes fee information for selected entries." In The Accordion "Help with applications"
    Then User Should See The Text "Print continuous prints all selected entries together as a court list or register." In The Accordion "Help with applications"
    Then User Should See The Text "Print page prints each selected entry starting on a new page." In The Accordion "Help with applications"
    Then User Takes Screenshot "HelpDetails-ApplicationsListDetail-Applications-Expanded"
    When User Toggles The Accordion "Help with applications"
    # List details help details
    Then User Clicks On The Link Using Exact Text Match "List details"
    Then User Should See The Accordion "Help with application list details"
    When User Toggles The Accordion "Help with application list details"
    Then User Should See The Text "To delete a list click on the button menu labeled \"Actions\" and click \"Delete list\"" In The Accordion "Help with application list details"
    Then User Should See The Text "To close a list, click on the button menu labeled \"Actions\" and click \"Close list\"." In The Accordion "Help with application list details"
    Then User Should See The Text "A list can only be closed when:" In The Accordion "Help with application list details"
    Then User Should See The Text "every application has at least one result" In The Accordion "Help with application list details"
    Then User Should See The Text "every application with a fee has a status of Paid or Remitted" In The Accordion "Help with application list details"
    Then User Should See The Text "every application has at least one justice of the peace or official recorded" In The Accordion "Help with application list details"
    Then User Should See The Text "the list duration has been completed" In The Accordion "Help with application list details"
    Then User Should See The Text "Close a list to keep it for reference; delete a list to permanently remove it and its contents." In The Accordion "Help with application list details"
    Then User Takes Screenshot "HelpDetails-ApplicationsListDetail-ListDetails-Expanded"
    When User Toggles The Accordion "Help with application list details"

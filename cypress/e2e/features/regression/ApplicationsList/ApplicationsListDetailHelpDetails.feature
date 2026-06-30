Feature: Applications list detail help details

  Background: Create applications list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                  | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Help details list {RANDOM}   | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @regression @applicationsList @helpDetails
  Scenario: Expand and collapse applications tab help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId"
    Then User Sees Page Heading "Applications list"
    Then User Should See The Accordion "Help with applications"
    Then User Should See The Accordion "Help with applications" Is Collapsed
    When User Toggles The Accordion "Help with applications"
    Then User Should See The Accordion "Help with applications" Is Expanded
    Then User Should See The Following Text In The Accordion "Help with applications":
      | Actions are applied to the entries selected in the table. |
      | Result selected applies the same result to all selected entries. |
      | Move entries moves the selected entries to another application list. |
      | Update officials changes the recorded justice of peace or official for selected entries. |
      | Update fee details changes fee information for selected entries. |
      | Print continuous prints all selected entries together as a court list or register. |
      | Print page prints each selected entry starting on a new page. |
    Then User Takes Screenshot "HelpDetails-ApplicationsListDetail-Applications-Expanded"
    When User Toggles The Accordion "Help with applications"
    Then User Should See The Accordion "Help with applications" Is Collapsed

  @regression @applicationsList @helpDetails
  Scenario: Expand and collapse list details tab help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId"
    Then User Clicks On The Link Using Exact Text Match "List details"
    Then User Should See The Accordion "Help with application list details"
    Then User Should See The Accordion "Help with application list details" Is Collapsed
    When User Toggles The Accordion "Help with application list details"
    Then User Should See The Accordion "Help with application list details" Is Expanded
    Then User Should See The Following Text In The Accordion "Help with application list details":
      | To close a list, change the status to Closed and save your changes. |
      | A list can only be closed when: |
      | every application has at least one result |
      | every application with a fee has a status of Paid or Remitted |
      | every application has at least one justice of the peace or official recorded |
      | the list duration has been completed |
    Then User Takes Screenshot "HelpDetails-ApplicationsListDetail-ListDetails-Expanded"
    When User Toggles The Accordion "Help with application list details"
    Then User Should See The Accordion "Help with application list details" Is Collapsed

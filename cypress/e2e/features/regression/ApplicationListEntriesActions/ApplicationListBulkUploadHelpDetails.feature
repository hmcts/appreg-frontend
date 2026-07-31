Feature: Application list bulk upload help details

  Background: Create applications list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                    | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Bulk upload help list {RANDOM} | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @regression @applicationsListEntries @helpDetails @ARCPOC-377
  Scenario: Expand and collapse bulk upload help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId/bulk-upload"
    Then User Sees Page Heading "Bulk upload applications"
    Then User Should See The Accordion "Help with bulk upload"
    When User Toggles The Accordion "Help with bulk upload"
    Then User Should See The Text "Use bulk upload to add applications to this list from a CSV file." In The Accordion "Help with bulk upload"
    Then User Should See The Text "The file must match the current bulk upload template." In The Accordion "Help with bulk upload"
    Then User Should See The Text "The filename must end in .csv." In The Accordion "Help with bulk upload"
    Then User Should See The Text "After you upload the file, the applications list page shows the upload progress." In The Accordion "Help with bulk upload"
    Then User Should See The Text "The file is validated before applications are added to the list." In The Accordion "Help with bulk upload"
    Then User Should See The Text "If the upload fails, the error message explains what needs to be corrected." In The Accordion "Help with bulk upload"
    Then User Takes Screenshot "HelpDetails-BulkUpload-Expanded"
    When User Toggles The Accordion "Help with bulk upload"

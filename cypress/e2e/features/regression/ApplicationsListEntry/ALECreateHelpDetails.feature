Feature: Applications list entry create help details

  Background: Create applications list
    Given User Authenticates Via API As "user1"
    When User Makes POST API Request To "/application-lists" With Body:
      | date     | time  | status | description                         | courtLocationCode |
      | todayiso | 10:20 | OPEN   | Entry create help list {RANDOM}     | LCCC065           |
    Then User Verify Response Status Code Should Be "201"
    Then User Stores Response Body Property "id" As "listId"

  @regression @applicationListEntry @helpDetails
  Scenario: Expand and collapse create entry help details
    Given User Is On The Portal Page
    When User Signs In With Microsoft SSO As "user1"
    Given User Navigates To The URL "/applications-list/:listId/create-entry"
    Then User Sees Page Heading "Create new entry"
    When User Clicks On The "Show all sections" Button

    Then User Should See The Accordion "Help with applicant details" Is Collapsed
    When User Toggles The Accordion "Help with applicant details"
    Then User Should See The Following Text In The Accordion "Help with applicant details":
      | Enter applicant details for a single applicant or organisation. |
      | If you select a standard applicant, you can choose a different standard applicant, but you cannot edit the standard applicant |
      | The selected standard applicant is shown above the search results. |
    Then User Takes Screenshot "HelpDetails-ALECreate-Applicant-Expanded"
    When User Toggles The Accordion "Help with applicant details"
    Then User Should See The Accordion "Help with applicant details" Is Collapsed

    Then User Should See The Accordion "Help with application codes" Is Collapsed
    When User Toggles The Accordion "Help with application codes"
    Then User Should See The Following Text In The Accordion "Help with application codes":
      | Select the application code that matches the nature of the application being recorded. |
      | The lodgement date is the date the court office received the application. |
      | The lodgement date is used to find the correct fee for the date the application was received. |
      | Once the lodgement date is saved it cannot be changed. |
    Then User Takes Screenshot "HelpDetails-ALECreate-ApplicationCodes-Expanded"
    When User Toggles The Accordion "Help with application codes"
    Then User Should See The Accordion "Help with application codes" Is Collapsed

    Then User Should See The Accordion "Help with application wording" Is Collapsed
    When User Toggles The Accordion "Help with application wording"
    Then User Should See The Following Text In The Accordion "Help with application wording":
      | Application wording is based on the selected application code and may include fixed text and fields you need to complete. |
    Then User Takes Screenshot "HelpDetails-ALECreate-ApplicationWording-Expanded"
    When User Toggles The Accordion "Help with application wording"
    Then User Should See The Accordion "Help with application wording" Is Collapsed

    Then User Should See The Accordion "Help with civil fee details" Is Collapsed
    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Following Text In The Accordion "Help with civil fee details":
      | Civil fee details record whether an application fee is due, paid, remitted or covered by an undertaking. |
      | Due means the fee still needs to be paid or resolved. |
      | Paid means the fee has been paid in full. You can add a payment reference if needed. |
      | Remitted means the court has waived the fee, for example through Help with Fees. |
      | Undertaking means the applicant has formally agreed to pay later. The list cannot be closed until this is updated to Paid. |
      | Applications that do not need a fee show No fee required and the fee fields cannot be changed. |
      | Select Off-site fee if an additional fee applies because a magistrate attended a location away from court premises. |
    Then User Takes Screenshot "HelpDetails-ALECreate-CivilFee-Expanded"
    When User Toggles The Accordion "Help with civil fee details"
    Then User Should See The Accordion "Help with civil fee details" Is Collapsed

    Then User Should See The Accordion "Help with application notes" Is Collapsed
    When User Toggles The Accordion "Help with application notes"
    Then User Should See The Following Text In The Accordion "Help with application notes":
      | Use this section to record case references, account references and any additional notes for the application. |
      | Account reference is required for enforcement application codes prefixed with EF. |
    Then User Takes Screenshot "HelpDetails-ALECreate-Notes-Expanded"
    When User Toggles The Accordion "Help with application notes"
    Then User Should See The Accordion "Help with application notes" Is Collapsed
